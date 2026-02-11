module.exports = {
  apps: [
    {
      name: 'clean-ddd-migration',
      cwd: __dirname,

      // Run migrations as a one-off process via corepack-pinned pnpm.
      script: 'corepack',
      args: 'pnpm db:migrate',
      exec_interpreter: 'none',

      autorestart: false,
      max_restarts: 0,
      merge_logs: true,

      env: {
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
    },
  ],
};
