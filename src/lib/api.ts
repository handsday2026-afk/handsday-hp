import { supabase } from './supabase'
import { generateAllVariants, generateMissingVariants, VARIANT_SUFFIXES } from './image-utils'

// ===== 타입 정의 =====
export interface Project {
    id: string
    title: string
    category: string
    year: string
    image: string
    images: string[]
    description: string
    isHero?: boolean
    createdAt: string
}

export interface HeroItem {
    id: string
    title: string
    category: string
    year: string
    description: string
    image: string
    projectId?: string
    createdAt: string
}

// ===== DB Row 타입 =====
interface ProjectRow {
    id: string
    title: string
    category: string
    year: string | null
    image: string | null
    images: string[] | null
    description: string | null
    is_hero: boolean | null
    created_at: string
}

// ===== DB Row → 프론트엔드 타입 매핑 =====
function mapProject(row: ProjectRow): Project {
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        year: row.year || '',
        image: row.image || '',
        images: row.images || [],
        description: row.description || '',
        isHero: !!row.is_hero,
        createdAt: row.created_at,
    }
}

// ===== Projects CRUD =====

export async function getProjects(category?: string): Promise<Project[]> {
    let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    if (category) {
        query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error || !data) return []
    return (data as ProjectRow[]).map(mapProject)
}

/**
 * 이미지 파일 1장에 대해 4개 variant를 Supabase Storage에 업로드하고
 * 원본 URL을 반환한다.
 */
async function uploadImageVariants(variantFiles: Map<string, File>, baseName: string): Promise<string> {
    let originalUrl = ''

    for (const [suffix, file] of variantFiles) {
        const fileName = `${baseName}${suffix}.webp`
        const { data, error } = await supabase.storage
            .from('project-images')
            .upload(fileName, file)

        if (data && !error && suffix === '') {
            const { data: urlData } = supabase.storage
                .from('project-images')
                .getPublicUrl(data.path)
            originalUrl = urlData.publicUrl
        }
    }

    return originalUrl
}

export async function createProject(
    projectData: {
        title: string
        category: string
        year: string
        description: string
        isHero: boolean
        mainImageIndex: number
    },
    imageFiles: File[]
): Promise<Project> {
    // 1. 다중 크기 variant 생성
    const allVariants = await generateAllVariants(imageFiles)

    // 2. 모든 variant를 Supabase Storage에 업로드
    const imageUrls: string[] = []
    for (const variants of allVariants) {
        const url = await uploadImageVariants(variants.files, variants.baseName)
        if (url) imageUrls.push(url)
    }

    // 3. 대표 이미지 설정
    const mainImage = imageUrls[projectData.mainImageIndex] || imageUrls[0] || ''

    // 4. DB에 삽입
    const { data, error } = await supabase
        .from('projects')
        .insert({
            title: projectData.title,
            category: projectData.category,
            year: projectData.year,
            description: projectData.description,
            image: mainImage,
            images: imageUrls,
            is_hero: projectData.isHero,
        })
        .select()
        .single()

    if (error || !data) throw new Error('프로젝트 등록 실패')
    return mapProject(data as ProjectRow)
}

/**
 * URL에서 Storage 파일 경로(baseName)를 추출한다.
 * 예: .../project-images/1710000000-abc123.webp → 1710000000-abc123
 */
function extractBaseName(url: string): string {
    const parts = url.split('/project-images/')
    if (parts.length < 2) return ''
    const fileName = parts[parts.length - 1].split('?')[0] // query string 제거
    const dotIdx = fileName.lastIndexOf('.')
    return dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName
}

/**
 * 원본 URL 하나에 대해 모든 variant 파일 경로를 생성한다.
 */
function getVariantPaths(url: string): string[] {
    const baseName = extractBaseName(url)
    if (!baseName) return []
    return VARIANT_SUFFIXES.map(suffix => `${baseName}${suffix}.webp`)
}

export async function deleteProject(id: string): Promise<void> {
    // 1. 프로젝트 이미지 경로 조회
    const { data: project } = await supabase
        .from('projects')
        .select('images')
        .eq('id', id)
        .single()

    // 2. Storage에서 모든 variant 삭제
    if (project?.images && project.images.length > 0) {
        const allPaths = (project.images as string[]).flatMap(getVariantPaths).filter(Boolean)
        if (allPaths.length > 0) {
            await supabase.storage.from('project-images').remove(allPaths)
        }
    }

    // 3. DB에서 삭제
    await supabase.from('projects').delete().eq('id', id)
}

