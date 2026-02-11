# OpenAPI와 공유 타입

이 문서는 `src/packages/contracts`의 역할을 소개합니다.

## 개요

이 저장소에서 contracts 패키지는 “통합 경계에서 공유되는 것”을 담습니다.

- API 계약(OpenAPI)
- API 호출/응답과 관련된 공용 타입

도메인 모델(업무 규칙을 담는 객체)을 패키지로 공유하는 것은 이 저장소의 목표가 아닙니다.

## 이 저장소에서의 형태

- OpenAPI 스펙은 `src/packages/contracts/openapi.yaml`에 위치합니다.
- 타입 진입점은 `src/packages/contracts/index.ts`로 제공됩니다.

## 함께 읽기

- [본 저장소의 Next.js 모델](../frontend/nextjs-model.md)
- [시스템 한눈에 보기](../../system-at-a-glance.md)
