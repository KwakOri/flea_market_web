# tambang 리스킨 실행 가이드 (에이전트용)

> **이 문서를 읽는 클로드에게**: 이건 이미 기능이 완성된 레포(브라운필드)에 tambang `DESIGN.md`의
> 색·스타일만 입히는(리스킨) 작업 지시서다. 아래 규칙을 반드시 지켜라.

## ⛔ 절대 규칙 (SCOPE GUARDRAILS)

1. **바꿔도 되는 것**: 색상값(hex/클래스), 폰트, 간격·라운드·그림자 같은 **시각 스타일만**.
2. **절대 건드리지 말 것**:
   - 로직·상태관리(Zustand/TanStack Query)·데이터 구조·API 호출
   - enum **값** 자체 (`confirmed`, `active` 등 문자열)와 함수 **시그니처**
   - 배지/디스플레이 함수는 **반환하는 클래스 문자열만** 교체, 함수 구조는 그대로
3. 🔴 또는 "확인 필요"로 표시된 항목은 **적용 전 사용자에게 물어보고** 결정 받은 뒤 진행.
4. 한 번에 다 하지 말고 **파일/화면 단위로 나눠서** 진행하고, 각 단계 후 사용자에게 스크린샷/확인 요청.

## 참고 스택 사실
- Next 16 (App Router) / Tailwind CSS v4 (**JS config 없음**, `@theme` 사용) / **shadcn 아님** / **다크모드 없음**
- 색이 CSS 변수로 중앙화 안 됨 → hex 리터럴이 **28파일·524회 산재**. 전수 치환 필요.
- ⚠️ AGENTS.md 경고 있음: 비표준 Next 16 — 코드 만지기 전 `node_modules/next/dist/docs/` 확인.

---

## STEP 1 — 토큰 설치 (먼저)

`projects/tambang/tokens.css`의 `@theme` 블록을 이 레포 `src/app/globals.css`에 병합한다.
→ 이걸로 `bg-canvas`, `text-ink`, `text-muted`, `border-hairline`, `bg-brand-tint` 같은 Tailwind 유틸이 생성됨.
이후 STEP 2부터는 hex 대신 이 유틸로 치환한다.

## STEP 2 — 색 hex 치환

레포 전체에서 아래 hex를 찾아 대응 토큰 유틸로 바꾼다. **✅는 바로 적용, 🔴/⚠️는 사용자 확인 후.**

| 기존 hex | → 토큰 유틸 | 지시 |
|---|---|---|
| `#fcfbf6` | `surface` (bg-surface) | ✅ 바로 적용 |
| `#f1eee2` | `canvas-soft` (bg-canvas-soft) | ✅ 바로 적용 |
| `#e6e2d4` | `hairline` (border-hairline) | ✅ 바로 적용 |
| `#8a8775` | `muted` (text-muted) | ⚠️ 캡션/보조 텍스트면 muted, 더 흐린 용도면 muted-soft — 용도 보고 판단 |
| `#1a1b12` | `ink` (text-ink) | ⚠️ 텍스트면 ink, 어두운 배경면이면 brand-deep — 용도 확인 |
| `#16170f` | `ink` (text-ink) | ⚠️ 위와 동일 |
| `#c7f94b` | 🔴 **STOP** | 밝은 라임. 주 액션/버튼이면 `brand`, 로고·장식이면 `brand-spring`. **사용자에게 물어봐라** |
| `#1f8a4d` | 🔴 **STOP** | 채도 높은 그린. 정산완료/성공이면 `success`, 주 액션이면 `brand`. **사용자에게 물어봐라** |

> 위는 dev가 확인해준 상위 8색. **먼저 레포 전체에서 실제 사용 중인 hex 전체 목록을 뽑아**
> (예: `grep -roiE '#[0-9a-fA-F]{6}' src/`) 이 표에 없는 색은 사용자에게 매칭을 물어본 뒤 진행한다.

## STEP 3 — 상태 배지 색 교체

`market-display.ts`(`getMarketStatusBadgeClass`), `settlement-display.ts`(`getSettlementStatusBadgeClass`),
그리고 인라인 배지들에서 **반환 클래스 문자열만** 아래로 교체:

| 상태 성격 | 배지 클래스 |
|---|---|
| 완료/성공 (confirmed, active) | `bg-success-tint text-success` |
| 오류/환불/무효 (voided) | `bg-error-tint text-error` |
| 대기/검토필요 (pending) | `bg-warning-tint text-warning` |
| 진행중/중립정보 (draft, upcoming) | `bg-info-tint text-info` |
| 비활성/대체됨 (superseded, inactive, archived) | `bg-canvas-soft text-muted` |

> ⚠️ 어떤 enum 값이 위 어느 줄에 속하는지 애매하면 **사용자에게 확인**. 관련 enum:
> `MarketStatus`, `MarketLifecycleFilter`, `ProductStatus`, `ParticipantType`, `ParticipantStatus`, `SettlementType`.
> 커스텀 hex 배지 파일도 위 토큰으로 통일: `participant-type-badge.tsx`, `settlement-metric.tsx`, `dashboard-shell.tsx`.

## STEP 4 — 금액 숫자 색 (테이블 셀)

| 의미 | 토큰 유틸 |
|---|---|
| 일반 금액 | text-amount-default |
| 지급액·정산확정 | text-amount-payout |
| 수수료 차감 | text-amount-fee |
| 환불·마이너스 | text-amount-negative (`−`/`₩` 기호 병행 유지) |

## STEP 5 — 화면 단위로 진행 (각 화면 끝나면 사용자 확인)

`/` · `/login` · `/markets`(+상세 하위들) · `/booths` · `/receipts` · `/sales` · `/settlements` · `/management` · `/settings`
- 공통 셸: `layout.tsx → DashboardShell(Rail+Header+summary)` 부터.
- 프리미티브 `src/lib/design-system.ts`를 먼저 리스킨하면 하위가 자동으로 따라옴.

## STEP 6 — 폰트 (사용자 결정 후)

- DESIGN.md 지정: 본문 Pretendard, 숫자 tabular(tnum), mono는 JetBrains Mono
- 현재 레포: Paperlogy / Space Grotesk / IBM Plex·Space Mono (로컬 @font-face)
- 🔴 **교체할지 유지할지 사용자에게 물어본 뒤** 진행.

---
정본: 병합 후엔 이 레포의 `globals.css`/`DESIGN.md`가 라이브 기준. `projects/tambang/`는 설계 스냅샷.
