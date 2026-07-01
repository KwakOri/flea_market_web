---
version: alpha
name: tambang-design-system
platform: web (React + Tailwind CSS)
theme: light + dark (token-paired)
locale: ko-KR (primary)
description: >
  tambang — 소규모 플리마켓 운영진이 쓰는 정산·계산 기록 대시보드. 마켓은 셀러를 모집해
  부스별 결제가 아니라 종이 영수증을 모아 계산대에서 단체 결제하는 방식이라, 운영진은 거래를
  기록하고 셀러별 매출·수수료·지급액을 정산해야 한다. 기존 구글 시트(수식 연결)가 익숙하지 않아
  어려워하던 운영진을 위해, "시트보다 쉽고, 시트보다 정확한" 도구를 목표로 한다.
  브랜드 무드는 수작업 굿즈 마켓다운 따뜻하고 아날로그한 아이보리+연두 파스텔이지만,
  도구 자체는 운영진의 가독성·정확성·빠른 입력을 최우선으로 설계했다 — 따뜻한 표면 위에
  엄정한 표·숫자 시스템을 얹는 이중 구조다.

# ──────────────────────────────────────────────────────────────────────────
# COLORS — 모든 색은 라이트/다크 페어로 정의(테마 = 토큰 교체. supabase 차용).
# 순백·순흑을 의도적으로 피한다(웜 아이보리/웜 다크 — claude·starbucks 차용).
# WCAG 대비는 Accessibility 섹션에서 검증값 명시.
# ──────────────────────────────────────────────────────────────────────────
colors:
  # --- 캔버스 & 표면 ---
  canvas:          { light: "#F7F4EC", dark: "#1A1C16" }   # 페이지 바탕(웜 아이보리 / 웜 다크 올리브-블랙)
  canvas-soft:     { light: "#F1EDE2", dark: "#21241C" }   # 섹션 워시·존 구분
  surface:         { light: "#FCFBF6", dark: "#262922" }   # 카드·패널 기본 표면
  surface-raised:  { light: "#FFFFFF", dark: "#2F332A" }   # 모달·드롭다운·팝오버(최상단)
  surface-sunken:  { light: "#F0ECDF", dark: "#15170F" }   # 인풋 트랙·테이블 헤더 바닥

  # --- 텍스트(순흑 거부, 그린 기운 웜 잉크) ---
  ink:             { light: "#2A2E22", dark: "#ECEAE0" }   # 제목·고강조
  body:            { light: "#494F3E", dark: "#C9CBBE" }   # 기본 본문
  muted:           { light: "#686D5C", dark: "#979B89" }   # 캡션·보조·수수료 텍스트 (light 4.5:1 대응 조정)
  muted-soft:      { light: "#A6AB97", dark: "#6B6F60" }   # 플레이스홀더·비활성 — 대비 예외(의도적 약화, 본문 금지)

  # --- 라인 ---
  hairline:        { light: "#E7E2D4", dark: "#34382E" }   # 1px 구분선·테이블 행 경계
  border:          { light: "#D5D0BF", dark: "#444839" }   # 인풋·아웃라인 보더
  border-strong:   { light: "#BDB8A4", dark: "#5A5F4C" }   # 포커스 외 강조 보더

  # --- 브랜드 연두(역할 매핑 — starbucks 구조 차용, 4셰이드→핵심으로 축약) ---
  brand:           { light: "#4E7327", dark: "#9CC65C" }   # 주 액션·링크·선택·포커스. 라이트=AA 통과 딥 연두, 다크=밝은 연두
  brand-hover:     { light: "#436322", dark: "#ACD46C" }   # 호버/프레스 상태
  brand-spring:    { light: "#A7C957", dark: "#A7C957" }   # 브랜드 시그널 연두(로고·일러스트·장식). 텍스트 위 흰글자 금지
  brand-deep:      { light: "#34431C", dark: "#1F2912" }   # 딥 올리브 — 다크 밴드 배경·고강조 브랜드 텍스트
  brand-tint:      { light: "#ECF2DB", dark: "#2B3A1A" }   # 선택 행·칩·서브틀 호버 배경(연두 워시)
  brand-tint-strong:{ light: "#E5EECF", dark: "#3A4D24" }  # 활성 칩·강조 선택 배경 (light: brand 텍스트 4.5:1 위해 밝게)

  # --- on-color(브랜드 면 위 텍스트) ---
  on-brand:        { light: "#FFFFFF", dark: "#15170F" }   # brand 채움 위 텍스트(다크는 어두운 글자)
  on-brand-deep:   { light: "#EEF3DD", dark: "#EEF3DD" }   # brand-deep 다크 밴드 위 텍스트

  # --- 시맨틱(돈 도구이므로 색만이 아니라 라벨/아이콘 병행 — Accessibility 참고) ---
  success:         { light: "#4E7327", dark: "#9CC65C" }   # 정산 완료(=brand, 온브랜드)
  success-tint:    { light: "#E4EFCF", dark: "#2B3A1A" }
  warning:         { light: "#8A620B", dark: "#E6B85C" }   # 정산 대기·검토 필요(웜 앰버) (light 틴트 위 4.5:1 대응)
  warning-tint:    { light: "#F6EBCF", dark: "#3D3214" }
  error:           { light: "#AE412C", dark: "#E8836B" }   # 환불·마이너스·미정산 오류(웜 클레이 레드) (light 틴트 위 4.5:1 대응)
  error-tint:      { light: "#F5DDD5", dark: "#3D241D" }
  info:            { light: "#3A7081", dark: "#7FB6C6" }   # 중립 정보·진행중(웜 틸) (light 틴트 위 4.5:1 대응)
  info-tint:       { light: "#DCEBEF", dark: "#1E2E33" }

  # --- 정산 금액 의미 색(테이블 숫자 셀 — 신규 설계) ---
  amount-default:  { light: "#2A2E22", dark: "#ECEAE0" }   # 일반 매출/금액 — 중립 잉크(돈을 색으로 도배하지 않음)
  amount-payout:   { light: "#4E7327", dark: "#9CC65C" }   # 셀러 지급액·정산 확정액(브랜드 그린)
  amount-fee:      { light: "#686D5C", dark: "#979B89" }   # 수수료 차감(muted — 빠지는 돈은 조용히)
  amount-negative: { light: "#AE412C", dark: "#E8836B" }   # 환불·마이너스(error red)

  # --- 데이터 시각화(거의 없음 — 최소 토큰만, 신규 설계) ---
  bar-track:       { light: "#E7E2D4", dark: "#34382E" }   # 진행/비율 바 트랙
  bar-fill:        { light: "#7BA23F", dark: "#9CC65C" }   # 진행 바 채움(연두)
  chart-grid:      { light: "#E7E2D4", dark: "#34382E" }   # (필요 시) 차트 그리드

  # --- 오버레이 ---
  scrim:           { light: "#2A2E22", dark: "#000000" }   # 모달 배경(라이트 45% / 다크 60% 알파)
  focus-ring:      { light: "#4E7327", dark: "#9CC65C" }   # 키보드 포커스 링(=brand)

