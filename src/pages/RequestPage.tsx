import { MessageSquare, Mail, Phone, Printer } from 'lucide-react'

const CONTACT_CHANNELS = [
    {
        icon: MessageSquare,
        label: 'KakaoTalk',
        value: '@handsday',
        href: 'https://pf.kakao.com/_handsday',
        color: 'bg-[#FEE500]',
        iconColor: 'text-[#3C1E1E]',
    },
    {
        icon: Mail,
        label: 'Email',
        value: 'handsday@naver.com',
        href: 'mailto:handsday@naver.com',
        color: 'bg-charcoal',
        iconColor: 'text-white',
    },
    {
        icon: Printer,
        label: 'Fax',
        value: '0504.060.2606',
        href: 'tel:05040602606',
        color: 'bg-warm-gray',
        iconColor: 'text-white',
    },
    {
        icon: Phone,
        label: 'Tel',
        value: '070.4076.0248',
        href: 'tel:07040760248',
        color: 'bg-gold',
        iconColor: 'text-white',
    },
]

export default function RequestPage() {
    return (
        <main className="pt-28 pb-20 px-8 page-enter">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="font-display text-5xl font-bold mb-4">Project Request</h1>
                <p className="text-warm-gray text-lg mb-4">프로젝트 문의를 원하시면 아래 채널로 연락해 주세요.</p>
                <p className="text-warm-gray text-sm mb-16">상담 가능 시간 : 월 – 금 09:00 ~ 18:00</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-20">
                    {CONTACT_CHANNELS.map((ch) => (
                        <a key={ch.label} href={ch.href}
                            target={ch.label === 'KakaoTalk' ? '_blank' : undefined}
                            rel={ch.label === 'KakaoTalk' ? 'noopener noreferrer' : undefined}
                            className="group flex items-center gap-5 bg-white p-6 rounded-sm border border-gray-100 hover:shadow-lg hover:border-gold/30 transition-all duration-300">
                            <div className={`w-12 h-12 rounded-full ${ch.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <ch.icon size={20} className={ch.iconColor} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs uppercase tracking-[3px] text-warm-gray mb-1">{ch.label}</p>
                                <p className="font-medium text-charcoal text-lg">{ch.value}</p>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="bg-charcoal text-white rounded-sm p-12">
                    <h2 className="font-display text-2xl font-bold mb-3">공간의 가치를 높이는 디자인</h2>
                    <p className="text-white/60 text-sm leading-relaxed max-w-lg mx-auto mb-6">
                        병원, 상업공간, 주거공간 등 다양한 프로젝트 경험을 바탕으로<br />
                        최적의 인테리어 솔루션을 제안해 드립니다.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-gold text-sm">
                        <MessageSquare size={16} />
                        <span className="uppercase tracking-[3px]">카카오톡 @handsday 로 편하게 문의하세요</span>
                    </div>
                </div>
            </div>
        </main>
    )
}
