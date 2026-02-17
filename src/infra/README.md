# infra

`src/infra/`는 서버리스 인프라 정의(SAM 템플릿) 위치입니다.

## SAM 템플릿

- 템플릿: [src/infra/sam/template.yaml](sam/template.yaml)
- 배포 체크리스트: [src/infra/deployment-checklist.md](deployment-checklist.md)

## AWS 리소스 부트스트랩 CLI

- 스크립트: `src/infra/scripts/bootstrap-aws-resources.sh`
- 생성 대상: AWS 계정 확인, S3(artifacts/web), CloudFront(CDN), DynamoDB
- 기본 AWS profile: `clean-ddd` (옵션 `--profile`로 변경 가능)

```bash
chmod +x src/infra/scripts/bootstrap-aws-resources.sh
src/infra/scripts/bootstrap-aws-resources.sh --env dev --write-vars-file .github/env/dev.vars
src/infra/scripts/bootstrap-aws-resources.sh --env prod --profile clean-ddd --write-vars-file .github/env/prod.vars
```

리소스-애플리케이션 연결 설명은 아래 기준 문서를 우선 확인합니다.

## 배포 워크플로우

- GitHub Actions: `.github/workflows/deploy.yml`
- CD 트리거: `clean-ddd-ci`가 `main`에서 성공(`workflow_run`)한 뒤 자동 실행
- IaC: `src/infra/sam/template.yaml`
- frontend: `src/service/frontend` build 결과(`out/`)를 S3에 업로드 후 CloudFront invalidation
- URL 자동화: 배포 시 `ApiUrl`(CloudFormation Output) + CloudFront Domain을 조회해
    - frontend build용 `NEXT_PUBLIC_API_BASE_URL`에 즉시 주입
    - GitHub Environment Variables의 `NEXT_PUBLIC_API_BASE_URL`, `DEPLOY_URL` 자동 갱신
    - Repository homepage 및 루트 README의 Production URL 자동 동기화
- 사전검증: 배포 시작 전에 필수 Variables/Secrets 누락 시 즉시 실패

## Outbox 스케줄러

- EventBridge Schedule이 `OutboxDispatchSchedulerFunction`을 주기 실행
- 스케줄식 파라미터: `OutboxDispatchScheduleExpression` (기본 `rate(1 minute)`)
- 배치 크기 env: `OUTBOX_DISPATCH_BATCH_SIZE` (기본 `10`)

## Avatar 저장소 구성

- local: `AVATAR_REPOSITORY_BACKEND=mongo`
- deploy: `AVATAR_REPOSITORY_BACKEND=dynamodb`
- DynamoDB 테이블: `DYNAMODB_AVATAR_TABLE` (PAY_PER_REQUEST)
- 테이블은 부트스트랩 CLI에서 사전 생성하고, SAM은 해당 테이블 이름을 참조만 합니다.

## GitHub CLI 변수/시크릿 등록

예시 파일:

- `.github/env/dev.vars.example`
- `.github/env/dev.secrets.example`
- `.github/env/prod.vars.example`
- `.github/env/prod.secrets.example`

등록 스크립트:

```bash
.github/scripts/register-env.sh <owner/repo> <environment> <vars.env> [secrets.env] [homepage_url]
```

## GitHub OIDC 배포 역할 정책

- 최소 권한 예시: `src/infra/aws-github-oidc-deploy-policy.json`
- Trust Policy 예시: `src/infra/aws-github-oidc-trust-policy.json`
- `AWS_ROLE_TO_ASSUME`에 연결된 IAM Role에 정책을 적용합니다.

권한 오류 대응 (`AccessDenied` for `sqs:CreateQueue`, `dynamodb:DescribeTable`):

- 배포 Role에 `aws-github-oidc-deploy-policy.json`을 다시 attach/update 합니다.
- 해당 정책은 SAM 배포 시 필요한 SQS/DynamoDB/Lambda/IAM/API Gateway/EventBridge 권한을 포함합니다.

OIDC 오류 대응 (`Not authorized to perform sts:AssumeRoleWithWebIdentity`):

- Role의 Trust Policy에 `token.actions.githubusercontent.com` Federated principal 허용
- `aud=sts.amazonaws.com` 조건 포함
- `sub` 조건에 `repo:younganswer/clean-ddd:*` 또는 main/environment 패턴 포함

## 로컬 Actions 디버깅

`act`로 workflow를 로컬 실행할 수 있습니다.

```bash
brew install act
act workflow_dispatch -W .github/workflows/ci.yml
act workflow_dispatch -W .github/workflows/deploy.yml -s DATABASE_URL_POOLED=xxx -s DATABASE_URL_DIRECT=xxx
```

주의:

- OIDC AssumeRole은 로컬 `act`에서 완전 재현이 어렵습니다.
- 로컬 디버깅은 워크플로우 문법/스크립트 단계 검증 중심으로 사용합니다.
