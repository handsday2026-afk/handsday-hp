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

function App() {
    const location = useLocation()
    const isHome = location.pathname === '/'

    return (
        <div className="app">
            <Header transparent={isHome} />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/works" element={<WorksPage />} />
                <Route path="/works/:category" element={<CategoryPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/request" element={<RequestPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
            {!isHome && <Footer />}
        </div>
    )
}

export default App
