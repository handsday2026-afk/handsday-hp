import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function ContactPage() {
    return (
        <main className="min-h-screen pt-32 pb-24 px-8 page-enter bg-charcoal text-white">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-wide text-white">Contact</h1>
                <p className="text-white/60 mb-20 text-lg">방문 상담은 사전 예약 후 가능합니다.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
                    {/* Info Section */}
                    <div className="space-y-12">
                        <div className="flex items-start gap-5 group">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold/30 transition-colors">
                                <MapPin size={20} className="text-gold" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg mb-2 text-white">Address</h3>
                                <p className="text-white/60 text-sm leading-relaxed tracking-wide">부산광역시 동래구 석사북로 31, 2F (사직동)</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5 group">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold/30 transition-colors">
                                <Phone size={20} className="text-gold" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg mb-2 text-white">Tel</h3>
                                <p className="text-white/60 text-sm tracking-wide">070.4076.0248</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5 group">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold/30 transition-colors">
                                <Mail size={20} className="text-gold" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg mb-2 text-white">Email</h3>
                                <p className="text-white/60 text-sm tracking-wide">handsday@naver.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5 group">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold/30 transition-colors">
                                <Clock size={20} className="text-gold" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg mb-2 text-white">Business Hours</h3>
                                <p className="text-white/60 text-sm leading-relaxed tracking-wide">Mon - Fri | 09:00 - 18:00<br />Sat - Sun | Closed</p>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="aspect-square md:aspect-[4/3] bg-white/5 rounded-sm flex items-center justify-center text-white/40 text-sm overflow-hidden border border-white/10 shadow-2xl">
                        <iframe
                            src="https://maps.google.com/maps?q=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C+%EB%8F%99%EB%9E%98%EA%B5%AC+%EC%84%9D%EC%82%AC%EB%B6%81%EB%A1%9C+31&t=&z=16&ie=UTF8&iwloc=&output=embed"
                            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                            className="opacity-80 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0"
                            referrerPolicy="no-referrer-when-downgrade" title="HANDSDAY Location" />
                    </div>
                </div>
            </div>
        </main>
    )
}
