# Works 썸네일 Description 표시 & SEO 개선 계획서

> 작성일: 2026-03-26

## 현황 분석

### 현재 썸네일 오버레이 구조 (WorksPage.tsx:159-170)
```
[gradient overlay]
  "View Project"  ← hover 시만 보임
  [title]         ← 항상 보임, hover 시 gold 색상
  [category] [year] ← year는 hover 시만 보임
```

### 문제
- `description` 필드는 DB에 저장되고 fetch되지만 카드에서 전혀 표시 안 됨
- SEO 관점에서 이미지 alt text만으론 크롤러가 프로젝트 내용을 파악하기 어려움

---

## 구현 계획

### 변경 파일
1. `src/pages/WorksPage.tsx` — 메인 변경 대상
2. `src/pages/CategoryPage.tsx` — 같은 카드 패턴이면 동일 적용 (확인 후 결정)

---

### Phase 1: 썸네일에 description 표시

#### 디자인 방향: "항상 보이되, hover 시 선명하게"
- description을 기본 상태에서 희미하게(`text-white/40`) 표시 → hover 시 밝아짐(`text-white/65`)
- `display: none`이 아닌 opacity 기반 → Google 크롤러가 항상 텍스트 인식 가능
- `line-clamp-2`로 최대 2줄까지만 표시

#### overlay 변경 내용
```tsx
// 현재: gradient 높이 p-6 pt-12
// 변경: pt-16으로 늘려 description 공간 확보, gradient 어두움도 약간 강화

<div className="absolute inset-x-0 bottom-0
  bg-gradient-to-t from-black/85 via-black/45 to-transparent
  p-6 pt-16
  translate-y-2 group-hover:translate-y-0 transition-transform duration-300">

  <p className="... hidden group-hover:flex ...">View Project</p>
  <h3 ...>{project.title}</h3>
  <div className="flex items-center justify-between ...">
    <span>{project.category}</span>
    <span className="opacity-0 group-hover:opacity-100 ...">{project.year}</span>
  </div>

  {/* ↓ 신규 추가 */}
  {project.description && (
    <p className="text-[11px] text-white/40 group-hover:text-white/65
      line-clamp-2 leading-relaxed mt-2
      transition-colors duration-300">
      {project.description}
    </p>
  )}
</div>
```

#### 조건부 처리
- `{project.description && (...)}` — description이 없는 프로젝트는 빈 공간 없이 처리
- 기존 프로젝트들이 description 없어도 레이아웃 무너지지 않음

---

### Phase 2: 시맨틱 HTML 개선 (SEO)

#### 이미지 alt text 강화
```tsx
// 현재
alt={project.title}

// 변경: description이 있으면 포함
alt={project.description
  ? `${project.title} - ${project.description}`
  : project.title}
```
→ Google 이미지 검색에서 더 풍부한 컨텍스트 제공

#### 카드 래퍼를 시맨틱 태그로 변경
```tsx
// 현재: <div className="group cursor-pointer relative" onClick={...}>
// 변경:
<article
  className="group cursor-pointer relative"
  onClick={() => openLightbox(project)}
  aria-label={`${project.title}, ${project.category} 프로젝트`}
>
```
→ `<article>` 태그는 크롤러에게 "독립적인 콘텐츠 단위"임을 명시

---

### Phase 3: 페이지 메타 정보 개선 (선택적)

현재 Works 페이지에 `<title>`, `<meta name="description">` 설정 여부 확인 후 결정.
없다면 `document.title`을 동적으로 설정하거나 Vite의 index.html / vite-plugin-html 등으로 개선 가능.
→ 이 부분은 별도 이슈로 분리하거나 이번에 같이 다룰지 확인 필요.

---

## 예상 시각적 변화

### 기본 상태 (hover 없음)
```
┌─────────────────────────────┐
│                             │
│         [이미지]             │
│                             │
│─────────────────────────────│ ← gradient 시작
│  title                      │
│  MEDICAL              2026  │ ← year는 hover 시만
│  조은장내과 인테리어 시공을..  │ ← description (희미하게)
└─────────────────────────────┘
```

### hover 상태
```
┌─────────────────────────────┐
│                             │
│         [이미지] (scale 1.05)│
│                             │
│─────────────────────────────│
│  VIEW PROJECT               │
│  title (gold)               │
│  MEDICAL              2026  │ ← year 나타남
│  조은장내과 인테리어 시공을   │ ← description (선명하게)
│  위한 공간 설계...           │
└─────────────────────────────┘
```

---

