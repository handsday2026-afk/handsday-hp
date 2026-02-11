import * as React from "react";
import { useNavigate } from "react-router-dom";
import { getHeroItems, type HeroItem } from "@/lib/api";

interface ProjectData {
    id?: string;
    title: string;
    image: string;
    category: string;
    year: string;
    description: string;
}

// 기본 폴백 데이터 (API 데이터 없을 때)
const FALLBACK_DATA: ProjectData[] = [
    {
        title: "강남 피부과 클리닉",
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop",
        category: "Medical",
        year: "2025",
        description: "프리미엄 피부과 인테리어",
    },
    {
        title: "서초 부티크 호텔 로비",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
        category: "Commercial",
        year: "2024",
        description: "럭셔리 호텔 로비 디자인",
    },
    {
        title: "한남동 펜트하우스",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2074&auto=format&fit=crop",
        category: "Residence",
        year: "2024",
        description: "모던 펜트하우스 리빙",
    },
];

const CONFIG = {
    SCROLL_SPEED: 0.75,
    LERP_FACTOR: 0.05,
    BUFFER_SIZE: 5,
    MAX_VELOCITY: 150,
    SNAP_DURATION: 500,
    INFO_HEIGHT: 180,
};

const lerp = (start: number, end: number, factor: number) =>
    start + (end - start) * factor;

