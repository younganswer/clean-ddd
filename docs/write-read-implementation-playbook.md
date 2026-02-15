# Write/Read Implementation Playbook

이 문서는 `clean-ddd`에서 실무 기여자가 Write(Command)와 Read(Query)를 구현할 때 따르는 권장 순서를 정리합니다.

<br/>
<br/>

## Write(Command) 순서

1. 유스케이스 입력/출력 모델을 정의합니다.
2. 도메인 규칙(엔티티/도메인 서비스)을 먼저 고정합니다.
3. Repository 인터페이스를 정의합니다.
4. Infrastructure 구현(매퍼/저장소)을 연결합니다.
5. Command Handler에서 orchestration을 구성합니다.
6. Controller/BFF에서 요청 포맷을 연결합니다.
7. 비동기 후속 처리가 필요하면 Outbox로 발행을 연결합니다.

### EN Summary

- Model domain rules first, then orchestrate in command handlers, and publish async follow-up via outbox.

<br/>
<br/>

## Read(Query) 순서

1. Query 입력/출력 모델을 정의합니다.
2. 조회 대상이 Aggregate Root인지 먼저 판별합니다.
3. Aggregate Root 조회는 Repository 우선.
4. 복합 조회/통계 조회는 Reader 또는 조회 전용 접근을 선택.
5. Query Handler에서 조회 흐름/에러를 정리합니다.
6. Controller/BFF 응답 DTO를 분리합니다.

### EN Summary

- Keep query paths read-only; choose repository vs reader by aggregate boundary and query complexity.

<br/>
<br/>

## 경계 보호 체크포인트

- Query 경로에서 상태 변경이 발생하지 않는가?
- Reader 계약이 도메인 엔티티를 노출하지 않는가?
- BFF가 도메인 규칙을 소유하지 않는가?
- Queue/Cron 경로가 내부 구현 우회 없이 Command/Query 경계를 지키는가?

<br/>
<br/>

## Anti-pattern

- 조회 편의 때문에 Repository를 범용 조회 API로 비대화
- BFF에서 신규 비즈니스 정책을 생성
- 배치 처리에서 컨텍스트를 전역 공유

### EN Summary

- Avoid repository bloat for read convenience, avoid policy drift into BFF, and avoid global context reuse in batch flows.
