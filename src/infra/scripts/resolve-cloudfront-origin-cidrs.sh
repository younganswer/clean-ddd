#!/usr/bin/env bash

set -euo pipefail

IP_RANGES_URL="https://ip-ranges.amazonaws.com/ip-ranges.json"
SERVICES="CLOUDFRONT_ORIGIN_FACING"
INCLUDE_IPV6=1

usage() {
  cat <<'USAGE'
Usage:
  src/infra/scripts/resolve-cloudfront-origin-cidrs.sh [options]

Options:
  --url <ip-ranges-json-url>   Source URL for AWS ip ranges json
  --services <csv>             Service filters (default: CLOUDFRONT_ORIGIN_FACING)
  --no-ipv6                    Exclude IPv6 CIDRs from output
  -h, --help                   Show this help

Examples:
  src/infra/scripts/resolve-cloudfront-origin-cidrs.sh
  src/infra/scripts/resolve-cloudfront-origin-cidrs.sh --services CLOUDFRONT_ORIGIN_FACING,CLOUDFRONT
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      IP_RANGES_URL="$2"
      shift 2
      ;;
    --services)
      SERVICES="$2"
      shift 2
      ;;
    --no-ipv6)
      INCLUDE_IPV6=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi

python3 - "$IP_RANGES_URL" "$SERVICES" "$INCLUDE_IPV6" <<'PY'
import json
import sys
from urllib.request import Request, urlopen


def main() -> int:
    url = sys.argv[1]
    services = [service.strip() for service in sys.argv[2].split(",") if service.strip()]
    include_ipv6 = sys.argv[3] == "1"
    if not services:
        services = ["CLOUDFRONT_ORIGIN_FACING"]

    request = Request(url, headers={"User-Agent": "clean-ddd-infra-script"})
    with urlopen(request, timeout=10) as response:
        payload = json.load(response)

    ipv4_prefixes = payload.get("prefixes", [])
    selected_ipv4 = {
        item["ip_prefix"]
        for item in ipv4_prefixes
        if item.get("service") in services and item.get("ip_prefix")
    }

    selected_ipv6 = set()
    if include_ipv6:
        ipv6_prefixes = payload.get("ipv6_prefixes", [])
        selected_ipv6 = {
            item["ipv6_prefix"]
            for item in ipv6_prefixes
            if item.get("service") in services and item.get("ipv6_prefix")
        }

    selected = sorted({*selected_ipv4, *selected_ipv6})

    if not selected:
        sys.stderr.write(
            "No CIDRs found for services: " + ",".join(services) + "\n"
        )
        return 1

    sys.stdout.write(",".join(selected))
    return 0


raise SystemExit(main())
PY