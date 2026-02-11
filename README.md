# clean-ddd

DDD와 Clean Architecture의 요소들을 기술적으로 실험할 수 있도록 구성한 샘플 저장소입니다. 개념/설계 문서는 `docs/` 아래에 정리합니다.

업무/도메인 자체에 대한 소개(유비쿼터스 언어, 컨텍스트 설명 등)는 범위에서 제외합니다.

## 문서

- 문서 허브: [docs/index.md](docs/index.md)
- 사용법/로컬 실행: [docs/usage.md](docs/usage.md)
- 배포 가이드: [docs/deploy.md](docs/deploy.md)
- 인프라(SAM/로컬 런타임): [src/infra/README.md](src/infra/README.md)

## 저장소 구조(요약)

- `src/service/backend`: NestJS 백엔드(HTTP API / cron / queue)
- `src/service/frontend`: Next.js 어드민 UI(컨테이너 dev/serve 모두 8080)
- `src/packages/contracts`: OpenAPI 및 공유 타입(도메인 객체는 공유하지 않음)
- `src/infra`: docker compose, nginx, localstack init, SAM 템플릿
