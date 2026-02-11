/**
 * 이미지 최적화 유틸리티
 * 
 * 1. Supabase Storage Transform URL: 서버사이드에서 용량만 줄이고 원본 비율(구도) 유지
 * 2. 클라이언트 압축: 업로드 전 이미지를 WebP로 변환하고 크기를 제한
 */

// ============================================================
// 1. Supabase Storage Image Transformation (표시용)
// ============================================================
// Supabase Storage URL 구조:
//   원본: /storage/v1/object/public/bucket/path
//   변환: /storage/v1/render/image/public/bucket/path?width=X&quality=Y
//
// ★ width만 지정하면 원본 비율을 유지한 채 크기만 줄어듭니다.
//   height나 resize:'cover'를 지정하면 강제 크롭이 발생하므로 사용하지 않습니다.

interface TransformOptions {
    width?: number
    quality?: number
}

/**
 * Supabase Storage URL에 이미지 변환 파라미터를 추가합니다.
 * width만 지정 → 원본 구도(비율) 유지, 용량만 줄임.
 * Supabase Pro 플랜에서만 작동. Free 플랜에서는 원본 URL을 그대로 반환.
 */
export function getOptimizedUrl(url: string, options: TransformOptions = {}): string {
    if (!url) return url

    const { width, quality = 75 } = options

    // Supabase Storage URL이 아닌 경우 원본 반환
    if (!url.includes('/storage/v1/object/public/')) {
        return url
    }

    const transformedUrl = url.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
    )

    const params = new URLSearchParams()
    if (width) params.set('width', width.toString())
    params.set('quality', quality.toString())

    return `${transformedUrl}?${params.toString()}`
}

/** 갤러리 썸네일용 (Works 페이지 그리드) */
export function getThumbnailUrl(url: string): string {
    return getOptimizedUrl(url, { width: 800, quality: 75 })
}

/** 카테고리 페이지, 중간 크기 */
export function getMediumUrl(url: string): string {
    return getOptimizedUrl(url, { width: 1200, quality: 80 })
}

/** 라이트박스, 히어로 슬라이더 등 대형 표시용 */
export function getFullUrl(url: string): string {
    return getOptimizedUrl(url, { width: 1920, quality: 85 })
}

/** 관리자 페이지 썸네일 (아주 작게) */
export function getAdminThumbUrl(url: string): string {
    return getOptimizedUrl(url, { width: 300, quality: 65 })
}


// ============================================================
// 2. Client-Side Image Compression (업로드용)
// ============================================================

/**
 * 이미지를 업로드 전에 클라이언트에서 압축합니다.
 * - 최대 폭/높이를 제한 (원본 비율 유지)
 * - WebP 포맷으로 변환 (용량 ~60% 절약)
 * - 품질 조정 가능
 * 
 * @param file - 원본 File 객체
 * @param maxDimension - 최대 허용 폭/높이 (기본: 2000px)
 * @param quality - WebP 품질 0~1 (기본: 0.82)
 * @returns 압축된 File 객체 (WebP)
 */
export async function compressImage(
    file: File,
    maxDimension: number = 2000,
    quality: number = 0.82
): Promise<File> {
    // 이미 작은 파일은 그대로 반환 (300KB 이하)
    if (file.size <= 300 * 1024) {
        return file
    }

    return new Promise((resolve) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img

                // 최대 크기 제한 (비율 유지 — 크롭 없음)
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width)
                        width = maxDimension
                    } else {
                        width = Math.round((width * maxDimension) / height)
                        height = maxDimension
                    }
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size < file.size) {
                            // 압축된 파일이 원본보다 작을 때만 사용
                            const ext = file.name.split('.').slice(0, -1).join('.')
                            const compressedFile = new File(
                                [blob],
                                `${ext}.webp`,
                                { type: 'image/webp', lastModified: Date.now() }
                            )
                            console.log(
                                `[이미지 최적화] ${file.name}: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (${Math.round((1 - compressedFile.size / file.size) * 100)}% 절약)`
                            )
                            resolve(compressedFile)
                        } else {
                            // 압축 효과가 없으면 원본 사용
                            resolve(file)
                        }
                    },
                    'image/webp',
                    quality
                )
            }
            img.src = e.target?.result as string
        }

        reader.readAsDataURL(file)
    })
}

/**
 * 여러 이미지 파일을 일괄 압축합니다.
 */
export async function compressImages(
    files: File[],
    maxDimension: number = 2000,
    quality: number = 0.82
): Promise<File[]> {
    return Promise.all(
        files.map(file => compressImage(file, maxDimension, quality))
    )
}

// 바이트 → 사람이 읽기 좋은 문자열
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
