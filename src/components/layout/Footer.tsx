import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'

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

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white/60 py-16 px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                    <h3 className="font-display text-white text-xl font-bold tracking-widest mb-4">HANDSDAY</h3>
                    <p className="text-sm leading-relaxed">공간에 가치를 담다.<br />프리미엄 인테리어 디자인 스튜디오</p>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-[3px] text-gold mb-4">Quick Links</h4>
                    <div className="flex flex-col gap-2">
                        <Link to="/works" className="text-sm hover:text-white transition-colors">Works</Link>
                        <Link to="/about" className="text-sm hover:text-white transition-colors">About</Link>
                        <Link to="/request" className="text-sm hover:text-white transition-colors">Project Request</Link>
                        <Link to="/contact" className="text-sm hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-[3px] text-gold mb-4">Contact</h4>
                    <p className="text-sm leading-relaxed">부산광역시 동래구 석사북로 31, 2F (사직동)<br />T. 070.4076.0248<br />E. handsday@naver.com</p>

                    <div className="mt-6 flex gap-4">
                        <a href="https://www.instagram.com/suyoil_interior/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10" title="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="https://blog.naver.com/handsday" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" title="Naver Blog">
                            <NaverIcon size={20} />
                        </a>
                    </div>
                </div>
            </div>
            <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-xs tracking-wider">
                &copy; 2026 Handsday Interior Studio. All rights reserved.
            </div>
        </footer>
    )
}
