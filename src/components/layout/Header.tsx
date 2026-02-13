import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, Instagram } from 'lucide-react'

interface HeaderProps {
    transparent?: boolean
}

// 네이버 'N' 로고 아이콘 컴포넌트 (Lucide 스타일)
function NaverIcon({ size = 18, className = "" }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M17 2H7C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5z" />
            <path d="M8 17V7l8 10V7" />
        </svg>
    )
}

export default function Header({ transparent = false }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [worksOpen, setWorksOpen] = useState(false)

    // 화면 크기 변경 시 모바일 메뉴 닫기
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const headerBg = isOpen
        ? 'bg-bone border-b border-gray-200'
        : transparent
            ? 'bg-transparent'
            : 'bg-bone/90 backdrop-blur-md border-b border-gray-200'

    const iconColor = transparent && !isOpen ? 'text-white/80 hover:text-white' : 'text-charcoal/60 hover:text-charcoal'

    return (
        <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${headerBg}`}>
            <div className="flex items-center justify-between px-8 py-5">
                <Link to="/home" className={`font-display text-2xl font-bold tracking-[3px] ${transparent && !isOpen ? 'text-white' : 'text-charcoal'
                    }`}>
                    HANDSDAY
                </Link>

                <nav className="hidden md:flex items-center gap-10">
                    <div className="relative -my-5 py-5"
                        onMouseEnter={() => setWorksOpen(true)}
                        onMouseLeave={() => setWorksOpen(false)}>
                        <Link to="/works" className={`nav-link ${transparent ? 'text-white/80 hover:text-white' : 'text-charcoal/60 hover:text-charcoal'}`}>
                            Works
                        </Link>
                        {worksOpen && (
                            <div className="absolute top-full left-0 pt-0">
                                <div className="bg-white shadow-2xl rounded-sm overflow-hidden min-w-[160px] border border-gray-100">
                                    <Link to="/works/medical" className="block px-5 py-3 text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal hover:bg-bone transition-colors">Medical</Link>
                                    <Link to="/works/commercial" className="block px-5 py-3 text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal hover:bg-bone transition-colors">Commercial</Link>
                                    <Link to="/works/residence" className="block px-5 py-3 text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal hover:bg-bone transition-colors">Residence</Link>
                                </div>
                            </div>
                        )}
                    </div>
                    <Link to="/about" className={`nav-link ${transparent ? 'text-white/80 hover:text-white' : 'text-charcoal/60 hover:text-charcoal'}`}>About</Link>
                    <Link to="/request" className={`nav-link ${transparent ? 'text-white/80 hover:text-white' : 'text-charcoal/60 hover:text-charcoal'}`}>Project Request</Link>
                    <Link to="/contact" className={`nav-link ${transparent ? 'text-white/80 hover:text-white' : 'text-charcoal/60 hover:text-charcoal'}`}>Contact</Link>

                    <div className="w-px h-3 bg-current opacity-20 mx-2"></div>

                    <a href="https://www.instagram.com/suyoil_interior/" target="_blank" rel="noopener noreferrer" className={`transition-colors ${iconColor}`} title="Instagram">
                        <Instagram size={18} />
                    </a>
                    <a href="https://blog.naver.com/handsday" target="_blank" rel="noopener noreferrer" className={`transition-colors ${iconColor}`} title="Naver Blog">
                        <NaverIcon size={18} />
                    </a>
                </nav>

                <button className="md:hidden z-50 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen
                        ? <X size={24} className="text-charcoal" />
                        : <Menu size={24} className={transparent ? 'text-white' : 'text-charcoal'} />}
                </button>
            </div>

            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-bone shadow-lg border-b border-gray-200 z-40 px-8 py-6 flex flex-col gap-0">
                    <Link to="/works" className="block py-3 nav-link text-charcoal border-b border-gray-100" onClick={() => setIsOpen(false)}>Works</Link>
                    <div className="border-b border-gray-100">
                        <Link to="/works/medical" className="block py-2.5 pl-6 text-xs uppercase tracking-widest text-warm-gray hover:text-charcoal transition-colors" onClick={() => setIsOpen(false)}>Medical</Link>
                        <Link to="/works/commercial" className="block py-2.5 pl-6 text-xs uppercase tracking-widest text-warm-gray hover:text-charcoal transition-colors" onClick={() => setIsOpen(false)}>Commercial</Link>
                        <Link to="/works/residence" className="block py-2.5 pl-6 text-xs uppercase tracking-widest text-warm-gray hover:text-charcoal transition-colors" onClick={() => setIsOpen(false)}>Residence</Link>
                    </div>
                    <Link to="/about" className="block py-3 nav-link text-charcoal border-b border-gray-100" onClick={() => setIsOpen(false)}>About</Link>
                    <Link to="/request" className="block py-3 nav-link text-charcoal border-b border-gray-100" onClick={() => setIsOpen(false)}>Project Request</Link>
                    <Link to="/contact" className="block py-3 nav-link text-charcoal border-b border-gray-100" onClick={() => setIsOpen(false)}>Contact</Link>

                    <div className="flex gap-6 py-4 justify-start">
                        <a href="https://www.instagram.com/suyoil_interior/" target="_blank" rel="noopener noreferrer" className="text-warm-gray hover:text-charcoal transition-colors">
                            <Instagram size={20} />
                        </a>
                        <a href="https://blog.naver.com/handsday" target="_blank" rel="noopener noreferrer" className="text-warm-gray hover:text-charcoal transition-colors">
                            <NaverIcon size={20} />
                        </a>
                    </div>
                </div>
            )}
        </header>
    )
}