## 트레이드오프

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 이미지 가시 영역 | 더 큼 | 오버레이가 약 15% 더 높아짐 |
| 텍스트 정보량 | title + category | + description (2줄) |
| SEO 인덱싱 | 제목/카테고리만 | 설명 텍스트까지 인덱싱 |
| description 없는 프로젝트 | 영향 없음 | 조건부 렌더링으로 영향 없음 |

---

## 변경 범위 요약

- **필수**: `WorksPage.tsx` overlay 수정 (description 추가 + gradient 조정)
- **권장**: alt text 강화, `<article>` 시맨틱 태그
- **선택**: CategoryPage.tsx 동일 적용 여부, 페이지 meta 태그 개선

---

## 승인 전 확인 사항

1. description을 "항상 희미하게 표시 + hover 시 선명"으로 하는 방향에 동의하시나요?
   (대안: hover 시에만 보이게 할 수도 있음)
2. CategoryPage에도 같은 변경을 적용할까요?
3. Phase 3 (페이지 meta 태그)를 이번 작업에 포함할까요?

---

# HANDSDAY 프로젝트 개선 계획서 (이전 내용)

> 작성일: 2026-03-09
> 기반: research.md 분석 결과
> 구현 완료일: 2026-03-09

---

## Phase 0: 이미지 최적화 (포트폴리오 핵심)

> Supabase Free 플랜 사용. Transform URL 불가 → 업로드 시점에 다중 크기 생성으로 해결.

### 전략: 업로드 시 다중 크기 WebP 생성
```
업로드 1장 → Storage에 4개 파일 생성:
├── {id}.webp          ← 원본 (2000px, q0.82) — 라이트박스, 히어로
├── {id}_md.webp       ← 중간 (1200px, q0.80) — 카테고리 페이지
├── {id}_sm.webp       ← 소형 (600px, q0.75)  — 갤러리 썸네일
└── {id}_blur.webp     ← 초소형 (20px, q0.50)  — LQIP 블러 플레이스홀더

DB images 컬럼: 원본 URL만 저장 → 표시 시 suffix로 크기별 URL 생성
  원본: /project-images/abc123.webp
  썸네일: /project-images/abc123_sm.webp (suffix 치환)
```

### 0.1 image-utils.ts 개편
- [x] `compressImage`를 다중 크기 생성 함수로 확장 → `generateImageVariants(file) → { original, md, sm, blur }`
- [x] 크기별 URL 생성 함수: `getSmallUrl(url)`, `getMediumUrl(url)`, `getFullUrl(url)` — suffix 기반으로 변경
- [x] `getBlurUrl(url)` 추가 — LQIP용 초소형 이미지 URL
- [x] 기존 Supabase Transform 의존 코드 제거 (`getOptimizedUrl` 등)

### 0.2 api.ts 업로드 로직 수정
- [x] `createProject`: 이미지당 4개 variant를 Storage에 업로드
- [x] `updateProject`: 새 이미지 추가 시 동일하게 4개 variant 생성
- [x] `deleteProject`: 이미지 삭제 시 4개 variant 모두 삭제
- [x] DB에는 원본 URL만 저장 (기존과 동일), variant는 suffix 규칙으로 추론
- [x] `mapProject(row: any)` → `ProjectRow` 타입 명시

### 0.3 표시 측 코드 수정
- [x] WorksPage 갤러리 썸네일: `getThumbnailUrl` → `getSmallUrl` (600px)
- [x] WorksPage 라이트박스 하단 썸네일: `getFullUrl` → `getSmallUrl`
- [x] CategoryPage: `getMediumUrl` 유지 (suffix 기반)
- [x] 라이트박스 alt 속성에 프로젝트 제목 반영

### 0.4 AnimatedImage 개선
- [x] `blurSrc` prop 추가 — 로딩 중 LQIP 블러 이미지를 배경으로 표시
- [x] `'use client'` 디렉티브 제거

### 0.5 기존 이미지 마이그레이션
- [x] 관리자 페이지에 "이미지 최적화" 버튼 추가 (진행률 표시)
- [x] `generateMissingVariants()` — URL에서 이미지 로드하여 _md, _sm, _blur variant 생성
- [x] `migrateExistingImages()` — 전체 프로젝트 일괄 마이그레이션 (중복 건너뛰기)

---

## Phase 1: Critical 수정 (보안 및 안정성)

