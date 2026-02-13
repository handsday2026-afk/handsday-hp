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
        <main className="min-h-screen pt-28 pb-20 px-8 bg-charcoal text-white">
            <div className="max-w-6xl mx-auto">
                <Link to="/works" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors uppercase tracking-widest">
                    <ArrowLeft size={16} /> Back to Works
                </Link>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 capitalize text-white">{category}</h1>
                <p className="text-white/60 text-lg mb-16">{CATEGORY_LABELS[category || ''] || ''}</p>

                {projects.length === 0 ? (
                    <div className="text-center py-32 text-white/30">
                        <p className="text-lg font-light mb-2">아직 등록된 프로젝트가 없습니다.</p>
                        <p className="text-sm">관리자 페이지에서 프로젝트를 추가해 주세요.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((p) => (
                            <div key={p.id} className="group cursor-pointer" onClick={() => openLightbox(p)}>
                                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-white/5 relative">
                                    <img src={getMediumUrl(p.image)} alt={p.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <p className="text-gold uppercase tracking-widest text-xs font-semibold px-4 py-2 border border-gold/30 rounded-full backdrop-blur-sm">View Project</p>
                                    </div>
                                </div>
                                <h3 className="mt-4 font-medium text-lg text-white group-hover:text-gold transition-colors">{p.title}</h3>
                                <p className="text-white/50 text-xs mt-1 uppercase tracking-wider">{p.category}</p>
                                {/* {p.images && p.images.length > 1 && (
                                    <p className="text-xs text-gold mt-1">📷 {p.images.length}장</p>
                                )} */}
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
