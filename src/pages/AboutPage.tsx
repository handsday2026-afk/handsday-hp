export default function AboutPage() {
    return (
        <main className="pt-28 pb-20 page-enter">
            <section className="px-8 max-w-6xl mx-auto mb-20">
                <h1 className="font-display text-5xl font-bold mb-6">About Us</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <p className="text-warm-gray leading-loose text-lg mb-6">
                            HANDSDAY 인테리어 스튜디오는 공간의 본질을 탐구합니다.
                        </p>
                        <p className="text-warm-gray leading-loose mb-6">
                            메디컬, 상업 공간, 그리고 주거 공간에 이르기까지
                            각 클라이언트의 고유한 가치를 세련된 미학으로 전환합니다.
                            기능성과 예술성의 조화를 통해, 머무는 이의 자부심이 되는 공간을 설계합니다.
                        </p>
                        <div className="flex gap-12 mt-10">
                            <div>
                                <p className="font-display text-4xl font-bold text-gold">150+</p>
                                <p className="text-xs uppercase tracking-[3px] text-warm-gray mt-1">Projects</p>
                            </div>
                            <div>
                                <p className="font-display text-4xl font-bold text-gold">12</p>
                                <p className="text-xs uppercase tracking-[3px] text-warm-gray mt-1">Years</p>
                            </div>
                            <div>
                                <p className="font-display text-4xl font-bold text-gold">98%</p>
                                <p className="text-xs uppercase tracking-[3px] text-warm-gray mt-1">Satisfaction</p>
                            </div>
                        </div>
                    </div>
                    <div className="aspect-[4/5] rounded-sm overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
                            alt="Studio" className="w-full h-full object-cover" />
                    </div>
                </div>
            </section>

            <section className="bg-charcoal text-white py-24 px-8">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="font-display text-3xl font-bold mb-4">Designing Spaces, Defining Lives.</h2>
                    <p className="text-white/60 max-w-lg mx-auto">
                        우리는 단순한 인테리어를 넘어 삶의 방식을 제안합니다.
                    </p>
                </div>
            </section>
        </main>
    )
}
