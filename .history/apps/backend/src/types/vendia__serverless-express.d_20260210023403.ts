declare module '@vendia/serverless-express' {
  import type { Handler } from 'aws-lambda';

  export type ServerlessExpressOptions = {
    // Nest's Express adapter exposes an Express app instance here.
    // We keep it loose to avoid pulling in Express types.
    app: unknown;
  };

  export default function serverlessExpress(
    options: ServerlessExpressOptions,
  ): Handler;
}
