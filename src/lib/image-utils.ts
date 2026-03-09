/**
 * 이미지 최적화 유틸리티
 *
 * Supabase Free 플랜 사용 → Transform URL 불가.
 * 업로드 시점에 다중 크기 WebP를 생성하고, 표시 시 suffix 기반으로 URL을 결정한다.
 *
 * 파일 네이밍 규칙:
 *   {id}.webp       ← 원본 (2000px, q0.82) — 라이트박스, 히어로
 *   {id}_md.webp     ← 중간 (1200px, q0.80) — 카테고리 페이지
 *   {id}_sm.webp     ← 소형 (600px, q0.75)  — 갤러리 썸네일
 *   {id}_blur.webp   ← 초소형 (20px, q0.50)  — LQIP 블러 플레이스홀더
 */

// ============================================================
// 1. Suffix 기반 URL 생성 (표시용)
// ============================================================

/** 원본 URL에서 suffix variant URL을 생성한다. */
function addSuffix(url: string, suffix: string): string {
    if (!url) return url
    const dotIdx = url.lastIndexOf('.')
    if (dotIdx === -1) return url
    return `${url.slice(0, dotIdx)}${suffix}${url.slice(dotIdx)}`
}

/** 갤러리 썸네일용 (Works 페이지 그리드) — 600px */
export function getSmallUrl(url: string): string {
    return addSuffix(url, '_sm')
}

/** 카테고리 페이지, 중간 크기 — 1200px */
export function getMediumUrl(url: string): string {
    return addSuffix(url, '_md')
}

/** 라이트박스, 히어로 슬라이더 등 대형 표시용 — 원본 그대로 */
export function getFullUrl(url: string): string {
    return url
}

/** 관리자 페이지 썸네일 — 소형과 동일 */
export function getAdminThumbUrl(url: string): string {
    return addSuffix(url, '_sm')
}

/** LQIP 블러 플레이스홀더용 — 20px 초소형 */
export function getBlurUrl(url: string): string {
    return addSuffix(url, '_blur')
}

// ============================================================
// 2. Client-Side Image Compression & Multi-Size Generation
// ============================================================

interface ImageVariant {
    suffix: string
    maxDimension: number
    quality: number
}

const VARIANTS: ImageVariant[] = [
    { suffix: '',      maxDimension: 2000, quality: 0.82 },
    { suffix: '_md',   maxDimension: 1200, quality: 0.80 },
    { suffix: '_sm',   maxDimension: 600,  quality: 0.75 },
    { suffix: '_blur', maxDimension: 20,   quality: 0.50 },
]

function resizeToWebP(
    img: HTMLImageElement,
    maxDimension: number,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

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

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas 2D context unavailable'))
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob)
                else reject(new Error('toBlob returned null'))
            },
            'image/webp',
            quality
        )
    })
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()
        reader.onload = (e) => {
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = e.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export interface GeneratedVariants {
    /** suffix → File (suffix: '', '_md', '_sm', '_blur') */
    files: Map<string, File>
    /** 기본 파일명 (확장자 제외, 예: '1710000000-abc123') */
    baseName: string
}

/**
 * 1장의 이미지에서 4개의 크기 variant를 생성한다.
 */
export async function generateImageVariants(file: File): Promise<GeneratedVariants> {
    const img = await loadImage(file)
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const files = new Map<string, File>()

    for (const variant of VARIANTS) {
        const blob = await resizeToWebP(img, variant.maxDimension, variant.quality)
        const fileName = `${baseName}${variant.suffix}.webp`
        const variantFile = new File([blob], fileName, {
            type: 'image/webp',
            lastModified: Date.now(),
        })
        files.set(variant.suffix, variantFile)
    }

    return { files, baseName }
}

/**
 * 여러 이미지 파일을 일괄로 variant 생성한다.
 */
export async function generateAllVariants(files: File[]): Promise<GeneratedVariants[]> {
    return Promise.all(files.map(file => generateImageVariants(file)))
}

/** variant suffix 목록 (삭제 시 사용) */
export const VARIANT_SUFFIXES = ['', '_md', '_sm', '_blur']

// ============================================================
// 3. 기존 이미지 마이그레이션 (URL → variant 생성)
// ============================================================

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

/**
 * 기존 원본 URL 이미지를 로드하여 _md, _sm, _blur variant만 생성한다.
 * (원본은 이미 존재하므로 생성하지 않음)
 */
export async function generateMissingVariants(
    url: string,
    baseName: string
): Promise<Map<string, File>> {
    const img = await loadImageFromUrl(url)
    const files = new Map<string, File>()

    // 원본('')은 이미 존재하므로 _md, _sm, _blur만 생성
    for (const variant of VARIANTS) {
        if (variant.suffix === '') continue
        const blob = await resizeToWebP(img, variant.maxDimension, variant.quality)
        const fileName = `${baseName}${variant.suffix}.webp`
        const variantFile = new File([blob], fileName, {
            type: 'image/webp',
            lastModified: Date.now(),
        })
        files.set(variant.suffix, variantFile)
    }

    return files
}