# ──────────────────────────────────────────────────────────────────────────
# TYPOGRAPHY — 한글 우선(레퍼런스 미보유 영역, 신규 설계). 웹 rem 기반.
# 대시보드 가독성 최우선: 본문 15px·라인 1.6, 숫자는 전부 tabular(tnum).
# ──────────────────────────────────────────────────────────────────────────
typography:
  # 패밀리: Pretendard 단일(한글 가독성 표준 + 라틴/숫자 우수). 코드/영수증번호만 mono.
  fontFamily-base: "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
  fontFamily-mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, 'Pretendard', monospace"

  display:                       # 대시보드 큰 제목(드물게)
    fontSize: 1.75rem            # 28px
    fontWeight: 700
    lineHeight: 1.3              # 한글 여유
    letterSpacing: "-0.01em"
  title-lg:                      # 페이지 제목
    fontSize: 1.375rem           # 22px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.005em"
  title:                         # 카드·섹션·패널 제목
    fontSize: 1.125rem           # 18px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0
  body:                          # 기본 본문·테이블 셀 텍스트
    fontSize: 0.9375rem          # 15px (대시보드 밀도 ↔ 한글 가독 균형)
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:                       # 보조 본문·메타
    fontSize: 0.8125rem          # 13px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  label:                         # 버튼·폼 라벨·테이블 헤더
    fontSize: 0.875rem           # 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  caption:                       # 캡션·도움말·축
    fontSize: 0.75rem            # 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  micro:                         # 칩·배지
    fontSize: 0.6875rem          # 11px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  # --- 숫자 전용(정산 도구의 심장 — stripe tabular-figure 차용) ---
  num-display:                   # 요약 카드 큰 금액(총매출·정산액)
    fontSize: 1.75rem            # 28px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontFeatures: "'tnum' 1, 'ss01' 1"   # 폭 고정 숫자
  num:                           # 테이블 금액 셀
    fontSize: 0.9375rem          # 15px
    fontWeight: 500
    lineHeight: 1.4
    fontFeatures: "'tnum' 1"
    textAlign: right             # 금액은 항상 우측 정렬
  num-sm:                        # 보조 수치·소계
    fontSize: 0.8125rem          # 13px
    fontWeight: 500
    fontFeatures: "'tnum' 1"
    textAlign: right
  mono:                          # 영수증 번호·거래 코드·ID(자리 정렬)
    fontFamily: "{typography.fontFamily-mono}"
    fontSize: 0.8125rem          # 13px
    fontWeight: 500
    letterSpacing: "0.01em"
    fontFeatures: "'tnum' 1"

