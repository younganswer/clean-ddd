# 영속성과 MikroORM

이 문서는 백엔드에서 MikroORM을 어떻게 사용하고, 어떤 구성 전략을 취하는지 소개합니다.

## 개요

MikroORM은 아래 개념을 중심으로 동작합니다.

- EntityManager(EM): 단위 작업(Unit of Work)과 엔티티 추적을 담당합니다.
- RequestContext: 요청/작업 단위로 EM의 범위를 관리합니다(Identity Map 범위).

## 이 저장소에서의 형태

이 저장소는 “런타임 구성”과 “마이그레이션 구성”을 분리합니다.

- 런타임 구성: 애플리케이션이 실행될 때 엔티티를 로딩하고 DB에 연결하는 설정
- 마이그레이션 구성: CLI/스크립트가 마이그레이션을 생성/실행할 때 사용하는 설정

또한 로컬/운영 환경에서 DB URL을 pooled/direct로 구분해 사용할 수 있도록 구성되어 있습니다.

## 범위 밖(Non-goals)

- 테이블/스키마 설계 원칙
- 도메인 모델링(aggregate/entity 설계) 자체의 소개

## 함께 읽기

- [RequestContext와 EntityManager](request-context-and-entity-manager.md)
- [마이그레이션](migrations.md)
