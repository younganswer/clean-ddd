# Deployment Checklist

서버리스 온디맨드 배포를 위한 준비/생성 항목 체크리스트입니다.

## 0) 공통 원칙

- [ ] 모든 리소스는 `dev`, `prod` 환경 분리
- [ ] 가능하면 온디맨드 과금 옵션 사용 (`PAY_PER_REQUEST`, Lambda, SQS 등)
- [ ] 리소스 네이밍 규칙 통일 (`clean-ddd-<env>-...`)

## 0-1) 원클릭 CLI 부트스트랩

아래 스크립트로 AWS 계정 확인 + S3 + CloudFront(CDN) + DynamoDB를 일괄 생성할 수 있습니다.

```bash
chmod +x src/infra/scripts/bootstrap-aws-resources.sh
src/infra/scripts/bootstrap-aws-resources.sh --env dev --write-vars-file .github/env/dev.vars
src/infra/scripts/bootstrap-aws-resources.sh --env prod --write-vars-file .github/env/prod.vars
```

참고:

- 스크립트는 존재 리소스 재사용(idempotent) 방식
- 기본 AWS profile은 `clean-ddd` (필요 시 `--profile <name>`)
- `AWS_ROLE_TO_ASSUME`는 수동 입력 필요

## 1) AWS 계정/권한

- [ ] GitHub OIDC Provider 연결 (`token.actions.githubusercontent.com`)
- [ ] GitHub Actions 배포용 IAM Role 생성
- [ ] 배포 Role에 정책 적용 ([aws-github-oidc-deploy-policy.json](aws-github-oidc-deploy-policy.json))
- [ ] Role ARN을 GitHub Environment Variable `AWS_ROLE_TO_ASSUME`에 등록

## 2) S3 버킷 생성

### 2-1. SAM 아티팩트 버킷

- [ ] `clean-ddd-dev-artifacts` 생성
- [ ] `clean-ddd-prod-artifacts` 생성
- [ ] 버전 관리(Versioning) 활성화 (권장)
- [ ] 퍼블릭 차단(Public Access Block) 활성화
- [ ] GitHub 변수 등록: `SAM_S3_BUCKET`

### 2-2. 프론트 정적 호스팅 버킷

- [ ] `clean-ddd-dev-web` 생성
- [ ] `clean-ddd-prod-web` 생성
- [ ] 퍼블릭 차단 유지 (CloudFront OAC/OAI 통해 접근)
- [ ] 정적 파일 업로드 권한을 배포 Role에 허용
- [ ] GitHub 변수 등록: `FRONTEND_S3_BUCKET`

## 3) CDN(CloudFront) 생성

- [ ] dev CloudFront Distribution 생성
- [ ] prod CloudFront Distribution 생성
- [ ] Origin을 각 환경 S3 웹 버킷으로 연결
- [ ] 기본 루트 객체 설정 (`index.html`)
- [ ] SPA 라우팅 대응(필요 시 403/404 -> `/index.html`)
- [ ] GitHub 변수 등록: `CLOUDFRONT_DISTRIBUTION_ID`

## 4) DynamoDB 생성

- [ ] dev Avatar 테이블 생성 (`clean-ddd-avatar-dev`)
- [ ] prod Avatar 테이블 생성 (`clean-ddd-avatar-prod`)
- [ ] Billing mode: `PAY_PER_REQUEST`
- [ ] Partition key: `avatarId` (String)
- [ ] GitHub 변수 등록: `DYNAMODB_AVATAR_TABLE`
- [ ] GitHub 변수 등록: `AVATAR_REPOSITORY_BACKEND=dynamodb`

## 5) Neon(PostgreSQL) 준비

- [ ] dev DB 생성
- [ ] prod DB 생성
- [ ] pooled/direct connection string 발급
- [ ] GitHub Secrets 등록: `DATABASE_URL_POOLED`, `DATABASE_URL_DIRECT`

## 6) GitHub Environment 설정

환경별(`dev`, `prod`)로 아래 값을 등록합니다.

### Variables

- [ ] `AWS_REGION`
- [ ] `AWS_ROLE_TO_ASSUME`
- [ ] `SAM_STACK_NAME`
- [ ] `SAM_S3_BUCKET`
- [ ] `FRONTEND_S3_BUCKET`
- [ ] `CLOUDFRONT_DISTRIBUTION_ID`
- [ ] `DYNAMODB_AVATAR_TABLE`
- [ ] `AVATAR_REPOSITORY_BACKEND`

### Secrets

- [ ] `DATABASE_URL_POOLED`
- [ ] `DATABASE_URL_DIRECT`

## 7) DNS/도메인 (선택)

- [ ] Route53 또는 외부 DNS에 CloudFront CNAME 연결
- [ ] ACM 인증서(CloudFront용, us-east-1) 연결
- [ ] HTTPS 강제 리디렉션 설정

## 8) 보안/WAF (권장)

- [ ] AWS WAF WebACL 생성 후 CloudFront에 연결
- [ ] AWS Managed Rules 적용
- [ ] Rate-based rule 적용
- [ ] 로그 저장 대상(S3/CloudWatch) 구성

## 9) 배포 실행

- [ ] `.github/env/dev.vars`, `.github/env/dev.secrets` 작성
- [ ] `.github/env/prod.vars`, `.github/env/prod.secrets` 작성
- [ ] CLI 등록 실행:
    - [ ] `.github/scripts/register-env.sh <owner/repo> dev .github/env/dev.vars .github/env/dev.secrets`
    - [ ] `.github/scripts/register-env.sh <owner/repo> prod .github/env/prod.vars .github/env/prod.secrets`
- [ ] GitHub Actions `clean-ddd-deploy` 실행 (`dev` -> `prod`)

## 10) 배포 후 검증

- [ ] CloudFormation stack 상태 `CREATE_COMPLETE`/`UPDATE_COMPLETE`
- [ ] API 응답 확인 (`ApiUrl`)
- [ ] Frontend CloudFront URL 접속 확인
- [ ] Avatar API 호출 시 DynamoDB 저장 확인
- [ ] README의 `Production URL` 자동 갱신 확인
- [ ] Repository homepage URL 자동 갱신 확인

## 11) 운영 체크

- [ ] CloudWatch 알람(에러율, Lambda 실패, DLQ 적재) 설정
- [ ] 비용 알람(Budgets) 설정
- [ ] 장애 대응 문서(롤백 절차) 업데이트