# ──────────────────────────────────────────────────────────────────────────
# SPACING — 4px 베이스. 대시보드는 테이블 밀도를 위해 dense 스텝 추가.
# ──────────────────────────────────────────────────────────────────────────
spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
  # 컴포넌트 밀도 토큰
  cell-y: 10px        # 테이블 셀 세로 패딩(밀도형)
  cell-x: 14px        # 테이블 셀 가로 패딩
  row-comfortable: 14px  # 여유 행(설정·셀러 목록)

# ──────────────────────────────────────────────────────────────────────────
# RADIUS — 따뜻하되 운영 도구다운 절제. 버튼은 풀필 대신 8px(airbnb 풀필 배제).
# ──────────────────────────────────────────────────────────────────────────
rounded:
  xs: 4px
  sm: 6px
  md: 8px        # 버튼·인풋·셀렉트
  lg: 12px       # 카드·패널
  xl: 16px       # 모달·다이얼로그
  full: 9999px   # 칩·배지·아바타·토글

# ──────────────────────────────────────────────────────────────────────────
# ELEVATION — 웜 틴트 소프트 섀도(섀도 색=ink 틴트, 순흑 금지. starbucks 다층 차용·절제).
# ──────────────────────────────────────────────────────────────────────────
elevation:
  flat:   "none"                                                       # 캔버스·테이블 행
  card:   "0 1px 2px rgba(42,46,34,0.06), 0 1px 3px rgba(42,46,34,0.05)"   # 카드·패널
  popover:"0 4px 12px rgba(42,46,34,0.10), 0 2px 4px rgba(42,46,34,0.06)"  # 드롭다운·툴팁
  modal:  "0 16px 40px rgba(42,46,34,0.18), 0 4px 12px rgba(42,46,34,0.10)" # 모달
  # 다크 테마는 섀도 대신 surface 밝기 차 + border 로 깊이를 준다(다크에서 섀도는 약하므로).

# ──────────────────────────────────────────────────────────────────────────
# MOTION — 대시보드는 빠르고 조용하게. reduced-motion 존중(접근성).
# ──────────────────────────────────────────────────────────────────────────
motion:
  duration-instant: 90ms     # 호버·포커스
  duration-fast: 140ms       # 버튼·토글·행 강조
  duration-base: 200ms       # 드롭다운·탭 전환
  duration-slow: 260ms       # 모달·시트
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"     # 진입/이동
  easing-emphasized: "cubic-bezier(0.3, 0, 0, 1)"   # 모달
  easing-exit: "cubic-bezier(0.4, 0, 1, 1)"         # 퇴장
  reduced: "prefers-reduced-motion 시 transform/opacity 외 모션 제거, duration 0ms 대체"

