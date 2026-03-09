import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const IntroPage = lazy(() => import('@/pages/IntroPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const WorksPage = lazy(() => import('@/pages/WorksPage'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const RequestPage = lazy(() => import('@/pages/RequestPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))

function App() {
    const location = useLocation()
    const isHome = location.pathname === '/home'
    const isIntro = location.pathname === '/'
    const TRANSPARENT_PATHS = ['/home', '/works', '/about', '/request', '/contact']
    const isTransparent = TRANSPARENT_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))

    return (
        <div className="app">
            {!isIntro && <Header transparent={isTransparent} />}
            <Suspense fallback={
                <div className="flex justify-center items-center h-screen bg-charcoal">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold"></div>
                </div>
            }>
                <Routes>
                    <Route path="/" element={<IntroPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/works" element={<WorksPage />} />
                    <Route path="/works/:category" element={<CategoryPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/request" element={<RequestPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </Suspense>
            {!isHome && !isIntro && <Footer />}
        </div>
    )
}

export default App