export async function updateProject(
    id: string,
    data: Partial<Project>,
    options?: {
        removedImageUrls?: string[]
        newImageFiles?: File[]
        mainImageUrl?: string
    }
): Promise<Project> {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.category !== undefined) updateData.category = data.category
    if (data.year !== undefined) updateData.year = data.year
    if (data.description !== undefined) updateData.description = data.description
    if (data.isHero !== undefined) updateData.is_hero = data.isHero

    // === 이미지 수정 처리 ===
    if (options) {
        // 1. 삭제할 이미지: 모든 variant를 Storage에서 제거
        if (options.removedImageUrls && options.removedImageUrls.length > 0) {
            const allPaths = options.removedImageUrls.flatMap(getVariantPaths).filter(Boolean)
            if (allPaths.length > 0) {
                await supabase.storage.from('project-images').remove(allPaths)
            }
        }

        // 2. 새 이미지 업로드 (다중 크기 variant 생성)
        const newImageUrls: string[] = []
        if (options.newImageFiles && options.newImageFiles.length > 0) {
            const allVariants = await generateAllVariants(options.newImageFiles)
            for (const variants of allVariants) {
                const url = await uploadImageVariants(variants.files, variants.baseName)
                if (url) newImageUrls.push(url)
            }
        }

        // 3. 현재 프로젝트의 이미지 목록 조회
        const { data: current } = await supabase
            .from('projects')
            .select('images, image')
            .eq('id', id)
            .single()

        if (current) {
            const currentImages: string[] = current.images || []
            const removedSet = new Set(options.removedImageUrls || [])

            // 남은 이미지 + 새 이미지
            const finalImages = [
                ...currentImages.filter((url: string) => !removedSet.has(url)),
                ...newImageUrls
            ]

            updateData.images = finalImages

            // 4. 대표 이미지 설정
            if (options.mainImageUrl) {
                updateData.image = options.mainImageUrl
            } else if (removedSet.has(current.image) && finalImages.length > 0) {
                updateData.image = finalImages[0]
            } else if (finalImages.length === 0) {
                updateData.image = ''
            }
        }
    }

    const { data: result, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error || !result) throw new Error('프로젝트 수정 실패')
    return mapProject(result as ProjectRow)
}

export async function toggleProjectHero(id: string): Promise<Project> {
    const { data: current } = await supabase
        .from('projects')
        .select('is_hero')
        .eq('id', id)
        .single()

    const { data, error } = await supabase
        .from('projects')
        .update({ is_hero: !current?.is_hero })
        .eq('id', id)
        .select()
        .single()

    if (error || !data) throw new Error('히어로 토글 실패')
    return mapProject(data as ProjectRow)
}

// ===== Hero Slider =====

export async function getHeroItems(): Promise<HeroItem[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_hero', true)
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as ProjectRow[]).map(row => ({
        id: row.id,
        title: row.title,
        category: row.category,
        year: row.year || '',
        description: row.description || '',
        image: row.image || '',
        projectId: row.id,
        createdAt: row.created_at,
    }))
}

// ===== 이미지 마이그레이션 =====

export interface MigrationProgress {
    total: number
    current: number
    currentTitle: string
}

/**
 * 기존 프로젝트의 원본 이미지에서 _md, _sm, _blur variant를 일괄 생성한다.
 * onProgress 콜백으로 진행 상황을 보고한다.
 */
export async function migrateExistingImages(
    onProgress?: (progress: MigrationProgress) => void
): Promise<{ migrated: number; skipped: number; failed: number }> {
    const projects = await getProjects()
    const allImages: { url: string; title: string }[] = []

    for (const p of projects) {
        const images = p.images?.length > 0 ? p.images : (p.image ? [p.image] : [])
        for (const url of images) {
            if (url) allImages.push({ url, title: p.title })
        }
    }

    let migrated = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < allImages.length; i++) {
        const { url, title } = allImages[i]
        onProgress?.({ total: allImages.length, current: i + 1, currentTitle: title })

        const baseName = extractBaseName(url)
        if (!baseName) { skipped++; continue }

        // _sm variant가 이미 존재하는지 확인
        const smPath = `${baseName}_sm.webp`
        const { data: existing } = await supabase.storage
            .from('project-images')
            .list('', { search: smPath })

        if (existing && existing.length > 0) {
            skipped++
            continue
        }

        try {
            const variantFiles = await generateMissingVariants(url, baseName)
            for (const [suffix, file] of variantFiles) {
                const fileName = `${baseName}${suffix}.webp`
                await supabase.storage
                    .from('project-images')
                    .upload(fileName, file, { upsert: true })
            }
            migrated++
        } catch {
            failed++
        }
    }

    return { migrated, skipped, failed }
}
