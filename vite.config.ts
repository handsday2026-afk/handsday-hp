import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
    // 모든 환경변수 로드 (VITE_ 접두사 없는 것도 포함)
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [
            react(),
            tailwindcss(),
            // 로컬 개발용: /api/auth/login 엔드포인트 처리
            {
                name: 'dev-auth-api',
                configureServer(server) {
                    server.middlewares.use('/api/auth/login', (req, res) => {
                        if (req.method === 'OPTIONS') {
                            res.setHeader('Access-Control-Allow-Origin', '*')
                            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
                            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
                            res.statusCode = 200
                            res.end()
                            return
                        }
                        if (req.method === 'POST') {
                            let body = ''
                            req.on('data', (chunk: Buffer) => { body += chunk.toString() })
                            req.on('end', () => {
                                try {
                                    const { password } = JSON.parse(body)
                                    const adminPassword = env.ADMIN_PASSWORD || 'admin123'
                                    res.setHeader('Content-Type', 'application/json')
                                    if (password === adminPassword) {
                                        res.end(JSON.stringify({ success: true, token: 'admin_authenticated' }))
                                    } else {
                                        res.statusCode = 401
                                        res.end(JSON.stringify({ success: false, message: 'Invalid password' }))
                                    }
                                } catch {
                                    res.statusCode = 400
                                    res.end(JSON.stringify({ error: 'Invalid request' }))
                                }
                            })
                        } else {
                            res.statusCode = 405
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ error: 'Method not allowed' }))
                        }
                    })
                },
            },
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 5173,
            // proxy 제거됨 - Supabase는 클라이언트에서 직접 연결
        },
    }
})
