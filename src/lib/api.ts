import { supabase } from './supabase'
import { compressImages } from './image-utils'

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

// ===== DB Row → 프론트엔드 타입 매핑 =====
function mapProject(row: any): Project {
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        year: row.year || '',
        image: row.image || '',
        images: row.images || [],
        description: row.description || '',
        isHero: row.is_hero,
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
    return data.map(mapProject)
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
    // 1. 이미지 업로드 전 압축 (WebP 변환 + 최대 2000px 리사이징)
    const compressedFiles = await compressImages(imageFiles)

    // 2. 압축된 이미지를 Supabase Storage에 업로드
    const imageUrls: string[] = []
    for (const file of compressedFiles) {
        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { data, error } = await supabase.storage
            .from('project-images')
            .upload(fileName, file)

        if (data && !error) {
            const { data: urlData } = supabase.storage
                .from('project-images')
                .getPublicUrl(data.path)
            imageUrls.push(urlData.publicUrl)
        }
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
    return mapProject(data)
}

export async function deleteProject(id: string): Promise<void> {
    // 1. 프로젝트 이미지 경로 조회
    const { data: project } = await supabase
        .from('projects')
        .select('images')
        .eq('id', id)
        .single()

    // 2. Storage에서 이미지 삭제
    if (project?.images && project.images.length > 0) {
        const filePaths = project.images
            .map((url: string) => {
                const parts = url.split('/project-images/')
                return parts.length > 1 ? parts[parts.length - 1] : ''
            })
            .filter(Boolean)

        if (filePaths.length > 0) {
            await supabase.storage.from('project-images').remove(filePaths)
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
        mainImageUrl?: string  // 최종 대표 이미지 URL (기존 또는 새로운 URL)
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
        // 1. 삭제할 이미지: Supabase Storage에서 제거
        if (options.removedImageUrls && options.removedImageUrls.length > 0) {
            const filePaths = options.removedImageUrls
                .map((url: string) => {
                    const parts = url.split('/project-images/')
                    return parts.length > 1 ? parts[parts.length - 1].split('?')[0] : ''
                })
                .filter(Boolean)

            if (filePaths.length > 0) {
                await supabase.storage.from('project-images').remove(filePaths)
            }
        }

        // 2. 새 이미지 업로드 (압축 후)
        const newImageUrls: string[] = []
        if (options.newImageFiles && options.newImageFiles.length > 0) {
            const compressedFiles = await compressImages(options.newImageFiles)
            for (const file of compressedFiles) {
                const ext = file.name.split('.').pop() || 'webp'
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project-images')
                    .upload(fileName, file)

                if (uploadData && !uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('project-images')
                        .getPublicUrl(uploadData.path)
                    newImageUrls.push(urlData.publicUrl)
                }
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
                // 대표 이미지가 삭제된 경우 첫 번째 이미지를 대표로
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
    return mapProject(result)
}

export async function toggleProjectHero(id: string): Promise<Project> {
    // 현재 값 조회 후 반전
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
    return mapProject(data)
}

// ===== Hero Slider =====

export async function getHeroItems(): Promise<HeroItem[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_hero', true)
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map(row => ({
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

// ===== Auth =====

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string }> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    })
    return res.json()
}
