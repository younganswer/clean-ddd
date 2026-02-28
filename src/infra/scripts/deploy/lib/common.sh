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