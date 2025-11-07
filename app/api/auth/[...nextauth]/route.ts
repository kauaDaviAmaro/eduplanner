import { handlers } from '@/lib/auth'

// Force Node.js runtime (not Edge) for NextAuth.js
export const runtime = 'nodejs'

export const { GET, POST } = handlers

