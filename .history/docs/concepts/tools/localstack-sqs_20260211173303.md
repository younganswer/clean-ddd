# LocalStack SQS

이 문서는 로컬 개발 환경에서 LocalStack을 통해 SQS를 사용하는 모델을 소개합니다.

## 개요

로컬에서는 AWS SQS 대신 LocalStack SQS를 사용합니다.

- 엔드포인트: `http://localhost:4566`
- 리전: 기본적으로 `us-east-1`

## 이 저장소에서의 형태

- Docker Compose에서 LocalStack을 `SERVICES=sqs`로 구동합니다.
- 준비 스크립트가 큐를 생성합니다(예: `OutboxDispatchQueue.fifo`).
- 애플리케이션은 로컬 환경변수로 SQS 엔드포인트/큐 URL을 주입받습니다.

## 함께 읽기

- [SQS FIFO와 멱등성](../backend/sqs-fifo-and-idempotency.md)
- [런타임 토폴로지](../../runtime-topology.md)
