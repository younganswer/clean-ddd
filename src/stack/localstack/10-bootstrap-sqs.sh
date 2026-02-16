#!/usr/bin/env bash
set -euo pipefail

QUEUE_NAME="${OUTBOX_QUEUE_NAME:-OutboxDispatchQueue.fifo}"
QUEUE_ATTRIBUTES="${OUTBOX_QUEUE_ATTRIBUTES:-FifoQueue=true,ContentBasedDeduplication=false}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-northeast-2}}"

AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test awslocal sqs create-queue \
  --region "${REGION}" \
  --queue-name "${QUEUE_NAME}" \
  --attributes "${QUEUE_ATTRIBUTES}" \
  >/dev/null

echo "[localstack] ${QUEUE_NAME} created"
