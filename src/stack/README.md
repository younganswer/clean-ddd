# stack

`src/stack/`은 로컬 개발 환경에서 시스템을 구동하기 위한 런타임 조합을 정의합니다.

## 구성

- `compose/`: 서비스 조합 및 실행 정의
- `localstack/`: 로컬 AWS 대체 환경 초기화 스크립트
- `nginx/`: 로컬 라우팅/리버스 프록시 설정

## 핵심 목적

백엔드의 Outbox/SQS 흐름을 로컬에서도 재현하려면 `stack/` 설정 이해가 필요합니다.

## 로컬 런타임 모델

- 백엔드(HTTP/worker), DB, LocalStack, 프록시를 함께 띄우는 개발 환경을 표준화합니다.
- 팀원 간 동일 런타임 조건을 확보합니다.
- 여러 저장소(Postgres/Mongo) 조합에서도 Application이 포트만 의존하는 DIP 구조를 검증합니다.

### 디렉터리별 역할

- `compose/`: 함께 실행할 컨테이너 구성을 정의합니다.
- `localstack/`: AWS 대체 리소스(예: SQS) 부트스트랩 스크립트를 제공합니다.
- `nginx/`: 외부 진입 URL과 라우팅 규칙을 제공합니다.

### 확인 순서

1. `make -C src up`
2. 큐/DB 상태 확인
3. backend outbox 이벤트 생성
4. worker 소비 결과 확인
