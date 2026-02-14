# Runtime Appendix

이 문서는 CA/DDD 개념 문서를 읽을 때 필요한 최소 런타임/운영 맥락만 제공합니다.

## 로컬 런타임 요약

- 진입점: Nginx `http://localhost/`
- Backend API: `3000`
- Frontend: `8080`
- LocalStack SQS: `http://localhost:4566`

## 실행 흐름(최소)

1. `make -C src init`
2. `make -C src dev`
3. `make -C src health`

## 서버리스 배포 형태(개요)

- HTTP: API Gateway → Lambda
- Async: SQS FIFO → Lambda
- Persistence: PostgreSQL
- Frontend: S3 + CloudFront

## LocalStack/SQS 참고

- 로컬에서는 SQS를 LocalStack으로 대체
- 큐 부트스트랩 스크립트가 FIFO 큐(예: `OutboxDispatchQueue.fifo`)를 생성
- 멱등성/큐 처리 개념은 [SQS FIFO와 멱등성](concepts/backend/sqs-fifo-and-idempotency.md) 참조
