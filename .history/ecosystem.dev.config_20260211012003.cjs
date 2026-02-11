const path = require("node:path");

const backendCwd = path.join(__dirname, "apps", "backend");
const frontendCwd = path.join(__dirname, "apps", "frontend");

module.exports = {
  apps: [
    // HTTP API (cluster)
    {
      name: "clean-ddd-api",
      cwd: backendCwd,
      script: "dist/src/main.js",
      exec_mode: "cluster",
      instances: Number(process.env.PM2_API_INSTANCES ?? 1),
      merge_logs: true,
      autorestart: true,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 60_000,
      max_memory_restart: "2G",

      env: {
        PORT_LISTEN: "true",
        OUTBOX_CRON_ENABLED: "false",
        OUTBOX_POLLING_ENABLED: "false",
        NO_COLOR: "true",
      },
      env_local: {
        NODE_ENV: "local",
        AWS_REGION: "us-east-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        SQS_ENDPOINT: "http://localhost:4566",
        SQS_OUTBOX_QUEUE_URL:
          "http://localhost:4566/000000000000/OutboxDispatchQueue.fifo",
        SQS_DISABLE_DELAY_SECONDS: "true",
        DATABASE_URL_POOLED: "postgresql://app:app@localhost:5432/clean_ddd",
        DATABASE_URL_DIRECT: "postgresql://app:app@localhost:5432/clean_ddd",
      },
      env_dev: {
        NODE_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "prod",
      },

      output: "./logs/clean-ddd-api.log",
      error: "./logs/clean-ddd-api.log",
      ignore_watch: ["node_modules/*", "logs/*"],
      node_args: "--max-old-space-size=2048",
    },

    // Cron / scheduler (fork)
    {
      name: "clean-ddd-cron",
      cwd: backendCwd,
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      merge_logs: true,
      autorestart: true,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 300_000,
      max_memory_restart: "1G",

      env: {
        PORT_LISTEN: "false",
        OUTBOX_CRON_ENABLED: "true",
        OUTBOX_POLLING_ENABLED: "false",
        NO_COLOR: "true",
      },
      env_local: {
        NODE_ENV: "local",
        AWS_REGION: "us-east-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        SQS_ENDPOINT: "http://localhost:4566",
        SQS_OUTBOX_QUEUE_URL:
          "http://localhost:4566/000000000000/OutboxDispatchQueue.fifo",
        SQS_DISABLE_DELAY_SECONDS: "true",
        DATABASE_URL_POOLED: "postgresql://app:app@localhost:5432/clean_ddd",
        DATABASE_URL_DIRECT: "postgresql://app:app@localhost:5432/clean_ddd",
      },
      env_dev: {
        NODE_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "prod",
      },

      output: "./logs/clean-ddd-cron.log",
      error: "./logs/clean-ddd-cron.log",
      ignore_watch: ["node_modules/*", "logs/*"],
      node_args: "--max-old-space-size=1024",
    },

    // Queue / SQS poller (fork)
    {
      name: "clean-ddd-queue",
      cwd: backendCwd,
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      merge_logs: true,
      autorestart: true,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 120_000,
      max_memory_restart: "1G",

      env: {
        PORT_LISTEN: "false",
        OUTBOX_CRON_ENABLED: "false",
        OUTBOX_POLLING_ENABLED: "true",
        NO_COLOR: "true",
      },
      env_local: {
        NODE_ENV: "local",
        AWS_REGION: "us-east-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        SQS_ENDPOINT: "http://localhost:4566",
        SQS_OUTBOX_QUEUE_URL:
          "http://localhost:4566/000000000000/OutboxDispatchQueue.fifo",
        SQS_DISABLE_DELAY_SECONDS: "true",
        DATABASE_URL_POOLED: "postgresql://app:app@localhost:5432/clean_ddd",
        DATABASE_URL_DIRECT: "postgresql://app:app@localhost:5432/clean_ddd",
      },
      env_dev: {
        NODE_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "prod",
      },

      output: "./logs/clean-ddd-queue.log",
      error: "./logs/clean-ddd-queue.log",
      ignore_watch: ["node_modules/*", "logs/*"],
      node_args: "--max-old-space-size=1024",
    },

    // Frontend dev server (fork)
    {
      name: "clean-ddd-admin",
      cwd: frontendCwd,

      script: "corepack",
      args: ["pnpm", "exec", "next", "dev", "-p", "3001"],
      exec_interpreter: "none",

      instances: 1,
      exec_mode: "fork",
      merge_logs: true,
      autorestart: true,

      env: {
        NO_COLOR: "true",
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000/api/v1",
      },
      env_local: {
        NODE_ENV: "local",
      },

      // Keep logs under apps/backend/logs to avoid creating a new root logs directory.
      output: "../backend/logs/clean-ddd-admin.log",
      error: "../backend/logs/clean-ddd-admin.log",
      ignore_watch: ["node_modules/*"],
    },
  ],
};
