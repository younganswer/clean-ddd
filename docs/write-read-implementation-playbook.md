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

### DIP 체크(Write/Read 공통)

1. Application이 구체 클래스(`Sql...Repository`, `Mongo...Repository`)를 직접 주입받지 않는지 확인합니다.
2. Domain 포트(인터페이스) 기준으로 유스케이스를 설계합니다.
3. 구현체 교체는 `Module`의 provider 바인딩만 바꾸도록 제한합니다.
4. DB 구조 차이/연결 방식은 Infrastructure 어댑터 내부에서 흡수합니다.

<br/>
<br/>

## Read(Query) 순서

1. Query 입력/출력 모델을 정의합니다.
2. 조회 대상이 Aggregate Root인지 먼저 판별합니다.
3. Aggregate Root 조회는 Repository 우선.
4. 복합 조회/통계 조회는 Reader 또는 조회 전용 접근을 선택.
5. Query Handler에서 조회 흐름/에러를 정리합니다.
6. Controller/BFF 응답 DTO를 분리합니다.

### Query/Reader 강제 규칙

- Query Handler는 Reader만 의존하고 Repository를 직접 참조하지 않습니다.
- Reader는 Repository를 참조하지 않고 인프라에서 `EntityManager`로 직접 조회합니다.
- Reader에서 상태 변경 로직(쓰기/seed/flush)은 금지합니다.
- Reader Result 매핑은 `Result.fromSchema(...)` 정적 팩토리로 통일합니다.
- Reader pagination 입력 정규화는 공통 policy(`common/cqrs/pagination-policy`)를 사용하고, Reader별 임의 상수 clamp를 추가하지 않습니다.

### Event Import 강제 규칙

- 비동기 이벤트 import는 `contracts/{context}/events/*.event` direct path를 사용합니다.
- contracts index(barrel) re-export를 추가하거나 의존하지 않습니다.

<br/>
<br/>

## 경계 보호 체크포인트

- Query 경로에서 상태 변경이 발생하지 않는가?
- Reader 계약이 도메인 엔티티를 노출하지 않는가?
- Reader 구현이 Repository를 우회해서 직접 조회하고, `Result.fromSchema(...)`만으로 반환하는가?
- BFF가 도메인 규칙을 소유하지 않는가?
- Queue/Cron 경로가 내부 구현 우회 없이 Command/Query 경계를 지키는가?

<br/>
<br/>

## Anti-pattern

- 조회 편의 때문에 Repository를 범용 조회 API로 비대화
- BFF에서 신규 비즈니스 정책을 생성
- 배치 처리에서 컨텍스트를 전역 공유
- Application/Domain에서 특정 DB 클라이언트나 구현체 타입에 직접 의존
