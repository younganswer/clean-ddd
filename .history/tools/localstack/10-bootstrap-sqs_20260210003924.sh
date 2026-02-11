#!/usr/bin/env bash
set -euo pipefail

awslocal sqs create-queue \
  --region "${AWS_REGION:-us-east-1}" \
  --queue-name OutboxDispatchQueue.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=false \
  >/dev/null

echo "[localstack] OutboxDispatchQueue.fifo created"
