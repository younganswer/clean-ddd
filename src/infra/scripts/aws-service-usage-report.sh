#!/usr/bin/env bash

set -euo pipefail

DAYS=30
AWS_REGION="${AWS_REGION-}"
AWS_PROFILE_NAME="${AWS_PROFILE-}"
STACK_NAME="${SAM_STACK_NAME-}"
FRONTEND_BUCKET="${FRONTEND_S3_BUCKET-}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID-}"
DYNAMODB_TABLE="${DYNAMODB_AVATAR_TABLE-}"
OUTPUT_DIR="tmp/aws-usage-report"

usage() {
  cat <<'USAGE'
Usage:
  src/infra/scripts/aws-service-usage-report.sh [options]

Options:
  --days <n>                        Lookback days (default: 30)
  --region <aws-region>             AWS region (default: env AWS_REGION)
  --profile <aws-profile>           AWS profile (default: env AWS_PROFILE)
  --stack-name <name>               CloudFormation stack name (required)
  --frontend-bucket <name>          Frontend S3 bucket name (optional)
  --cloudfront-distribution-id <id> CloudFront distribution ID (optional)
  --dynamodb-table <name>           DynamoDB table name (required)
  --output-dir <path>               Output directory (default: tmp/aws-usage-report)
  -h, --help                        Show this help

Examples:
  src/infra/scripts/aws-service-usage-report.sh \
    --profile clean-ddd \
    --region ap-northeast-2 \
    --stack-name clean-ddd-dev \
    --dynamodb-table clean-ddd-avatar-dev \
    --frontend-bucket clean-ddd-dev-web \
    --cloudfront-distribution-id E123EXAMPLE
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)
      DAYS="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --profile)
      AWS_PROFILE_NAME="$2"
      shift 2
      ;;
    --stack-name)
      STACK_NAME="$2"
      shift 2
      ;;
    --frontend-bucket)
      FRONTEND_BUCKET="$2"
      shift 2
      ;;
    --cloudfront-distribution-id)
      CLOUDFRONT_DISTRIBUTION_ID="$2"
      shift 2
      ;;
    --dynamodb-table)
      DYNAMODB_TABLE="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
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
  require_command jq
  require_command python3

  if [[ -z "$STACK_NAME" ]]; then
    echo "missing required option: --stack-name"
    exit 1
  fi

  if [[ -z "$DYNAMODB_TABLE" ]]; then
    echo "missing required option: --dynamodb-table"
    exit 1
  fi

  if [[ -z "$AWS_REGION" && -n "${AWS_DEFAULT_REGION-}" ]]; then
    AWS_REGION="$AWS_DEFAULT_REGION"
  fi

  if [[ -z "$AWS_REGION" ]]; then
    echo "missing AWS region. set --region or AWS_REGION"
    exit 1
  fi

  if ! [[ "$DAYS" =~ ^[0-9]+$ ]] || [[ "$DAYS" -le 0 ]]; then
    echo "--days must be a positive integer"
    exit 1
  fi
}

init_aws_env() {
  if [[ -n "$AWS_PROFILE_NAME" ]]; then
    export AWS_PROFILE="$AWS_PROFILE_NAME"
  fi

  export AWS_REGION
}

calc_time_range() {
  local time_values=()
  while IFS= read -r line; do
    time_values+=("$line")
  done < <(python3 - "$DAYS" <<'PY'
from datetime import datetime, timedelta, timezone
import sys

days = int(sys.argv[1])
end = datetime.now(timezone.utc)
start = end - timedelta(days=days)

print(start.strftime("%Y-%m-%dT%H:%M:%SZ"))
print(end.strftime("%Y-%m-%dT%H:%M:%SZ"))
print(start.strftime("%Y-%m-%d"))
print(end.strftime("%Y-%m-%d"))
PY
  )

  START_TIME_ISO="${time_values[0]}"
  END_TIME_ISO="${time_values[1]}"
  START_DATE="${time_values[2]}"
  END_DATE="${time_values[3]}"
}

aws_call() {
  aws "$@"
}

metric_sum() {
  local namespace="$1"
  local metric_name="$2"
  local stat="$3"
  local dimensions="$4"
  local region_override="${5-}"

  local args=(
    cloudwatch
    get-metric-statistics
    --namespace "$namespace"
    --metric-name "$metric_name"
    --start-time "$START_TIME_ISO"
    --end-time "$END_TIME_ISO"
    --period 86400
    --statistics "$stat"
    --dimensions "$dimensions"
  )

  if [[ -n "$region_override" ]]; then
    args+=(--region "$region_override")
  fi

  aws_call "${args[@]}" | jq -r --arg stat "$stat" '[.Datapoints[]?[$stat] // 0] | add // 0'
}

