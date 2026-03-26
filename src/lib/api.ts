import { pb } from './pocketbase'
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
    created: string
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
        createdAt: row.created,
    }
}

// ===== Projects CRUD =====

export async function getProjects(category?: string): Promise<Project[]> {
    const filter = category ? `category = "${category}"` : ''
    const records = await pb.collection('projects').getFullList<ProjectRow>({
        sort: '-created',
        filter,
    })
    return records.map(mapProject)
}

/**
 * 이미지 4개 variant를 PocketBase project_images 컬렉션에 업로드하고
 * 원본 파일의 공개 URL을 반환한다.
 */
async function uploadImageVariants(variantFiles: Map<string, File>, baseName: string): Promise<string> {
    const formData = new FormData()
    formData.append('base_name', baseName)

    for (const [suffix, file] of variantFiles) {
        const fieldName = suffix === '' ? 'original' : suffix.replace('_', '')
        formData.append(fieldName, file)
    }

    const record = await pb.collection('project_images').create(formData)

    // 원본 파일의 공개 URL 반환
    const originalFile = record['original'] as string
    if (!originalFile) return ''
    return pb.files.getURL(record, originalFile)
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

    // 2. 모든 variant를 PocketBase Storage에 업로드
    const imageUrls: string[] = []
    for (const variants of allVariants) {
        const url = await uploadImageVariants(variants.files, variants.baseName)
        if (url) imageUrls.push(url)
    }

    // 3. 대표 이미지 설정
    const mainImage = imageUrls[projectData.mainImageIndex] || imageUrls[0] || ''

    // 4. DB에 삽입
    const record = await pb.collection('projects').create<ProjectRow>({
        title: projectData.title,
        category: projectData.category,
        year: projectData.year,
        description: projectData.description,
        image: mainImage,
        images: imageUrls,
        is_hero: projectData.isHero,
    })

    return mapProject(record)
}

/**
 * URL에서 project_images record ID와 파일명(baseName)을 추출한다.
 * PocketBase URL 패턴: {pb_url}/api/files/project_images/{recordId}/{baseName}.webp
 */
function extractImageInfo(url: string): { recordId: string; baseName: string } | null {
    const match = url.match(/\/api\/files\/project_images\/([^/]+)\/([^/?]+)\.webp/)
    if (!match) return null
    const dotIdx = match[2].lastIndexOf('.')
    const baseName = dotIdx > 0 ? match[2].slice(0, dotIdx) : match[2]
    return { recordId: match[1], baseName }
}

/**
 * 원본 URL 하나에 대해 project_images record ID를 반환한다.
 * (삭제 시 record 전체를 지우면 variant 4개가 모두 삭제됨)
 */
function getRecordId(url: string): string {
    const info = extractImageInfo(url)
    return info?.recordId || ''
}

export async function deleteProject(id: string): Promise<void> {
    // 1. 프로젝트 이미지 record ID 조회
    const project = await pb.collection('projects').getOne<ProjectRow>(id)

    // 2. project_images 레코드 삭제 (variant 4개 자동 삭제)
    if (project?.images && project.images.length > 0) {
        const recordIds = [...new Set((project.images as string[]).map(getRecordId).filter(Boolean))]
        await Promise.all(recordIds.map(rid => pb.collection('project_images').delete(rid).catch(() => null)))
    }

    // 3. DB에서 삭제
    await pb.collection('projects').delete(id)
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
        // 1. 삭제할 이미지: project_images 레코드 삭제
        if (options.removedImageUrls && options.removedImageUrls.length > 0) {
            const recordIds = [...new Set(options.removedImageUrls.map(getRecordId).filter(Boolean))]
            await Promise.all(recordIds.map(rid => pb.collection('project_images').delete(rid).catch(() => null)))
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
        const current = await pb.collection('projects').getOne<ProjectRow>(id)

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
            } else if (removedSet.has(current.image || '') && finalImages.length > 0) {
                updateData.image = finalImages[0]
            } else if (finalImages.length === 0) {
                updateData.image = ''
            }
        }
    }

    const record = await pb.collection('projects').update<ProjectRow>(id, updateData)
    return mapProject(record)
}

export async function toggleProjectHero(id: string): Promise<Project> {
    const current = await pb.collection('projects').getOne<ProjectRow>(id)
    const record = await pb.collection('projects').update<ProjectRow>(id, {
        is_hero: !current?.is_hero,
    })
    return mapProject(record)
}

// ===== Hero Slider =====

export async function getHeroItems(): Promise<HeroItem[]> {
    const records = await pb.collection('projects').getFullList<ProjectRow>({
        filter: 'is_hero = true',
        sort: '-created',
    })
    return records.map(row => ({
        id: row.id,
        title: row.title,
        category: row.category,
        year: row.year || '',
        description: row.description || '',
        image: row.image || '',
        projectId: row.id,
        createdAt: row.created,
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

        const info = extractImageInfo(url)
        if (!info) { skipped++; continue }

        // sm variant가 이미 존재하는지 확인 (record의 sm 필드 확인)
        try {
            const record = await pb.collection('project_images').getOne(info.recordId)
            if (record['sm']) { skipped++; continue }

            const variantFiles = await generateMissingVariants(url, info.baseName)
            const formData = new FormData()
            for (const [suffix, file] of variantFiles) {
                const fieldName = suffix.replace('_', '')
                formData.append(fieldName, file)
            }
            await pb.collection('project_images').update(info.recordId, formData)
            migrated++
        } catch {
            failed++
        }
    }

    return { migrated, skipped, failed }
}

// ===== 하위 호환: VARIANT_SUFFIXES 재export =====
export { VARIANT_SUFFIXES }
