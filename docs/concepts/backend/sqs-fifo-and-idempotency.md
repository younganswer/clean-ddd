# SQS FIFO와 멱등성

이 문서는 본 저장소가 SQS FIFO 큐를 사용할 때 전제하는 특성과, 애플리케이션 레벨에서의 멱등성 처리 관점을 소개합니다.

## 개요

SQS FIFO 큐는 메시지 순서(ordering)와 중복 제거(deduplication)에 대해 표준 큐와 다른 특성을 갖습니다.

이 저장소는 Outbox 디스패치 큐로 FIFO 큐를 사용하며, 메시지에는 주로 outboxId가 담깁니다.

## 이 저장소에서의 형태

- SQS 연결은 로컬(LocalStack)과 운영(AWS)에서 엔드포인트/자격 증명 구성이 달라질 수 있습니다.
- 로컬(LocalStack)에서는 FIFO 큐의 일부 속성(예: `DelaySeconds`)이 제한될 수 있어 우회 설정이 존재합니다.
- 소비 측에서는 outboxId를 기반으로 “이미 처리된 것인지”를 기록/판별하는 계층이 포함됩니다.

## 함께 읽기

- [Outbox 패턴(본 저장소 구현)](outbox-pattern.md)
- [Runtime Appendix](../../runtime-appendix.md)
