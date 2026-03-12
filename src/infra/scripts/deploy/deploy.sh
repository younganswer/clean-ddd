#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INFRA_SCRIPTS_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

TARGET_ENV="prod"
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
  EDGE_ORIGIN_VERIFY_HEADER_VALUE
)

required_secrets=(
  DATABASE_URL_POOLED
  DATABASE_URL_DIRECT
)

source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/validate.sh"
source "${SCRIPT_DIR}/lib/data.sh"
source "${SCRIPT_DIR}/lib/deploy.sh"

main() {
  if [[ $# -gt 1 ]]; then
    print_usage
    exit 1
  fi

  if [[ $# -eq 1 && "$1" != "prod" ]]; then
    echo "unsupported target environment: $1"
    print_usage
    exit 1
  fi

  validate_required_inputs
  validate_guardrail_inputs
  build_workspace
  reset_database_on_every_deploy
  recover_stack_if_needed
  deploy_backend
  reset_and_seed_dynamodb_avatars_on_every_deploy
  resolve_urls
  deploy_frontend
  write_summary
}

main "$@"