safe_metric_sum() {
  local namespace="$1"
  local metric_name="$2"
  local stat="$3"
  local dimensions="$4"
  local region_override="${5-}"

  if result=$(metric_sum "$namespace" "$metric_name" "$stat" "$dimensions" "$region_override" 2>/dev/null); then
    echo "$result"
  else
    echo "NA"
  fi
}

extract_stack_resources() {
  STACK_RESOURCES_JSON="$(aws_call cloudformation describe-stack-resources --stack-name "$STACK_NAME" --output json)"

  LAMBDA_FUNCTIONS=()
  API_IDS=()
  SQS_QUEUE_NAMES=()

  while IFS= read -r line; do
    [[ -n "$line" ]] && LAMBDA_FUNCTIONS+=("$line")
  done < <(jq -r '.StackResources[] | select(.ResourceType=="AWS::Lambda::Function") | .PhysicalResourceId' <<<"$STACK_RESOURCES_JSON")

  while IFS= read -r line; do
    [[ -n "$line" ]] && API_IDS+=("$line")
  done < <(jq -r '.StackResources[] | select(.ResourceType=="AWS::ApiGatewayV2::Api") | .PhysicalResourceId' <<<"$STACK_RESOURCES_JSON")

  while IFS= read -r line; do
    [[ -n "$line" ]] && SQS_QUEUE_NAMES+=("$line")
  done < <(jq -r '.StackResources[] | select(.ResourceType=="AWS::SQS::Queue") | .PhysicalResourceId | if startswith("https://") then (split("/") | .[-1]) else . end' <<<"$STACK_RESOURCES_JSON")
}

cost_for_service() {
  local service_name="$1"
  jq -r --arg service_name "$service_name" '[.ResultsByTime[].Groups[] | select(.Keys[0] == $service_name) | (.Metrics.UnblendedCost.Amount | tonumber)] | add // 0' <<<"$COST_BY_SERVICE_JSON"
}

is_number() {
  [[ "$1" =~ ^-?[0-9]+([.][0-9]+)?$ ]]
}

sum_values() {
  local total=0
  local value
  for value in "$@"; do
    if is_number "$value"; then
      total=$(python3 - "$total" "$value" <<'PY'
import sys
print(float(sys.argv[1]) + float(sys.argv[2]))
PY
)
    fi
  done
  echo "$total"
}

format_usd() {
  python3 - "$1" <<'PY'
import sys
print(f"{float(sys.argv[1]):.4f}")
PY
}

format_metric_value() {
  local value="$1"
  if [[ "$value" == "NA" ]]; then
    echo "NA"
    return
  fi

  python3 - "$value" <<'PY'
import sys
v = float(sys.argv[1])
if v.is_integer():
    print(f"{int(v)}")
else:
    print(f"{v:.4f}")
PY
}

add_result_row() {
  local service="$1"
  local request_metric="$2"
  local request_value="$3"
  local cost_usd="$4"
  local note="$5"
  printf '%s\t%s\t%s\t%s\t%s\n' "$service" "$request_metric" "$request_value" "$cost_usd" "$note" >> "$RESULTS_FILE"
}

collect_request_metrics() {
  local api_total=0
  local lambda_total=0
  local sqs_sent_total=0
  local cf_total="NA"
  local ddb_read=0
  local ddb_write=0
  local value

  local api_id
  for api_id in "${API_IDS[@]}"; do
    value=$(safe_metric_sum "AWS/ApiGateway" "Count" "Sum" "Name=ApiId,Value=${api_id}")
    if is_number "$value"; then
      api_total=$(sum_values "$api_total" "$value")
    fi
  done

  local function_name
  for function_name in "${LAMBDA_FUNCTIONS[@]}"; do
    value=$(safe_metric_sum "AWS/Lambda" "Invocations" "Sum" "Name=FunctionName,Value=${function_name}")
    if is_number "$value"; then
      lambda_total=$(sum_values "$lambda_total" "$value")
    fi
  done

  local queue_name
  for queue_name in "${SQS_QUEUE_NAMES[@]}"; do
    value=$(safe_metric_sum "AWS/SQS" "NumberOfMessagesSent" "Sum" "Name=QueueName,Value=${queue_name}")
    if is_number "$value"; then
      sqs_sent_total=$(sum_values "$sqs_sent_total" "$value")
    fi
  done

  ddb_read=$(safe_metric_sum "AWS/DynamoDB" "ConsumedReadCapacityUnits" "Sum" "Name=TableName,Value=${DYNAMODB_TABLE}" "${AWS_REGION}")
  ddb_write=$(safe_metric_sum "AWS/DynamoDB" "ConsumedWriteCapacityUnits" "Sum" "Name=TableName,Value=${DYNAMODB_TABLE}" "${AWS_REGION}")

  if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
    if cf_value=$(aws_call cloudwatch get-metric-statistics \
      --namespace AWS/CloudFront \
      --metric-name Requests \
      --start-time "$START_TIME_ISO" \
      --end-time "$END_TIME_ISO" \
      --period 86400 \
      --statistics Sum \
      --dimensions "Name=DistributionId,Value=${CLOUDFRONT_DISTRIBUTION_ID}" "Name=Region,Value=Global" \
      --region us-east-1 2>/dev/null | jq -r '[.Datapoints[]?.Sum // 0] | add // 0'); then
      if is_number "$cf_value"; then
        cf_total="$cf_value"
      fi
    fi
  fi

  REQUEST_API_GATEWAY=$(format_metric_value "$api_total")
  REQUEST_LAMBDA=$(format_metric_value "$lambda_total")
  REQUEST_SQS=$(format_metric_value "$sqs_sent_total")
  REQUEST_DDB_RCU=$(format_metric_value "$ddb_read")
  REQUEST_DDB_WCU=$(format_metric_value "$ddb_write")
  REQUEST_CLOUDFRONT=$(format_metric_value "$cf_total")
}

