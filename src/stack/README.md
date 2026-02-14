# stack

`src/stack/`은 로컬 개발 환경에서 시스템을 구동하기 위한 런타임 조합을 정의합니다.

## 구성

- `compose/`: 서비스 조합 및 실행 정의
- `localstack/`: 로컬 AWS 대체 환경 초기화 스크립트
- `nginx/`: 로컬 라우팅/리버스 프록시 설정

## 왜 중요한가?

백엔드의 Outbox/SQS 흐름을 로컬에서도 재현하려면 `stack/` 설정 이해가 필요합니다.

## 로컬 런타임 모델

- 목적
    - 백엔드(HTTP/worker), DB, LocalStack, 프록시를 함께 띄우는 개발 환경 표준화
    - 팀원 간 동일 런타임 조건 확보

- 디렉터리별 역할
    - `compose/`: 어떤 컨테이너를 함께 실행할지 정의
    - `localstack/`: 큐/토픽 등 AWS 리소스 부트스트랩(`10-bootstrap-sqs.sh`)
    - `nginx/`: 외부 진입 URL 정리 및 라우팅

- 확인 순서
    1.  `make -C src up`
    2.  큐/DB 상태 확인
    3.  backend outbox 이벤트 생성
    4.  worker 소비 결과 확인
