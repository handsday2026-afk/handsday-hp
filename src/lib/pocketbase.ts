import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_PB_URL

if (!pbUrl) {
    console.warn('VITE_PB_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.')
}

export const pb = new PocketBase(pbUrl || '')
