# 로컬 실행 및 사용법

이 문서는 clean-ddd를 로컬에서 실행하는 실무적인 절차(How-to)를 제공합니다.

## 포트 정책(기본값)

- Nginx(진입점): `80` → 접속 `http://localhost/`
- Frontend(Next.js 컨테이너): `8080` (dev/serve 동일)
- Backend(Nest.js 컨테이너): `3000`

> 기본값은 로컬 Docker Compose 기준이며, 아래 override 옵션으로 변경 가능합니다.

## Docker Compose(권장)

nginx reverse proxy 포함 전체 스택을 실행합니다.

```bash
make -C src up NODE_ENV=dev
# 접속: http://localhost/
```

유용한 명령:

- `make -C src logs` / `make -C src ps` / `make -C src down` / `make -C src prune`

### Swagger(로컬만)

로컬 환경에서만 Swagger 문서가 활성화됩니다.

- 문서 URL: `http://localhost/api/v1/docs`
- 활성화 방식: 로컬 compose에서 `SWAGGER_ENABLED=true` 기본 주입

## 포트 override 옵션

포트는 모두 환경변수로 override 가능합니다.

- `NGINX_HTTP_PORT` (기본 `80`): 호스트 공개 포트
- `FRONTEND_PORT` (기본 `8080`): Frontend 컨테이너 listen/expose 포트
- `BACKEND_PORT` (기본 `3000`): Backend 컨테이너 listen 포트

예시(호스트 8080으로 공개):

```bash
make -C src up NODE_ENV=dev NGINX_HTTP_PORT=8080
# 접속: http://localhost:8080/
```

## Frontend API Base URL

Frontend의 API base URL은 `NEXT_PUBLIC_API_BASE_URL`로 제어합니다.

- 권장(nginx reverse proxy 경유): `/api/v1`
- nginx를 거치지 않고 직접 호출(호스트 실행 등): `http://localhost:3000/api/v1` 같은 절대 URL

## 기존 방식(호스트에서 앱 실행)

보조 서비스(postgres/localstack)만 컨테이너로 올리고, 앱은 호스트에서 실행합니다.

```bash
docker compose -f src/infra/compose/docker-compose.deps.yml up -d

corepack enable
corepack pnpm --dir src install
corepack pnpm --dir src dev
```

기본 포트(호스트 실행 기준)는 개발 스크립트/PM2 설정에 따라 달라질 수 있습니다.
