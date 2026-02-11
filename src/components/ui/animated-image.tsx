'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useInView } from 'framer-motion';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface AnimatedImageProps {
    alt: string;
    src: string;
    className?: string;
    ratio: number;
    onClick?: () => void;
}

export function AnimatedImage({ alt, src, className, ratio, onClick }: AnimatedImageProps) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);

    return (
        <div
            ref={ref}
            className={cn("relative overflow-hidden rounded-lg group cursor-pointer", className)}
            onClick={onClick}
        >
            <AspectRatio
                ratio={ratio}
                className="bg-gray-800 relative w-full h-full"
            >
                {!hasError ? (
                    <img
                        alt={alt}
                        src={src}
                        className={cn(
                            'block w-full h-full object-cover transition-all duration-700 ease-out',
                            isLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0',
                            isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                            'group-hover:scale-105'
                        )}
                        onLoad={() => setIsLoading(false)}
                        loading="lazy"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-white/20 text-xs">
                        No Image
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs uppercase tracking-[3px] font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        View Project
                    </span>
                </div>
            </AspectRatio>
        </div>
    );
}
