import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEffect, useCallback } from 'react'

export interface LightboxState {
    images: string[]
    thumbs: string[]
    title: string
    index: number
}

interface LightboxProps {
    state: LightboxState | null
    onClose: () => void
    onNavigate: (index: number) => void
}

export function Lightbox({ state, onClose, onNavigate }: LightboxProps) {
    const nav = useCallback((dir: number) => {
        if (!state) return
        const newIndex = (state.index + dir + state.images.length) % state.images.length
        onNavigate(newIndex)
    }, [state, onNavigate])

    // 키보드 네비게이션
    useEffect(() => {
        if (!state) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowLeft') nav(-1)
            else if (e.key === 'ArrowRight') nav(1)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [state, onClose, nav])

    return (
        <AnimatePresence>
            {state && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose() }}
                        className="absolute top-6 right-8 text-white/50 hover:text-white transition-colors cursor-pointer z-[110] p-2 hover:bg-white/10 rounded-full"
                        aria-label="Close lightbox"
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="relative flex items-center justify-center w-full h-full max-w-7xl px-4"
                        onClick={e => e.stopPropagation()}
                    >
                        {state.images.length > 1 && (
                            <button
                                onClick={() => nav(-1)}
                                className="absolute left-4 md:left-8 text-white/30 hover:text-white transition-all cursor-pointer z-10 p-3 hover:bg-white/5 rounded-full"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        <motion.img
                            key={state.images[state.index]}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            src={state.images[state.index]}
                            alt={state.title}
                            className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
                        />

                        {state.images.length > 1 && (
                            <button
                                onClick={() => nav(1)}
                                className="absolute right-4 md:right-8 text-white/30 hover:text-white transition-all cursor-pointer z-10 p-3 hover:bg-white/5 rounded-full"
                                aria-label="Next image"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}
                    </div>

                    {state.images.length > 1 && (
                        <div
                            className="flex gap-2 mt-6 pb-4 overflow-x-auto max-w-full px-4 hide-scrollbar"
                            onClick={e => e.stopPropagation()}
                        >
                            {state.thumbs.map((thumb, i) => (
                                <button
                                    key={i}
                                    onClick={() => onNavigate(i)}
                                    className={cn(
                                        "relative flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all duration-300 cursor-pointer",
                                        i === state.index
                                            ? "ring-2 ring-gold opacity-100 scale-105"
                                            : "opacity-40 hover:opacity-80 grayscale hover:grayscale-0"
                                    )}
                                >
                                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
