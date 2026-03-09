-- ============================================
-- HANDSDAY - Supabase 초기 설정 SQL
-- ============================================
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

-- 1. projects 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'medical',
    year TEXT NOT NULL DEFAULT '2025',
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    images TEXT[] DEFAULT '{}',
    is_hero BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security 활성화
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. 공개 읽기 허용 (포트폴리오 사이트이므로 누구나 볼 수 있어야 함)
CREATE POLICY "Public read access" ON projects
    FOR SELECT USING (true);

-- 4. 인증된 사용자만 쓰기 허용 (Supabase Auth 로그인 필요)
CREATE POLICY "Authenticated insert access" ON projects
    FOR INSERT TO authenticated WITH CHECK (true);

-- 5. 인증된 사용자만 수정 허용
CREATE POLICY "Authenticated update access" ON projects
    FOR UPDATE TO authenticated USING (true);

-- 6. 인증된 사용자만 삭제 허용
CREATE POLICY "Authenticated delete access" ON projects
    FOR DELETE TO authenticated USING (true);

-- ============================================
-- 기존 공개 쓰기 정책 → 인증 전용 정책 마이그레이션
-- (이미 공개 정책이 있는 경우 아래를 실행하세요)
-- ============================================
-- DROP POLICY IF EXISTS "Public insert access" ON projects;
-- DROP POLICY IF EXISTS "Public update access" ON projects;
-- DROP POLICY IF EXISTS "Public delete access" ON projects;
-- 이후 위의 4~6번 정책을 다시 실행하세요.

-- ============================================
-- Storage 버킷은 SQL로 생성할 수 없습니다.
-- Supabase Dashboard > Storage 에서 수동 생성하세요:
--
-- 버킷 이름: project-images
-- Public bucket: ON (체크)
-- ============================================
