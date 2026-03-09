import { useEffect, useState, useMemo, useCallback } from 'react'
import { getProjects, Project } from '@/lib/api'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChevronDown } from 'lucide-react'
import { AnimatedImage } from '@/components/ui/animated-image'
import { motion, AnimatePresence } from 'framer-motion'
import { getSmallUrl, getFullUrl, getBlurUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import { Lightbox, type LightboxState } from '@/components/ui/lightbox'

const ITEMS_PER_PAGE = 18

export default function WorksPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
    const [lightbox, setLightbox] = useState<LightboxState | null>(null)

    useEffect(() => {
        async function fetchProjects() {
            try {
                const data = await getProjects()
                setProjects(data)
            } catch (error) {
                console.error('Failed to fetch projects', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [])

    // 필터 변경 시 보이는 갯수 초기화
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE)
    }, [filter])

    // 1. 필터링 로직
    const filteredProjects = useMemo(() => {
        if (filter === 'all') return projects
        return projects.filter(p => p.category.toLowerCase() === filter)
    }, [projects, filter])

    // 2. "더 보기" 페이지네이션 적용 (보이는 데이터만 추출)
    const visibleProjects = useMemo(() => {
        return filteredProjects.slice(0, visibleCount)
    }, [filteredProjects, visibleCount])

    const hasMore = filteredProjects.length > visibleCount

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-charcoal">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-charcoal text-white">
            {/* 히어로 섹션 */}
            <div className="flex flex-col items-center justify-center pt-32 pb-16 px-6 relative z-10">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="font-display text-4xl md:text-5xl lg:text-6xl font-normal tracking-wide text-white text-center leading-tight mb-2"
                >
                    OUR<br />PROJECTS
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="mt-10 inline-flex max-w-[95vw] overflow-x-auto hide-scrollbar p-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-xl"
                >
                    <ToggleGroup
                        type="single"
                        value={filter}
                        onValueChange={(value) => value && setFilter(value)}
                        className="gap-1.5 min-w-max"
                    >
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'medical', label: 'Medical' },
                            { value: 'commercial', label: 'Commercial' },
                            { value: 'residence', label: 'Residence' },
                        ].map((item) => (
                            <ToggleGroupItem
                                key={item.value}
                                value={item.value}
                                className={cn(
                                    "px-4 md:px-6 py-2.5 rounded-full text-[10px] md:text-[11px] uppercase tracking-[2px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap",
                                    "text-white/40 hover:text-white hover:bg-white/5",
                                    "data-[state=on]:bg-white data-[state=on]:text-charcoal data-[state=on]:shadow-md data-[state=on]:font-bold"
                                )}
                            >
                                {item.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 text-[10px] uppercase tracking-[3px] text-white/30"
                >
                    {filteredProjects.length} Projects Found
                </motion.p>
            </div>

            {/* 메인 갤러리 그리드 */}
            <div className="px-4 md:px-8 lg:px-12 pb-24 min-h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-[1600px] mx-auto">
                    <AnimatePresence mode="popLayout">
                        {visibleProjects.map((project, index) => (
                            <motion.div
                                layout
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="w-full"
                            >
                                <div
                                    className="group cursor-pointer relative"
                                    onClick={() => openLightbox(project)}
                                >
                                    <div className="relative overflow-hidden rounded-sm bg-gray-900 aspect-[4/3]">
                                        <AnimatedImage
                                            src={getSmallUrl(project.image)}
                                            blurSrc={getBlurUrl(project.image)}
                                            alt={project.title}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                            ratio={4 / 3}
                                        />

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <p className="text-[10px] items-center gap-2 mb-1 hidden group-hover:flex text-gold tracking-widest uppercase font-semibold">
                                                <span>View Project</span>
                                            </p>
                                            <h3 className="text-lg md:text-xl font-medium text-white leading-tight mb-1 group-hover:text-gold transition-colors duration-300">
                                                {project.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-[11px] text-white/50 tracking-wider uppercase mt-1">
                                                <span>{project.category}</span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{project.year}</span>
                                            </div>
                                        </div>

                                        {project.images && project.images.length > 1 && (
                                            <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white/80 text-[10px] px-2 py-0.5 rounded-full tracking-wider border border-white/10">
                                                +{project.images.length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-32 text-white/30">
                        <p className="text-lg font-light">No projects found in this category.</p>
                    </div>
                )}

                {hasMore && (
                    <div className="flex justify-center mt-20">
                        <button
                            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                            className="group relative px-8 py-3 overflow-hidden rounded-full bg-transparent border border-white/20 text-white transition-all duration-300 hover:border-white/50 hover:bg-white/5"
                        >
                            <span className="relative z-10 flex items-center gap-2 text-xs uppercase tracking-[3px]">
                                Load More
                                <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform duration-300" />
                            </span>
                        </button>
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
