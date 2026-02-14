# SAM 리소스 매핑

이 문서는 SAM 템플릿의 리소스가 런타임 관점에서 무엇을 의미하는지, 그리고 애플리케이션 엔트리포인트와 어떻게 연결되는지 소개합니다.

## 개요

SAM 템플릿은 “인프라 리소스”와 “애플리케이션 핸들러”를 연결하는 선언입니다.

## 이 저장소에서의 형태(개념)

```mermaid
graph TD
  HttpApi[HttpApi] --> ApiFunction[ApiFunction: HTTP Lambda]
  OutboxQueue[OutboxDispatchQueue.fifo] --> OutboxConsumerFunction[OutboxConsumerFunction: SQS Lambda]
  OutboxConsumerFunction --> OutboxDlq[OutboxDispatchDlq.fifo]

  ApiFunction --> DbUrl[DATABASE_URL_POOLED]
  ApiFunction --> QueueUrl[SQS_OUTBOX_QUEUE_URL]
  OutboxConsumerFunction --> DbUrl
  OutboxConsumerFunction --> QueueUrl
```

## 참고

현재 템플릿의 코드/핸들러 경로는 아래 기준으로 맞춰져 있습니다.

- `CodeUri`: `src/service/backend`
- `ApiFunction.Handler`: `dist/lib/lambda/http.handler.handler`
- `OutboxConsumerFunction.Handler`: `dist/lib/lambda/sqs/outbox.handler.handler`

저장소 구조가 바뀌면 위 경로를 함께 조정해야 합니다.

## 함께 읽기

- [서버리스 엔트리포인트](../backend/serverless-entrypoints.md)
- [SAM 개요](sam-overview.md)
