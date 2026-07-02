# 리스킨 진행 상황 (progress.md)

> 이 문서는 "이 앱에 tambang 디자인(색·폰트·스타일)을 새로 입히는 작업"의 진행 상황을 추적합니다.
> 초보자용으로 쉽게 썼습니다. 세션이 바뀌어도 이 파일만 보면 어디까지 했는지 알 수 있습니다.
>
> 관련 문서: `DESIGN.md`(디자인 정본) · `tokens.css`(색 토큰 원본) · `MAPPING.md`(작업 지시서)

---

## 0. 가장 중요한 안전 규칙 (절대 안 깨지게)

- ✅ **바꾸는 것**: 색, 폰트, 간격, 라운드(모서리 둥글기), 그림자 = **눈에 보이는 스타일만**.
- 🚫 **절대 안 바꾸는 것**:
  - 기능 로직, 데이터 흐름, 서버 통신(API), 상태관리(Zustand/React Query)
  - `enum` 값 자체(예: `"confirmed"`, `"active"` 같은 문자열) — 이건 데이터라 건드리면 기능이 깨짐
  - 함수의 구조/이름 — 배지 색 함수는 **"돌려주는 색 클래스 글자"만** 바꾸고 함수 골격은 그대로
- 📌 지금까지 바꾼 파일은 **전부 스타일(className, CSS)만** 수정했고 기능 코드는 한 줄도 안 건드렸습니다.
- 📌 헷갈리거나 색 결정이 애매하면 → **먼저 사용자에게 물어보고** 진행 (특히 아래 "보류 중인 결정").

### 작업 브랜치
- 이 리스킨 작업은 **`redesign/tambang`** 브랜치에서 진행 중입니다. `main`(형 원본)은 그대로 보존.
- 확인: `git branch --show-current` → `redesign/tambang` 이면 맞음.
- **커밋 18개 완료** (아래 "8. 커밋 히스토리" 참고). 작업 트리 깨끗함(저장 안 된 변경 없음).
- 아직 **push는 안 함** — 형에게 공유하려면 `git push` + PR 필요 (외부 업로드라 진행 전에 확인).

### 되돌리는 법(안심용)
- 커밋은 브랜치에만 있고 `main`은 안전합니다. 특정 파일만 되돌리려면 `git restore <파일경로>`(저장 안 한 변경) 또는 `git checkout main -- <파일경로>`(원본으로).
- 브랜치 전체를 버리려면 `git checkout main` 후 `git branch -D redesign/tambang` (main은 그대로).

---

## 1. 이 작업의 큰 그림 (6단계)

| 단계 | 내용 | 상태 |
|---|---|---|
| STEP 1 | 색 토큰 설치 (`tokens.css` → `globals.css`에 병합) | ✅ 완료 |
| STEP 2 | 색 교체 (레포의 하드코딩 색 → 토큰으로) | ✅ 완료 (전 화면) |
| STEP 3 | 상태 배지 색 교체 (정산완료/환불/대기 등) | ✅ 완료 (+아이콘 병행) |
| STEP 4 | 금액 숫자 색 (지급액/수수료/환불) | ✅ 완료 (정산·영수증) |
| STEP 5 | 화면 하나씩 진행 + 스크린샷 확인 | ✅ 완료 |
| STEP 6 | 폰트 교체 (Pretendard + JetBrains Mono) | ✅ 완료 (React19 호이스팅 <link>) |

> **➡️ STEP 1~6 전부 완료.** 여기에 더해 DESIGN.md의 색 외 사양(타이포 스케일 · 라운드/간격/그림자 · 모션 · 접근성)도 반영 완료. **다크모드는 제외**(사용자 결정).

---

## 2. 지금까지 한 것 ✅

### 체크포인트 1 — 공통 셸 + 홈 화면(`/management`)
- `src/app/globals.css` — tambang 색 토큰 전부 설치(canvas, ink, brand, hairline, success/warning/error 등). 페이지 기본 배경/글자색을 웜 아이보리로.
- `src/lib/design-system.ts` — 공통 부품(버튼/인풋/셀렉트/패널/탭/카드/섹션제목)의 색을 토큰으로. **여기만 바꿔도 여러 화면이 같이 바뀜.**
- 셸 라이트 표면: `dashboard-header` · `home-action-card` · `dashboard-page-title` · `page-state-message` · `dashboard-toast`
- 결과: 배경 웜 아이보리, 카드 웜 화이트+얇은 보더, "업무 선택" 라벨이 브랜드 연두로.

