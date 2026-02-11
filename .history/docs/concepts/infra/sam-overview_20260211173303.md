# SAM 개요

이 문서는 `infra/sam/template.yaml`이 어떤 종류의 리소스를 정의하고, 저장소의 런타임 구성과 어떤 관계를 갖는지 소개합니다.

## 개요

AWS SAM은 서버리스 애플리케이션의 리소스를 선언적으로 정의하고, 패키징/배포 단위를 구성하는 템플릿입니다.

## 이 저장소에서의 형태

템플릿은 아래 요소들을 포함합니다.

- HTTP API (API Gateway)
- HTTP 요청을 처리하는 Lambda 함수
- Outbox 디스패치 메시지를 담는 SQS FIFO 큐 + DLQ
- SQS 메시지를 소비하는 Lambda 함수

## 함께 읽기

- [SAM 리소스 매핑](sam-resource-mapping.md)
- [런타임 토폴로지](../../runtime-topology.md)