### 1.1 AdminPage 인증 강화
- [x] Supabase Auth (email/password) 기반 인증으로 전환
- [x] `supabase.auth.signInWithPassword` / `signOut` / `onAuthStateChange` 사용
- [x] Vercel serverless 로그인 함수 (`api/auth/login.js`) 삭제
- [x] `adminLogin` 함수 제거, localStorage 토큰 방식 폐기
- [x] `createTrackedUrl` 재귀 호출 버그 수정

### 1.2 타입 안전성 확보
- [x] `api.ts`에 `ProjectRow` 인터페이스 정의
- [x] `mapProject(row: any)` → `mapProject(row: ProjectRow)`
- [x] `reveal-wave-video.tsx`의 `VideoPlane`, `RevealWaveVideo` props 타입 정의
- [x] 프로젝트 전체 `tsc --noEmit` 통과 확인

### 1.3 슬라이더 성능 최적화
- [x] `setActiveIndex` 호출을 값 변경 시에만 실행 (`lastIndexRef` 비교)

---

## Phase 2: High 우선순위 개선

### 2.1 코드 중복 제거
- [x] `NaverIcon` → `src/components/ui/icons.tsx`로 분리, Header/Footer에서 import

### 2.2 에러/로딩 처리 보강
- [x] CategoryPage에 로딩 스피너 및 에러 처리 추가

### 2.3 메모리 누수 수정
- [x] AdminPage `URL.createObjectURL` → `createTrackedUrl`로 추적, unmount 시 cleanup

### 2.4 CSS 클래스 불일치 수정
- [x] `scrollbar-hide` → `hide-scrollbar`로 통일

### 2.5 레거시 코드 정리
- [x] `server/index.js` 삭제

---

## Phase 3: Medium 우선순위 개선

### 3.1 데드 코드 제거
- [x] `flip-reveal.tsx` 삭제
- [x] `reveal-wave-image.tsx` 삭제
- [x] gsap, @gsap/react 의존성 제거
- [x] 5개 파일에서 `'use client'` 디렉티브 제거

### 3.2 컴포넌트 네이밍 개선
- [x] `export function Component()` → `HeroSlider`로 변경
- [x] HomePage.tsx의 import 정리

### 3.3 접근성(a11y) 개선
- [x] 라이트박스 이미지 `alt` 속성에 프로젝트 제목 반영
- [x] Header 드롭다운 키보드 접근성 (onFocus/onBlur 추가)
- [x] 모바일 메뉴 열림 시 body 스크롤 잠금
- [x] `<ul>` 내부 `<div>` → `<li>`로 변경

### 3.4 소소한 버그 수정
- [x] RequestPage Fax `href="tel:..."` → 링크 없는 div로 변경
- [x] CategoryPage 주석 처리된 이모지 코드 삭제
- [x] AdminPage 이모지 직접 사용 제거

---

## Phase 4: Low 우선순위 (코드 품질)

### 4.1 프로덕션 준비
- [x] `console.log` 제거 (image-utils.ts 전면 개편으로 해결)
- [x] `console.warn` 이모지 제거 (supabase.ts)

### 4.2 코드 정리
- [x] WorksPage 설계 고민 주석 정리
- [x] `body { color: charcoal }` → `color: bone` 수정

### 4.3 아키텍처 개선
- [x] App.tsx `isTransparent` 조건 → `TRANSPARENT_PATHS` 배열로 관리

---

## 추가 구현 항목 (2차)

### 5.1 AdminPage 인증 강화
- [x] Supabase Auth (email/password) 전환 (Phase 1.1에서 완료)

### 5.2 기존 이미지 마이그레이션
- [x] 관리자 페이지 "이미지 최적화" 버튼 + 진행률 표시 (Phase 0.5에서 완료)

### 5.3 라이트박스 공통 컴포넌트 추출
- [x] `src/components/ui/lightbox.tsx` — 공통 Lightbox 컴포넌트 (키보드 네비게이션 포함)
- [x] WorksPage/CategoryPage에서 공통 Lightbox 사용

### 5.4 CSS-JS 상수 동기화
- [x] `--hero-info-height` / `--hero-info-height-mobile` CSS 커스텀 프로퍼티 도입
- [x] 슬라이더 JS에서 `getInfoHeight()` + resize 리스너로 CSS 변수 참조

---

## 미구현 항목 (향후 작업)

| 항목 | 이유 |
|---|---|
| AboutPage Unsplash 이미지 교체 | 실제 스튜디오 이미지 준비 필요 |
| Supabase RLS 정책 추가 | 인증 사용자만 프로젝트 CRUD 가능하도록 DB 레벨 보안 |
| 번들 코드 스플리팅 | 현재 1.5MB 단일 청크, 동적 import로 분할 가능 |
