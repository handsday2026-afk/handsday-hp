const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Ensure directories
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// JSON Databases
const PROJECTS_DB = path.join(dataDir, 'projects.json');
const HERO_DB = path.join(dataDir, 'hero.json');

function readJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer config - multiple files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ===== Auth =====
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// ===== Projects (Works) - Multiple images =====
app.get('/api/projects', (req, res) => {
    let projects = readJSON(PROJECTS_DB);
    if (req.query.category) {
        projects = projects.filter(p => p.category === req.query.category);
    }
    res.json(projects);
});

app.post('/api/projects', upload.array('images', 20), (req, res) => {
    const { title, category, description, isHero, mainImageIndex, year } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    // 대표 이미지 설정 (기본값 0)
    const mIdx = parseInt(mainImageIndex) || 0;
    const mainImage = images[mIdx] || (images.length > 0 ? images[0] : '');

    const project = {
        id: crypto.randomBytes(8).toString('hex'),
        title,
        category,
        description,
        year: year || new Date().getFullYear().toString(),
        image: mainImage,
        images,
        isHero: isHero === 'true',
        createdAt: new Date().toISOString(),
    };
    const projects = readJSON(PROJECTS_DB);
    projects.unshift(project); // 최신 항목이 앞으로
    writeJSON(PROJECTS_DB, projects);
    res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
    let projects = readJSON(PROJECTS_DB);
    const target = projects.find(p => p.id === req.params.id);
    if (target) {
        const allImages = target.images || (target.image ? [target.image] : []);
        allImages.forEach(img => {
            const filePath = path.join(uploadsDir, path.basename(img));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    }
    projects = projects.filter(p => p.id !== req.params.id);
    writeJSON(PROJECTS_DB, projects);
    res.json({ success: true });
});

// 프로젝트 수정 (텍스트 필드만 - 이미지 교체는 미지원)
app.put('/api/projects/:id', (req, res) => {
    const projects = readJSON(PROJECTS_DB);
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const { title, category, description, year, isHero, mainImageIndex } = req.body;
    if (title !== undefined) projects[idx].title = title;
    if (category !== undefined) projects[idx].category = category;
    if (description !== undefined) projects[idx].description = description;
    if (year !== undefined) projects[idx].year = year;
    if (isHero !== undefined) projects[idx].isHero = isHero;
    if (mainImageIndex !== undefined && projects[idx].images && projects[idx].images.length > 0) {
        const mIdx = parseInt(mainImageIndex) || 0;
        projects[idx].image = projects[idx].images[mIdx] || projects[idx].images[0];
    }

    writeJSON(PROJECTS_DB, projects);
    res.json(projects[idx]);
});

// 히어로 토글 (간편)
app.patch('/api/projects/:id/hero', (req, res) => {
    const projects = readJSON(PROJECTS_DB);
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    projects[idx].isHero = !projects[idx].isHero;
    writeJSON(PROJECTS_DB, projects);
    res.json(projects[idx]);
});

// ===== Hero Slider (Derived from Projects) =====
app.get('/api/hero', (req, res) => {
    const projects = readJSON(PROJECTS_DB);
    const heroItems = projects
        .filter(p => p.isHero)
        .map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            year: p.year,
            description: p.description,
            image: p.image,
            projectId: p.id // 연결용
        }));
    res.json(heroItems);
});

app.listen(PORT, () => {
    console.log(`✅ HANDSDAY API Server running on http://localhost:${PORT}`);
});
