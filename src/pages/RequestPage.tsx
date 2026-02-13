import { MessageSquare, Mail, Phone, Printer } from 'lucide-react'

const CONTACT_CHANNELS = [
    {
        icon: MessageSquare,
        label: 'KakaoTalk',
        value: '@handsday',
        href: 'https://pf.kakao.com/_handsday',
        bgClass: 'bg-[#FEE500]',
        iconColor: 'text-[#3C1E1E]',
    },
    {
        icon: Mail,
        label: 'Email',
        value: 'handsday@naver.com',
        href: 'mailto:handsday@naver.com',
        bgClass: 'bg-white/10',
        iconColor: 'text-white',
    },
    {
        icon: Printer,
        label: 'Fax',
        value: '0504.060.2606',
        href: 'tel:05040602606',
        bgClass: 'bg-white/10',
        iconColor: 'text-white/60',
    },
    {
        icon: Phone,
        label: 'Tel',
        value: '070.4076.0248',
        href: 'tel:07040760248',
        bgClass: 'bg-gold',
        iconColor: 'text-white',
    },
]

export default function RequestPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-8 bg-charcoal text-white">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-wide">Project Request</h1>
                    <p className="text-white/60 text-lg mb-2">프로젝트 문의를 원하시면 아래 채널로 연락해 주세요.</p>
                    <p className="text-white/40 text-sm tracking-wider uppercase">Business Hours : Mon - Fri 09:00 ~ 18:00</p>
                </div>

                {/* Contact Channels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl mb-20">
                    {CONTACT_CHANNELS.map((ch) => (
                        <a key={ch.label} href={ch.href}
                            target={ch.label === 'KakaoTalk' ? '_blank' : undefined}
                            rel={ch.label === 'KakaoTalk' ? 'noopener noreferrer' : undefined}
                            className="group flex items-center gap-5 bg-white/5 p-6 rounded-sm border border-white/5 hover:bg-white/10 hover:border-gold/30 transition-all duration-300">

                            <div className={`w-12 h-12 rounded-full ${ch.bgClass} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg`}>
                                <ch.icon size={20} className={ch.iconColor} />
                            </div>

                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-[3px] text-white/40 mb-1 font-medium group-hover:text-gold transition-colors">{ch.label}</p>
                                <p className="font-medium text-white text-lg tracking-wide group-hover:translate-x-1 transition-transform">{ch.value}</p>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Call to Action Banner */}
                <div className="w-full bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-sm p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10">
                        <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-white">공간의 가치를 높이는 디자인</h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-lg mx-auto mb-8">
                            병원, 상업공간, 주거공간 등 다양한 프로젝트 경험을 바탕으로<br />
                            최적의 인테리어 솔루션을 제안해 드립니다.
                        </p>

                        <a href="https://pf.kakao.com/_handsday" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 text-gold text-xs uppercase tracking-[3px] border border-gold/30 px-6 py-3 rounded-full hover:bg-gold hover:text-charcoal transition-all duration-300">
                            <MessageSquare size={14} />
                            <span>Inquire via KakaoTalk</span>
                        </a>
                    </div>
                </div>
            </div>
        </main>
    )
}
