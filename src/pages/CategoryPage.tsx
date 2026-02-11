import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getProjects, type Project } from '@/lib/api'
import { getMediumUrl, getFullUrl } from '@/lib/image-utils'
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    medical: 'Medical · 병원 인테리어',
    commercial: 'Commercial · 상업 공간',
    residence: 'Residence · 주거 공간',
}

export default function CategoryPage() {
    const { category } = useParams<{ category: string }>()
    const [projects, setProjects] = useState<Project[]>([])
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

    useEffect(() => {
        if (category) getProjects(category).then(setProjects)
        setLightbox(null)
    }, [category])

    const openLightbox = (project: Project, imgIndex: number = 0) => {
        const images = project.images?.length > 0 ? project.images : [project.image]
        setLightbox({ images: images.filter(Boolean).map(getFullUrl), index: imgIndex })
    }

    const navLightbox = (dir: number) => {
        if (!lightbox) return
        const newIndex = (lightbox.index + dir + lightbox.images.length) % lightbox.images.length
        setLightbox({ ...lightbox, index: newIndex })
    }

    return (
        <main className="pt-28 pb-20 px-8 page-enter">
            <div className="max-w-6xl mx-auto">
                <Link to="/works" className="inline-flex items-center gap-2 text-warm-gray hover:text-charcoal text-sm mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Works
                </Link>
                <h1 className="font-display text-5xl font-bold mb-2 capitalize">{category}</h1>
                <p className="text-warm-gray text-lg mb-12">{CATEGORY_LABELS[category || ''] || ''}</p>

                {projects.length === 0 ? (
                    <div className="text-center py-20 text-warm-gray">
                        <p className="text-lg mb-2">아직 등록된 프로젝트가 없습니다.</p>
                        <p className="text-sm">관리자 페이지에서 프로젝트를 추가해 주세요.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map((p) => (
                            <div key={p.id} className="group cursor-pointer" onClick={() => openLightbox(p)}>
                                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-gray-200">
                                    <img src={getMediumUrl(p.image)} alt={p.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <h3 className="mt-3 font-medium text-sm">{p.title}</h3>
                                <p className="text-warm-gray text-xs">{p.description}</p>
                                {p.images && p.images.length > 1 && (
                                    <p className="text-xs text-gold mt-1">📷 {p.images.length}장</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox with multi-image navigation */}
            {lightbox && (
                <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4"
                    onClick={() => setLightbox(null)}>
                    <button onClick={(e) => { e.stopPropagation(); setLightbox(null) }}
                        className="absolute top-4 right-6 text-white/60 hover:text-white transition-colors cursor-pointer z-[110]">
                        <X size={28} />
                    </button>

                    <div className="relative flex items-center justify-center w-full max-w-5xl"
                        onClick={e => e.stopPropagation()}>
                        {lightbox.images.length > 1 && (
                            <button onClick={() => navLightbox(-1)}
                                className="absolute left-2 text-white/50 hover:text-white transition-colors cursor-pointer z-10">
                                <ChevronLeft size={40} />
                            </button>
                        )}

                        <img src={lightbox.images[lightbox.index]} alt=""
                            className="max-w-full max-h-[85vh] object-contain rounded" />

                        {lightbox.images.length > 1 && (
                            <button onClick={() => navLightbox(1)}
                                className="absolute right-2 text-white/50 hover:text-white transition-colors cursor-pointer z-10">
                                <ChevronRight size={40} />
                            </button>
                        )}
                    </div>

                    {lightbox.images.length > 1 && (
                        <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                            {lightbox.images.map((img, i) => (
                                <button key={i} onClick={() => setLightbox({ ...lightbox, index: i })}
                                    className={`w-14 h-10 rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${i === lightbox.index ? 'border-gold opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
