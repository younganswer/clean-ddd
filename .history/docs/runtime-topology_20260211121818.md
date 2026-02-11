# Runtime Topology

This document describes where code runs in local development and in AWS, and how the pieces connect.

## Local topology

Local development uses Docker for supporting services and PM2 to run multiple backend roles.

```mermaid
graph LR
  subgraph LocalMachine[Local machine]
    FE[Next.js dev server\napps/frontend] -->|HTTP| API[Backend HTTP API\nclean-ddd-api]

    CRON[Backend cron/scheduler\nclean-ddd-cron]
    QP[Backend queue poller\nclean-ddd-queue]

    API --> DB[(Postgres)]
    CRON --> DB
    QP --> DB

    API --> SQS[(LocalStack SQS FIFO)]
    CRON --> SQS
    QP --> SQS
  end
```

Names such as `clean-ddd-api`, `clean-ddd-cron`, and `clean-ddd-queue` come from the PM2 configuration.

## AWS topology (conceptual)

The AWS shape mirrors the same roles using API Gateway, Lambda, and SQS.

```mermaid
graph LR
  CF[CloudFront] --> S3[(S3 static site)]

  APIGW[API Gateway] --> LHTTP[HTTP Lambda\nbackend handler]
  LHTTP --> DB[(Postgres)]
  LHTTP --> SQS[(SQS FIFO)]

  SQS --> LSQS[SQS consumer Lambda\nworker handler]
  LSQS --> DB
```

## Related docs

- [Process Model](concepts/backend/process-model.md)
- [SAM Overview](concepts/infra/sam-overview.md)
- [Serverless Entrypoints](concepts/backend/serverless-entrypoints.md)
