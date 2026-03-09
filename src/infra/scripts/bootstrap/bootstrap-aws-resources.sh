#!/usr/bin/env bash

set -euo pipefail

PROJECT="clean-ddd"
ENV_NAME="dev"
AWS_REGION="ap-northeast-2"
AWS_PROFILE_NAME="clean-ddd"
WRITE_VARS_FILE=""
ENSURE_GITHUB_OIDC="true"

GITHUB_OIDC_URL="https://token.actions.githubusercontent.com"
GITHUB_OIDC_CLIENT_ID="sts.amazonaws.com"
DEFAULT_GITHUB_OIDC_THUMBPRINT="6938fd4d98bab03faadb97b34396831e3780aea1"
GITHUB_OIDC_THUMBPRINT="${GITHUB_OIDC_THUMBPRINT_OVERRIDE-}"

usage() {
	cat <<'USAGE'
Usage:
	src/infra/scripts/bootstrap/bootstrap-aws-resources.sh [options]

Options:
	--env <name>				Environment name (default: dev)
	--project <name>			Project prefix (default: clean-ddd)
	--region <aws-region>		AWS region (default: ap-northeast-2)
	--profile <aws-profile>		AWS CLI profile (default: clean-ddd)
	--write-vars-file <path>	Write GitHub variables file (KEY=VALUE)
	--ensure-github-oidc <bool>	Ensure GitHub OIDC provider exists (default: true)
	-h, --help					Show this help

Examples:
	src/infra/scripts/bootstrap/bootstrap-aws-resources.sh --env dev --write-vars-file .github/env/dev.vars
	src/infra/scripts/bootstrap/bootstrap-aws-resources.sh --env prod --region ap-northeast-2 --profile clean-ddd --write-vars-file .github/env/prod.vars
USAGE
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--env)
			ENV_NAME="$2"
			shift 2
			;;
		--project)
			PROJECT="$2"
			shift 2
			;;
		--region)
			AWS_REGION="$2"
			shift 2
			;;
		--profile)
			AWS_PROFILE_NAME="$2"
			shift 2
			;;
		--write-vars-file)
			WRITE_VARS_FILE="$2"
			shift 2
			;;
		--ensure-github-oidc)
			ENSURE_GITHUB_OIDC="$2"
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "Unknown option: $1"
			usage
			exit 1
			;;
	esac
done

if ! command -v aws >/dev/null 2>&1; then
	echo "aws CLI is required"
	exit 1
fi

export AWS_PROFILE="$AWS_PROFILE_NAME"

ARTIFACT_BUCKET="${PROJECT}-${ENV_NAME}-artifacts"
WEB_BUCKET="${PROJECT}-${ENV_NAME}-web"
DDB_TABLE="${PROJECT}-avatar-${ENV_NAME}"
STACK_NAME="${PROJECT}-${ENV_NAME}"
CF_COMMENT="${PROJECT}-${ENV_NAME}-web-cdn"
OAC_NAME="${PROJECT}-${ENV_NAME}-oac"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
CALLER_ARN="$(aws sts get-caller-identity --query Arn --output text)"

echo "AWS account: ${ACCOUNT_ID}"
echo "Caller ARN: ${CALLER_ARN}"
echo "Region: ${AWS_REGION}"
echo "Profile: ${AWS_PROFILE}"

ensure_github_oidc_provider() {
	local provider_arn
	provider_arn="$(aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text | tr '\t' '\n' | grep -E 'oidc-provider/token.actions.githubusercontent.com$' || true)"

	if [[ -n "$provider_arn" ]]; then
		echo "GitHub OIDC provider already exists: ${provider_arn}"
		return 0
	fi

	echo "Creating GitHub OIDC provider..."
	if [[ -z "$GITHUB_OIDC_THUMBPRINT" ]]; then
		GITHUB_OIDC_THUMBPRINT="$DEFAULT_GITHUB_OIDC_THUMBPRINT"
		echo "using default GitHub OIDC thumbprint (set GITHUB_OIDC_THUMBPRINT_OVERRIDE to override)"
	fi

	aws iam create-open-id-connect-provider \
		--url "$GITHUB_OIDC_URL" \
		--client-id-list "$GITHUB_OIDC_CLIENT_ID" \
		--thumbprint-list "$GITHUB_OIDC_THUMBPRINT" >/dev/null

	provider_arn="$(aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text | tr '\t' '\n' | grep -E 'oidc-provider/token.actions.githubusercontent.com$' || true)"
	if [[ -z "$provider_arn" ]]; then
		echo "Failed to create GitHub OIDC provider"
		exit 1
	fi

	echo "Created GitHub OIDC provider: ${provider_arn}"
}

