import { useEffect, useState, useMemo } from 'react'
import { getProjects, Project } from '@/lib/api'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react'
import { AnimatedImage } from '@/components/ui/animated-image'
import { motion, AnimatePresence } from 'framer-motion'
import { getThumbnailUrl, getFullUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 18

export default function WorksPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

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

    // 3. Masonry Layout을 위한 데이터 분할 (3개의 컬럼)
    // 모바일에서는 1열, 태블릿 2열, 데스크탑 3열로 보여주기 위해 CSS Grid를 사용하되, 
    // 순서대로 채워지는 느낌을 주기 위해 데이터 자체는 그대로 두고 CSS로 제어하거나,
    // JS로 나누어 렌더링하고 flex-col로 쌓을 수 있음. 
    // 여기서는 반응형 처리를 위해 단순 Grid + AnimatedImage 조합을 사용하되, 
    // Masonry 느낌(높이가 다름)을 내려면 flex-col로 3개의 컬럼을 렌더링하는 게 좋음.
    // 하지만 현재 이미지 비율 정보를 모르므로 4:3 고정 비율을 사용하면 그냥 Grid가 가장 깔끔함.
    // 사용자가 제공한 코드는 Masonry 스타일(세로가 긴 이미지 섞임)이었음.
    // 우선 깔끔한 갤러리를 위해 Grid로 구현하고, 추후 비율 정보가 생기면 Masonry로 변경 추천.

    // 라이트박스 열기
    const openLightbox = (project: Project, imgIndex: number = 0) => {
        const images = project.images?.length > 0 ? project.images : [project.image]
        // 라이트박스에서는 고해상도 이미지 사용
        setLightbox({ images: images.filter(Boolean).map(getFullUrl), index: imgIndex })
    }

    // 라이트박스 네비게이션
    const navLightbox = (dir: number) => {
        if (!lightbox) return
        const newIndex = (lightbox.index + dir + lightbox.images.length) % lightbox.images.length
        setLightbox({ ...lightbox, index: newIndex })
    }

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
                    className="mt-10 inline-flex p-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-xl"
                >
                    <ToggleGroup
                        type="single"
                        value={filter}
                        onValueChange={(value) => value && setFilter(value)}
                        className="gap-1.5"
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
                                    "px-6 py-2.5 rounded-full text-[11px] uppercase tracking-[2px] font-medium transition-all duration-300 cursor-pointer",
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

            {/* 메인 갤러리 그리드 (Masonry 느낌의 3열 그리드이나, 비율은 4:3으로 통일) */}
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
                                transition={{ duration: 0.4, delay: index * 0.05 }} // 순차적으로 나타나는 효과
                                className="w-full"
                            >
                                <div
                                    className="group cursor-pointer relative"
                                    onClick={() => openLightbox(project)}
                                >
                                    {/* 이미지 컨테이너 (AspectRatio 대신 AnimatedImage 사용) */}
                                    <div className="relative overflow-hidden rounded-sm bg-gray-900 aspect-[4/3]">
                                        <AnimatedImage
                                            src={getThumbnailUrl(project.image)}
                                            alt={project.title}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                            ratio={4 / 3}
                                        />

                                        {/* 텍스트 오버레이 (하단 그라데이션) */}
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

                                        {/* 이미지 갯수 뱃지 */}
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

                {/* 데이터가 없을 때 */}
                {filteredProjects.length === 0 && (
                    <div className="text-center py-32 text-white/30">
                        <p className="text-lg font-light">No projects found in this category.</p>
                    </div>
                )}

                {/* 더 보기 버튼 (하단 중앙) */}
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

            {/* 라이트박스 */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setLightbox(null)}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightbox(null) }}
                            className="absolute top-6 right-8 text-white/50 hover:text-white transition-colors cursor-pointer z-[110] p-2 hover:bg-white/10 rounded-full"
                        >
                            <X size={24} />
                        </button>

                        <div
                            className="relative flex items-center justify-center w-full h-full max-w-7xl px-4"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 이전 버튼 */}
                            {lightbox.images.length > 1 && (
                                <button
                                    onClick={() => navLightbox(-1)}
                                    className="absolute left-4 md:left-8 text-white/30 hover:text-white transition-all cursor-pointer z-10 p-3 hover:bg-white/5 rounded-full"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                            )}

                            {/* 메인 이미지 */}
                            <motion.img
                                key={lightbox.images[lightbox.index]}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                src={lightbox.images[lightbox.index]}
                                alt=""
                                className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
                            />

                            {/* 다음 버튼 */}
                            {lightbox.images.length > 1 && (
                                <button
                                    onClick={() => navLightbox(1)}
                                    className="absolute right-4 md:right-8 text-white/30 hover:text-white transition-all cursor-pointer z-10 p-3 hover:bg-white/5 rounded-full"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            )}
                        </div>

                        {/* 썸네일 네비게이션 (하단) */}
                        {lightbox.images.length > 1 && (
                            <div
                                className="flex gap-2 mt-6 pb-4 overflow-x-auto max-w-full px-4 scrollbar-hide"
                                onClick={e => e.stopPropagation()}
                            >
                                {lightbox.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setLightbox({ ...lightbox, index: i })}
                                        className={cn(
                                            "relative flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all duration-300 cursor-pointer",
                                            i === lightbox.index
                                                ? "ring-2 ring-gold opacity-100 scale-105"
                                                : "opacity-40 hover:opacity-80 grayscale hover:grayscale-0"
                                        )}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
