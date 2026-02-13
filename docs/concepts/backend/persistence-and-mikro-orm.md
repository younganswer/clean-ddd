# 영속성과 MikroORM

이 문서는 백엔드에서 MikroORM을 어떻게 사용하고, 어떤 구성 전략을 취하는지 소개합니다.

## 개요

MikroORM은 아래 개념을 중심으로 동작합니다.

- EntityManager(EM): 단위 작업(Unit of Work)과 엔티티 추적을 담당합니다.
- RequestContext: 요청/작업 단위로 EM의 범위를 관리합니다(Identity Map 범위).

## 이 저장소에서의 형태

이 저장소는 런타임에서 사용할 MikroORM 구성만 유지합니다.

- 런타임 구성: 애플리케이션이 실행될 때 엔티티를 로딩하고 DB에 연결하는 설정

DB 초기 상태(스키마/데이터)는 초기화 스크립트가 책임집니다.

- 초기화 스크립트: `src/service/backend/scripts/db-init.ts`
    - 스키마 생성: `SchemaGenerator.createSchema()`
    - 트리거 적용: `updated_at` 자동 갱신 트리거
    - 기본 데이터 구성: users 100, orders/payments/shipments 200 등

## 범위 밖(Non-goals)

- 테이블/스키마 설계 원칙
- 도메인 모델링(aggregate/entity 설계) 자체의 소개

## 함께 읽기

- [RequestContext와 EntityManager](request-context-and-entity-manager.md)
