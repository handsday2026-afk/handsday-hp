import { Link } from 'react-router-dom'
import { Building2, Stethoscope, Home } from 'lucide-react'

const categories = [
    {
        slug: 'medical',
        title: 'Medical',
        subtitle: '병원 · 클리닉',
        icon: Stethoscope,
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop',
        desc: '환자와 의료진 모두를 위한 쾌적하고 세련된 의료 공간을 설계합니다.',
    },
    {
        slug: 'commercial',
        title: 'Commercial',
        subtitle: '상업 공간',
        icon: Building2,
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop',
        desc: '브랜드의 정체성을 공간으로 구현하여 비즈니스 가치를 높입니다.',
    },
    {
        slug: 'residence',
        title: 'Residence',
        subtitle: '주거 공간',
        icon: Home,
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop',
        desc: '일상의 품격을 높이는 맞춤형 주거 공간을 디자인합니다.',
    },
]

export default function WorksPage() {
    return (
        <main className="pt-28 pb-20 px-8 page-enter">
            <div className="max-w-6xl mx-auto">
                <h1 className="font-display text-5xl font-bold mb-4">Our Works</h1>
                <p className="text-warm-gray text-lg mb-16 max-w-xl">
                    각 공간의 본질을 탐구하여, 기능과 아름다움이 조화를 이루는 인테리어를 완성합니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {categories.map((cat) => (
                        <Link key={cat.slug} to={`/works/${cat.slug}`}
                            className="group relative overflow-hidden rounded-sm aspect-[3/4] bg-charcoal">
                            <img src={cat.image} alt={cat.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-8 text-white z-10">
                                <cat.icon size={28} className="mb-3 text-gold" />
                                <h2 className="text-2xl font-bold tracking-wider mb-1">{cat.title}</h2>
                                <p className="text-white/60 text-xs uppercase tracking-[3px] mb-3">{cat.subtitle}</p>
                                <p className="text-white/70 text-sm leading-relaxed">{cat.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
