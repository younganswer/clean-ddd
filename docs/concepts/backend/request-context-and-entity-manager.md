# RequestContext와 EntityManager

이 문서는 MikroORM의 RequestContext가 어떤 의미를 갖고, 이 저장소에서 어떤 위치에서 중요해지는지 소개합니다.

## 개요

MikroORM은 RequestContext 범위 안에서 EntityManager를 사용하도록 설계되어 있습니다.

- 한 RequestContext 안에서는 동일 엔티티가 동일 인스턴스로 유지되는(Identity Map) 성질이 나타납니다.
- 작업 단위(HTTP 요청, cron tick, 큐 메시지 처리)마다 컨텍스트를 분리해 이해할 수 있습니다.

## 이 저장소에서의 형태

- HTTP 요청은 프레임워크 레벨에서 컨텍스트가 자연스럽게 잡히는 편입니다.
- Cron/Queue처럼 “HTTP가 아닌 실행”에서는 컨텍스트를 명시적으로 생성/관리해야 하는 구간이 생깁니다.

이 저장소에는 이러한 비-HTTP 작업을 위한 추상화(예: cron job abstract)와 패턴이 포함되어 있습니다.

## 함께 읽기

- [영속성과 MikroORM](persistence-and-mikro-orm.md)
- [프로세스 모델](process-model.md)
