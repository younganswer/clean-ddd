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