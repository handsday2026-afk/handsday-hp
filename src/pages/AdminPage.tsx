import { useState, useEffect, useRef, useCallback } from 'react'
import { getProjects, createProject, deleteProject, updateProject, toggleProjectHero, migrateExistingImages, type Project, type MigrationProgress } from '@/lib/api'
import { getAdminThumbUrl } from '@/lib/image-utils'
import { Upload, Trash2, LogIn, LogOut, Plus, Layers, ChevronLeft, ChevronRight, Edit3, X, Check, Star, StarOff, Filter, ImagePlus, RefreshCw } from 'lucide-react'

const PAGE_SIZE = 6
const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'medical', label: 'Medical' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'residence', label: 'Residence' },
] as const

const STORAGE_KEY = 'admin_auth'

export default function AdminPage() {
    const [isAuth, setIsAuth] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
    const [password, setPassword] = useState('')

    // Works
    const [projects, setProjects] = useState<Project[]>([])
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('medical')
    const [year, setYear] = useState(new Date().getFullYear().toString())
    const [description, setDescription] = useState('')
    const [isHero, setIsHero] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [mainImageIndex, setMainImageIndex] = useState(0)

    // Edit modal
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [editForm, setEditForm] = useState({ title: '', category: '', year: '', description: '', isHero: false })
    const [editImages, setEditImages] = useState<string[]>([])
    const [editRemovedUrls, setEditRemovedUrls] = useState<string[]>([])
    const [editNewFiles, setEditNewFiles] = useState<File[]>([])
    const [editMainImage, setEditMainImage] = useState<string>('')
    const [editMsg, setEditMsg] = useState('')

    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const objectUrlsRef = useRef<string[]>([])

    // 이미지 마이그레이션
    const [migrating, setMigrating] = useState(false)
    const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null)

    // cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
        }
    }, [])

    // Category filter
    const [filterCategory, setFilterCategory] = useState<string>('all')

    // Pagination
    const [worksPage, setWorksPage] = useState(1)
    const filteredProjects = filterCategory === 'all'
        ? projects
        : projects.filter(p => p.category.toLowerCase() === filterCategory)
    const worksTotalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE))
    const pagedProjects = filteredProjects.slice((worksPage - 1) * PAGE_SIZE, worksPage * PAGE_SIZE)

    // 히어로 슬라이더 등록된 프로젝트
    const heroProjects = projects.filter(p => p.isHero)

    useEffect(() => {
        if (isAuth) { loadProjects() }
    }, [isAuth])

    const loadProjects = () => getProjects().then(setProjects)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
            localStorage.setItem(STORAGE_KEY, '1')
            setIsAuth(true)
            setMsg('')
        } else {
            setMsg('비밀번호가 올바르지 않습니다.')
        }
    }

    // Works Upload
    const handleWorksUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (files.length === 0) return setMsg('이미지를 선택해 주세요.')
        setLoading(true)

        try {
            await createProject(
                { title, category, year, description, isHero, mainImageIndex },
                files
            )
            setTitle(''); setCategory('medical'); setYear(new Date().getFullYear().toString()); setDescription(''); setFiles([]); setIsHero(false); setMainImageIndex(0)
            setMsg('프로젝트가 등록되었습니다!')
            loadProjects()
        } catch { setMsg('업로드 실패') }
        setLoading(false)
    }

    const handleDeleteProject = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? (히어로 슬라이더에서도 함께 삭제됩니다)')) return
        await deleteProject(id)
        loadProjects()
    }

    // 편집 모달
    const openEditModal = (p: Project) => {
        setEditingProject(p)
        setEditForm({
            title: p.title,
            category: p.category,
            year: p.year || '',
            description: p.description || '',
            isHero: !!p.isHero,
        })
        const imgs = p.images?.length > 0 ? [...p.images] : (p.image ? [p.image] : [])
        setEditImages(imgs)
        setEditRemovedUrls([])
        setEditNewFiles([])
        setEditMainImage(p.image || imgs[0] || '')
        setEditMsg('')
    }

    const closeEditModal = useCallback(() => {
        setEditingProject(null)
        setEditRemovedUrls([])
        setEditNewFiles([])
        setEditMsg('')
    }, [])

    // ESC 키로 모달 닫기
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEditModal() }
        if (editingProject) window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [editingProject, closeEditModal])

    const handleEditRemoveImage = (url: string) => {
        setEditImages(prev => prev.filter(u => u !== url))
        setEditRemovedUrls(prev => [...prev, url])
        if (editMainImage === url) {
            const remaining = editImages.filter(u => u !== url)
            setEditMainImage(remaining[0] || '')
        }
    }

    const handleEditAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setEditNewFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }

    const handleEditRemoveNewFile = (index: number) => {
        setEditNewFiles(prev => prev.filter((_, i) => i !== index))
    }

    const saveEdit = async () => {
        if (!editingProject) return
        setLoading(true)
        setEditMsg('')
        try {
            const hasImageChanges = editRemovedUrls.length > 0 || editNewFiles.length > 0
            await updateProject(
                editingProject.id,
                editForm,
                hasImageChanges ? {
                    removedImageUrls: editRemovedUrls,
                    newImageFiles: editNewFiles,
                    mainImageUrl: editMainImage || undefined,
                } : undefined
            )
            closeEditModal()
            setMsg('프로젝트가 수정되었습니다!')
            loadProjects()
        } catch {
            setEditMsg('수정 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // 히어로 토글
    const handleToggleHero = async (id: string) => {
        await toggleProjectHero(id)
        loadProjects()
    }

    const handleLogout = () => {
        localStorage.removeItem(STORAGE_KEY)
        setIsAuth(false)
    }

    const handleMigrate = async () => {
        if (!confirm('기존 이미지의 최적화 variant(_md, _sm, _blur)를 일괄 생성합니다. 진행하시겠습니까?')) return
        setMigrating(true)
        setMigrationProgress(null)
        try {
            const result = await migrateExistingImages((progress) => {
                setMigrationProgress(progress)
            })
            setMsg(`마이그레이션 완료: ${result.migrated}건 생성, ${result.skipped}건 건너뜀, ${result.failed}건 실패`)
        } catch {
            setMsg('마이그레이션 중 오류가 발생했습니다.')
        } finally {
            setMigrating(false)
            setMigrationProgress(null)
        }
    }

    const createTrackedUrl = (file: File): string => {
        const url = URL.createObjectURL(file)
        objectUrlsRef.current.push(url)
        return url
    }

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
            setMainImageIndex(0)
        }
    }

    if (!isAuth) {
        return (
            <main className="pt-28 pb-20 px-8 page-enter flex items-center justify-center min-h-screen">
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
                    <h1 className="font-display text-3xl font-bold text-center">Admin Login</h1>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Password" required
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-gold" />
                    {msg && <p className="text-red-500 text-xs text-center">{msg}</p>}
                    <button type="submit" className="w-full bg-charcoal text-white py-3 text-xs uppercase tracking-[3px] hover:bg-gold transition-colors rounded-sm flex items-center justify-center gap-2 cursor-pointer border-none font-bold">
                        <LogIn size={14} /> Sign In
                    </button>
                </form>
            </main>
        )
    }

    return (
        <>
        <main className="pt-28 pb-20 px-8 page-enter">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={handleMigrate} disabled={migrating}
                            className="flex items-center gap-2 text-warm-gray hover:text-gold text-xs cursor-pointer border border-gray-200 hover:border-gold bg-transparent px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50 uppercase tracking-widest font-bold">
                            <RefreshCw size={12} className={migrating ? 'animate-spin' : ''} />
                            {migrating ? (migrationProgress ? `${migrationProgress.current}/${migrationProgress.total}` : '...') : '이미지 최적화'}
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 text-warm-gray hover:text-charcoal text-sm cursor-pointer border-none bg-transparent">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>

                {/* ===== 히어로 슬라이더 관리 섹션 ===== */}
                {heroProjects.length > 0 && (
                    <div className="bg-gradient-to-r from-gold/5 to-gold/10 p-6 rounded-sm border border-gold/20 mb-8">
                        <h2 className="text-sm uppercase tracking-[3px] text-gold mb-4 flex items-center gap-2">
                            <Layers size={14} /> 메인 히어로 슬라이더 ({heroProjects.length})
                        </h2>
                        <p className="text-[10px] text-warm-gray mb-4 uppercase tracking-widest">현재 메인화면 슬라이더에 노출 중인 프로젝트입니다. 체크를 해제하면 슬라이더에서 제거됩니다.</p>
                        <div className="space-y-2">
                            {heroProjects.map(p => (
                                <div key={p.id} className="flex items-center gap-4 bg-white/80 px-4 py-3 rounded-sm">
                                    <img src={getAdminThumbUrl(p.image)} alt={p.title} className="w-12 h-12 object-cover rounded-sm shrink-0 border border-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">{p.title}</h3>
                                        <div className="text-[10px] text-warm-gray uppercase tracking-widest">
                                            {p.category} · {p.year}
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggleHero(p.id)}
                                        className="flex items-center gap-1.5 bg-gold/10 hover:bg-red-50 text-gold hover:text-red-500 text-[10px] px-3 py-1.5 rounded-sm cursor-pointer border border-gold/20 hover:border-red-200 transition-all uppercase tracking-widest font-bold whitespace-nowrap">
                                        <StarOff size={12} /> 슬라이더 해제
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== 프로젝트 등록 폼 ===== */}
                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-100 mb-12">
                    <h2 className="text-sm uppercase tracking-[3px] text-gold mb-6 flex items-center gap-2">
                        <Plus size={14} /> 프로젝트 등록
                    </h2>
                    <p className="text-xs text-warm-gray mb-6">Works 서브페이지에 표시될 프로젝트를 등록합니다. '히어로 슬라이더 노출' 체크 시 메인화면 슬라이더에도 추가됩니다.</p>
                    <form onSubmit={handleWorksUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="프로젝트 제목" required
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold">
                                    <option value="medical">Medical</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="residence">Residence</option>
                                </select>
                                <input type="text" value={year} onChange={e => setYear(e.target.value)}
                                    placeholder="연도" required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold" />
                            </div>
                        </div>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            rows={3} placeholder="설명"
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold resize-none" />

                        <div className="flex items-center gap-2 py-2">
                            <input type="checkbox" id="isHero" checked={isHero} onChange={e => setIsHero(e.target.checked)}
                                className="w-4 h-4 accent-gold cursor-pointer" />
                            <label htmlFor="isHero" className="text-sm text-charcoal cursor-pointer font-medium">메인 히어로 슬라이더에 노출</label>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-sm p-6 text-center cursor-pointer hover:border-gold transition-colors"
                            onClick={() => document.getElementById('worksFileInput')?.click()}>
                            <Upload size={24} className="mx-auto mb-2 text-warm-gray" />
                            <p className="text-xs text-warm-gray">
                                {files.length > 0
                                    ? `${files.length}개 파일 선택됨`
                                    : '클릭하여 이미지를 선택하세요 (여러 장 가능)'}
                            </p>
                            <input id="worksFileInput" type="file" accept="image/*" multiple className="hidden"
                                onChange={handleFilesChange} />
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-warm-gray font-bold">대표 이미지(메인 노출)를 선택하세요:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {files.map((f, i) => (
                                        <div key={i} onClick={() => setMainImageIndex(i)}
                                            className={`relative w-20 h-20 rounded-sm overflow-hidden border-2 cursor-pointer transition-all ${mainImageIndex === i ? 'border-gold shadow-md scale-105' : 'border-gray-200 opacity-60'}`}>
                                            <img src={createTrackedUrl(f)} alt="" className="w-full h-full object-cover" />
                                            {mainImageIndex === i && (
                                                <div className="absolute top-0 left-0 bg-gold text-white text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-tighter">Main</div>
                                            )}
                                            <button type="button" onClick={(e) => {
                                                e.stopPropagation();
                                                const newFiles = files.filter((_, idx) => idx !== i);
                                                setFiles(newFiles);
                                                if (mainImageIndex === i) setMainImageIndex(0);
                                                else if (mainImageIndex > i) setMainImageIndex(mainImageIndex - 1);
                                            }}
                                                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer border-none leading-none">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg && <p className={`text-xs ${msg.includes('실패') || msg.includes('올바르지') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full bg-charcoal text-white py-4 text-xs uppercase tracking-[3px] hover:bg-gold transition-colors rounded-sm disabled:opacity-50 cursor-pointer border-none font-bold">
                            {loading ? 'Uploading...' : '프로젝트 등록하기'}
                        </button>
                    </form>
                </div>

                {/* ===== 프로젝트 목록 ===== */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h2 className="text-sm uppercase tracking-[3px] text-warm-gray flex items-center gap-2">
                        <Filter size={14} /> Registered Projects ({filteredProjects.length})
                    </h2>
                    <div className="flex gap-1">
                        {CATEGORIES.map(c => (
                            <button key={c.key}
                                onClick={() => { setFilterCategory(c.key); setWorksPage(1); }}
                                className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-sm cursor-pointer transition-all border ${filterCategory === c.key
                                    ? 'bg-charcoal text-white border-charcoal'
                                    : 'bg-white text-warm-gray border-gray-200 hover:border-charcoal hover:text-charcoal'
                                    }`}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {pagedProjects.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-sm border border-gray-100 relative group">
                            {p.isHero && (
                                <div className="absolute top-2 right-12 bg-gold/10 text-gold text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-gold/20 flex items-center gap-1">
                                    <Layers size={8} /> Hero
                                </div>
                            )}
                            <div className="flex gap-4">
                                <img src={getAdminThumbUrl(p.image)} alt={p.title} className="w-20 h-20 object-cover rounded-sm shrink-0 border border-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm truncate">{p.title}</h3>
                                    <div className="flex gap-2 items-center text-[10px] text-gold uppercase tracking-widest font-bold mb-1">
                                        <span>{p.category}</span>
                                        <span className="text-warm-gray/30">|</span>
                                        <span className="text-warm-gray">{p.year}</span>
                                    </div>
                                    <p className="text-[11px] text-warm-gray line-clamp-2 leading-relaxed">{p.description}</p>
                                    {p.images && p.images.length > 1 && (
                                        <p className="text-[9px] text-warm-gray/50 mt-1 uppercase font-bold tracking-tighter">{p.images.length} images</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button onClick={() => handleToggleHero(p.id)}
                                        title={p.isHero ? '히어로 해제' : '히어로 등록'}
                                        className={`w-7 h-7 flex items-center justify-center rounded-sm cursor-pointer border transition-colors ${p.isHero
                                            ? 'bg-gold/10 text-gold border-gold/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                                            : 'bg-gray-50 text-warm-gray/40 border-gray-200 hover:bg-gold/10 hover:text-gold hover:border-gold/20'
                                            }`}>
                                        {p.isHero ? <Star size={12} /> : <StarOff size={12} />}
                                    </button>
                                    <button onClick={() => openEditModal(p)}
                                        className="w-7 h-7 flex items-center justify-center rounded-sm text-warm-gray hover:text-charcoal cursor-pointer border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                        <Edit3 size={12} />
                                    </button>
                                    <button onClick={() => handleDeleteProject(p.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-sm text-warm-gray hover:text-red-500 cursor-pointer border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            {p.images && p.images.length > 1 && (
                                <div className="flex gap-1 mt-3 overflow-x-auto pb-1 invisible group-hover:visible transition-all">
                                    {p.images.map((img, i) => (
                                        <img key={i} src={getAdminThumbUrl(img)} alt="" className={`w-10 h-10 object-cover rounded-sm shrink-0 border ${img === p.image ? 'border-gold' : 'border-gray-100 opacity-60'}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {worksTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <button onClick={() => setWorksPage(p => Math.max(1, p - 1))} disabled={worksPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-sm border border-gray-200 text-warm-gray hover:text-charcoal hover:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white">
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: worksTotalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setWorksPage(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-medium cursor-pointer transition-colors border-none ${p === worksPage ? 'bg-charcoal text-white' : 'bg-white border border-gray-200 text-warm-gray hover:text-charcoal hover:border-charcoal'
                                    }`}>{p}</button>
                        ))}
                        <button onClick={() => setWorksPage(p => Math.min(worksTotalPages, p + 1))} disabled={worksPage === worksTotalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-sm border border-gray-200 text-warm-gray hover:text-charcoal hover:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </main>

        {/* ===== 편집 모달 ===== */}
        {editingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* 배경 오버레이 */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal} />

                {/* 모달 본체 */}
                <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <span className="text-[10px] uppercase tracking-[3px] text-gold font-bold flex items-center gap-2">
                            <Edit3 size={12} /> 프로젝트 편집
                        </span>
                        <button onClick={closeEditModal} className="text-warm-gray hover:text-charcoal cursor-pointer border-none bg-transparent transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* 편집 폼 */}
                    <div className="px-6 py-5 space-y-4">
                        <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="프로젝트 제목"
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold" />
                        <div className="grid grid-cols-2 gap-4">
                            <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold">
                                <option value="medical">Medical</option>
                                <option value="commercial">Commercial</option>
                                <option value="residence">Residence</option>
                            </select>
                            <input type="text" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                                placeholder="연도"
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold" />
                        </div>
                        <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            rows={3} placeholder="설명"
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm text-gray-900 focus:outline-none focus:border-gold resize-none" />

                        {/* 이미지 관리 */}
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-[3px] text-warm-gray font-bold">이미지 관리</p>

                            {/* 기존 이미지 */}
                            {editImages.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {editImages.map((url, i) => (
                                        <div key={i} className={`relative rounded-sm overflow-hidden border-2 ${editMainImage === url ? 'border-gold' : 'border-gray-200'}`}>
                                            <img src={getAdminThumbUrl(url)} alt={`이미지 ${i + 1}`} className="w-full aspect-square object-cover" />
                                            {/* 대표 배지 */}
                                            {editMainImage === url && (
                                                <div className="absolute top-0.5 left-0.5 bg-gold text-white text-[8px] px-1 py-0.5 rounded-sm font-bold">대표</div>
                                            )}
                                            {/* 컨트롤 버튼 — 항상 표시 */}
                                            <div className="absolute bottom-0 inset-x-0 flex justify-center gap-1 bg-black/40 py-1">
                                                <button onClick={() => setEditMainImage(url)} title="대표 이미지로 설정"
                                                    className={`p-1 rounded-full border-none cursor-pointer transition-colors ${editMainImage === url ? 'bg-gold text-white' : 'bg-white/90 text-charcoal hover:bg-gold hover:text-white'}`}>
                                                    <Star size={10} />
                                                </button>
                                                <button onClick={() => handleEditRemoveImage(url)} title="삭제"
                                                    className="p-1 rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white border-none cursor-pointer transition-colors">
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 새로 추가된 이미지 */}
                            {editNewFiles.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {editNewFiles.map((file, i) => (
                                        <div key={`new-${i}`} className="relative rounded-sm overflow-hidden border-2 border-dashed border-green-400">
                                            <img src={createTrackedUrl(file)} alt={`새 이미지 ${i + 1}`} className="w-full aspect-square object-cover" />
                                            <div className="absolute top-0.5 left-0.5 bg-green-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-bold">NEW</div>
                                            <div className="absolute bottom-0 inset-x-0 flex justify-center bg-black/40 py-1">
                                                <button onClick={() => handleEditRemoveNewFile(i)} title="제거"
                                                    className="p-1 rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white border-none cursor-pointer transition-colors">
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-sm text-xs text-warm-gray hover:border-gold hover:text-gold cursor-pointer transition-colors">
                                <ImagePlus size={14} />
                                이미지 추가
                                <input type="file" multiple accept="image/*" onChange={handleEditAddFiles} className="hidden" />
                            </label>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                            <input type="checkbox" id="editIsHero" checked={editForm.isHero} onChange={e => setEditForm({ ...editForm, isHero: e.target.checked })}
                                className="w-4 h-4 accent-gold cursor-pointer" />
                            <label htmlFor="editIsHero" className="text-sm text-charcoal cursor-pointer">메인 히어로 슬라이더에 노출</label>
                        </div>

                        {/* 결과 메시지 */}
                        {editMsg && (
                            <p className={`text-xs ${editMsg.includes('오류') ? 'text-red-500' : 'text-green-600'}`}>{editMsg}</p>
                        )}

                        {/* 액션 버튼 */}
                        <div className="flex gap-3 pt-1">
                            <button onClick={saveEdit} disabled={loading}
                                className="flex-1 bg-gold text-white py-3 text-[10px] uppercase tracking-[3px] rounded-sm cursor-pointer border-none font-bold flex items-center justify-center gap-2 hover:bg-gold/90 transition-colors disabled:opacity-50">
                                <Check size={13} /> {loading ? '저장 중...' : '저장'}
                            </button>
                            <button onClick={closeEditModal}
                                className="flex-1 bg-gray-100 text-warm-gray py-3 text-[10px] uppercase tracking-[3px] rounded-sm cursor-pointer border-none font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                                <X size={13} /> 취소
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
    )
}
