# HANDSDAY Interior Studio — Design Document

## 1. 프로젝트 개요

인테리어 디자인 회사 **HANDSDAY**의 공식 홈페이지.
병언(Medical), 상업공간(Commercial), 주거(Residence) 포트폴리오를 갤러리 중심으로 보여주며, 관리자 페이지에서 콘텐츠를 직접 관리한다.

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|:---|:---|:---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS v4 | |
| Animation | Framer Motion, GSAP (Carousel 등) | |
| Backend/DB | Supabase (PostgreSQL + Realtime) | 로컬 서버에서 전환 |
| Storage | Supabase Storage | 이미지 멀티 업로드 및 저장 |
| Image Optimization | WebP (Client-side), Supabase Transform URL | 대역폭 최적화 |
| UI Components | Radix UI (AspectRatio), Lucide Icons | |

---

## 3. 디자인 시스템

### 색상 팔레트

| 토큰 | 값 | 용도 |
|:---|:---|:---|
| `--color-charcoal` | `#2C2C2C` | 주요 텍스트, CTA 배경, 다크 모드 배경 |
| `--color-bone` | `#F9F9F9` | 라이트 배경 |
| `--color-gold` | `#D4AF37` | 포인트, 액센트 |
| `--color-warm-gray` | `#888888` | 보조 텍스트 |

### 타이포그래피

- **Display**: Playfair Display (serif) — 제목, 로고
- **Body**: Montserrat (sans-serif) — 본문, 네비게이션

---

## 4. 페이지 구조 & 라우팅

```
/                → HomePage        히어로 패럴랙스 슬라이더 (풀스크린)
/works           → WorksPage       통합 프로젝트 갤러리 (필터링 + 페이지네이션)
/works/:category → CategoryPage    카테고리별 아카이브 (별도 상세 보기)
/about           → AboutPage       회사 소개, 철학, 통계
/request         → RequestPage     연락 채널 안내 (카톡, 이메일, 팩스, 전화)
/contact         → ContactPage     주소, 연락처, 구글맵
/admin           → AdminPage       관리자 대시보드 (프로젝트/히어로 관리)
```

---

## 5. 핵심 기능 및 컴포넌트

### 5.1 통합 Works 갤러리 (`WorksPage.tsx`)

- **Masonry Grid**: CSS Grid를 활용한 세련된 배치
- **동적 필터링**: All, Medical, Commercial, Residence 필터 (Framer Motion 애니메이션)
- **페이지네이션**: 항목당 18개 표시, 'Load More' 버튼 방식
- **반응형 최적화**: 모바일 가로 스크롤 필터 메뉴, 간격 조정

### 5.2 이미지 라이트박스 (`WorksPage.tsx`, `CategoryPage.tsx`)

- **멀티 이미지 네비게이션**: 상단 이미지 + 하단 썸네일 리스트
- **고해상도 로딩**: `getFullUrl`을 통한 1920px 최적화 이미지 로드
- **모션**: Framer Motion을 이용한 부드러운 Fade/Scale 전환

### 5.3 이미지 최적화 파이프라인 (`image-utils.ts`)

- **Client-side Compression**: 업로드 전 이미지를 2000px(Max) WebP로 압축하여 대용량 파일 업로드 방지
- **On-the-fly Transformation**: 용도에 맞게 Supabase 서버에서 리사이징
  - `getThumbnailUrl`: 800px (그리드용)
  - `getMediumUrl`: 1200px (카테고리형)
  - `getFullUrl`: 1920px (라이트박스/히어로용)

---

## 6. 관리자 페이지 (`/admin`)

### 인증

- `localStorage` 관리자 토큰 기반 로그인

### 기능

- **프로젝트 등록**: 멀티 이미지 업로드, 개별 압축 처리
- **프로젝트 편집 (강화)**:
  - 텍스트 정보 (제목, 설명 등) 수정
  - **이미지 관리**: 기존 이미지 삭제, 신규 이미지 추가, 대표 이미지(Main) 별점 버튼으로 즉시 변경
- **히어로 관리**: 메인 슬라이더 노출 여부 원클릭 토글

---

## 7. 주요 파일 구조 (Update)

```
handsday/
├── src/
│   ├── lib/
│   │   ├── supabase.ts       Supabase 클라이언트 설정
│   │   ├── api.ts            CRUD API 로직 (Supabase 연동)
│   │   └── image-utils.ts    이미지 압축 및 Transform 유틸리티
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx    투명 헤더 로직 포함
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── animated-image.tsx  In-view 애니메이션 이미지
│   │       ├── aspect-ratio.tsx    비율 유지 컨테이너
│   │       └── toggle-group.tsx    필터 UI 컴포넌트
│   └── pages/
│       ├── WorksPage.tsx     리뉴얼된 통합 갤러리
│       └── AdminPage.tsx     이미지 편집 기능이 포함된 관리자
```

---

## 8. 메모 및 특이사항

- 모든 이미지는 원본 비율을 유지하며, 썸네일 그리드에서만 4:3 `aspect-ratio`를 적용한다.
- 모바일 필터 메뉴에서 잘림 현상 방지를 위해 `overflow-x-auto`와 `hide-scrollbar`를 적용했다.
- 이미지 업로드 시 브라우저에서 1차 압축을 진행하므로 서버 용량을 효율적으로 관리한다.
