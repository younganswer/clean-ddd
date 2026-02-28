resolve_cloudfront_allowed_cidrs_if_enabled() {
  if [[ "$AUTO_RESOLVE_CLOUDFRONT_CIDRS" != "1" ]]; then
    return 0
  fi

  local resolver_script="${INFRA_SCRIPTS_DIR}/network/resolve-cloudfront-origin-cidrs.sh"
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