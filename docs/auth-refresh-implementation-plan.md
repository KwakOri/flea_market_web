# 인증 세션 Refresh 구현 계획

## 목표

Access token이 만료되어도 유효한 refresh session이 남아 있으면 사용자의 작업을
중단하지 않고 인증을 복구한다. Web의 중복 refresh 요청과 API의 refresh token
회전 경쟁 조건을 방지하고, 세션의 서버 만료 시각과 브라우저 쿠키 만료 시각을
일치시킨다.

## 현재 상태

- API는 `POST /auth/refresh`를 제공한다.
- Access token 기본 TTL은 15분이고 refresh session 기본 TTL은 30일이다.
- API는 refresh token 원문 대신 SHA-256 hash를 `user_sessions`에 저장한다.
- API는 refresh할 때 새 refresh token을 발급하지만 세션 조회와 hash 교체가 별도
  쿼리여서 동시 요청 경쟁 조건이 있다.
- Web은 `login`, `logout`, `me`만 호출하며 401 응답 후 refresh를 시도하지 않는다.
- Web의 JSON 요청과 파일 다운로드는 별도 fetch 경로를 사용한다.
- Auth refresh 전용 회귀 테스트가 없다.

## 결정 사항

### Web

- 사전 타이머가 아닌 401 기반 reactive refresh를 사용한다.
- refresh는 React Query hook이 아니라 services HTTP 계층에서 처리한다.
- 같은 탭의 동시 401은 하나의 in-flight refresh Promise를 공유한다.
- 원래 요청은 refresh 성공 후 최대 한 번만 재시도한다.
- `login`과 `refresh` 요청은 자동 refresh 대상에서 제외한다.
- `me` 요청과 파일 다운로드는 자동 refresh 대상에 포함한다.
- refresh가 최종 실패하면 인증 만료 이벤트를 발생시키고 React Query cache를
  비워 기존 Dashboard redirect 흐름이 로그인 화면으로 이동하게 한다.
- 401은 React Query가 별도로 반복 재시도하지 않는다.

### API

- refresh token 회전은 기존 hash, `revoked_at`, `expires_at`을 조건으로 한 단일
  compare-and-swap update로 처리한다.
- 조건에 맞는 세션이 정확히 하나일 때만 새 access/refresh 쿠키를 발급한다.
- Session은 로그인 시점부터 30일의 절대 만료 정책을 유지한다.
- Refresh cookie의 `maxAge`는 DB `expires_at`까지 남은 시간으로 설정한다.
- 만료, 폐기, 사용자 삭제 또는 로그인 불가 상태는 terminal refresh failure로
  처리하고 인증 쿠키를 제거한다.

## 구현 순서

1. Web API client에 공통 fetch, single-flight refresh, 한 번 재시도를 구현한다.
2. JSON 요청과 다운로드 요청을 공통 인증 복구 흐름에 연결한다.
3. 인증 만료 이벤트와 QueryClient cache 정리를 연결한다.
4. API refresh 로직을 조건부 단일 update로 변경한다.
5. API cookie 발급 함수가 session 만료까지 남은 TTL을 받을 수 있게 변경한다.
6. Web lint/build와 API lint/test/build를 실행한다.

## 검증 시나리오

1. 만료된 access token과 유효한 refresh token으로 원래 요청이 성공한다.
2. 여러 요청이 동시에 401을 받아도 refresh는 한 번만 호출된다.
3. 잘못된 로그인 401은 refresh를 호출하지 않는다.
4. refresh 실패는 재귀 호출 없이 인증 cache를 정리한다.
5. `/auth/me`는 refresh 후 사용자를 복구한다.
6. PDF 다운로드는 refresh 후 한 번 재시도하여 정상 파일을 반환한다.
7. 만료되거나 폐기된 session은 401과 cookie 제거로 종료된다.
8. Refresh token 회전 update가 실패하면 새 쿠키를 발급하지 않는다.
9. Refresh cookie 만료가 DB session 만료보다 길어지지 않는다.

## 리스크와 후속 범위

- 모듈 수준 single-flight는 같은 탭의 중복 요청을 해결한다. 다중 탭 refresh 직렬화가
  필요하면 Web Locks API 기반 조정을 후속으로 추가한다.
- API 응답의 안정적인 machine-readable auth error code는 이번 핵심 구현 이후 별도
  개선할 수 있다.
- Web에 테스트 러너가 없으므로 이번 변경은 lint/build와 수동 통합 시나리오를
  기본 검증으로 사용한다. 테스트 도구 의존성 추가는 별도 변경으로 분리한다.

## 완료 기준

- Web에서 access token 만료가 사용자 작업 중단으로 이어지지 않는다.
- Refresh 실패 시 무한 재시도나 stale 사용자 화면이 남지 않는다.
- API refresh token 회전이 단일 조건부 update로 보호된다.
- 세션과 쿠키 만료 정책이 일치한다.
- 두 저장소의 기존 lint, test, build가 통과한다.
