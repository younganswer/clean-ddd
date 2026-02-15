# lib

`lib/`는 백엔드가 사용하는 인프라 어댑터와 런타임 보조 구성요소를 담습니다.

<br/>
<br/>

## 구성

- `database`: 영속성/DB 접근 기반 구성
- `queue`: 큐 송수신 및 워커 연계 구성
- `outbox`: outbox 디스패치 기술 구현
- `lambda`: 서버리스 런타임 적응 계층

<br/>
<br/>

## 정리 관점

- 비즈니스 규칙은 `modules/`에 두고, 기술 구현 세부는 `lib/`에서 흡수합니다.
- 런타임별 차이(로컬/서버리스)는 엔트리포인트와 어댑터에서 조정합니다.

<br/>
<br/>

## 경계 원칙

- `lib`는 adapter 계층이므로 도메인 정책을 소유하지 않습니다.
- Outbox/Queue/Lambda 구현은 상태 전이와 재시도 메커니즘을 제공하되, 비즈니스 의사결정은 handler/domain에 위임합니다.

<br/>
<br/>

## 관련 개념

- [Clean Architecture + DDD 통합 문서](../../../../docs/clean-architecture-ddd.md)
- [도메인 간 연동 패턴](../../../../docs/backend-integration-patterns.md)
- [데이터 흐름](../../../../docs/data-flows.md)
