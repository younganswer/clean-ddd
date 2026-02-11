# 배포 가이드

이 문서는 clean-ddd의 배포(서버리스/SAM) 관점에서의 절차 및 참고 링크를 제공합니다.

## 개요

- HTTP: API Gateway → Lambda(HTTP 엔트리포인트)
- Async: SQS FIFO → Lambda(SQS 컨슈머)
- Persistence: PostgreSQL
- Frontend: 정적 export 산출물을 S3 + CloudFront로 서빙

## 관련 문서(개념)

- [SAM 개요](concepts/infra/sam-overview.md)
- [SAM 리소스 매핑](concepts/infra/sam-resource-mapping.md)
- [서버리스 엔트리포인트](concepts/backend/serverless-entrypoints.md)

## 주의사항

- Swagger는 로컬에서만 활성화되도록 구성되어 있으며, 배포 산출물(SAM/Lambda)에서는 기본적으로 노출하지 않습니다.
