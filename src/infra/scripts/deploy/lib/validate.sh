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
  if [[ ${#EDGE_ORIGIN_VERIFY_HEADER_VALUE} -lt 24 ]]; then
    echo "EDGE_ORIGIN_VERIFY_HEADER_VALUE is too short (min: 24 chars)"
    exit 1
  fi
}