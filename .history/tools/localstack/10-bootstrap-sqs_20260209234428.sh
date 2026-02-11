#!/usr/bin/env bash
set -euo pipefail

awslocal sqs create-queue \
  --queue-name OutboxDispatchQueue.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=false \
  >/dev/null

echo "[localstack] OutboxDispatchQueue.fifo created"
