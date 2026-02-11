# 런타임 토폴로지

이 문서는 로컬 개발 환경과 AWS 환경에서 코드가 어디에서 실행되고, 각 구성요소가 어떻게 연결되는지 소개합니다.

## 로컬 토폴로지

로컬 개발에서는 Docker Compose로 보조 서비스와 애플리케이션(백엔드/프론트엔드)을 함께 구동합니다.

```mermaid
graph LR
  subgraph LocalMachine[Local]
    NGINX[Nginx reverse proxy] -->|HTTP| FE[Frontend\nsrc/service/frontend]
    NGINX -->|HTTP /api| API[Backend HTTP API\nclean-ddd-api]

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

`clean-ddd-api`, `clean-ddd-cron`, `clean-ddd-queue` 같은 역할(role)은 동일한 백엔드 코드베이스를 환경변수로 분기해 실행하는 형태로 구성됩니다.

## AWS 토폴로지(개념)

AWS에서도 역할은 유사하며, API Gateway/Lambda/SQS로 매핑됩니다.

```mermaid
graph LR
  CF[CloudFront] --> S3[(S3 static site)]

  APIGW[API Gateway] --> LHTTP[HTTP Lambda\nbackend handler]
  LHTTP --> DB[(Postgres)]
  LHTTP --> SQS[(SQS FIFO)]

  SQS --> LSQS[SQS consumer Lambda\nworker handler]
  LSQS --> DB
```

## 관련 문서

- [프로세스 모델](concepts/backend/process-model.md)
- [SAM 개요](concepts/infra/sam-overview.md)
- [서버리스 엔트리포인트](concepts/backend/serverless-entrypoints.md)
