# 본 저장소의 Next.js 모델

이 문서는 clean-ddd 프론트엔드(`apps/frontend`)가 어떤 형태로 실행/배포되는지(기술 모델)를 소개합니다.

## 개요

이 저장소의 Next.js 설정은 정적 export 기반을 전제로 합니다.

- 로컬 개발: Next dev server
- 배포 형태: 정적 결과물을 S3에 배포하고 CloudFront로 서빙

## 이 저장소에서의 형태

- `next.config.ts`에서 `output: "export"`를 사용합니다.
- API 호출은 환경변수(예: `NEXT_PUBLIC_API_BASE_URL`)를 통해 백엔드의 base URL을 주입받는 형태로 구성됩니다.

## 함께 읽기

- [시스템 한눈에 보기](../../system-at-a-glance.md)
- [런타임 토폴로지](../../runtime-topology.md)
