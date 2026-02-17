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
- `AWS_ROLE_TO_ASSUME`에 연결된 IAM Role에 정책을 적용합니다.