---

## 3. 앞으로 할 화면 목록 (STEP 5 체크리스트)

각 화면은 "그 화면에서 쓰는 색만" 토큰으로 바꾸고, 끝나면 스크린샷으로 확인받습니다.

- [x] 공통 셸(헤더) + 홈 `/management` — 체크포인트 1
- [x] `/settings` 설정 폼 — 체크포인트 2
- [x] `/markets` 마켓 목록 (+상태 배지 STEP3 시작) — 체크포인트 3
- [x] `/booths` 부스(셀러) 관리 목록 + 다이얼로그 — 체크포인트 4
- [x] 영수증 조회 `/markets/[id]/receipts` (매트릭스 다크헤더) — 체크포인트 5
- [x] 영수증 입력 `/markets/[id]/sales` (입력매트릭스+결제+제출, 금액색 시작) — 체크포인트 6
- [x] 정산 메인 `/markets/[id]/settlements` (지표·차트·표·히스토리, STEP4 금액색) — 체크포인트 7
- [x] 정산 드릴다운/회차 상세: daily-sales-detail · snapshots · version-summary/changes/management/detail-screen — 체크포인트 8
      (※ 회차 상세 전체화면은 mock에 확정 정산이 없어 화면 확인 불가, 코드는 완료)
- [x] 마켓 상세 하위: 참가부스 연결(list·picker·dialog·product) / 수수료 현황(fees) / 로그(logs) — 체크포인트 9
- [x] 영수증 수정 `/markets/[id]/receipts/[id]/edit` (매출입력 재사용, 무변경 확인) — 체크포인트 10
- [x] `/login` 로그인 화면 (mock 자동인증으로 화면확인 불가, 코드 완료)
- [x] **다크 내비 레일** — ✅ B-1(웜 올리브 brand-deep + brand-spring 로고/활성)로 확정