# ──────────────────────────────────────────────────────────────────────────
# COMPONENTS — 정산 대시보드 + 도메인 전용(테이블·통화·정산 흐름이 핵심).
# 변형/상태/크기를 직교적으로(design-engineer-lens 5축). 토큰 참조만, 하드코딩 금지.
# ──────────────────────────────────────────────────────────────────────────
components:
  # === 셸 / 내비게이션(웹 — sidebar + topbar. 모바일 탭바·FAB는 배제) ===
  app-sidebar:
    backgroundColor: "{colors.canvas-soft}"
    width: 248px
    itemTextColor: "{colors.body}"
    itemActiveColor: "{colors.brand}"
    itemActiveBg: "{colors.brand-tint}"
    itemHoverBg: "{colors.surface}"
    typography: "{typography.label}"
    rounded-item: "{rounded.md}"
    collapsible: true            # 좁은 화면에서 아이콘 전용으로 축소
  top-bar:
    backgroundColor: "{colors.canvas}"
    borderBottom: "1px solid {colors.hairline}"
    height: 56px
    titleTypography: "{typography.title}"

  # === 버튼(variant × size 직교) ===
  button-primary:
    backgroundColor: "{colors.brand}"
    hoverBackground: "{colors.brand-hover}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 40px                 # default. sm=32px / lg=48px
    focusRing: "2px solid {colors.focus-ring}, offset 2px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    hoverBackground: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.border}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 40px
  button-ghost:
    backgroundColor: transparent
    hoverBackground: "{colors.brand-tint}"
    textColor: "{colors.brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 40px
  button-danger:                 # 환불·삭제·정산 취소
    backgroundColor: "{colors.error}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 40px
  icon-button:                   # 테이블 행 액션(편집·삭제)
    size: 32px                   # 시각 크기. 클릭 히트영역은 최소 40px 확보
    iconColor: "{colors.muted}"
    hoverColor: "{colors.ink}"
    hoverBackground: "{colors.canvas-soft}"
    rounded: "{rounded.sm}"

  # === 데이터 테이블(이 시스템의 심장 — stripe 숫자 정밀 + supabase 콘솔 차용) ===
  data-table:
    headerBackground: "{colors.surface-sunken}"
    headerTextColor: "{colors.muted}"
    headerTypography: "{typography.label}"
    headerSticky: true           # 스크롤 시 헤더 고정(긴 정산 목록 대응)
    rowBackground: "{colors.surface}"
    rowHoverBackground: "{colors.brand-tint}"
    rowSelectedBackground: "{colors.brand-tint-strong}"
    rowBorder: "1px solid {colors.hairline}"
    cellPadding: "{spacing.cell-y} {spacing.cell-x}"
    cellTypography: "{typography.body}"
    zebra: false                 # 줄무늬 대신 hairline + 여백으로 분리(따뜻·깔끔)
    density: "default | compact"  # compact=cell-y 6px
  amount-cell:                   # 금액 셀 — 우측 정렬·tabular·의미색(신규 설계)
    typography: "{typography.num}"
    textAlign: right
    color-default: "{colors.amount-default}"
    color-payout: "{colors.amount-payout}"
    color-fee: "{colors.amount-fee}"
    color-negative: "{colors.amount-negative}"
    format: "₩#,### (천단위 콤마, 원 단위, 음수는 −₩#,### + error색)"
  table-total-row:               # 합계 행(정산 도구 필수)
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    amountTypography: "{typography.num}"
    borderTop: "2px solid {colors.border}"
    sticky: "bottom"             # 하단 고정 합계
  seller-row:                    # 셀러별 정산 행(도메인 — meal-card 변형 발상)
    avatarColor: "{colors.brand-spring}"
    nameTypography: "{typography.body}"
    boothTypography: "{typography.caption}"   # 부스 번호·메모
    salesAmount: "{colors.amount-default}"
    feeAmount: "{colors.amount-fee}"
    payoutAmount: "{colors.amount-payout}"    # 강조: 실제 지급액

  # === 요약 카드(KPI — 총매출·총수수료·정산액. 데이터viz 대신 큰 숫자 우선) ===
  summary-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{elevation.card}"
    labelTypography: "{typography.body-sm}"
    labelColor: "{colors.muted}"
    valueTypography: "{typography.num-display}"
    valueColor: "{colors.ink}"
    deltaPositiveColor: "{colors.success}"
    deltaNegativeColor: "{colors.error}"

  # === 폼(구글 시트 대체의 본질 — 빠르고 틀리기 어려운 입력) ===
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.muted-soft}"
    typography: "{typography.body}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 12px"
    focusBorder: "1.5px solid {colors.brand}"
    focusRing: "2px {colors.brand-tint}"
  number-input:                  # 금액·수량 — 우측정렬·tabular·자동 콤마
    extends: text-input
    typography: "{typography.num}"
    textAlign: right
    inputMode: "numeric"
    prefix: "₩"                  # 통화 프리픽스
  receipt-number-input:          # 종이 영수증 번호(도메인 — mono로 자리 정렬)
    extends: text-input
    typography: "{typography.mono}"
  select:
    extends: text-input
    chevronColor: "{colors.muted}"
  form-field:                    # label + input + help/error 조립
    labelTypography: "{typography.label}"
    labelColor: "{colors.ink}"
    helpTypography: "{typography.caption}"
    helpColor: "{colors.muted}"
    errorColor: "{colors.error}"
    gap: "{spacing.sm}"
  segmented-control:             # 기간 필터(오늘/이번 마켓/전체)
    backgroundColor: "{colors.surface-sunken}"
    activeBackground: "{colors.surface-raised}"
    activeTextColor: "{colors.ink}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 36px

  # === 상태 표시(색만 아니라 라벨 병행 — 접근성) ===
  status-badge:
    rounded: "{rounded.full}"
    typography: "{typography.micro}"
    padding: "3px 10px"
    variants:
      settled:  { bg: "{colors.success-tint}", text: "{colors.success}", label: "정산완료", icon: "check" }
      pending:  { bg: "{colors.warning-tint}", text: "{colors.warning}", label: "정산대기", icon: "clock" }
      refunded: { bg: "{colors.error-tint}",   text: "{colors.error}",   label: "환불",     icon: "rotate-ccw" }
      active:   { bg: "{colors.info-tint}",    text: "{colors.info}",    label: "진행중",   icon: "dot" }
  chip:                          # 셀러 태그·카테고리
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-deep}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  chip-selected:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"

  # === 오버레이 / 피드백 ===
  modal:                         # 정산 확정·삭제 확인 등
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.xl}"
    shadow: "{elevation.modal}"
    padding: "{spacing.lg}"
    scrim: "{colors.scrim}"
    maxWidth: 480px
    titleTypography: "{typography.title}"
  toast:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.on-brand-deep}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    shadow: "{elevation.popover}"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
  empty-state:                   # "아직 거래가 없어요" 등
    illustrationColor: "{colors.brand-spring}"
    titleTypography: "{typography.title}"
    bodyTypography: "{typography.body-sm}"
    textColor: "{colors.muted}"
  progress-bar:                  # 정산 진행률(데이터viz 최소 — 의도적으로 1종만)
    trackColor: "{colors.bar-track}"
    fillColor: "{colors.bar-fill}"
    rounded: "{rounded.full}"
    height: 8px
