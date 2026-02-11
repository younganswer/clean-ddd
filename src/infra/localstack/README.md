# localstack

`src/infra/localstack`는 로컬 개발 환경에서 LocalStack을 통해 SQS를 사용할 수 있도록 초기화 스크립트를 제공합니다.

## 개요

- Docker Compose가 LocalStack 컨테이너를 구동합니다.
- 컨테이너 준비(ready) 시점에 init 스크립트가 실행되어 필요한 큐를 생성합니다.

## 이 저장소에서의 형태

- init 스크립트 위치: `src/infra/localstack/10-bootstrap-sqs.sh`
- 생성되는 큐 예시: `OutboxDispatchQueue.fifo`

## 관련 문서

- 문서 허브: [docs/index.md](/docs/index.md)
- [LocalStack SQS](/docs/concepts/tools/localstack-sqs.md)
