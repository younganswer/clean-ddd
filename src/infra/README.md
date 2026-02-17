# infra

`src/infra/`는 clean-ddd의 서버리스 인프라 모델을 정의합니다.

## 구성 요소 개요

- SAM 템플릿: `sam/template.yaml`
    - API Gateway HTTP API, Lambda, SQS(FIFO), EventBridge Schedule 등 런타임 토폴로지를 선언합니다.
- IAM 정책 예시: `aws-github-oidc-deploy-policy.json`
    - GitHub OIDC를 통해 배포 시 필요한 권한 경계를 표현합니다.
- IAM Trust 정책 예시: `aws-github-oidc-trust-policy.json`
    - 어떤 GitHub 주체가 AWS Role을 가정할 수 있는지 신뢰 조건을 정의합니다.
- 리소스 부트스트랩 스크립트: `scripts/bootstrap-aws-resources.sh`
    - 인프라 리소스 naming 및 기본 보안 설정의 기준을 코드로 유지합니다.

## 아키텍처 원칙

- 환경 분리: 환경별 리소스 분리를 전제로 오작동 전파를 줄입니다.
- 최소 권한: 배포 주체에는 목적 기반 권한만 부여합니다.
- 서버리스 우선: 요청 기반 과금 모델을 우선 적용합니다.
- 데이터 경계 명시: 도메인 데이터 저장소와 이벤트 전달 경로를 템플릿에 명시적으로 드러냅니다.

## 비용 관점 메모

- Lambda, API Gateway, SQS, DynamoDB(PAY_PER_REQUEST)는 온디맨드 성격이 강합니다.
- CloudFront, S3 저장소는 트래픽 외에도 저장/요청 기반 비용이 누적될 수 있어 별도 모니터링이 필요합니다.
- EventBridge 스케줄 기반 호출은 트래픽이 없어도 주기 실행 비용이 발생할 수 있습니다.

## 참고 문서

- 배포/운영 개념 체크 항목: `deployment-checklist.md`
