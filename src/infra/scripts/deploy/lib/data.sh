reset_database_on_every_deploy() {
  echo "forcing postgres reset for every deploy: env=${TARGET_ENV}"
  pushd service/backend >/dev/null
  PGSSLMODE=require DB_FORCE_SSL=true pnpm db:reset:cd
  popd >/dev/null
}

reset_and_seed_dynamodb_avatars_on_every_deploy() {
  if [[ "$AVATAR_REPOSITORY_BACKEND" != "dynamodb" ]]; then
    echo "skip dynamodb avatar reset/seed: AVATAR_REPOSITORY_BACKEND=${AVATAR_REPOSITORY_BACKEND}"
    return 0
  fi

  echo "forcing dynamodb avatar table reset+seed for every deploy: env=${TARGET_ENV}"
  pushd service/backend >/dev/null
  pnpm db:reset:dynamodb:avatars:cd
  PGSSLMODE=require DB_FORCE_SSL=true pnpm db:seed:dynamodb:avatars:cd
  popd >/dev/null
}