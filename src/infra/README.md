# infra

`src/infra/`는 Clean Architecture/DDD 경계를 AWS 런타임에 투영하는 계약을 정의합니다.

## 경계 관점에서의 역할

- `sam/template.yaml`: API/Worker/Queue의 역할 분리와 파라미터 계약의 진입점
- `sam/stacks/*.yaml`: 역할별 런타임 스택 계약(API, Worker, Queue, Monitoring)
- `deployment-checklist.md`: 배포 절차가 아닌 경계/계약 일관성 점검 기준

## 아키텍처 원칙

- 환경 분리: 환경별 리소스 분리를 전제로 오작동 전파를 줄입니다.
- 데이터 경계 명시: 도메인 데이터 저장소와 이벤트 전달 경로를 템플릿에 명시적으로 드러냅니다.

## 참고 문서

- 배포/운영 개념 체크 항목: `deployment-checklist.md`
