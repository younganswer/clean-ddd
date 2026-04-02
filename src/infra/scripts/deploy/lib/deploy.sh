build_workspace() {
  pnpm build
  sam validate --template-file infra/sam/template.yaml
  sam build --template-file infra/sam/template.yaml
}

recover_stack_if_needed() {
  local stack_status
  stack_status=$(aws cloudformation describe-stacks \
    --stack-name "$SAM_STACK_NAME" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || true)

  if [[ -z "$stack_status" || "$stack_status" == "None" ]]; then
    return 0
  fi

  case "$stack_status" in
    DELETE_IN_PROGRESS)
      aws cloudformation wait stack-delete-complete --stack-name "$SAM_STACK_NAME"
      ;;
    ROLLBACK_COMPLETE|ROLLBACK_FAILED|UPDATE_ROLLBACK_COMPLETE|UPDATE_ROLLBACK_FAILED)
      aws cloudformation delete-stack --stack-name "$SAM_STACK_NAME"
      aws cloudformation wait stack-delete-complete --stack-name "$SAM_STACK_NAME"
      ;;
  esac
}

deploy_backend() {
  local outbox_consumer_lock_timeout_ms="${OUTBOX_CONSUMER_LOCK_TIMEOUT_MS-120000}"

  run_with_timeout "$DEPLOY_TIMEOUT_SECONDS" sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name "$SAM_STACK_NAME" \
    --s3-bucket "$SAM_S3_BUCKET" \
    --resolve-image-repos \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
      ProjectName="$PROJECT_NAME" \
      EnvironmentName="$TARGET_ENV" \
      DatabaseUrlPooled="$DATABASE_URL_POOLED" \
      DatabaseUrlPrimary="$DATABASE_URL_DIRECT" \
      AvatarRepositoryBackend="$AVATAR_REPOSITORY_BACKEND" \
      DynamoDbAvatarTable="$DYNAMODB_AVATAR_TABLE" \
      OutboxConsumerLockTimeoutMs="$outbox_consumer_lock_timeout_ms" \
      EdgeOriginVerifyHeaderValue="$EDGE_ORIGIN_VERIFY_HEADER_VALUE"
}

resolve_urls() {
  local api_stage_url
  api_stage_url=$(aws cloudformation describe-stacks \
    --stack-name "$SAM_STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text)

  if [[ -z "$api_stage_url" || "$api_stage_url" == "None" ]]; then
    echo "Failed to resolve ApiUrl from CloudFormation outputs"
    exit 1
  fi

  API_URL="${api_stage_url%/}/api/v1"

  local cf_domain
  cf_domain=$(aws cloudfront get-distribution \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --query "Distribution.DomainName" \
    --output text)

  if [[ -z "$cf_domain" || "$cf_domain" == "None" ]]; then
    echo "Failed to resolve CloudFront domain"
    exit 1
  fi

  DEPLOY_URL="https://${cf_domain}"
}

deploy_frontend() {
  pushd service/frontend >/dev/null
  NEXT_PUBLIC_API_BASE_URL="$API_URL" pnpm build

  aws s3 sync out "s3://${FRONTEND_S3_BUCKET}" --delete

  while IFS= read -r index_file; do
    relative_path="${index_file#out/}"
    route_path="${relative_path%/index.html}"

    if [[ -z "$route_path" || "$route_path" == "index.html" ]]; then
      continue
    fi

    aws s3 cp "$index_file" "s3://${FRONTEND_S3_BUCKET}/${route_path}" \
      --content-type text/html \
      --cache-control "public, max-age=60"

    aws s3api put-object \
      --bucket "$FRONTEND_S3_BUCKET" \
      --key "${route_path}/" \
      --body "$index_file" \
      --content-type text/html \
      --cache-control "public, max-age=60"
  done < <(find out -type f -name index.html)
  popd >/dev/null

  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*"
}

write_summary() {
  if [[ -z "${GITHUB_STEP_SUMMARY-}" ]]; then
    return 0
  fi

  {
    echo "## Deploy Summary"
    echo "- target env: ${TARGET_ENV}"
    echo "- stack: ${SAM_STACK_NAME}"
    echo "- api url: ${API_URL}"
    echo "- deploy url: ${DEPLOY_URL}"
    echo "- frontend bucket: ${FRONTEND_S3_BUCKET}"
  } >> "$GITHUB_STEP_SUMMARY"
}