collect_cost_metrics() {
  COST_BY_SERVICE_JSON="$(aws_call ce get-cost-and-usage \
    --time-period Start="$START_DATE",End="$END_DATE" \
    --granularity DAILY \
    --metrics UnblendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --output json)"

  COST_API_GATEWAY="$(format_usd "$(cost_for_service "Amazon API Gateway")")"
  COST_LAMBDA="$(format_usd "$(cost_for_service "AWS Lambda")")"
  COST_SQS="$(format_usd "$(cost_for_service "Amazon Simple Queue Service")")"
  COST_DDB="$(format_usd "$(cost_for_service "Amazon DynamoDB")")"
  COST_S3="$(format_usd "$(cost_for_service "Amazon Simple Storage Service")")"
  COST_CLOUDFRONT="$(format_usd "$(cost_for_service "Amazon CloudFront")")"
}

write_reports() {
  mkdir -p "$OUTPUT_DIR"

  STACK_RESOURCE_FILE="${OUTPUT_DIR}/stack-resources.json"
  COST_RAW_FILE="${OUTPUT_DIR}/cost-by-service.raw.json"
  RESULTS_FILE="${OUTPUT_DIR}/service-usage.tsv"
  REPORT_MD_FILE="${OUTPUT_DIR}/report.md"

  printf 'service\trequest_metric\trequest_value\tcost_usd\tnote\n' > "$RESULTS_FILE"

  printf '%s\n' "$STACK_RESOURCES_JSON" > "$STACK_RESOURCE_FILE"
  printf '%s\n' "$COST_BY_SERVICE_JSON" > "$COST_RAW_FILE"

  add_result_row "API Gateway" "Count (Sum)" "$REQUEST_API_GATEWAY" "$COST_API_GATEWAY" "CloudWatch namespace AWS/ApiGateway"
  add_result_row "Lambda" "Invocations (Sum)" "$REQUEST_LAMBDA" "$COST_LAMBDA" "All Lambda functions in SAM stack"
  add_result_row "SQS" "NumberOfMessagesSent (Sum)" "$REQUEST_SQS" "$COST_SQS" "All SQS queues in SAM stack"
  add_result_row "DynamoDB" "ConsumedReadCapacityUnits (Sum)" "$REQUEST_DDB_RCU" "$COST_DDB" "요청 수 대체 지표(RCU)"
  add_result_row "DynamoDB" "ConsumedWriteCapacityUnits (Sum)" "$REQUEST_DDB_WCU" "$COST_DDB" "요청 수 대체 지표(WCU)"
  add_result_row "S3" "N/A" "NA" "$COST_S3" "요청 수는 request metrics 활성화 시 수집 가능"
  add_result_row "CloudFront" "Requests (Sum)" "$REQUEST_CLOUDFRONT" "$COST_CLOUDFRONT" "DistributionId 기반"

  {
    echo "# AWS Service Usage Report"
    echo ""
    echo "- Stack: ${STACK_NAME}"
    echo "- Region: ${AWS_REGION}"
    echo "- Period: ${START_DATE} ~ ${END_DATE} (last ${DAYS} days)"
    echo ""
    echo "| Service | Request Metric | Request Value | Cost (USD) | Note |"
    echo "| --- | --- | ---: | ---: | --- |"
    awk -F'\t' 'NR > 1 {printf "| %s | %s | %s | %s | %s |\n", $1, $2, $3, $4, $5}' "$RESULTS_FILE"
    echo ""
    echo "## Output Files"
    echo "- ${STACK_RESOURCE_FILE}"
    echo "- ${COST_RAW_FILE}"
    echo "- ${RESULTS_FILE}"
  } > "$REPORT_MD_FILE"

  cat "$REPORT_MD_FILE"
}

main() {
  validate_inputs
  init_aws_env
  calc_time_range
  extract_stack_resources
  collect_request_metrics
  collect_cost_metrics
  write_reports
}

main "$@"