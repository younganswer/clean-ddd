#!/usr/bin/env bash

set -euo pipefail

TARGET_ENV="$1"
DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS-1200}"
PROJECT_NAME="${PROJECT_NAME-clean-ddd}"

API_URL=""
DEPLOY_URL=""

required_vars=(
  AWS_ROLE_TO_ASSUME
  AWS_REGION
  SAM_STACK_NAME
  SAM_S3_BUCKET
  FRONTEND_S3_BUCKET
  CLOUDFRONT_DISTRIBUTION_ID
  AVATAR_REPOSITORY_BACKEND
  DYNAMODB_AVATAR_TABLE
  API_CLOUDFRONT_ALLOWED_CIDRS
  PRIVATE_API_VPCE_IDS
  EDGE_ORIGIN_VERIFY_HEADER_VALUE
)

required_secrets=(
  DATABASE_URL_POOLED
  DATABASE_URL_DIRECT
)

AUTO_RESOLVE_CLOUDFRONT_CIDRS="${AUTO_RESOLVE_CLOUDFRONT_CIDRS-1}"

print_usage() {
  echo "Usage: $0 <target_env>"
}

validate_required_inputs() {
  if [[ -z "${AWS_REGION-}" && -n "${AWS_DEFAULT_REGION-}" ]]; then
    export AWS_REGION="$AWS_DEFAULT_REGION"
  fi

  for key in "${required_vars[@]}"; do
    value="${!key-}"
    if [[ -z "$value" ]]; then
      echo "missing required github environment variable: $key"
      echo "hint: check Repository Settings > Environments > '$TARGET_ENV' > Variables"
      exit 1
    fi
  done

  for key in "${required_secrets[@]}"; do
    value="${!key-}"
    if [[ -z "$value" ]]; then
      echo "missing required github environment secret: $key"
      echo "hint: check Repository Settings > Environments > '$TARGET_ENV' > Secrets"
      exit 1
    fi
  done

}

