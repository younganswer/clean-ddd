# 마이그레이션

이 문서는 백엔드의 DB 마이그레이션 파일이 어디에 위치하고, 어떤 구성으로 실행되는지 소개합니다.

## 개요

마이그레이션은 애플리케이션 코드의 변경과 별도로 DB 스키마 변화를 기록하는 아티팩트입니다.

## 이 저장소에서의 형태

- 마이그레이션 파일은 `apps/backend/migrations` 아래에 위치합니다.
- 마이그레이션 실행은 backend 패키지의 스크립트(및 필요 시 PM2 one-shot 실행)로 구성됩니다.

DB 연결 문자열은 환경변수로 주입되며, 로컬/운영에서 pooled/direct URL의 의미가 다를 수 있습니다.

## 함께 읽기

- [영속성과 MikroORM](persistence-and-mikro-orm.md)
- [SAM 리소스 매핑](../infra/sam-resource-mapping.md)
