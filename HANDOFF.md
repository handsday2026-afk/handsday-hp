# HANDSDAY 프로젝트 핸드오프 문서

> 작성일: 2026-03-10
> 작성자: Claude (claude-sonnet-4-6)
> 목적: 작업 인계 — 다음 에이전트 또는 개발자가 바로 이어받을 수 있도록

---

## 현재 상태 요약

**코드 작업: 100% 완료** (모든 기능 구현 및 커밋됨)
**배포: 미완료** (git push 필요, 수동 설정 2건 대기 중)

---

## 완료된 작업 (코드)

### 이미지 최적화 시스템 (Phase 0)
- 업로드 시 4개 variant 자동 생성: `{id}.webp`, `{id}_md.webp`, `{id}_sm.webp`, `{id}_blur.webp`
- DB에는 원본 URL만 저장, suffix 치환으로 크기별 URL 추론
- `src/lib/image-utils.ts`: `getSmallUrl`, `getMediumUrl`, `getFullUrl`, `getBlurUrl`, `generateImageVariants`, `generateMissingVariants`
- AdminPage "이미지 최적화" 버튼: 기존 이미지 일괄 마이그레이션 (진행률 표시)

### 인증 시스템
- AdminPage 로그인: 비밀번호 입력 → `VITE_ADMIN_PASSWORD` 환경변수와 직접 비교
- 로그인 성공 시 `localStorage.setItem('admin_auth', '1')` → 새로고침 후에도 유지
- 로그아웃: `localStorage.removeItem('admin_auth')`
- Supabase Auth 미사용 (불필요한 복잡도 제거)

### 공통 컴포넌트
- `src/components/ui/lightbox.tsx`: WorksPage/CategoryPage 공용 라이트박스 (키보드 네비게이션)
- `src/components/ui/icons.tsx`: NaverIcon 공용 (Header/Footer)

### CSS-JS 상수 동기화
- `src/index.css` `:root`: `--hero-info-height: 180px`, `--hero-info-height-mobile: 140px`
- `argent-loop-infinite-slider.tsx`: `getInfoHeight()`로 CSS 변수 참조 (하드코딩 제거)

### 번들 최적화
- 모든 페이지 `React.lazy` + `Suspense` 동적 import
- 메인 청크: 1,528KB → 244KB (IntroPage 882KB로 분리)

### 보안/안정성
- `createTrackedUrl` 재귀 버그 수정
- `ProjectRow` 타입 명시로 `any` 제거
- `supabase-setup.sql` RLS 정책: SELECT 공개, INSERT/UPDATE/DELETE 인증된 사용자만

### 기타 정리
- `server/index.js`, `flip-reveal.tsx`, `reveal-wave-image.tsx` 삭제
- gsap, @gsap/react 의존성 제거
- 전체 TypeScript 타입 검사 통과

---

## 대기 중인 수동 작업 (필수)

### 1. Supabase 관리자 계정 생성
```
Supabase Dashboard (https://supabase.com/dashboard)
→ 프로젝트: fwjbwjhmlaqqizqluqpx
→ Authentication → Users → Add user
→ Email: 원하는 관리자 이메일 입력
→ Password: 원하는 비밀번호 입력
→ Auto Confirm User: ON (체크)
→ Create User
```
이메일을 기록해두세요. 다음 단계에서 사용합니다.

### 2. Supabase RLS 정책 적용 (기존 공개 정책 교체)
```
Supabase Dashboard → SQL Editor → 아래 SQL 실행:

DROP POLICY IF EXISTS "Public insert access" ON projects;
DROP POLICY IF EXISTS "Public update access" ON projects;
DROP POLICY IF EXISTS "Public delete access" ON projects;

CREATE POLICY "Authenticated insert access" ON projects
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update access" ON projects
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete access" ON projects
    FOR DELETE TO authenticated USING (true);
```
> 주의: SELECT 정책("Public read access")은 건드리지 마세요. 공개 읽기 유지 필요.

### 3. Vercel 환경변수 업데이트
```
Vercel Dashboard → handsday-hp 프로젝트 → Settings → Environment Variables
```

| 작업 | Key | Value |
|------|-----|-------|
| 이미 설정됨 ✅ | `VITE_SUPABASE_URL` | `https://fwjbwjhmlaqqizqluqpx.supabase.co` |
| 이미 설정됨 ✅ | `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| **추가 필요** ❌ | `VITE_ADMIN_PASSWORD` | 관리자 비밀번호 (로컬 `.env`와 동일하게) |
| 삭제 권장 | `ADMIN_PASSWORD` | 구버전 변수 (VITE_ 접두사 없음, 사용 안 함) |

### 5. Git Push → Vercel 자동 배포
```bash
git push origin main
```
GitHub 저장소: `handsday2026-afk/handsday-hp`
Vercel이 push 감지 후 자동 빌드/배포.

---

## 남은 장기 작업 (낮은 우선순위)

| 항목 | 설명 |
|------|------|
| AboutPage 이미지 교체 | 현재 Unsplash 임시 이미지 → 실제 스튜디오 사진으로 교체 (사진 준비 필요) |

---

## 주요 파일 경로

| 파일 | 역할 |
|------|------|
| `src/pages/AdminPage.tsx` | 관리자 대시보드 (인증, 프로젝트 CRUD, 이미지 마이그레이션) |
| `src/lib/api.ts` | Supabase CRUD + 이미지 variant 업로드/삭제/마이그레이션 |
| `src/lib/image-utils.ts` | 이미지 리사이즈/WebP 변환/suffix URL 유틸 |
| `src/lib/supabase.ts` | Supabase 클라이언트 초기화 |
| `src/components/ui/lightbox.tsx` | 공용 라이트박스 컴포넌트 |
| `src/components/ui/argent-loop-infinite-slider.tsx` | 메인 히어로 슬라이더 |
| `src/index.css` | CSS 커스텀 프로퍼티, 전역 스타일 |
| `supabase-setup.sql` | DB 초기화 및 RLS 정책 SQL |
| `plan.md` | 전체 구현 계획서 (모두 체크 완료) |
| `research.md` | 코드베이스 분석 결과 |

---

## 인프라 정보

| 항목 | 값 |
|------|-----|
| Supabase 프로젝트 ID | `fwjbwjhmlaqqizqluqpx` |
| Supabase Storage 버킷 | `project-images` (public) |
| Vercel 프로젝트 | `handsday-hp` |
| GitHub 저장소 | `handsday2026-afk/handsday-hp` |
| 브랜치 | `main` |

---

## 기술 스택

- React 19 + TypeScript + Vite 6
- Tailwind CSS v4
- Supabase (Free 플랜) — DB + Storage + Auth
- Vercel — 배포 (GitHub push 시 자동 배포)
- Three.js / React Three Fiber — IntroPage 3D 효과
