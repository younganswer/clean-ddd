# 서버리스 엔트리포인트

이 문서는 운영 환경에서 Lambda로 실행될 수 있는 엔트리포인트(HTTP/SQS)가 어떤 방식으로 Nest 애플리케이션을 부팅하는지 소개합니다.

## 개요

이 저장소에는 두 종류의 서버리스 엔트리포인트가 존재합니다.

- HTTP: API Gateway를 통해 들어오는 요청을 처리하는 Lambda
- SQS: 큐 메시지를 소비하는 Lambda

## 이 저장소에서의 형태

- HTTP 엔트리포인트는 Express 어댑터 기반으로 Nest 앱을 HTTP 핸들러로 연결할 수 있습니다.
- SQS 엔트리포인트는 “애플리케이션 컨텍스트” 형태로 Nest를 부팅하고, 메시지 처리 로직을 호출하는 방식으로 구성될 수 있습니다.

이 두 형태는 동일한 모듈/DI 구성을 공유하되, 런타임 트리거(HTTP vs SQS)만 다르게 이해할 수 있습니다.

## 함께 읽기

- [Nest 애플리케이션 모델](nest-application-model.md)
- [인프라: SAM 리소스 매핑](../infra/sam-resource-mapping.md)
