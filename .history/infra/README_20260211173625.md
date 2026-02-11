# infra

`infra/`는 AWS 환경에서의 서버리스 런타임 구성을 소개하고, SAM 템플릿을 포함합니다.

## 개요

이 저장소의 운영 환경 구성은 아래 요소를 중심으로 설명할 수 있습니다.

- HTTP: API Gateway → Lambda(HTTP 엔트리포인트)
- Async: SQS FIFO → Lambda(SQS 컨슈머)
- Persistence: PostgreSQL(예: Neon)
- Frontend: 정적 export 결과물을 S3에 배포하고 CloudFront로 서빙

## SAM 템플릿

- 템플릿: [infra/sam/template.yaml](sam/template.yaml)

템플릿이 정의하는 리소스와 애플리케이션 엔트리포인트의 연결은 문서에서 소개합니다.

## 관련 문서

- 문서 허브: [docs/index.md](../docs/index.md)
- [SAM 개요](../docs/concepts/infra/sam-overview.md)
- [SAM 리소스 매핑](../docs/concepts/infra/sam-resource-mapping.md)
- [서버리스 엔트리포인트](../docs/concepts/backend/serverless-entrypoints.md)
