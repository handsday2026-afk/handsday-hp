import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { getProjects, type Project } from '@/lib/api'
import { getMediumUrl, getFullUrl, getSmallUrl } from '@/lib/image-utils'
import { ArrowLeft } from 'lucide-react'
import { Lightbox, type LightboxState } from '@/components/ui/lightbox'

const CATEGORY_LABELS: Record<string, string> = {
    medical: 'Medical · 병원 인테리어',
    commercial: 'Commercial · 상업 공간',
    residence: 'Residence · 주거 공간',
}

export default function CategoryPage() {
    const { category } = useParams<{ category: string }>()
    const [projects, setProjects] = useState<Project[]>([])
    const [lightbox, setLightbox] = useState<LightboxState | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (category) {
            const label = CATEGORY_LABELS[category] || category
            document.title = `${label} | HANDSDAY Interior Design`
            setLoading(true)
            getProjects(category)
                .then(setProjects)
                .catch(() => setProjects([]))
                .finally(() => setLoading(false))
        }
        setLightbox(null)
        return () => { document.title = 'HANDSDAY | Premium Interior Design Studio' }
    }, [category])

    const openLightbox = (project: Project) => {
        const rawImages = project.images?.length > 0 ? project.images : [project.image]
        const filtered = rawImages.filter(Boolean)
        setLightbox({
            images: filtered.map(getFullUrl),
            thumbs: filtered.map(getSmallUrl),
            title: project.title,
            index: 0,
        })
    }

    const handleLightboxClose = useCallback(() => setLightbox(null), [])
    const handleLightboxNavigate = useCallback((index: number) => {
        setLightbox(prev => prev ? { ...prev, index } : null)
    }, [])

    return (
        <main className="min-h-screen pt-28 pb-20 px-8 page-enter bg-charcoal text-white">
            <div className="max-w-6xl mx-auto">
                <Link to="/works" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors uppercase tracking-widest">
                    <ArrowLeft size={16} /> Back to Works
                </Link>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 capitalize text-white">{category}</h1>
                <p className="text-white/60 text-lg mb-16">{CATEGORY_LABELS[category || ''] || ''}</p>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-32 text-white/30">
                        <p className="text-lg font-light mb-2">아직 등록된 프로젝트가 없습니다.</p>
                        <p className="text-sm">관리자 페이지에서 프로젝트를 추가해 주세요.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((p) => (
                            <article key={p.id} className="group cursor-pointer" onClick={() => openLightbox(p)} aria-label={`${p.title}, ${p.category} 프로젝트`}>
                                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-white/5 relative">
                                    <img src={getMediumUrl(p.image)} alt={p.description ? `${p.title} - ${p.description}` : p.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <p className="text-gold uppercase tracking-widest text-xs font-semibold px-4 py-2 border border-gold/30 rounded-full backdrop-blur-sm">View Project</p>
                                    </div>
                                </div>
                                <h3 className="mt-4 font-medium text-lg text-white group-hover:text-gold transition-colors">{p.title}</h3>
                                <p className="text-white/50 text-xs mt-1 uppercase tracking-wider">{p.category}</p>
                                {p.description && (
                                    <p className="text-white/45 text-xs mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <Lightbox
                state={lightbox}
                onClose={handleLightboxClose}
                onNavigate={handleLightboxNavigate}
            />
        </main>
    )
}
