"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";

/* =========================================================
   RevealWaveVideo Component (Safe Mode)
   - Guaranteed full-color visibility first.
   - Simple grayscale to color reveal transition.
   - Removes complex dithering logic to prevent shader errors.
   ========================================================= */

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uRevealRadius; // 0~1 range for responsiveness
  uniform float uMouseActive;
  
  uniform float uWaveSpeed;
  uniform float uWaveFrequency;
  uniform float uWaveAmplitude;
  uniform float uMouseRadius;
  
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    float time = uTime;
    float waveStrength = uWaveAmplitude * 0.1;
    
    // 1. Wave Logic (Keep existing wave effect)
    float wave1 = sin(uv.y * uWaveFrequency + time * uWaveSpeed) * waveStrength;
    float wave2 = sin(uv.x * uWaveFrequency * 0.7 + time * uWaveSpeed * 0.8) * waveStrength * 0.5;
    
    vec2 distortedUv = uv;
    distortedUv.x += wave1;
    distortedUv.y += wave2;
    
    // 2. Mouse Ripple Logic
    if (uMouseActive > 0.01) {
        vec2 mousePos = uMouse;
        float dist = distance(uv, mousePos);
        float mouseInfluence = smoothstep(uMouseRadius, 0.0, dist); // Use custom mouse radius
        
        float rippleFreq = uWaveFrequency * 5.0;
        float rippleSpeed = uWaveSpeed * 1.0;
        float rippleStrength = uWaveAmplitude * 0.05;
        
        float ripple = sin(dist * rippleFreq - time * rippleSpeed) * rippleStrength * mouseInfluence * uMouseActive;
        distortedUv.x += ripple;
        distortedUv.y += ripple;
    }
    
    vec4 color = texture2D(uTexture, distortedUv);
    
    // 3. Simple Grayscale Mix Logic (Safe & Visible)
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 grayColor = vec3(gray); // Black & White version
    
    // Reveal Calculation
    float dist = distance(uv, uMouse);
    float reveal = 1.0 - smoothstep(uRevealRadius * 0.5, uRevealRadius, dist);
    
    // Mouse Active Check
    reveal *= uMouseActive; // Only reveal if mouse is active
    
    // Final Mix: Base is 30% Color + 70% Grayscale. Reveal brings back 100% Color.
    float mixFactor = clamp(reveal + 0.3, 0.0, 1.0);
    vec3 finalColor = mix(grayColor, color.rgb, mixFactor);
    
    gl_FragColor = vec4(finalColor, color.a);
  }
`;

function VideoPlane({
    src,
    revealRadius,
    revealSoftness,
    pixelSize,
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    mouseRadius,
    isMouseInCanvas,
}: any) {
    const meshRef = useRef<THREE.Mesh>(null);
    const { pointer } = useThree();
    const mouseActiveRef = useRef(0);
    const hasEnteredRef = useRef(false);

    const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
    const [aspectRatio, setAspectRatio] = useState(1.77); // Default 16:9

    useEffect(() => {
        const video = document.createElement("video");
        video.src = src;
        video.crossOrigin = "Anonymous";
        video.loop = true;
        video.muted = true;
        video.playsInline = true;

        video.onerror = (e) => {
            console.error("Video loading error:", video.error);
        };

        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;

        const handleResize = () => {
            if (video.videoWidth && video.videoHeight) {
                setAspectRatio(video.videoWidth / video.videoHeight);
                texture.needsUpdate = true;
                setVideoTexture(texture);
            }
        };

        video.addEventListener("loadedmetadata", handleResize);

        // Robust play attempt
        const attemptPlay = async () => {
            try {
                await video.play();
                handleResize();
            } catch (err) {
                console.warn("Video play failed:", err);
            }
        };
        video.load();
        attemptPlay();

        return () => {
            video.pause();
            video.removeAttribute('src');
            video.load();
            video.removeEventListener("loadedmetadata", handleResize);
            texture.dispose();
            videoTexture?.dispose();
        };
    }, [src]);

    // Simplified uniforms (Removed unused ones like uPixelSize from shader)
    const uniforms = useMemo(
        () => ({
            uTexture: { value: videoTexture },
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(-10, -10) },
            uRevealRadius: { value: revealRadius },
            // uRevealSoftness removed from shader for simplicity
            // uPixelSize removed from shader
            uMouseActive: { value: 0 },
            uWaveSpeed: { value: waveSpeed },
            uWaveFrequency: { value: waveFrequency },
            uWaveAmplitude: { value: waveAmplitude },
            uMouseRadius: { value: mouseRadius },
        }),
        [videoTexture, revealRadius, waveSpeed, waveFrequency, waveAmplitude, mouseRadius]
    );

    const scale = useMemo<[number, number, number]>(() => {
        if (aspectRatio > 1) return [aspectRatio, 1, 1];
        return [1, 1 / aspectRatio, 1];
    }, [aspectRatio]);

    useFrame((state) => {
        if (meshRef.current && videoTexture) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            if (material.uniforms) {
                material.uniforms.uTime.value = state.clock.elapsedTime;

                if (isMouseInCanvas) hasEnteredRef.current = true;

                const targetActive = isMouseInCanvas ? 1 : 0;
                mouseActiveRef.current += (targetActive - mouseActiveRef.current) * 0.08;
                material.uniforms.uMouseActive.value = mouseActiveRef.current;

                if (hasEnteredRef.current) {
                    material.uniforms.uMouse.value.set((pointer.x + 1) / 2, (pointer.y + 1) / 2);
                }
            }
        }
    });

    if (!videoTexture) return null;

    return (
        <mesh ref={meshRef} scale={scale}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
            />
        </mesh>
    );
}

export const RevealWaveVideo = ({
    src,
    revealRadius = 0.4, // Increased default radius
    revealSoftness = 0.5,
    pixelSize = 3,
    waveSpeed = 0.5,
    waveFrequency = 3.0,
    waveAmplitude = 0.2,
    mouseRadius = 0.2,
    className = "h-full w-full",
}: any) => {
    const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);

    return (
        <div
            className={`relative overflow-hidden bg-black ${className}`}
            onMouseEnter={() => setIsMouseInCanvas(true)}
            onMouseLeave={() => setIsMouseInCanvas(false)}
        >
            <Canvas
                style={{ width: "100%", height: "100%", display: "block" }}
                gl={{ antialias: false }}
                camera={{ position: [0, 0, 1] }}
            >
                <VideoPlane
                    src={src}
                    revealRadius={revealRadius}
                    revealSoftness={revealSoftness}
                    pixelSize={pixelSize}
                    waveSpeed={waveSpeed}
                    waveFrequency={waveFrequency}
                    waveAmplitude={waveAmplitude}
                    mouseRadius={mouseRadius}
                    isMouseInCanvas={isMouseInCanvas}
                />
            </Canvas>
        </div>
    );
};