---

## Overview

tambang은 **구글 시트를 대체하는 정산 대시보드**다. 핵심 사용자는 엑셀/시트 수식에 익숙하지
않은 소규모 플리마켓 운영진이고, 핵심 작업은 (1) 계산대에서 발생한 단체 결제·거래를 기록하고
(2) 셀러별 매출에서 수수료를 뗀 **지급액을 정확히 정산**하는 것이다. 따라서 이 시스템의 두 기둥은
**가독성 높은 데이터 테이블**과 **틀리기 어려운 숫자 입력**이다.

디자인은 의도적으로 **이중 구조**를 가진다.
- **브랜드 표면(따뜻함)**: 수작업 굿즈 마켓의 무드 — 웜 아이보리 캔버스(`{colors.canvas}` #F7F4EC,
  순백 거부), 연두 파스텔 액센트(`{colors.brand-spring}` #A7C957), 친근한 라운드. 로그인·빈 상태·
  헤더 등 "사람이 보는 면"에서 온도를 낸다. (claude·starbucks 차용)
- **도구 표면(엄정함)**: 운영진이 일하는 면 — tabular 숫자, 우측 정렬 금액 셀, 합계 행, sticky 헤더,
  단일 액션색 절제. 따뜻하되 **장식이 데이터를 방해하지 않게** 한다. (stripe·supabase 차용)

라이트/다크 두 테마를 토큰 페어로 운용하므로(`{ theme.* }` 교체만으로 전환), 운영진이 야간 행사장에서도
눈이 편하다. 한글이 1차 언어라 타이포는 레퍼런스에 없어 **새로 설계**했다(Pretendard·라인하이트 1.6·
tabular 숫자).

**Key Characteristics**
- 웜 아이보리 캔버스(#F7F4EC) + 웜 다크(#1A1C16) — 순백·순흑 금지. 따뜻함이 load-bearing.
- 연두 역할 매핑: brand(액션, AA 통과 딥연두) / brand-spring(브랜드 시그널 연두) / brand-deep(고강조) / brand-tint(선택·호버).
- 단일 액션 시그널 — 클릭 가능한 1차 액션은 항상 `{colors.brand}` 하나(supabase 절제 차용).
- 정산 숫자 시스템: tabular(tnum) + 우측 정렬 + 금액 의미색(지급액/수수료/환불) + ₩ 천단위 포맷(stripe 차용·신규 설계).
- 데이터 테이블 중심: sticky 헤더·sticky 합계 행·행 호버·선택. 줄무늬 대신 hairline+여백.
- 라이트/다크 토큰 페어 — 테마=토큰 교체.
- 한글 우선 타이포(Pretendard, rem 기반, 본문 15/1.6) — 신규 설계.
- 운영 도구다운 절제된 라운드(버튼 8px) — 풀필 버튼(airbnb)은 의도적 배제.
- 키보드 친화: 모든 인터랙티브에 2px 포커스 링(시트 사용자는 키보드 입력이 많음).

## Colors

테마 전환은 색을 다시 칠하는 게 아니라 **토큰 값 페어를 교체**하는 것으로만 일어난다(라이트↔다크).
Tailwind라면 `:root` 와 `.dark` 에 CSS 변수로 각 토큰을 바인딩하고, 컴포넌트는 변수만 참조한다.

### 캔버스 & 표면
순백 대신 **웜 아이보리**(`{colors.canvas}`)에서 시작한다(claude의 틴티드 크림 차용). 표면 위계는
섀도가 아니라 **밝기 차**로 만든다: `surface-sunken`(인풋·테이블 헤더 바닥) → `canvas` → `surface`(카드)
→ `surface-raised`(모달). 다크에서도 같은 위계를 어두운 올리브-블랙 톤으로 유지한다.

### 텍스트
순흑 대신 그린 기운의 웜 잉크 — `ink`(고강조) / `body`(본문) / `muted`(캡션·수수료) / `muted-soft`(플레이스홀더).

### 브랜드 연두(역할별)
- **brand** (#4E7327 / 다크 #9CC65C): 주 액션·링크·선택·포커스. 라이트는 흰 글자와 **AA 통과**하도록
  딥 연두로 잡았고, 다크는 어두운 배경에서 또렷하게 밝은 연두로 뒤집었다.
- **brand-spring** (#A7C957): 진짜 "연두" 브랜드 시그널 — 로고·일러스트·아바타·장식에만. 채도가 높아
  **흰 글자를 올리지 않는다**(대비 실패). 따뜻함은 여기서, 액션은 brand에서.
- **brand-deep** (#34431C): 다크 밴드 배경·토스트·고강조 브랜드 텍스트.
- **brand-tint / brand-tint-strong**: 선택 행·호버·칩 배경. 테이블에서 "지금 보고 있는 행"을 연두 워시로.

### 시맨틱 & 정산 금액색(신규 설계)
돈을 다루므로 색을 절제한다 — **일반 금액은 중립 잉크**(`amount-default`)로 두고, 의미가 있을 때만 색을 쓴다:
지급액=브랜드 그린(`amount-payout`), 수수료 차감=muted(`amount-fee`, 빠지는 돈은 조용히), 환불·마이너스=
error red(`amount-negative`). 시맨틱 배지(정산완료/대기/환불/진행중)는 **색+라벨+아이콘을 항상 병행**한다
(색맹 사용자 대응 — Accessibility 참고).

### 그라데이션
구조적 그라데이션 없음 — 솔리드 컬러블록(starbucks·supabase 차용). 깊이는 표면 밝기차 + 웜 소프트 섀도로.

## Typography (한글 우선 — 레퍼런스 미보유, 신규 설계)

### Font Family
- **본문·UI·숫자**: `Pretendard` — 한글 가독성의 사실상 표준이며 라틴/숫자 글리프도 우수하다. 단일 패밀리로
  한·영·숫자를 모두 커버해 페어링 복잡도를 없앤다. Fallback은 OS 한글 폰트(Apple SD Gothic Neo / Noto Sans KR).
- **영수증 번호·거래 코드·ID**: `JetBrains Mono`(또는 `ui-monospace`) — 종이 영수증 번호처럼 **자리수 정렬이
  중요한 코드성 텍스트**에만. 일반 금액은 mono가 아니라 Pretendard + tnum으로 충분하다.

### Hierarchy
| 토큰 | 크기 | 무게 | 라인하이트 | 용도 |
|------|------|------|-----------|------|
| `display` | 28 | 700 | 1.3 | 대시보드 큰 제목(드물게) |
| `title-lg` | 22 | 700 | 1.4 | 페이지 제목 |
| `title` | 18 | 600 | 1.45 | 카드·패널·섹션 제목 |
| `body` | 15 | 400 | 1.6 | 본문·테이블 셀 |
| `body-sm` | 13 | 400 | 1.55 | 보조 본문·메타 |
| `label` | 14 | 600 | 1.4 | 버튼·폼 라벨·테이블 헤더 |
| `caption` | 12 | 400 | 1.5 | 도움말·캡션 |
| `micro` | 11 | 600 | 1.3 | 칩·배지 |
| `num-display` | 28 | 700 | 1.15 (tnum) | 요약 카드 큰 금액 |
| `num` | 15 | 500 | 1.4 (tnum) | 테이블 금액 셀(우측정렬) |
| `num-sm` | 13 | 500 | — (tnum) | 소계·보조 수치 |
| `mono` | 13 | 500 | — (tnum) | 영수증 번호·코드 |

### 한글 타이포 원칙 (← tambang 고유, 레퍼런스 미보유)
- **라인하이트를 라틴보다 높인다.** 본문 1.6 — 한글은 글자 밀도가 높아 영미권 대시보드(1.4~1.5)보다 여유가 필요.
  테이블 셀도 1.6을 유지해 빽빽한 정산 표가 답답하지 않게 한다.
- **자간은 디스플레이/큰 숫자에만 약한 음수(-0.005~-0.01em), 본문·셀은 0.** 한글은 과한 음수 자간이 가독을 해친다.
- **무게 사다리는 400 / 600 / 700.** Pretendard의 600이 한글 라벨·헤더에서 또렷하다(라틴식 500은 한글에서 흐림).
- **숫자는 전부 tabular(tnum).** 자리수가 바뀌어도 금액 열이 흔들리지 않게(stripe 차용) — 정산 표의 생명.
- **금액은 우측 정렬.** 한글 텍스트 열은 좌측, 숫자 열은 우측 — 시트 사용자에게 익숙한 정렬을 토큰으로 못박는다.
- **영문/숫자 혼용 시** 같은 줄에서 Pretendard가 함께 처리(코드/영수증번호 mono 제외) — 폰트 스왑 없음.

## Layout

### Spacing — 4px 베이스
`{spacing.xs}`4 · `{spacing.sm}`8 · `{spacing.md}`12 · `{spacing.base}`16 · `{spacing.lg}`24 · `{spacing.xl}`32 · `{spacing.xxl}`48 · `{spacing.section}`64.
- 페이지 거터: `{spacing.lg}` 24px, 넓은 화면은 `{spacing.xl}` 32px.
- 카드 내부: `{spacing.lg}` 24px. 테이블 셀: `cell-y`(10)/`cell-x`(14), compact 밀도는 cell-y 6px.
- 섹션 간격: `{spacing.xl}`~`{spacing.section}`.

### Grid & Shell
- 웹 데스크톱 우선: 좌측 `app-sidebar`(248px, 좁으면 아이콘 축소) + 본문 영역.
- 본문 콘텐츠 최대폭 1280px, 테이블 화면은 풀폭 허용(긴 행).
- 요약 카드는 반응형 그리드(4-up → 2-up → 1-up).
- 반응형: ≥1024 데스크톱(주 사용), 768~1023 태블릿(사이드바 축소), <768 모바일(사이드바 드로어 + 테이블 가로 스크롤).

### Whitespace
아이보리 캔버스가 카드 사이의 "숨"이다. 테이블 내부는 밀도를 높이되, 카드/섹션 사이는 여백으로 끊는다(구분선 남발 금지).

## Shapes
카드/패널 `{rounded.lg}` 12px · 버튼·인풋·셀렉트 `{rounded.md}` 8px · 모달 `{rounded.xl}` 16px · 칩·배지·아바타 `{rounded.full}`.
버튼을 풀필로 하지 않는 것이 의도다 — 풀필은 소비자 앱(airbnb) 감성이고, 운영 도구는 8px가 따뜻함과 신뢰를 동시에 준다.

## Elevation
| 레벨 | 값 | 용도 |
|------|----|------|
| Flat | 없음 | 캔버스·테이블 행·대부분 |
| Card | `0 1px 2px rgba(42,46,34,0.06), 0 1px 3px rgba(42,46,34,0.05)` | 카드·패널·요약 카드 |
| Popover | `0 4px 12px rgba(42,46,34,0.10), 0 2px 4px rgba(42,46,34,0.06)` | 드롭다운·툴팁 |
| Modal | `0 16px 40px rgba(42,46,34,0.18), 0 4px 12px rgba(42,46,34,0.10)` | 모달 |

섀도 색을 순흑이 아닌 `ink`(#2A2E22) 틴트로 — 아이보리 위에서 따뜻하게 떨어진다.
**다크 테마는 섀도가 거의 안 보이므로 깊이를 surface 밝기 차 + border로** 준다(맹목 복제 금지 — 접근성 검증).

## Motion
duration `instant`90 / `fast`140 / `base`200 / `slow`260, easing `standard`(진입)·`emphasized`(모달)·`exit`(퇴장).
모션은 **피드백·연속성** 목적에만 — 행 호버(140), 드롭다운(200), 모달(260). 장식 애니메이션 없음.
`prefers-reduced-motion` 시 transform/opacity 외 모션 제거(접근성).

## Data Visualization (거의 없음 — 의도적 최소화, 신규 설계)
이 도구는 BI가 아니라 정산 기록이므로 차트를 만들지 않는다. **큰 숫자(요약 카드)와 테이블이 시각화를 대신한다.**
유일하게 허용하는 그래픽은 `progress-bar`(정산 진행률) 1종 — 트랙 `{colors.bar-track}` + 채움 `{colors.bar-fill}`(연두).
나중에 추이 차트가 필요해지면 `{colors.brand}` 단색 막대로 시작하고, 다색 팔레트는 데이터가 그것을 요구할 때만 추가한다.

## Accessibility (레퍼런스 값 맹목 복제 금지 — 검증 후 채택)
- **색 대비(WCAG AA 검증):** `brand`(#4E7327) 위 흰 글자 ≈ 5.5:1 ✓ / 아이보리 캔버스 위 `body`(#494F3E) ≈ 8:1 ✓ /
  `muted`(#686D5C) 위 캔버스 ≈ 4.9:1 ✓, 가장 어두운 표면(surface-sunken) 위 4.5:1 ✓(보조 텍스트 최저선 — 전 표면 통과).
  다크의 `brand`(#9CC65C) 위 어두운 글자 ≈ 8.5:1 ✓.
  `brand-spring`(#A7C957)은 대비가 낮아 **텍스트/흰글자에 쓰지 않는다**(장식·큰 면적만).
  `muted-soft`(플레이스홀더·비활성)는 대비 2.0~2.4:1로 **의도적 약화** — WCAG 1.4.3 비활성/플레이스홀더 예외 적용, 본문 텍스트에 사용 금지.
  상태색(warning #8A620B / error #AE412C / info #3A7081)은 각자 틴트 배경 위 ≥4.5:1로 조정 완료.
- **색에만 의존 금지:** 정산 상태는 색 + 라벨("정산완료") + 아이콘을 항상 함께. 금액 부호도 색 + `−`/`₩` 기호 병행.
- **포커스:** 모든 인터랙티브에 2px `{colors.focus-ring}` 링 + 2px offset. 시트 출신 사용자는 키보드 탭 이동이 잦다.
- **클릭 타깃:** 버튼 기본 40px, 밀도형 아이콘 버튼은 시각 32px이되 **히트영역 최소 40px**(WCAG 2.5.8 24px 상회).
- **모션 감소:** `prefers-reduced-motion` 존중.
- **숫자 가독:** tabular + 우측정렬로 자리수 비교 오류를 구조적으로 차단(정산 정확성 = 접근성의 일부).