> ✅ **색상 리스킨(STEP 2~5) 완료.** ✅ 폰트(STEP6) 완료. ✅ 라임→brand 확정. ✅ 다크레일 확정.
> 남은 선택지: 그린(#1f8a4d)/블루(#2d6fe0) 의미색 토큰화, 기하(라운드/간격/그림자) 정렬.

> 화면을 돌면서 자연스럽게 **STEP 3(상태 배지)**, **STEP 4(금액 색)**도 그 화면에서 함께 처리합니다.
> 관련 색-상태 연결 파일: `market-display.ts`, `settlement-display.ts`, `participant-type-badge.tsx`, `settlement-metric.tsx` 등.

---

## 4. ✅ 보류였던 결정 — 전부 확정됨

작업 중 멈추고 물어봤던 항목들. 사용자와 상의해 모두 결정·반영 완료.

1. **라임색 `#c7f94b`** → ✅ **brand(연두 액션색)로 확정.** primary 버튼·활성 탭은 `bg-brand`, 다크 레일 로고/활성은 `brand-spring`으로 정리. (커밋 `2f0a449`)
2. **초록색 `#1f8a4d`** → ✅ **success 토큰으로 확정.** 정산 지급액·성공 표시를 `text-success`/`bg-success-tint`로 통일. (커밋 `c689240`)
3. **파란색 `#2d6fe0`** → ✅ **info(웜 틸 `#3A7081`)로 확정.** 정산 지표 카드 blue 톤을 `text-info`로 조화. (커밋 `c689240`)
4. **폰트 (STEP 6)** → ✅ **교체 완료.** 본문 **Pretendard**, 코드/영수증번호 **JetBrains Mono** (React 19 스타일시트 호이스팅 `<link>`로 로드).

---

## 5. ✅ DESIGN.md의 "색 외" 사양 — 반영 완료

색 말고도 DESIGN.md에 있던 스타일 규칙들. 사용자 요청으로 모두 반영함 (**다크모드만 제외**).

| 항목 | DESIGN.md 사양 | 반영 여부 |
|---|---|---|
| 모서리 둥글기(라운드) | 버튼 8px · 카드 12px · 모달 16px · 칩 완전둥글 | ✅ 완료 (`6dfcc2a`) |
| 간격(스페이싱) | 4px 배수, 카드/섹션 여백 정렬 | ✅ 완료 (`91f8185`) |
| 그림자 | ink(#2A2E22) 틴트 소프트 섀도 3단계 (card/popover/modal) | ✅ 완료 (`e11552b`) |
| 모션(애니메이션) | 90/140/200/260ms + 감속곡선, reduced-motion 존중 | ✅ 완료 (`e11552b`) |
| 상태 배지 | 색 + 라벨 + **아이콘** 항상 같이(접근성) | ✅ 완료 (`74660fe`) |
| 금액 숫자색 | 지급액=연두 / 수수료=muted / 환불=빨강, 우측정렬·tabular | ✅ 완료 (STEP4) |
| 타이포 스케일 | display/title/body/num… 크기·굵기 체계 | ✅ 완료 (`b983cb7`) |
| 다크모드 | 라이트/다크 페어 | 🚫 **제외** (사용자 결정) |

---

## 6. 기술 메모 (개발 환경)

- **개발 서버 켜기**: 터미널에서 `npm run dev` → 브라우저에서 `http://localhost:3000` 접속.
  (이미 켜져 있으면 코드 저장 시 자동으로 새로고침됨 = HMR)
- **색이 안 먹는 것처럼 보이면** (예: 다크 카드가 투명): Turbopack CSS 캐시 문제일 수 있음 →
  dev 서버 끄고 `rm -rf .next` 후 다시 `npm run dev`. (특히 git 브랜치를 왔다갔다 한 뒤)
- **데이터 모드**: `.env.local`에 `NEXT_PUBLIC_DATA_SOURCE=mock` → **가짜 데이터로 동작**(진짜 서버 없이 화면 확인 가능). 그래서 로그인 없이 바로 홈이 보임.
- **색 토큰이 정의된 곳**: `src/app/globals.css`의 `@theme inline { ... }` 블록.
  여기서 예: `--color-brand: #4e7327;` → 화면에서 `bg-brand`, `text-brand` 처럼 쓸 수 있음.
- **공통 부품 색**: `src/lib/design-system.ts` (버튼·인풋·카드 등)
- **화면별 컴포넌트**: `src/features/<도메인>/components/` 폴더

### 자주 쓰는 토큰 이름(색) 요약
- 배경: `canvas`(페이지) · `surface`(카드) · `canvas-soft`(살짝 눌린 면)
- 글자: `ink`(제목) · `body`(본문) · `muted`(보조) · `muted-soft`(플레이스홀더)
- 선: `hairline`(얇은 구분선) · `border`(인풋 테두리)
- 브랜드: `brand`(연두 액션) · `brand-deep`(어두운 밴드) · `brand-tint`(연한 배경)
- 의미: `success`/`warning`/`error`/`info` (+각각 `-tint` 배경색)
- 금액: `amount-payout`(지급) · `amount-fee`(수수료) · `amount-negative`(환불)

---

## 7. 차트 색 토큰화 (팔레트 교체 대비) ✅

정산 차트 2개 파일의 SVG 색이 hex 하드코딩이었는데, **토큰 참조로 연결 완료.**
(SVG `fill=`/`stroke=` 속성은 `var()`가 안 먹어서, Tailwind `fill-*`/`stroke-*` 유틸리티 클래스로 변경 — `--color-*` 토큰을 그대로 참조.)

- `participant-settlement-dual-chart.tsx` · `participant-daily-sales-detail.tsx`
- 매핑: `#7ba23f`→`bar-fill` · `#d5d0bf`→`border` · `#e7e2d4`→`chart-grid` · `#686d5c`→`muted` · `#494f3e`→`body` · `#2a2e22`→`ink` · `#ffffff`→`surface-raised`
- 색은 그대로(브라우저 계산값 검증), 이제 `globals.css` 토큰만 바꾸면 **차트까지 자동 반영.**
- 남은 하드코딩 hex 8개는 **의도적 특수색**(다크 레일·staff 배지)이라 유지.

> ➡️ **팔레트 교체 방법**: getdesign.md에서 새 기업 md를 가져오면 → `globals.css`의 `@theme inline` 토큰 39개 값만 매핑·교체하면 앱 대부분+차트가 한 번에 리스킨됨. (특수색 8개만 필요시 수동 조정)

---

## 8. 테이블 헤더 통일 ✅

일부 표는 진한 녹색 헤더(`bg-brand-deep` #34431c)라 다크 사이드바와 색이 겹쳐 불편했음.
**부스 테이블 헤더를 표준**으로 삼아 앱 전체 표 헤더를 밝은 베이지로 통일.

- **표준 스펙**: `bg-surface-sunken`(베이지 배경) + `text-muted`(글자색) + `text-sm font-medium`(일반 산세리프, mono·대문자·자간 제거)
- **통일한 표(6곳)**: 영수증 입력 · 영수증 조회 · LOG · 수수료 정책 · 정산 미리보기 표 · 참가부스 스냅샷
- 강조 라벨(수수료 "이 부스 설정", 정산 "지급 예정/지급액")은 밝은 배경에서 안 읽히는 라임(`text-brand-spring`) 대신 **`text-brand`**(진한 연두)로 강조 유지.
- ⚠️ 정산 페이지의 **다크 KPI 카드·요약 패널·제출 패널·토스트·사이드바**는 의도된 다크 요소라 **그대로 유지**(헤더만 통일).

---

## 9. 표 하단 라운드 정리 ✅

일부 표에서 **패널은 둥근데 표 하단 모서리가 뾰족한** 문제. 원인은 둥근 패널(`rounded-[12px]`, `overflow-hidden` 없음)의 마지막 자식이 사각 `overflow-x-auto` 컨테이너라, 그 사각 클립이 패널의 둥근 하단을 덮기 때문.

- **수정한 표(4곳)**:
  - LOG(`audit-log-screen`) · 부스 마스터표(`participant-master-table`) · 상품표(`product-table`) → 표 컨테이너에 `rounded-b-[12px]` 추가
  - 영수증 조회 매트릭스(`receipt-matrix-table`) → `rounded-t-[12px]` → `rounded-[12px]`(상하 모두)
- **이미 안전했던 곳**: 영수증 입력·정산 스냅샷/히스토리·수수료 매트릭스(부모 `overflow-hidden`), 정산 미리보기 표(자체 rounded), 피커·모달(자체 rounded), 차트(패딩 안쪽).
- panelVariants 전역은 안 건드리고 각 표에 국소 수정(다른 패널 영향 없음).

---

## 9.5 참가부스 화면 패널 간격 ✅

`/markets/[id]/booths`(참가 부스)의 "마켓 참가 설정" 패널과 "상품" 패널이 **간격 없이 붙어** 있던 문제.
- 원인: `BoothProductManagementView`가 두 `<section>`을 **fragment**로 감싸개 없이 반환 + 부모 콘텐츠 영역(dashboard-shell)에 `gap` 없음.
- 수정: 두 섹션을 `<div className="grid gap-6">`(앱 표준 패널 간격 24px, `appShellClass` 기준)로 감쌈.

---

## 10. 남은 일 (선택)

리스킨 **기능/디자인 작업은 완료**. 남은 건 선택 사항뿐:

- **형에게 공유** — `redesign/tambang` push + PR (⚠️ 외부 업로드라 진행 전 확인 필요)
- 스크린샷 다시 돌며 미세 조정할 화면 찾기
- 이대로 마무리

---

## 11. 커밋 히스토리 (redesign/tambang, 최신순 일부)

- `2558b5c` 참가부스 화면: 참가설정/상품 패널 사이 간격 추가
- `3968ab9` 라운드: 표 하단 라운드 일괄 정리 (부스/상품/영수증 조회)
- `411d619` 라운드: LOG 테이블 하단 라운드 정렬
- `48a5c4f` docs: progress 헤더 통일 반영
- `6b422ef` 헤더 통일: 정산 표 헤더도 밝은 베이지로
- `9b6416c` 헤더 통일: 진한 녹색 테이블 헤더 → 밝은 베이지 (영수증/LOG/수수료)
- `e1fd3d5` 차트: SVG 색을 토큰 참조로 연결 + progress.md 최신화
- `2e5514d` 레일 색 차별화 + 영수증 표 라운드 정렬
- `74660fe` components+a11y: 상태 배지 아이콘 병행
- `e11552b` elevation+motion: DESIGN 섀도 3단계 + 모션/접근성
- `b983cb7` 타이포: DESIGN 타입 스케일 반영
- `c689240` C: 그린/블루 의미색 DESIGN 토큰으로 조화
- `91f8185` E-2: 간격 DESIGN 스케일 정렬 (카드/섹션 여백)
- `6dfcc2a` E-1: 라운드·그림자 DESIGN 스케일 정렬
- `2f0a449` 라임→brand 확정 + 다크 레일 B-1(웜 올리브)
- (그 앞: 화면별 색 리스킨 체크포인트 1~10 + 폰트 교체)

---

_마지막 업데이트: 라운드 정리 + 참가부스 패널 간격 반영 (커밋 26개, 작업 트리 clean)_
