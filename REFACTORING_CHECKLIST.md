# Refactoring Checklist

이 문서는 현재 프론트엔드 리팩토링 진행 상황과 다음 작업 순서를 기록합니다.

## 완료

- [x] Zustand 세팅 및 클라이언트 UI 상태 분리
- [x] 대시보드 UI 상태 `dashboard-ui.store` 분리
- [x] 대시보드 다이얼로그 상태 `dashboard-dialog.store` 분리
- [x] 판매 입력 상태 `receipt-matrix.store` 분리
- [x] React Query key factory 정리
- [x] Query options 중앙화
- [x] Mutation invalidation helper 정리
- [x] Services layer 유지 확인
- [x] 주요 대시보드 view를 screen/view 컴포넌트로 1차 분리
- [x] 정산 미리보기 패널 분리
- [x] 판매 입력 화면 패널 분리
- [x] 기본 design-system cva variant 추가

## 진행 순서

- [x] 정산 버전 상세 화면 분리
  - [x] 요약/메타 영역 분리
  - [x] 참가자별 정산 테이블 분리
  - [x] 변경 내역 영역 분리
  - [x] 회차 관리 액션 영역 분리
- [x] 참가자 다이얼로그 분리
  - [x] 참가자 마스터 생성/수정 다이얼로그 분리
  - [x] 마켓 참가자 연결/수정 다이얼로그 분리
  - [x] 참가자 검색/선택 리스트 분리
  - [x] 참가자 유형 선택 컨트롤 분리
- [x] 대시보드 셸 분리
  - [x] 좌측 레일 컴포넌트 분리
  - [x] 헤더/마켓 요약 컴포넌트 분리
  - [x] 컨텐츠 컨테이너를 shell 조립부에만 유지
- [x] 조회/수수료 표 뷰 추가 분리
  - [x] 영수증 조회 matrix 영역 분리
  - [x] 수수료 정책 status matrix/card 분리
- [ ] 스타일 variant 추가 정리
  - [ ] 반복 table shell/header/cell 스타일 후보 정리
  - [ ] badge/status card variant 후보 정리
  - [ ] 과한 조건부 className을 cva로 이동

## 검증 기준

- 각 리팩토링 단위마다 `npm run lint` 실행
- 화면 구조나 import 경계가 바뀌는 경우 `npm run build` 실행
- 커밋 전 `git diff --check` 실행
- 가능한 한 작은 커밋 단위 유지
