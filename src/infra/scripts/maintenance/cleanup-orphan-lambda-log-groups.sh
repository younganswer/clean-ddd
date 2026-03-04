#!/usr/bin/env bash

set -euo pipefail

PROJECT_NAME="clean-ddd"
ENVIRONMENT_NAME="dev"
DRY_RUN="true"
ASSUME_YES="false"

usage() {
  cat <<'USAGE'
Usage:
  src/infra/scripts/maintenance/cleanup-orphan-lambda-log-groups.sh [options]

Options:
  --project <name>   Project prefix (default: clean-ddd)
  --env <name>       Environment name (default: dev)
  --dry-run          Print deletions only (default behavior)
  --apply            Actually delete orphan log groups
  --yes              Skip confirmation prompt (only with --apply)
  -h, --help         Show this help

Examples:
  src/infra/scripts/maintenance/cleanup-orphan-lambda-log-groups.sh --project clean-ddd --env prod --dry-run
  src/infra/scripts/maintenance/cleanup-orphan-lambda-log-groups.sh --project clean-ddd --env prod --apply --yes
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_NAME="$2"
      shift 2
      ;;
    --env)
      ENVIRONMENT_NAME="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --apply)
      DRY_RUN="false"
      shift
      ;;
    --yes)
      ASSUME_YES="true"
      shift
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

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "required command not found: ${command_name}"
    exit 1
  fi
}

validate_inputs() {
  require_command aws

  if [[ -z "$PROJECT_NAME" ]]; then
    echo "--project must not be empty"
    exit 1
  fi

  if [[ -z "$ENVIRONMENT_NAME" ]]; then
    echo "--env must not be empty"
    exit 1
  fi
}

confirm_if_needed() {
  if [[ "$DRY_RUN" == "true" ]]; then
    return 0
  fi

  if [[ "$ASSUME_YES" == "true" ]]; then
    return 0
  fi

  echo "This will delete orphan CloudWatch log groups under /aws/lambda/${PROJECT_NAME}-${ENVIRONMENT_NAME}-*"
  read -r -p "Continue? [y/N] " answer

  case "$answer" in
    y|Y|yes|YES)
      ;;
    *)
      echo "aborted"
      exit 0
      ;;
  esac
}

collect_active_functions() {
  local prefix="$1"

  aws lambda list-functions \
    --query "Functions[?starts_with(FunctionName, '${prefix}')].FunctionName" \
    --output text \
    | tr '\t' '\n' \
    | sed '/^$/d' \
    | sort -u
}

collect_log_groups() {
  local log_prefix="$1"

  aws logs describe-log-groups \
    --log-group-name-prefix "$log_prefix" \
    --query "logGroups[].logGroupName" \
    --output text \
    | tr '\t' '\n' \
    | sed '/^$/d' \
    | sort -u
}

is_active_function() {
  local name="$1"
  local active_list="$2"

  if [[ -z "$active_list" ]]; then
    return 1
  fi

  if printf '%s\n' "$active_list" | grep -Fxq "$name"; then
    return 0
  fi

  return 1
}

main() {
  validate_inputs

  local function_prefix="${PROJECT_NAME}-${ENVIRONMENT_NAME}-"
  local log_group_prefix="/aws/lambda/${function_prefix}"

  local active_functions
  active_functions="$(collect_active_functions "$function_prefix")"

  local log_groups
  log_groups="$(collect_log_groups "$log_group_prefix")"

  local orphan_groups=()

  while IFS= read -r log_group; do
    [[ -z "$log_group" ]] && continue

    local function_name
    function_name="${log_group#/aws/lambda/}"

    if ! is_active_function "$function_name" "$active_functions"; then
      orphan_groups+=("$log_group")
    fi
  done <<<"$log_groups"

  echo "project: ${PROJECT_NAME}"
  echo "environment: ${ENVIRONMENT_NAME}"
  echo "active functions: $(printf '%s\n' "$active_functions" | sed '/^$/d' | wc -l | tr -d ' ')"
  echo "matched log groups: $(printf '%s\n' "$log_groups" | sed '/^$/d' | wc -l | tr -d ' ')"
  echo "orphan log groups: ${#orphan_groups[@]}"

  if [[ ${#orphan_groups[@]} -eq 0 ]]; then
    echo "nothing to clean"
    return 0
  fi

  printf '%s\n' "${orphan_groups[@]}"

  confirm_if_needed

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "dry-run complete"
    return 0
  fi

  local deleted_count=0
  local log_group
  for log_group in "${orphan_groups[@]}"; do
    aws logs delete-log-group --log-group-name "$log_group"
    deleted_count=$((deleted_count + 1))
    echo "deleted: ${log_group}"
  done

  echo "done. deleted orphan log groups: ${deleted_count}"
}

main
