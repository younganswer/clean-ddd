# backend src

`src/service/backend/src/`는 백엔드 애플리케이션의 엔트리포인트/역할 분기와 도메인 구현을 함께 담고 있습니다.

## app 파일 세트

`app/` 디렉터리 대신 아래 파일 세트가 기본 앱 구성 요소 역할을 담당합니다.

- `app.module.ts`: 루트 모듈 구성
- `app.controller.ts`: 기본 컨트롤러
- `app.service.ts`: 기본 서비스
- `app.default.ts`: 기본 앱 설정

## 런타임/엔트리포인트

- `main.ts`: 프로세스 시작점
- `nest-app.ts`: Nest 애플리케이션 부트스트랩
- `runtime-role.ts`: 실행 역할(role) 분기
- `init.ts`: 초기화 스크립트 엔트리

## 도메인/인프라 구현 디렉터리

- [modules](modules/README.md): 도메인 구현체
- [lib](lib/README.md): 인프라 어댑터/런타임 유틸
- `bff/`: 화면/유스케이스 기준 조회 조합 계층
- `common/`: 공통 추상/컨텍스트/가드/유틸
- `cron-jobs/`: 스케줄 기반 백그라운드 작업
- `saga-orchestrator/`: 장기 비즈니스 흐름 조율
- `shared/`: 도메인 공통 모델/값 객체/기술 계약

## 보조 디렉터리 핵심 포인트

- BFF는 도메인 규칙 소유 없이 조회/조합 책임만 갖습니다.
- Common은 도메인 규칙보다 기술 기반 재사용성에 집중합니다.
- Cron/Saga는 HTTP 요청 흐름 밖의 장기/주기 작업을 분리합니다.
- Shared는 공통 계약만 올리고, 구현 상세는 각 모듈에 둡니다.
