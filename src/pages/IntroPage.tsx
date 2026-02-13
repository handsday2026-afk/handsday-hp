import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RevealWaveVideo } from "@/components/ui/reveal-wave-video";
import { Suspense } from "react";

export default function IntroPage() {
    const navigate = useNavigate();

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
            {/* Background Reveal Wave Video with Suspense */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={<div className="w-full h-full bg-black" />}>
                    <RevealWaveVideo
                        src="/intro01.mp4"
                        waveSpeed={0.3}
                        waveFrequency={1.5}
                        waveAmplitude={0.3}
                        revealRadius={0.4}
                        pixelSize={2}
                        mouseRadius={0.3}
                    />
                </Suspense>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-center"
                >
                    <h1 className="text-white text-6xl md:text-8xl font-serif tracking-widest mb-4">
                        HANDSDAY
                    </h1>
                    <p className="text-warm-gray text-[10px] sm:text-lg md:text-xl font-light tracking-[0.5em] uppercase whitespace-nowrap">
                        Interior Architecture Studio
                    </p>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    onClick={() => navigate("/")}
                    className="mt-16 pointer-events-auto px-10 py-3 border border-white/30 text-white text-sm tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-sm"
                >
                    Enter Space
                </motion.button>
            </div>

            {/* Subtle bottom text */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-white/30 text-[10px] tracking-[0.2em] uppercase">
                © 2026 Handsday Corp. Based in Busan
            </div>
        </div>
    );
}