create_bucket_if_missing() {
	local bucket_name="$1"

	if aws s3api head-bucket --bucket "$bucket_name" >/dev/null 2>&1; then
		echo "S3 bucket exists: ${bucket_name}"
		return 0
	fi

	echo "Creating S3 bucket: ${bucket_name}"
	if [[ "$AWS_REGION" == "us-east-1" ]]; then
		aws s3api create-bucket --bucket "$bucket_name" >/dev/null
	else
		aws s3api create-bucket \
			--bucket "$bucket_name" \
			--create-bucket-configuration "LocationConstraint=${AWS_REGION}" >/dev/null
	fi
}

configure_artifact_bucket() {
	aws s3api put-public-access-block \
		--bucket "$ARTIFACT_BUCKET" \
		--public-access-block-configuration \
		'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true' >/dev/null

	aws s3api put-bucket-versioning \
		--bucket "$ARTIFACT_BUCKET" \
		--versioning-configuration Status=Enabled >/dev/null

	echo "Configured artifact bucket: ${ARTIFACT_BUCKET}"
}

configure_web_bucket_private() {
	aws s3api put-public-access-block \
		--bucket "$WEB_BUCKET" \
		--public-access-block-configuration \
		'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true' >/dev/null

	echo "Configured web bucket private access: ${WEB_BUCKET}"
}

tag_s3_bucket() {
	local bucket_name="$1"

	aws s3api put-bucket-tagging \
		--bucket "$bucket_name" \
		--tagging "TagSet=[{Key=Project,Value=${PROJECT}},{Key=Environment,Value=${ENV_NAME}},{Key=Service,Value=infra}]" >/dev/null
}

create_dynamodb_if_missing() {
	if aws dynamodb describe-table --table-name "$DDB_TABLE" --region "$AWS_REGION" >/dev/null 2>&1; then
		echo "DynamoDB table exists: ${DDB_TABLE}"
		return 0
	fi

	echo "Creating DynamoDB table: ${DDB_TABLE}"
	aws dynamodb create-table \
		--table-name "$DDB_TABLE" \
		--attribute-definitions AttributeName=avatarId,AttributeType=S \
		--key-schema AttributeName=avatarId,KeyType=HASH \
		--billing-mode PAY_PER_REQUEST \
		--region "$AWS_REGION" >/dev/null

	aws dynamodb wait table-exists --table-name "$DDB_TABLE" --region "$AWS_REGION"
	echo "Created DynamoDB table: ${DDB_TABLE}"
}

tag_dynamodb_table() {
	local table_arn
	table_arn="$(aws dynamodb describe-table --table-name "$DDB_TABLE" --region "$AWS_REGION" --query 'Table.TableArn' --output text)"

	aws dynamodb tag-resource \
		--resource-arn "$table_arn" \
		--tags Key=Project,Value="$PROJECT" Key=Environment,Value="$ENV_NAME" Key=Service,Value=avatar >/dev/null
}

ensure_oac() {
	local existing_id
	existing_id="$(aws cloudfront list-origin-access-controls \
		--query "OriginAccessControlList.Items[?Name=='${OAC_NAME}'].Id | [0]" \
		--output text 2>/dev/null || true)"

	if [[ -n "$existing_id" && "$existing_id" != "None" ]]; then
		echo "$existing_id"
		return 0
	fi

	echo "Creating CloudFront OAC: ${OAC_NAME}" >&2
	local tmpfile
	tmpfile="$(mktemp)"
	cat >"$tmpfile" <<JSON
{
	"Name": "${OAC_NAME}",
	"Description": "${PROJECT} ${ENV_NAME} S3 access",
	"SigningProtocol": "sigv4",
	"SigningBehavior": "always",
	"OriginAccessControlOriginType": "s3"
}
JSON

	local oac_id
	oac_id="$(aws cloudfront create-origin-access-control \
		--origin-access-control-config "file://${tmpfile}" \
		--query 'OriginAccessControl.Id' \
		--output text)"

	rm -f "$tmpfile"

	if [[ -z "$oac_id" || "$oac_id" == "None" ]]; then
		echo "Failed to create CloudFront OAC" >&2
		exit 1
	fi

	echo "$oac_id"
}

