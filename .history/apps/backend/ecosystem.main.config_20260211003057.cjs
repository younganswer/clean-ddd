module.exports = {
  apps: [
    // HTTP API (cluster)
    {
      name: 'clean-ddd-api',
      cwd: __dirname,
      script: 'dist/main.js',
      exec_mode: 'cluster',
      instances: Number(process.env.PM2_API_INSTANCES ?? 1),
      merge_logs: true,
      autorestart: true,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 60_000,
      max_memory_restart: '2G',

      env: {
        PORT_LISTEN: 'true',
        // Disable background loops in API runtime by default.
        OUTBOX_CRON_ENABLED: 'false',
        OUTBOX_POLLING_ENABLED: 'false',
        NO_COLOR: 'true',
      },
      env_local: {
        NODE_ENV: 'local',
      },
      env_dev: {
        NODE_ENV: 'dev',
      },
      env_prod: {
        NODE_ENV: 'prod',
      },

      output: './logs/clean-ddd-api.log',
      error: './logs/clean-ddd-api.log',
      ignore_watch: ['node_modules/*', 'logs/*'],
      node_args: '--max-old-space-size=2048',
    },

    // Cron / scheduler (fork)
    {
      name: 'clean-ddd-cron',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      merge_logs: true,
      autorestart: true,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 300_000,
      max_memory_restart: '1G',

      env: {
        PORT_LISTEN: 'false',
        OUTBOX_CRON_ENABLED: 'true',
        OUTBOX_POLLING_ENABLED: 'false',
        NO_COLOR: 'true',
      },
      env_local: {
        NODE_ENV: 'local',
      },
      env_dev: {
        NODE_ENV: 'dev',
      },
      env_prod: {
        NODE_ENV: 'prod',
      },

      output: './logs/clean-ddd-cron.log',
      error: './logs/clean-ddd-cron.log',
      ignore_watch: ['node_modules/*', 'logs/*'],
      node_args: '--max-old-space-size=1024',
    },

    // Queue / SQS poller (fork)
    {
      name: 'clean-ddd-queue',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      merge_logs: true,
      autorestart: true,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 120_000,
      max_memory_restart: '1G',

      env: {
        PORT_LISTEN: 'false',
        OUTBOX_CRON_ENABLED: 'false',
        OUTBOX_POLLING_ENABLED: 'true',
        NO_COLOR: 'true',
      },
      env_local: {
        NODE_ENV: 'local',
      },
      env_dev: {
        NODE_ENV: 'dev',
      },
      env_prod: {
        NODE_ENV: 'prod',
      },

      output: './logs/clean-ddd-queue.log',
      error: './logs/clean-ddd-queue.log',
      ignore_watch: ['node_modules/*', 'logs/*'],
      node_args: '--max-old-space-size=1024',
    },
  ],
};
