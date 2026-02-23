# AWS CloudWatch · WAF · Shield 도입 계획 (Serverless On-Demand)

## 목표

- 서버리스(on-demand) 서비스에 대한 DoS/DDoS 공격 완화
- 트래픽 급증 및 이상 징후 조기 탐지
- 프로젝트/서비스 단위 사용량(요금) 추적 정착

## 적용 범위

- WAF 범위: `CloudFront + API Gateway`
- Shield 수준: `Shield Standard`
- 비용 추적 단위: `프로젝트/서비스`

## 현재 구현 상태 (2026-02-23)

### 1) API Gateway 보호 (SAM)

`src/infra/sam/template.yaml`에 아래 리소스를 추가했습니다.

- `AWS::WAFv2::WebACL` (Scope: REGIONAL)
  - AWS Managed Rules
    - `AWSManagedRulesCommonRuleSet`
    - `AWSManagedRulesKnownBadInputsRuleSet`
    - `AWSManagedRulesAmazonIpReputationList`
  - Rate-based rule (`RateLimitPerIp`, limit: 2000/5min)
- `AWS::WAFv2::WebACLAssociation`
  - HTTP API `$default` stage에 WebACL 연결

### 2) CloudFront 보호 (Bootstrap Script)

`src/infra/scripts/bootstrap-aws-resources.sh`에 아래 로직을 추가했습니다.

- CloudFront용 WAF WebACL 자동 생성/재사용 (`Scope: CLOUDFRONT`, `us-east-1`)
- 기존/신규 CloudFront 배포에 WebACL 자동 연결
- 연결 상태 idempotent 처리(이미 연결 시 skip)

### 3) CloudWatch 알람 (SAM)

`src/infra/sam/template.yaml`에 보안/가용성 알람을 추가했습니다.

- API Gateway
  - `5xx` 급증
  - `4xx` 급증
  - `Latency p95` 급증
- WAF
  - `BlockedRequests` 급증
- Lambda
  - `Throttles` 급증 (`ApiFunction`)
- SQS
  - `ApproximateAgeOfOldestMessage` 급증 (`OutboxDispatchQueue`)
- 공통 SNS 알림 토픽
  - `SecurityAlertsTopic`

## 비용 추적(태깅) 구현

### 태그 키 표준

- `Project`
- `Environment`
- `Service`

### 적용 위치

- SAM Function/Queue/HttpApi/WebACL/SNS Topic 태깅
- Bootstrap 생성 리소스 태깅
  - S3 buckets
  - DynamoDB table
  - CloudFront WAF
- 배포 시 파라미터 전달
  - `ProjectName`
  - `EnvironmentName`

## 배포 권한 변경

`src/infra/aws-github-oidc-deploy-policy.json`에 다음 권한을 추가했습니다.

- `wafv2:*` (WebACL 생성/연결/조회/태깅 범위)
- `cloudwatch:PutMetricAlarm`, `DeleteAlarms`, `DescribeAlarms`
- `sns:CreateTopic` 등 토픽 프로비저닝 권한
- `cloudfront:GetDistributionConfig`, `UpdateDistribution`, `ListDistributions`
- `s3:GetBucketTagging`, `PutBucketTagging`

## 운영 체크포인트

1. 알람 수신 채널 연결
   - `SecurityAlertsTopic`에 Email/ChatOps 구독 연결
2. WAF 오탐 조정
   - 운영 1~2주 동안 차단 로그 기준 예외 룰 최소화
3. 임계치 튜닝
   - 트래픽 패턴에 맞춰 4xx/5xx/Latency/WAF threshold 조정
4. 월간 비용 리뷰
   - `Project`, `Environment`, `Service` 태그 필터 기준 사용량 리뷰

## 후속 단계 (권장)

- CloudWatch Dashboard 리소스 추가
  - API/WAF/Lambda/SQS 지표 통합 대시보드
- AWS Budgets + Cost Anomaly Detection 도입
  - 프로젝트 단위 월 예산/이상 비용 자동 탐지
- WAF 로그의 S3/Kinesis Firehose 적재
  - 장기 분석 및 포렌식 기준 강화
