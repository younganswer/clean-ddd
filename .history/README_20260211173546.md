# clean-ddd

DDD와 Clean Architecture의 요소들을 기술적으로 실험할 수 있도록 구성한 샘플 저장소입니다. 본 문서는 저장소의 문서 허브 역할을 하며, 개념 소개 문서는 `docs/` 아래에 정리합니다.

업무/도메인 자체에 대한 소개(유비쿼터스 언어, 컨텍스트 설명 등)는 범위에서 제외합니다.

## 문서

- 문서 허브: [docs/index.md](docs/index.md)
- 큰 그림: [docs/system-at-a-glance.md](docs/system-at-a-glance.md)
- 실행 구성: [docs/runtime-topology.md](docs/runtime-topology.md)
- 주요 흐름: [docs/data-flows.md](docs/data-flows.md)

## 저장소 구조

- `apps/backend`: NestJS 백엔드(HTTP API / cron / queue 역할로 실행)
- `apps/frontend`: Next.js 어드민 UI(정적 export)
- `packages/contracts`: OpenAPI 및 통합용 공유 타입(도메인 객체는 공유하지 않음)
- `infra`: AWS SAM 템플릿
- `tools`: LocalStack 등 로컬 개발 도구

## 기술 구성(요약)

- Backend: NestJS + MikroORM + PostgreSQL(로컬) / Neon(운영)
- Async: Outbox 패턴 + 단일 SQS FIFO 큐(`OutboxDispatchQueue.fifo`)
- Compute(운영): HTTP는 API Gateway + Lambda, 비동기는 SQS + Lambda
- Frontend(운영): S3 정적 배포 + CloudFront

관련 개념 문서는 [docs/index.md](docs/index.md)에서 영역별로 확인하실 수 있습니다.

## 로컬 실행(개발)

로컬 개발은 “Docker(보조 서비스) + PM2(백엔드 역할 분리) + Next dev(프론트엔드)” 조합으로 구성되어 있습니다.

실행 명령은 다음과 같은 형태로 사용합니다.

```bash
corepack enable
corepack pnpm install
corepack pnpm dev
```

기본 포트는 다음과 같습니다.

- API: http://localhost:3000/api/v1
- Admin: http://localhost:3001

프로세스 모델(역할 분리)에 대해서는 [docs/concepts/backend/process-model.md](docs/concepts/backend/process-model.md)를 참고해 주세요.

## 배포(개념)

인프라와 런타임 매핑은 다음 문서에서 소개합니다.

- [docs/concepts/infra/sam-overview.md](docs/concepts/infra/sam-overview.md)
- [docs/concepts/infra/sam-resource-mapping.md](docs/concepts/infra/sam-resource-mapping.md)
