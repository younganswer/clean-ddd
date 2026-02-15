# RequestContext + Unit of Work

이 문서는 `clean-ddd` 백엔드에서 RequestContext를 통해 Unit of Work 일관성을 유지하는 실무 규칙을 정리합니다.

<br/>
<br/>

## 핵심 원칙

- 실행 단위 1회(HTTP 요청 1건 / Queue 메시지 1건 / Cron 배치 1회)마다 ORM 컨텍스트 1개를 생성합니다.
- 하나의 실행 단위에서 상태 변경, outbox 기록, 실패 메타데이터 갱신은 동일한 Unit of Work에서 처리합니다.
- 재시도 경계와 컨텍스트 경계를 일치시켜 부분 성공/중복 처리를 줄입니다.

<br/>
<br/>

## 실행 타입별 규칙

### HTTP

- 요청 시작 시 컨텍스트 생성
- Controller → Application → Repository 경로에서 동일 컨텍스트 사용
- 응답 종료 시 컨텍스트 종료

### Queue Worker

- 메시지 단위로 컨텍스트 생성
- lock/멱등성 확인/도메인 처리/처리 결과 기록을 동일 컨텍스트에서 수행
- 메시지 루프 간 컨텍스트 공유 금지

### Cron Job

- 배치 반복 루프마다 독립 컨텍스트 생성
- 대량 처리 시 배치 chunk 단위로 경계를 끊어 메모리/락 누적 방지

<br/>
<br/>

## Outbox/재시도와의 결합

- 성공 경로: 상태 변경 + outbox 기록의 원자성 확보
- 실패 경로: `attempt`, `nextAttemptAt`, `lastError`를 같은 실행 경계에서 갱신
- 소비자 중복 방지: idempotency key(예: `consumerName + eventId`)로 클레임

<br/>
<br/>

## Do / Don’t

| 구분         | Do                                    | Don’t                                     |
| ------------ | ------------------------------------- | ----------------------------------------- |
| Context 생성 | entrypoint(HTTP/Worker/Cron)에서 생성 | repository 내부에서 임의 생성             |
| Scope        | 실행 단위당 1개                       | 프로세스 전역 공유                        |
| Retry        | 재시도 단위와 경계 일치               | 실패 메타데이터를 별도 비일관 경로로 갱신 |
