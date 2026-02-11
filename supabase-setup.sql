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

-- 4. 공개 쓰기 허용 (어드민 UI 게이트가 접근 제어 담당)
CREATE POLICY "Public insert access" ON projects
    FOR INSERT WITH CHECK (true);

-- 5. 공개 수정 허용
CREATE POLICY "Public update access" ON projects
    FOR UPDATE USING (true);

-- 6. 공개 삭제 허용
CREATE POLICY "Public delete access" ON projects
    FOR DELETE USING (true);

-- ============================================
-- Storage 버킷은 SQL로 생성할 수 없습니다.
-- Supabase Dashboard > Storage 에서 수동 생성하세요:
--
-- 버킷 이름: project-images
-- Public bucket: ON (체크)
-- ============================================