ensure_cloudfront_distribution() {
	local existing_id
	existing_id="$(aws cloudfront list-distributions \
		--query "DistributionList.Items[?Comment=='${CF_COMMENT}'].Id | [0]" \
		--output text 2>/dev/null || true)"

	if [[ -n "$existing_id" && "$existing_id" != "None" ]]; then
		echo "$existing_id"
		return 0
	fi

	local oac_id
	oac_id="$(ensure_oac)"

	local dist_config_file
	dist_config_file="$(mktemp)"
	cat >"$dist_config_file" <<JSON
{
	"CallerReference": "${PROJECT}-${ENV_NAME}-$(date +%s)",
	"Comment": "${CF_COMMENT}",
	"Enabled": true,
	"DefaultRootObject": "index.html",
	"Origins": {
		"Quantity": 1,
		"Items": [
			{
				"Id": "s3-${WEB_BUCKET}",
				"DomainName": "${WEB_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
				"S3OriginConfig": {
					"OriginAccessIdentity": ""
				},
				"OriginAccessControlId": "${oac_id}"
			}
		]
	},
	"DefaultCacheBehavior": {
		"TargetOriginId": "s3-${WEB_BUCKET}",
		"ViewerProtocolPolicy": "redirect-to-https",
		"AllowedMethods": {
			"Quantity": 2,
			"Items": ["GET", "HEAD"],
			"CachedMethods": {
				"Quantity": 2,
				"Items": ["GET", "HEAD"]
			}
		},
		"Compress": true,
		"CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
	},
	"CustomErrorResponses": {
		"Quantity": 2,
		"Items": [
			{
				"ErrorCode": 403,
				"ResponsePagePath": "/index.html",
				"ResponseCode": "200",
				"ErrorCachingMinTTL": 0
			},
			{
				"ErrorCode": 404,
				"ResponsePagePath": "/index.html",
				"ResponseCode": "200",
				"ErrorCachingMinTTL": 0
			}
		]
	},
	"PriceClass": "PriceClass_200"
}
JSON

	echo "Creating CloudFront distribution for bucket: ${WEB_BUCKET}" >&2
	local distribution_id
	distribution_id="$(aws cloudfront create-distribution \
		--distribution-config "file://${dist_config_file}" \
		--query 'Distribution.Id' \
		--output text)"

	rm -f "$dist_config_file"

	if [[ -z "$distribution_id" || "$distribution_id" == "None" ]]; then
		echo "Failed to create CloudFront distribution" >&2
		exit 1
	fi

	echo "$distribution_id"
}

apply_web_bucket_policy_for_cloudfront() {
	local distribution_id="$1"
	local distribution_arn="arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${distribution_id}"

	local policy_file
	policy_file="$(mktemp)"
	cat >"$policy_file" <<JSON
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "AllowCloudFrontServicePrincipalReadOnly",
			"Effect": "Allow",
			"Principal": {
				"Service": "cloudfront.amazonaws.com"
			},
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::${WEB_BUCKET}/*",
			"Condition": {
				"StringEquals": {
					"AWS:SourceArn": "${distribution_arn}"
				}
			}
		}
	]
}
JSON

	aws s3api put-bucket-policy \
		--bucket "$WEB_BUCKET" \
		--policy "file://${policy_file}" >/dev/null

	rm -f "$policy_file"
	echo "Applied S3 bucket policy for CloudFront distribution: ${distribution_id}"
}

if [[ "$ENSURE_GITHUB_OIDC" == "true" ]]; then
	ensure_github_oidc_provider
fi

create_bucket_if_missing "$ARTIFACT_BUCKET"
create_bucket_if_missing "$WEB_BUCKET"
configure_artifact_bucket
configure_web_bucket_private
tag_s3_bucket "$ARTIFACT_BUCKET"
tag_s3_bucket "$WEB_BUCKET"

create_dynamodb_if_missing
tag_dynamodb_table

CF_DISTRIBUTION_ID="$(ensure_cloudfront_distribution)"
CF_DOMAIN_NAME="$(aws cloudfront get-distribution --id "$CF_DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)"
apply_web_bucket_policy_for_cloudfront "$CF_DISTRIBUTION_ID"

echo ""
echo "=== Resource summary ==="
echo "AWS_ACCOUNT_ID=${ACCOUNT_ID}"
echo "AWS_REGION=${AWS_REGION}"
echo "SAM_STACK_NAME=${STACK_NAME}"
echo "SAM_S3_BUCKET=${ARTIFACT_BUCKET}"
echo "FRONTEND_S3_BUCKET=${WEB_BUCKET}"
echo "CLOUDFRONT_DISTRIBUTION_ID=${CF_DISTRIBUTION_ID}"
echo "DEPLOY_URL=https://${CF_DOMAIN_NAME}"
echo "DYNAMODB_AVATAR_TABLE=${DDB_TABLE}"
echo "AVATAR_REPOSITORY_BACKEND=dynamodb"
echo "EDGE_ORIGIN_VERIFY_HEADER_VALUE=<long-random-secret>"

if [[ -n "$WRITE_VARS_FILE" ]]; then
	mkdir -p "$(dirname "$WRITE_VARS_FILE")"
	cat >"$WRITE_VARS_FILE" <<EOF
AWS_REGION=${AWS_REGION}
AWS_ROLE_TO_ASSUME=
SAM_STACK_NAME=${STACK_NAME}
SAM_S3_BUCKET=${ARTIFACT_BUCKET}
FRONTEND_S3_BUCKET=${WEB_BUCKET}
CLOUDFRONT_DISTRIBUTION_ID=${CF_DISTRIBUTION_ID}
DYNAMODB_AVATAR_TABLE=${DDB_TABLE}
AVATAR_REPOSITORY_BACKEND=dynamodb
EDGE_ORIGIN_VERIFY_HEADER_VALUE=
EOF
	echo ""
	echo "Wrote vars template: ${WRITE_VARS_FILE}"
	echo "Fill AWS_ROLE_TO_ASSUME before register-env.sh"
fi
