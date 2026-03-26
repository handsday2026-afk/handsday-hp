# 플랜 B: 시놀로지 NAS 셀프호스팅 계획

> 작성일: 2026-03-26
> 근거: nas-hosting-guide.md (damha 프로젝트 실운영 기록 기반)
> 현재 운영 방식(Vercel + Supabase Cloud)을 유지하면서, 향후 완전 자체 호스팅으로 이전하기 위한 계획서

---

## NAS 환경 (확인된 실제 값)

| 항목 | 값 |
|------|----|
| 모델 | Synology DS1821+ (AMD Ryzen V1500B) |
| 로컬 IP | `192.168.0.252` (DHCP 예약 고정) |
| 공인 IP | `106.246.205.74` (유동 — 변경 가능) |
| SSH | `ssh coolk@192.168.0.252` |
| Docker | 24.0.2 (Container Manager) |
| SCP | `scp -O` (레거시 모드 필수) |

### 포트 현황

| 포트 | 용도 |
|------|------|
| 80, 443 | DSM nginx (리버스 프록시) |
| 3000 | node_rank-nextjs (점유 중) |
| 3001 | damha-web (점유 중) |
| **3002** | **handsday (예정)** |

---

## 현재 → 목표 아키텍처

```
현재:
수요일.kr → Vercel (SPA) → Supabase Cloud (DB + Storage)

목표:
수요일.kr (DNS A → 106.246.205.74)
    │ HTTPS (443)
    ▼
공유기 포트포워딩 → 192.168.0.252
    │
    ▼
DSM 리버스 프록시 (내장 nginx)
    ├─ 수요일.kr  → localhost:3002 (nginx 컨테이너)
    └─ api.수요일.kr → localhost:8000 (Supabase Kong)
    │
    ▼
┌─ nginx:3002 ── dist/ (Vite 빌드 결과물 정적 서빙)
└─ Supabase Self-hosted (Docker Compose)
       ├─ Kong (API Gateway) :8000
       ├─ PostgreSQL :5432
       ├─ Storage API
       ├─ Auth (GoTrue)
       └─ PostgREST
```

> **Next.js(damha)와 달리 Vite SPA는 Docker 빌드 불필요.**
> `npm run build` → `dist/` → nginx 정적 서빙. 훨씬 단순.

---

## NAS 디렉토리 구조

```
/volume1/docker/handsday/
├── dist/              ← Vite 빌드 결과물 (배포 시 업로드)
├── nginx.conf         ← SPA 라우팅 설정 (try_files)
├── .env               ← 환경변수 (git 외부 관리, chmod 600)
└── deploy.sh          ← 재배포 스크립트

/volume1/docker/supabase/   ← Supabase 셀프호스팅 별도 관리
├── docker-compose.yml
└── .env
```

---

## nginx.conf (SPA 라우팅 필수)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # React Router 대응 — 모든 경로를 index.html로
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|webp|png|jpg|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> `vercel.json`의 rewrites 역할을 nginx가 대신함.

---

## 배포 방식 (damha와 동일 — 방식 A)

```
git push origin main          # Mac → GitHub
ssh coolk@192.168.0.252 "cd /volume1/docker/handsday && ./deploy.sh"
```

### deploy.sh

```bash
#!/bin/bash
set -e

APP_DIR="/volume1/docker/handsday"

echo "[1/3] dist 업로드는 로컬에서 scp로..."
# (Mac에서 실행: scp -O -r dist/ coolk@192.168.0.252:/volume1/docker/handsday/dist/)

echo "[2/3] nginx 컨테이너 재시작..."
docker stop handsday 2>/dev/null && docker rm handsday 2>/dev/null || true

docker run -d \
  --name handsday \
  --restart always \
  -p 3002:80 \
  -v "$APP_DIR/dist:/usr/share/nginx/html:ro" \
  -v "$APP_DIR/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine

echo "[3/3] 응답 확인..."
sleep 3
curl -sf http://localhost:3002 > /dev/null \
  && echo "OK: 정상 응답" \
  || echo "WARN: 응답 없음 — docker logs handsday 확인"

docker ps | grep handsday
```

### Mac에서 배포 명령어

```bash
# 1. 빌드
npm run build

# 2. NAS에 업로드
scp -O -r dist/ coolk@192.168.0.252:/volume1/docker/handsday/dist/

# 3. 컨테이너 재시작
ssh coolk@192.168.0.252 "/volume1/docker/handsday/deploy.sh"
```

---

## Supabase 셀프호스팅 설정

공식 가이드: https://supabase.com/docs/guides/self-hosting/docker

```bash
# NAS SSH 접속 후
cd /volume1/docker/supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# .env에서 JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY 등 변경
docker compose up -d
```

Kong API가 `:8000`으로 뜨면 기존 Supabase Cloud와 동일한 인터페이스 제공.

---

## 마이그레이션 순서 (실행 시점에)

```
Step 1. NAS에 Supabase 셀프호스팅 구동 확인
Step 2. Supabase Cloud DB 덤프
        → supabase db dump (Supabase CLI)
        → NAS PostgreSQL에 restore

Step 3. Supabase Storage 이미지 다운로드
        → project-images 버킷 전체
        → NAS Storage에 업로드

Step 4. .env 값 교체 (코드 변경 없음)
        VITE_SUPABASE_URL=https://수요일.kr:8000  (또는 서브도메인)
        VITE_SUPABASE_ANON_KEY=[NAS Supabase anon key]

Step 5. npm run build → scp → NAS nginx 재시작

Step 6. DNS A 레코드 → 106.246.205.74 (NAS 공인 IP)
```

---

## DSM 리버스 프록시 설정

DSM → 제어판 → 로그인 포털 → 고급 → 리버스 프록시 → 생성

| 항목 | 값 |
|------|----|
| 소스 프로토콜 | HTTPS |
| 소스 호스트명 | `수요일.kr` |
| 소스 포트 | 443 |
| 대상 프로토콜 | HTTP |
| 대상 호스트명 | `localhost` |
| 대상 포트 | `3002` |

---

## SSL 인증서

DSM → 제어판 → 보안 → 인증서 → 추가 → Let's Encrypt

> **순서 중요**: DNS A 레코드를 NAS IP로 변경한 후 SSL 발급

---

## DNS 설정 (카페24 기준)

| 레코드 | 호스트 | 값 |
|--------|--------|----|
| A | `@` (apex) | `106.246.205.74` |

> 공인 IP 확인: `ssh coolk@192.168.0.252 "curl -s https://ifconfig.me"`
> 유동 IP이므로 변경 시 DNS 업데이트 필요 — DDNS 설정 권장

---

## 알려진 이슈 (nas-hosting-guide.md 기반)

| 이슈 | 해결 |
|------|------|
| `scp` 연결 오류 | `scp -O` (레거시 프로토콜) 사용 |
| `docker.sock` 권한 초기화 | NAS 작업 스케줄러 → 부팅 시: `chown root:docker /var/run/docker.sock` |
| 502 Bad Gateway | 컨테이너 정상 확인 후 리버스 프록시 설정 |
| 공인 IP 변경 | `curl -s https://ifconfig.me` 로 확인 후 DNS 업데이트 |

---

## 현재 Supabase 정보 (마이그레이션 시 필요)

| 항목 | 값 |
|------|----|
| 프로젝트 ID | `fwjbwjhmlaqqizqluqpx` |
| 스토리지 버킷 | `project-images` |
| DB 테이블 | `projects` |
| Vercel 프로젝트 | `handsday-hp` (GitHub: handsday2026-afk/handsday-hp) |
