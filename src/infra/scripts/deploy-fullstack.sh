#!/usr/bin/env bash

set -euo pipefail

TARGET_ENV="$1"
REPO_SLUG="$2"
ENV_VARS_FILE=".github/env/${TARGET_ENV}.vars"

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
)

required_secrets=(
  DATABASE_URL_POOLED
  DATABASE_URL_DIRECT
)

print_usage() {
  echo "Usage: $0 <target_env> <repo_slug>"
}

load_env_file_fallback() {
  if [[ ! -f "$ENV_VARS_FILE" ]]; then
    return 0
  fi

  while IFS='=' read -r raw_key raw_value; do
    key="${raw_key%%[[:space:]]*}"
    value="${raw_value:-}"

    if [[ -z "$key" || "$key" == \#* ]]; then
      continue
    fi

    if [[ -z "${!key-}" ]]; then
      export "$key=$value"
    fi
  done < "$ENV_VARS_FILE"
}

validate_required_inputs() {
  if [[ -z "${AWS_REGION-}" && -n "${AWS_DEFAULT_REGION-}" ]]; then
    export AWS_REGION="$AWS_DEFAULT_REGION"
  fi

  for key in "${required_vars[@]}"; do
    value="${!key-}"
    if [[ -z "$value" ]]; then
      echo "missing required github environment variable: $key"
      exit 1
    fi
  done

  for key in "${required_secrets[@]}"; do
    value="${!key-}"
    if [[ -z "$value" ]]; then
      echo "missing required github environment secret: $key"
      exit 1
    fi
  done
}

build_workspace() {
  pnpm build
  sam validate --template-file infra/sam/template.yaml
  sam build --template-file infra/sam/template.yaml
}

reset_dev_database_if_needed() {
  if [[ "$TARGET_ENV" != "dev" ]]; then
    return 0
  fi

  pushd service/backend >/dev/null
  PGSSLMODE=require DB_FORCE_SSL=true pnpm db:reset:ci
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
  sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name "$SAM_STACK_NAME" \
    --s3-bucket "$SAM_S3_BUCKET" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
      DatabaseUrlPooled="$DATABASE_URL_POOLED" \
      DatabaseUrlDirect="$DATABASE_URL_DIRECT" \
      AvatarRepositoryBackend="$AVATAR_REPOSITORY_BACKEND" \
      DynamoDbAvatarTable="$DYNAMODB_AVATAR_TABLE"
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

sync_github_metadata() {
  export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
  if [[ -z "$GH_TOKEN" ]]; then
    echo "warning: GH_TOKEN/GITHUB_TOKEN not found, skipping GitHub variable sync."
    return 0
  fi

  set +e
  gh variable set NEXT_PUBLIC_API_BASE_URL \
    --repo "$REPO_SLUG" \
    --env "$TARGET_ENV" \
    --body "$API_URL"
  api_var_status=$?

  gh variable set DEPLOY_URL \
    --repo "$REPO_SLUG" \
    --env "$TARGET_ENV" \
    --body "$DEPLOY_URL"
  deploy_var_status=$?
  set -e

  if [[ $api_var_status -ne 0 || $deploy_var_status -ne 0 ]]; then
    echo "warning: failed to sync one or more GitHub environment variables."
  fi

  gh repo edit "$REPO_SLUG" \
    --homepage "$DEPLOY_URL"

  pushd .. >/dev/null
  python3 - <<'PY'
from pathlib import Path
import os

readme = Path('README.md')
content = readme.read_text(encoding='utf-8')
marker = '- Production URL:'
replacement = f'- Production URL: {os.environ["DEPLOY_URL"]}'

if marker in content:
    lines = []
    for line in content.splitlines():
        if line.startswith(marker):
            lines.append(replacement)
        else:
            lines.append(line)
    readme.write_text('\n'.join(lines) + '\n', encoding='utf-8')
PY

  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"
  git add README.md
  if ! git diff --cached --quiet; then
    git commit -m "docs: update deployment URL"
    git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${REPO_SLUG}.git"
    git push origin HEAD:main
  fi
  popd >/dev/null
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
  if [[ $# -lt 2 ]]; then
    print_usage
    exit 1
  fi

  load_env_file_fallback
  validate_required_inputs
  build_workspace
  reset_dev_database_if_needed
  recover_stack_if_needed
  deploy_backend
  resolve_urls
  deploy_frontend
  sync_github_metadata
  write_summary
}

main "$@"
