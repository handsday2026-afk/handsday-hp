# HANDSDAY Interior Studio — Design Document

## 1. 프로젝트 개요

인테리어 디자인 회사 **HANDSDAY**의 공식 홈페이지.
병원(Medical), 상업공간(Commercial), 주거(Residence) 포트폴리오를 갤러리 중심으로 보여주며, 관리자 페이지에서 콘텐츠를 직접 관리한다.

---

## 2. 기술 스택

| 영역 | 기술 |
|:---|:---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js + Express.js |
| 상태관리 | React useState/useEffect (서버 fetch) |
| 파일 업로드 | multer (최대 50MB) |
| 데이터 저장 | JSON 파일 (`server/data/projects.json`, `hero.json`) |
| 라우팅 | react-router-dom v6 |
| 아이콘 | lucide-react |

---

## 3. 디자인 시스템

### 색상 팔레트

| 토큰 | 값 | 용도 |
|:---|:---|:---|
| `--color-charcoal` | `#2C2C2C` | 주요 텍스트, CTA 배경 |
| `--color-bone` | `#F9F9F9` | 페이지 배경 |
| `--color-gold` | `#D4AF37` | 포인트, 액센트 |
| `--color-warm-gray` | `#888888` | 보조 텍스트 |

### 타이포그래피

- **Display**: Playfair Display (serif) — 제목, 로고
- **Body**: Montserrat (sans-serif) — 본문, 네비게이션

---

## 4. 페이지 구조 & 라우팅

```
/                → HomePage        히어로 패럴랙스 슬라이더 (풀스크린)
/works           → WorksPage       카테고리 3개 카드 (Medical, Commercial, Residence)
/works/:category → CategoryPage    프로젝트 그리드 + 멀티이미지 라이트박스
/about           → AboutPage       회사 소개, 철학, 통계
/request         → RequestPage     연락 채널 안내 (카톡, 이메일, 팩스, 전화)
/contact         → ContactPage     주소, 연락처, 구글맵 (부산 동래구)
/admin           → AdminPage       관리자 대시보드 (비밀번호 보호)
```

---

## 5. 핵심 컴포넌트

### 5.1 히어로 슬라이더 (`argent-loop-infinite-slider.tsx`)

- 풀스크린 패럴랙스 무한 스크롤
- API에서 동적 로드 (`GET /api/hero`), 없으면 폴백 데이터 사용
- 하단 중앙 가로 정보 패널: 번호 + 제목 + 카테고리/연도 + 썸네일

### 5.2 헤더 (`Header.tsx`)

- 홈에서는 투명, 서브페이지에서는 반투명 blur
- Works 메뉴: hover 시 서브메뉴 드롭다운 (Medical/Commercial/Residence)
- 모바일 햄버거 메뉴 지원

### 5.3 라이트박스 (`CategoryPage.tsx` 내장)

- 멀티 이미지 좌우 네비게이션 + 하단 썸네일
- 외부 클릭 시 닫힘, ESC 닫기
- 헤더 아래 영역에 배치 (`top-[70px]`)
- 라우트 변경 시 자동 닫힘

### 5.4 푸터 (`Footer.tsx`)

- 회사 정보, 네비게이션 링크, 연락처

---

## 6. 관리자 페이지 (`/admin`)

### 인증

- 비밀번호: 환경변수 `ADMIN_PASSWORD` (기본: `admin123`)
- localStorage 토큰 기반

### 탭 구조

| 탭 | 기능 |
|:---|:---|
| 히어로 슬라이더 | 메인 히어로 이미지/정보 추가·삭제 |
| Works 프로젝트 | 카테고리별 프로젝트 등록 (멀티 이미지 업로드), 삭제 |

### 페이지네이션

- 각 탭 리스트 **5개씩** 표시
- `< 1 2 3 >` 페이지 네비게이션

---

## 7. API 엔드포인트

| Method | Path | 설명 |
|:---|:---|:---|
| POST | `/api/auth/login` | 관리자 로그인 |
| GET | `/api/projects?category=` | 프로젝트 목록 (카테고리 필터 선택) |
| POST | `/api/projects` | 프로젝트 등록 (멀티 이미지 `images[]`) |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |
| GET | `/api/hero` | 히어로 슬라이더 목록 |
| POST | `/api/hero` | 히어로 아이템 등록 (이미지 1장) |
| DELETE | `/api/hero/:id` | 히어로 아이템 삭제 |

---

## 8. 연락처 정보

| 채널 | 값 |
|:---|:---|
| 주소 | 부산광역시 동래구 석사북로 31, 2F (사직동) |
| KakaoTalk | @handsday |
| Email | <handsday@naver.com> |
| Fax | 0504.060.2606 |
| Tel | 070.4076.0248 |
| 영업시간 | 월–금 09:00 ~ 18:00 |

---

## 9. 개발 명령어

```bash
# 프론트엔드 + 백엔드 동시 실행
npm run dev

# 프론트엔드만
npx vite          # http://localhost:5173

# 백엔드만
node server/index.js   # http://localhost:3001
```

---

## 10. 파일 구조

```
handsday/
├── server/
│   ├── index.js              Express API 서버
│   ├── data/
│   │   ├── projects.json     프로젝트 DB
│   │   └── hero.json         히어로 슬라이더 DB
│   └── uploads/              업로드된 이미지
├── src/
│   ├── App.tsx               라우팅 설정
│   ├── main.tsx              진입점
│   ├── index.css             전역 스타일 + 디자인 토큰
│   ├── lib/
│   │   └── api.ts            API 클라이언트 함수
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx    네비게이션 헤더
│   │   │   └── Footer.tsx    사이트 푸터
│   │   └── ui/
│   │       └── argent-loop-infinite-slider.tsx  히어로 슬라이더
│   └── pages/
│       ├── HomePage.tsx      메인 (히어로 슬라이더)
│       ├── WorksPage.tsx     카테고리 선택
│       ├── CategoryPage.tsx  프로젝트 그리드 + 라이트박스
│       ├── AboutPage.tsx     회사 소개
│       ├── RequestPage.tsx   프로젝트 문의 (연락 채널)
│       ├── ContactPage.tsx   오시는 길 + 구글맵
│       └── AdminPage.tsx     관리자 대시보드
└── DESIGN.md                 ← 이 문서
```
