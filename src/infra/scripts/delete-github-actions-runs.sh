#!/usr/bin/env bash

set -euo pipefail

REPO="${GITHUB_REPOSITORY-}"
PER_PAGE=100
DRY_RUN="false"
ASSUME_YES="false"

usage() {
  cat <<'USAGE'
Usage:
  src/infra/scripts/delete-github-actions-runs.sh [options]

Options:
  --repo <owner/name>  Target repository (required if GITHUB_REPOSITORY is not set)
  --per-page <n>       API page size, 1-100 (default: 100)
  --dry-run            Print what would be deleted without deleting
  --yes                Skip confirmation prompt
  -h, --help           Show this help

Examples:
  src/infra/scripts/delete-github-actions-runs.sh --repo younganswer/clean-ddd --yes
  src/infra/scripts/delete-github-actions-runs.sh --repo owner/repo --dry-run
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="$2"
      shift 2
      ;;
    --per-page)
      PER_PAGE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
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
  require_command gh
  require_command jq

  if [[ -z "$REPO" ]]; then
    echo "missing required option: --repo (or set GITHUB_REPOSITORY)"
    exit 1
  fi

  if ! [[ "$REPO" =~ ^[^/]+/[^/]+$ ]]; then
    echo "invalid --repo format. expected: owner/name"
    exit 1
  fi

  if ! [[ "$PER_PAGE" =~ ^[0-9]+$ ]] || [[ "$PER_PAGE" -lt 1 ]] || [[ "$PER_PAGE" -gt 100 ]]; then
    echo "--per-page must be an integer between 1 and 100"
    exit 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "gh is not authenticated. run: gh auth login"
    exit 1
  fi
}

confirm_if_needed() {
  if [[ "$ASSUME_YES" == "true" ]]; then
    return 0
  fi

  echo "This will permanently delete ALL GitHub Actions workflow runs in ${REPO}."
  echo "This cannot be undone."
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

fetch_run_ids() {
  local page="$1"
  gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/${REPO}/actions/runs?per_page=${PER_PAGE}&page=${page}" \
    | jq -r '.workflow_runs[]?.id'
}

delete_run() {
  local run_id="$1"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] delete run: ${run_id}"
    return 0
  fi

  gh api \
    --method DELETE \
    -H "Accept: application/vnd.github+json" \
    "/repos/${REPO}/actions/runs/${run_id}" >/dev/null

  echo "deleted run: ${run_id}"
}

delete_all_runs() {
  local page=1
  local batch_count
  local total_count=0

  while true; do
    local run_ids
    run_ids="$(fetch_run_ids "$page")"

    if [[ -z "$run_ids" ]]; then
      break
    fi

    batch_count="$(printf '%s\n' "$run_ids" | sed '/^$/d' | wc -l | tr -d ' ')"
    echo "page ${page}: ${batch_count} runs"

    while IFS= read -r run_id; do
      [[ -z "$run_id" ]] && continue
      delete_run "$run_id"
      total_count=$((total_count + 1))
    done <<<"$run_ids"

    page=$((page + 1))
  done

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "done (dry-run). runs matched: ${total_count}"
  else
    echo "done. runs deleted: ${total_count}"
  fi
}

validate_inputs
confirm_if_needed
delete_all_runs
