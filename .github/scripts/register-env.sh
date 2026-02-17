#!/usr/bin/env bash

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install from https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh auth login is required before running this script"
  exit 1
fi

if [[ $# -lt 3 ]]; then
  cat <<'USAGE'
Usage:
  .github/scripts/register-env.sh <owner/repo> <environment> <vars.env> [secrets.env] [homepage_url]

Example:
  .github/scripts/register-env.sh younganswer/clean-ddd dev .github/env/dev.vars .github/env/dev.secrets https://example.com

Notes:
  - vars.env format: KEY=value (non-sensitive values)
  - secrets.env format: KEY=value (sensitive values)
  - Empty lines and lines starting with # are ignored
USAGE
  exit 1
fi

REPOSITORY="$1"
ENVIRONMENT="$2"
VARS_FILE="$3"
SECRETS_FILE="${4:-}"
HOMEPAGE_URL="${5:-}"

ensure_environment() {
  local repo="$1"
  local env_name="$2"
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${repo}/environments/${env_name}" >/dev/null
  echo "environment ensured: ${env_name}"
}

if [[ ! -f "$VARS_FILE" ]]; then
  echo "vars file not found: $VARS_FILE"
  exit 1
fi

ensure_environment "$REPOSITORY" "$ENVIRONMENT"

set_variable() {
  local key="$1"
  local value="$2"
  gh variable set "$key" --repo "$REPOSITORY" --env "$ENVIRONMENT" --body "$value" >/dev/null
  echo "variable set: $key"
}

set_secret() {
  local key="$1"
  local value="$2"
  gh secret set "$key" --repo "$REPOSITORY" --env "$ENVIRONMENT" --body "$value" >/dev/null
  echo "secret set: $key"
}

parse_env_file() {
  local file_path="$1"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" != *"="* ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key//[[:space:]]/}"
    if [[ -z "$key" ]]; then
      continue
    fi

    printf '%s\t%s\n' "$key" "$value"
  done <"$file_path"
}

while IFS=$'\t' read -r key value; do
  set_variable "$key" "$value"
done < <(parse_env_file "$VARS_FILE")

if [[ -n "$SECRETS_FILE" ]]; then
  if [[ ! -f "$SECRETS_FILE" ]]; then
    echo "secrets file not found: $SECRETS_FILE"
    exit 1
  fi

  while IFS=$'\t' read -r key value; do
    set_secret "$key" "$value"
  done < <(parse_env_file "$SECRETS_FILE")
fi

if [[ -n "$HOMEPAGE_URL" ]]; then
  gh repo edit "$REPOSITORY" --homepage "$HOMEPAGE_URL"
  echo "repository homepage set: $HOMEPAGE_URL"
fi

echo "completed: repository=$REPOSITORY environment=$ENVIRONMENT"