validate_guardrail_inputs() {
  if [[ "$API_CLOUDFRONT_ALLOWED_CIDRS" == *" "* ]]; then
    echo "API_CLOUDFRONT_ALLOWED_CIDRS must be comma-separated without spaces"
    exit 1
  fi

  IFS=',' read -r -a cidrs <<< "$API_CLOUDFRONT_ALLOWED_CIDRS"
  if [[ "${#cidrs[@]}" -eq 0 ]]; then
    echo "API_CLOUDFRONT_ALLOWED_CIDRS must contain at least one CIDR"
    exit 1
  fi

  if command -v python3 >/dev/null 2>&1; then
    if ! python3 - "$API_CLOUDFRONT_ALLOWED_CIDRS" <<'PY'
import ipaddress
import sys

cidrs = [item.strip() for item in sys.argv[1].split(",") if item.strip()]
for cidr in cidrs:
    try:
        ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        print(cidr)
        raise SystemExit(1)
PY
    then
      echo "invalid CIDR format in API_CLOUDFRONT_ALLOWED_CIDRS"
      exit 1
    fi
  else
    for cidr in "${cidrs[@]}"; do
      if [[ ! "$cidr" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$ ]] && [[ ! "$cidr" =~ ^[0-9A-Fa-f:]+/[0-9]{1,3}$ ]]; then
        echo "invalid CIDR format in API_CLOUDFRONT_ALLOWED_CIDRS: $cidr"
        exit 1
      fi
    done
  fi

  if [[ "$PRIVATE_API_VPCE_IDS" == *" "* ]]; then
    echo "PRIVATE_API_VPCE_IDS must be comma-separated without spaces"
    exit 1
  fi

  IFS=',' read -r -a vpce_ids <<< "$PRIVATE_API_VPCE_IDS"
  if [[ "${#vpce_ids[@]}" -eq 0 ]]; then
    echo "PRIVATE_API_VPCE_IDS must contain at least one vpce id"
    exit 1
  fi

  for vpce_id in "${vpce_ids[@]}"; do
    if [[ ! "$vpce_id" =~ ^vpce-[0-9a-f]+$ ]]; then
      echo "invalid VPC endpoint id in PRIVATE_API_VPCE_IDS: $vpce_id"
      exit 1
    fi
  done

  if [[ ${#EDGE_ORIGIN_VERIFY_HEADER_VALUE} -lt 24 ]]; then
    echo "EDGE_ORIGIN_VERIFY_HEADER_VALUE is too short (min: 24 chars)"
    exit 1
  fi
}

resolve_cloudfront_allowed_cidrs_if_enabled() {
  if [[ "$AUTO_RESOLVE_CLOUDFRONT_CIDRS" != "1" ]]; then
    return 0
  fi

  local resolver_script="infra/scripts/resolve-cloudfront-origin-cidrs.sh"
  if [[ ! -x "$resolver_script" ]]; then
    chmod +x "$resolver_script"
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    echo "warning: python3 not found; using API_CLOUDFRONT_ALLOWED_CIDRS from environment"
    return 0
  fi

  local resolved_cidrs
  if resolved_cidrs=$("$resolver_script"); then
    if [[ -n "$resolved_cidrs" ]]; then
      API_CLOUDFRONT_ALLOWED_CIDRS="$resolved_cidrs"
      export API_CLOUDFRONT_ALLOWED_CIDRS
      echo "resolved CloudFront origin CIDRs dynamically (${#resolved_cidrs} chars)"
      return 0
    fi
  fi

  echo "warning: failed to resolve CloudFront CIDRs dynamically; using API_CLOUDFRONT_ALLOWED_CIDRS from environment"
}

build_workspace() {
  pnpm build
  sam validate --template-file infra/sam/template.yaml
  sam build --template-file infra/sam/template.yaml
}

run_with_timeout() {
  local seconds="$1"
  shift

  if [[ -n "${seconds}" ]] && [[ "${seconds}" =~ ^[0-9]+$ ]] && [[ "${seconds}" -gt 0 ]]; then
    if command -v timeout >/dev/null 2>&1; then
      timeout "${seconds}" "$@"
      return
    fi

    if command -v gtimeout >/dev/null 2>&1; then
      gtimeout "${seconds}" "$@"
      return
    fi

    echo "warning: timeout command not found; running without timeout" >&2
  fi

  "$@"
}

reset_dev_database_if_needed() {
  if [[ "$TARGET_ENV" != "dev" ]]; then
    return 0
  fi

  pushd service/backend >/dev/null
  PGSSLMODE=require DB_FORCE_SSL=true pnpm db:reset:cd
  popd >/dev/null
}

seed_dynamodb_avatars_for_prod_if_needed() {
  if [[ "$TARGET_ENV" != "prod" ]]; then
    return 0
  fi

  if [[ "$AVATAR_REPOSITORY_BACKEND" != "dynamodb" ]]; then
    echo "skip dynamodb avatar seed: AVATAR_REPOSITORY_BACKEND=${AVATAR_REPOSITORY_BACKEND}"
    return 0
  fi

  pushd service/backend >/dev/null
  PGSSLMODE=require DB_FORCE_SSL=true pnpm db:seed:dynamodb:avatars:cd
  popd >/dev/null
}

recover_stack_if_needed() {
  local stack_status
  stack_status=$(aws cloudformation describe-stacks \
    --stack-name "$SAM_STACK_NAME" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || true)

  if [[ -z "$stack_status" || "$stack_status" == "None" ]]; then
    return 0
  fi

  case "$stack_status" in
    DELETE_IN_PROGRESS)
      aws cloudformation wait stack-delete-complete --stack-name "$SAM_STACK_NAME"
      ;;
    ROLLBACK_COMPLETE|ROLLBACK_FAILED|UPDATE_ROLLBACK_COMPLETE|UPDATE_ROLLBACK_FAILED)
      aws cloudformation delete-stack --stack-name "$SAM_STACK_NAME"
      aws cloudformation wait stack-delete-complete --stack-name "$SAM_STACK_NAME"
      ;;
  esac
}

deploy_backend() {
  run_with_timeout "$DEPLOY_TIMEOUT_SECONDS" sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name "$SAM_STACK_NAME" \
    --s3-bucket "$SAM_S3_BUCKET" \
    --resolve-image-repos \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
      ProjectName="$PROJECT_NAME" \
      EnvironmentName="$TARGET_ENV" \
      DatabaseUrlPooled="$DATABASE_URL_POOLED" \
      DatabaseUrlDirect="$DATABASE_URL_DIRECT" \
      AvatarRepositoryBackend="$AVATAR_REPOSITORY_BACKEND" \
      DynamoDbAvatarTable="$DYNAMODB_AVATAR_TABLE" \
      CloudFrontAllowedCidrs="$API_CLOUDFRONT_ALLOWED_CIDRS" \
      PrivateApiVpceIds="$PRIVATE_API_VPCE_IDS" \
      EdgeOriginVerifyHeaderValue="$EDGE_ORIGIN_VERIFY_HEADER_VALUE"
}

resolve_urls() {
  local api_stage_url
  api_stage_url=$(aws cloudformation describe-stacks \
    --stack-name "$SAM_STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text)

  if [[ -z "$api_stage_url" || "$api_stage_url" == "None" ]]; then
    echo "Failed to resolve ApiUrl from CloudFormation outputs"
    exit 1
  fi

  API_URL="${api_stage_url%/}/api/v1"

  local cf_domain
  cf_domain=$(aws cloudfront get-distribution \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --query "Distribution.DomainName" \
    --output text)

  if [[ -z "$cf_domain" || "$cf_domain" == "None" ]]; then
    echo "Failed to resolve CloudFront domain"
    exit 1
  fi

  DEPLOY_URL="https://${cf_domain}"
}

deploy_frontend() {
  pushd service/frontend >/dev/null
  NEXT_PUBLIC_API_BASE_URL="$API_URL" pnpm build

  aws s3 sync out "s3://${FRONTEND_S3_BUCKET}" --delete

  while IFS= read -r index_file; do
    relative_path="${index_file#out/}"
    route_path="${relative_path%/index.html}"

    if [[ -z "$route_path" || "$route_path" == "index.html" ]]; then
      continue
    fi

    aws s3 cp "$index_file" "s3://${FRONTEND_S3_BUCKET}/${route_path}" \
      --content-type text/html \
      --cache-control "public, max-age=60"

    aws s3api put-object \
      --bucket "$FRONTEND_S3_BUCKET" \
      --key "${route_path}/" \
      --body "$index_file" \
      --content-type text/html \
      --cache-control "public, max-age=60"
  done < <(find out -type f -name index.html)
  popd >/dev/null

  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*"
}

write_summary() {
  if [[ -z "${GITHUB_STEP_SUMMARY-}" ]]; then
    return 0
  fi

  {
    echo "## Deploy Summary"
    echo "- target env: ${TARGET_ENV}"
    echo "- stack: ${SAM_STACK_NAME}"
    echo "- api url: ${API_URL}"
    echo "- deploy url: ${DEPLOY_URL}"
    echo "- frontend bucket: ${FRONTEND_S3_BUCKET}"
  } >> "$GITHUB_STEP_SUMMARY"
}

main() {
  if [[ $# -lt 1 ]]; then
    print_usage
    exit 1
  fi

  validate_required_inputs
  resolve_cloudfront_allowed_cidrs_if_enabled
  validate_guardrail_inputs
  build_workspace
  reset_dev_database_if_needed
  recover_stack_if_needed
  deploy_backend
  seed_dynamodb_avatars_for_prod_if_needed
  resolve_urls
  deploy_frontend
  write_summary
}

main "$@"
