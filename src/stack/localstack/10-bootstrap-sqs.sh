#!/usr/bin/env bash
set -euo pipefail

AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test awslocal sqs create-queue \
  --region "${AWS_REGION:-ap-northeast-2}" \
  --queue-name OutboxDispatchQueue.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=false \
  >/dev/null

echo "[localstack] OutboxDispatchQueue.fifo created"
