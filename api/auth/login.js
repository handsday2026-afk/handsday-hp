// Vercel Serverless Function - Admin 로그인
// 배포 시 Vercel이 자동으로 서버리스 함수로 처리합니다.
export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { password } = req.body || {}
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (password === adminPassword) {
        res.status(200).json({ success: true, token: 'admin_authenticated' })
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' })
    }
}
