#!/usr/bin/env bash

set -euo pipefail

TARGET_ENV="$1"
REPO_SLUG="$2"
API_URL="$3"
DEPLOY_URL="$4"

print_usage() {
  echo "Usage: $0 <target_env> <repo_slug> <api_url> <deploy_url>"
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

  set +e
  gh repo edit "$REPO_SLUG" \
    --homepage "$DEPLOY_URL"
  repo_edit_status=$?
  set -e

  if [[ $repo_edit_status -ne 0 ]]; then
    echo "warning: failed to update repository homepage URL."
    return 0
  fi

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
    set +e
    git push origin HEAD:main
    push_status=$?
    set -e
    if [[ $push_status -ne 0 ]]; then
      echo "warning: failed to push README deployment URL update."
    fi
  fi
  popd >/dev/null
}

main() {
  if [[ $# -lt 4 ]]; then
    print_usage
    exit 1
  fi

  sync_github_metadata
}

main "$@"
