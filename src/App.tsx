import { Routes, Route, useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HomePage from '@/pages/HomePage'
import WorksPage from '@/pages/WorksPage'
import CategoryPage from '@/pages/CategoryPage'
import AboutPage from '@/pages/AboutPage'
import RequestPage from '@/pages/RequestPage'
import ContactPage from '@/pages/ContactPage'
import AdminPage from '@/pages/AdminPage'
import IntroPage from '@/pages/IntroPage'

function App() {
    const location = useLocation()
    const isHome = location.pathname === '/home'
    const isIntro = location.pathname === '/'
    const TRANSPARENT_PATHS = ['/home', '/works', '/about', '/request', '/contact']
    const isTransparent = TRANSPARENT_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))

    return (
        <div className="app">
            {!isIntro && <Header transparent={isTransparent} />}
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
            {!isHome && !isIntro && <Footer />}
        </div>
    )
}

export default App