export function Component() {
    const navigate = useNavigate();
    const [projectData, setProjectData] = React.useState<ProjectData[]>(FALLBACK_DATA);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [visibleRange, setVisibleRange] = React.useState({
        min: -CONFIG.BUFFER_SIZE,
        max: CONFIG.BUFFER_SIZE,
    });

    const state = React.useRef({
        currentY: 0, targetY: 0,
        isDragging: false, isSnapping: false,
        snapStart: { time: 0, y: 0, target: 0 },
        lastScrollTime: Date.now(),
        dragStart: { y: 0, scrollY: 0 },
        projectHeight: 0,
    });

    const projectsRef = React.useRef<Map<number, HTMLDivElement>>(new Map());
    const infoRef = React.useRef<Map<number, HTMLDivElement>>(new Map());
    const thumbRef = React.useRef<Map<number, HTMLDivElement>>(new Map());
    const requestRef = React.useRef<number | undefined>(undefined);
    const renderedRange = React.useRef({ min: -CONFIG.BUFFER_SIZE, max: CONFIG.BUFFER_SIZE });

    // API에서 데이터 로드
    React.useEffect(() => {
        getHeroItems().then((items: HeroItem[]) => {
            if (items.length > 0) {
                setProjectData(items.map(h => ({
                    id: h.projectId,
                    title: h.title,
                    image: h.image,
                    category: h.category,
                    year: h.year,
                    description: h.description,
                })));
            }
        }).catch(() => { /* fallback data 사용 */ });
    }, []);

    const getProjectData = React.useCallback((index: number) => {
        const len = projectData.length;
        const mod = ((index % len) + len) % len;
        return projectData[mod];
    }, [projectData]);

    const getProjectNumber = React.useCallback((index: number) => {
        const len = projectData.length;
        return (((index % len) + len) % len + 1)
            .toString()
            .padStart(2, "0");
    }, [projectData]);

    const updateParallax = (img: HTMLImageElement | null, scroll: number, index: number, height: number) => {
        if (!img) return;
        if (!img.dataset.parallaxCurrent) img.dataset.parallaxCurrent = "0";
        let current = parseFloat(img.dataset.parallaxCurrent);
        const target = (-scroll - index * height) * 0.2;
        current = lerp(current, target, 0.1);
        if (Math.abs(current - target) > 0.01) {
            img.style.transform = `translateY(${current}px) scale(1.5)`;
            img.dataset.parallaxCurrent = current.toString();
        }
    };

    const updateSnap = () => {
        const s = state.current;
        const progress = Math.min((Date.now() - s.snapStart.time) / CONFIG.SNAP_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        s.targetY = s.snapStart.y + (s.snapStart.target - s.snapStart.y) * eased;
        if (progress >= 1) s.isSnapping = false;
    };

    const snapToProject = () => {
        const s = state.current;
        const current = Math.round(-s.targetY / s.projectHeight);
        const target = -current * s.projectHeight;
        s.isSnapping = true;
        s.snapStart = { time: Date.now(), y: s.targetY, target };
    };

    // 핵심: 원본 참조 코드의 슬라이딩 방식 - 정보패널도 동기화 스크롤
    const updatePositions = () => {
        const s = state.current;
        const infoScrollY = (s.currentY * CONFIG.INFO_HEIGHT) / s.projectHeight;

        // 메인 프로젝트 이미지 위치 업데이트
        projectsRef.current.forEach((el, index) => {
            const y = index * s.projectHeight + s.currentY;
            el.style.transform = `translateY(${y}px)`;
            updateParallax(el.querySelector("img"), s.currentY, index, s.projectHeight);
        });

        // 정보 텍스트 위치 업데이트 (동기화 스크롤)
        infoRef.current.forEach((el, index) => {
            const y = index * CONFIG.INFO_HEIGHT + infoScrollY;
            el.style.transform = `translateY(${y}px)`;
        });

        // 썸네일 위치 업데이트 (동기화 스크롤)
        thumbRef.current.forEach((el, index) => {
            const y = index * CONFIG.INFO_HEIGHT + infoScrollY;
            el.style.transform = `translateY(${y}px)`;
            const img = el.querySelector("img");
            if (img) updateParallax(img, infoScrollY, index, CONFIG.INFO_HEIGHT);
        });
    };

    const animationLoop = () => {
        const s = state.current;
        const now = Date.now();
        if (!s.isSnapping && !s.isDragging && now - s.lastScrollTime > 100) {
            const snapPoint = -Math.round(-s.targetY / s.projectHeight) * s.projectHeight;
            if (Math.abs(s.targetY - snapPoint) > 1) snapToProject();
        }
        if (s.isSnapping) updateSnap();
        if (!s.isDragging) s.currentY += (s.targetY - s.currentY) * CONFIG.LERP_FACTOR;
        updatePositions();

        // 현재 활성 인덱스 계산 (인디케이터용)
        const currentIndex = Math.round(-s.currentY / s.projectHeight);
        setActiveIndex(currentIndex);

        const min = currentIndex - CONFIG.BUFFER_SIZE;
        const max = currentIndex + CONFIG.BUFFER_SIZE;
        if (min !== renderedRange.current.min || max !== renderedRange.current.max) {
            renderedRange.current = { min, max };
            setVisibleRange({ min, max });
        }
        requestRef.current = requestAnimationFrame(animationLoop);
    };

    React.useEffect(() => {
        state.current.projectHeight = window.innerHeight;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const s = state.current;
            s.isSnapping = false;
            s.lastScrollTime = Date.now();
            const delta = Math.max(Math.min(e.deltaY * CONFIG.SCROLL_SPEED, CONFIG.MAX_VELOCITY), -CONFIG.MAX_VELOCITY);
            s.targetY -= delta;
        };
        const onTouchStart = (e: TouchEvent) => {
            const s = state.current;
            s.isDragging = true; s.isSnapping = false;
            s.dragStart = { y: e.touches[0].clientY, scrollY: s.targetY };
            s.lastScrollTime = Date.now();
        };
        const onTouchMove = (e: TouchEvent) => {
            const s = state.current;
            if (!s.isDragging) return;
            s.targetY = s.dragStart.scrollY + (e.touches[0].clientY - s.dragStart.y) * 1.5;
            s.lastScrollTime = Date.now();
        };
        const onTouchEnd = () => { state.current.isDragging = false; };
        const onResize = () => { state.current.projectHeight = window.innerHeight; };

        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("resize", onResize);
        requestRef.current = requestAnimationFrame(animationLoop);
        return () => {
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("resize", onResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const indices: number[] = [];
    for (let i = visibleRange.min; i <= visibleRange.max; i++) indices.push(i);

    const handleProjectClick = (data: ProjectData) => {
        navigate(`/works/${data.category.toLowerCase()}`);
    };

    // 현재 활성 인디케이터 계산
    const activeModIndex = ((activeIndex % projectData.length) + projectData.length) % projectData.length;

    return (
        <div className="parallax-container">
            {/* 메인 풀스크린 이미지 */}
            <ul className="project-list">
                {indices.map((i) => {
                    const data = getProjectData(i);
                    return (
                        <div key={i} className="project"
                            ref={(el) => { if (el) projectsRef.current.set(i, el); else projectsRef.current.delete(i); }}>
                            <img src={data.image} alt={data.title} />
                        </div>
                    );
                })}
            </ul>

            {/* 하단 정보 패널 - 슬라이딩 동기화 */}
            <div className="hero-info-panel">
                <div className="hero-info-inner">
                    {/* 좌측 텍스트 영역 (슬라이딩) */}
                    <div className="hero-info-text">
                        {indices.map((i) => {
                            const data = getProjectData(i);
                            const num = getProjectNumber(i);
                            return (
                                <div key={i} className="hero-info-item"
                                    onClick={() => handleProjectClick(data)}
                                    ref={(el) => { if (el) infoRef.current.set(i, el); else infoRef.current.delete(i); }}>
                                    <div className="hero-info-number">{num}</div>
                                    <div className="hero-info-details">
                                        <h3 className="hero-info-title">{data.title}</h3>
                                        <div className="hero-info-meta">
                                            <span>{data.category}</span>
                                            <span>{data.year}</span>
                                        </div>
                                        <p className="hero-info-desc">{data.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 우측 썸네일 (슬라이딩) */}
                    <div className="hero-info-thumb">
                        {indices.map((i) => {
                            const data = getProjectData(i);
                            return (
                                <div key={i} className="hero-thumb-item"
                                    ref={(el) => { if (el) thumbRef.current.set(i, el); else thumbRef.current.delete(i); }}>
                                    <img src={data.image} alt={data.title} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 인디케이터 */}
                <div className="hero-indicator">
                    {projectData.map((_, i) => (
                        <div key={i} className={`hero-indicator-dot ${activeModIndex === i ? 'active' : ''}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}
