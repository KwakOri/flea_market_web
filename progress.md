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
- 아직 **커밋은 안 함**(원할 때 저장 지점 찍을 수 있음). 형에게 공유하려면 나중에 push + PR.

### 되돌리는 법(안심용)
- 커밋은 아직 안 했습니다. 뭔가 이상하면 `git status`로 바뀐 파일을 보고, `git restore <파일경로>`로 특정 파일을 원래대로 되돌릴 수 있습니다.
- 전부 되돌리려면 `git restore .` (단, 새로 만든 `progress.md`·`DESIGN.md`·`tokens.css`·`MAPPING.md`는 지워지지 않음).

---

## 1. 이 작업의 큰 그림 (6단계)

| 단계 | 내용 | 상태 |
|---|---|---|
| STEP 1 | 색 토큰 설치 (`tokens.css` → `globals.css`에 병합) | ✅ 완료 |
| STEP 2 | 색 교체 (레포의 하드코딩 색 → 토큰으로) | 🔄 진행 중 (화면 단위) |
| STEP 3 | 상태 배지 색 교체 (정산완료/환불/대기 등) | ⏳ 대기 (해당 화면 갈 때) |
| STEP 4 | 금액 숫자 색 (지급액/수수료/환불) | ⏳ 대기 (정산·영수증 화면) |
| STEP 5 | 화면 하나씩 진행 + 스크린샷 확인 | 🔄 진행 중 |
| STEP 6 | 폰트 교체 여부 | ⏸️ 보류 (사용자 결정 대기) |

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
- [ ] 정산 드릴다운/회차: participant-daily-sales-detail · settlement-participant-snapshots · settlement-version-* (회차 상세 화면)
- [ ] 마켓 상세 하위 나머지: 참가부스(participant-picker 등) / 수수료 현황(fees) / 로그(logs)
- [ ] 영수증 수정 `/markets/[id]/receipts/[id]/edit`
- [ ] `/login` 로그인 화면
- [ ] **다크 내비 레일**(왼쪽 세로) — ⏸️ 라임 결정 후. (매트릭스 다크헤더도 같은 계열)

> 화면을 돌면서 자연스럽게 **STEP 3(상태 배지)**, **STEP 4(금액 색)**도 그 화면에서 함께 처리합니다.
> 관련 색-상태 연결 파일: `market-display.ts`, `settlement-display.ts`, `participant-type-badge.tsx`, `settlement-metric.tsx` 등.

---

## 4. ⏸️ 보류 중인 결정 (사용자가 정해줘야 진행)

작업을 멈추고 물어본 항목들. 정해지면 해당 부분을 마저 바꿉니다.

1. **라임색 `#c7f94b`** (지금 primary 버튼·활성 탭·왼쪽 레일 로고에 쓰임)
   - → 브랜드 액션색(brand 연두)으로 바꿀지, 장식용(brand-spring)으로 둘지, 그대로 둘지.
   - **현재: 그대로 유지 중.** 이 색이 걸린 곳(다크 레일 포함)은 아직 안 건드림.
2. **초록색 `#1f8a4d`** (정산 지급액·성공 표시에 쓰임)
   - → success(정산완료 초록)로 볼지, brand로 볼지.
   - **현재: 그대로 유지 중.**
3. **파란색 `#2d6fe0`** (정산 지표 카드의 "blue" 톤, 4곳)
   - → tambang에는 파랑이 없고 대신 웜 틸(info `#3A7081`)이 있음. 톤이 바뀌어서 확인 필요.
   - **현재: 그대로 유지 중.**
4. **폰트 (STEP 6)**
   - 현재: Paperlogy / Space Grotesk / Mono 계열 (로컬 폰트)
   - DESIGN.md 지정: 본문 **Pretendard**, 코드/영수증번호 **JetBrains Mono**
   - → 교체할지 유지할지. **현재: 유지 중(색부터 먼저).**

---

## 5. DESIGN.md에서 "색 외에" 더 반영할 수 있는 것들 (선택 사항)

색 리스킨이 1순위지만, DESIGN.md에는 색 말고도 스타일 규칙이 더 있습니다.
아래는 **지금 당장 필요하진 않지만** 원하면 나중에 맞출 수 있는 항목입니다. (넣을지 말지 사용자 결정)

| 항목 | DESIGN.md 사양 | 지금 레포 | 반영 여부 |
|---|---|---|---|
| 모서리 둥글기(라운드) | 버튼 8px · 카드 12px · 모달 16px · 칩 완전둥글 | 버튼 10px · 카드 16~18px | ⏸️ 선택 |
| 간격(스페이싱) | 4px 배수, 테이블 셀 10/14px | 대체로 유사 | ⏸️ 선택 |
| 그림자 | ink(#2A2E22) 틴트 소프트 섀도 3단계 | 기존 유지 | ⏸️ 선택 |
| 모션(애니메이션) | 90/140/200/260ms + 감속곡선, reduced-motion 존중 | 일부만 | ⏸️ 선택 |
| 상태 배지 | 색 + 라벨 + 아이콘 항상 같이(접근성) | 색+라벨만 | 🔄 STEP3에서 |
| 금액 숫자색 | 지급액=연두 / 수수료=muted / 환불=빨강, 우측정렬·tabular | 일부 색만 | 🔄 STEP4에서 |
| 타이포 스케일 | display/title/body/num… 크기·굵기 체계 | 유사하나 폰트 다름 | ⏸️ 폰트 결정 후 |

> ⚠️ 라운드·간격은 "색"보다 티가 크게 나는 변화라, 넣을 거면 한 화면에서 먼저 시험해보고 결정하는 걸 권장.

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

_마지막 업데이트: 체크포인트 1 완료 시점_
