# Outbox 패턴(본 저장소 구현)

이 문서는 clean-ddd 백엔드에 구현된 Outbox 패턴의 형태를 소개합니다.

## 개요

Outbox는 “DB에 먼저 기록하고, 그 기록을 기반으로 메시징 시스템으로 전달”하는 형태로 설명할 수 있습니다.

이 저장소에서는 단일 SQS FIFO 큐(`OutboxDispatchQueue.fifo`)를 사용합니다.

## 이 저장소에서의 형태

구성 요소를 개념적으로 나누면 아래와 같습니다.

- Outbox 레코드 저장: 애플리케이션 로직이 DB에 outbox 레코드를 기록합니다.
- Outbox 디스패치: pending 레코드를 읽어 SQS로 outboxId를 전송합니다.
- Outbox 소비: SQS 메시지를 받아 outbox 레코드를 조회하고, 타입이 있는 이벤트로 변환/발행합니다.

### 실행 역할과의 관계

- Cron 역할은 디스패치가 활성화될 수 있습니다.
- Queue 역할은 폴링 기반 소비가 활성화될 수 있습니다.
- 운영 환경에서는 SQS 트리거 Lambda 소비 형태로도 매핑될 수 있습니다.

## 함께 읽기

- [데이터 흐름](../../data-flows.md)
- [SQS FIFO와 멱등성](sqs-fifo-and-idempotency.md)
- [서버리스 엔트리포인트](serverless-entrypoints.md)
