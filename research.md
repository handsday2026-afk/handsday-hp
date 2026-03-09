# HANDSDAY 프로젝트 현황 분석 (Research)

## 프로젝트 개요
부산 기반 인테리어 스튜디오 HANDSDAY 포트폴리오 웹사이트.
React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Supabase 스택.

## 페이지 구조
- IntroPage → HomePage(히어로 슬라이더) → Works/Category/About/Request/Contact/Admin

## 발견된 이슈 (우선순위별)

### Critical
1. **AdminPage 인증 취약점**: localStorage 존재 여부만으로 인증 판단. API 요청 시 토큰 미전송. 서버 측 인증 검증 사실상 없음.
2. **`any` 타입 다수 사용**: `reveal-wave-video.tsx`의 `VideoPlane`, `api.ts`의 `mapProject(row: any)` 등 타입 안전성 부재.
3. **rAF 매 프레임 setState**: `argent-loop-infinite-slider.tsx`에서 `setActiveIndex`가 매 프레임 호출 — 불필요한 리렌더링.

### High
4. **NaverIcon 컴포넌트 중복**: Header.tsx와 Footer.tsx에 동일 코드 복제.
5. **URL.createObjectURL 메모리 누수**: AdminPage에서 생성 후 cleanup 없음.
6. **CategoryPage 에러/로딩 처리 없음**: 네트워크 실패 시 빈 화면.
7. **scrollbar-hide vs hide-scrollbar 클래스명 불일치**: WorksPage에서 미정의 클래스 사용.
8. **CSS-JS 상수 동기화 문제**: 슬라이더 `CONFIG.INFO_HEIGHT=180`과 CSS `180px` 하드코딩.
9. **server/index.js 레거시 코드**: Supabase 전환 후 사용되지 않으나 프로젝트에 존재.
10. **라이트박스 로직 중복**: WorksPage와 CategoryPage에서 동일한 라이트박스 구현.

### Medium
11. **데드 코드**: `flip-reveal.tsx`(미사용), `reveal-wave-image.tsx`(미사용) — gsap 의존성 제거 가능.
12. **`'use client'` 디렉티브**: Vite+React에서 불필요, 5개 파일에 존재.
13. **컴포넌트 export 이름 `Component`**: argent-loop-infinite-slider.tsx의 export명이 무의미.
14. **Fax 링크**: RequestPage에서 fax 번호에 `tel:` 프로토콜 사용.
15. **AboutPage 외부 이미지**: Unsplash URL 하드코딩, 실제 이미지 교체 필요.
16. **접근성**: 라이트박스 이미지 alt 빈 값, 드롭다운 키보드 접근 불가, 모바일 메뉴 body 스크롤 미잠금.

### Low
17. **console.log/warn 프로덕션 제거 필요**: image-utils.ts, supabase.ts.
18. **주석 정리**: WorksPage 설계 고민 주석, CategoryPage 주석 처리된 이모지 코드.
19. **body 색상 설정 혼란**: background와 text 모두 charcoal.
20. **워크플로우 파일**: 미구현 도구 참조, 실행 불가능한 템플릿.
21. **vite.config.ts 내 인라인 auth 미들웨어**: 관심사 분리 부족.
22. **기본 비밀번호 'admin123'**: vite.config.ts와 server/index.js에 하드코딩.
