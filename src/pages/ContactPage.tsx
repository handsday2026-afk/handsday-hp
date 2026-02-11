import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function ContactPage() {
    return (
        <main className="pt-28 pb-20 px-8 page-enter">
            <div className="max-w-6xl mx-auto">
                <h1 className="font-display text-5xl font-bold mb-4">Contact</h1>
                <p className="text-warm-gray mb-16">방문 상담은 사전 예약 후 가능합니다.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <MapPin size={20} className="text-gold mt-1 shrink-0" />
                            <div>
                                <h3 className="font-medium mb-1">Address</h3>
                                <p className="text-warm-gray text-sm leading-relaxed">부산광역시 동래구 석사북로 31, 2F (사직동)</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone size={20} className="text-gold mt-1 shrink-0" />
                            <div>
                                <h3 className="font-medium mb-1">Tel</h3>
                                <p className="text-warm-gray text-sm">070.4076.0248</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Mail size={20} className="text-gold mt-1 shrink-0" />
                            <div>
                                <h3 className="font-medium mb-1">Email</h3>
                                <p className="text-warm-gray text-sm">handsday@naver.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Clock size={20} className="text-gold mt-1 shrink-0" />
                            <div>
                                <h3 className="font-medium mb-1">Business Hours</h3>
                                <p className="text-warm-gray text-sm">Mon - Fri | 09:00 - 18:00<br />Sat - Sun | Closed</p>
                            </div>
                        </div>
                    </div>
                    <div className="aspect-video bg-gray-200 rounded-sm flex items-center justify-center text-warm-gray text-sm overflow-hidden">
                        <iframe
                            src="https://maps.google.com/maps?q=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C+%EB%8F%99%EB%9E%98%EA%B5%AC+%EC%84%9D%EC%82%AC%EB%B6%81%EB%A1%9C+31&t=&z=16&ie=UTF8&iwloc=&output=embed"
                            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade" title="HANDSDAY Location" />
                    </div>
                </div>
            </div>
        </main>
    )
}
