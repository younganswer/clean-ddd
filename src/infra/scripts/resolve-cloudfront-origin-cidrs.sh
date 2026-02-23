#!/usr/bin/env bash

set -euo pipefail

IP_RANGES_URL="https://ip-ranges.amazonaws.com/ip-ranges.json"
SERVICES="CLOUDFRONT_ORIGIN_FACING"

usage() {
  cat <<'USAGE'
Usage:
  src/infra/scripts/resolve-cloudfront-origin-cidrs.sh [options]

Options:
  --url <ip-ranges-json-url>   Source URL for AWS ip ranges json
  --services <csv>             Service filters (default: CLOUDFRONT_ORIGIN_FACING)
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

python3 - "$IP_RANGES_URL" "$SERVICES" <<'PY'
import json
import sys
from urllib.request import Request, urlopen


def main() -> int:
    url = sys.argv[1]
    services = [service.strip() for service in sys.argv[2].split(",") if service.strip()]
    if not services:
        services = ["CLOUDFRONT_ORIGIN_FACING"]

    request = Request(url, headers={"User-Agent": "clean-ddd-infra-script"})
    with urlopen(request, timeout=10) as response:
        payload = json.load(response)

    prefixes = payload.get("prefixes", [])
    selected = sorted(
        {
            item["ip_prefix"]
            for item in prefixes
            if item.get("service") in services and item.get("ip_prefix")
        }
    )

    if not selected:
        sys.stderr.write(
            "No IPv4 CIDRs found for services: " + ",".join(services) + "\n"
        )
        return 1

    sys.stdout.write(",".join(selected))
    return 0


raise SystemExit(main())
PY