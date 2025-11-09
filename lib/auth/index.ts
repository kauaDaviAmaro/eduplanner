import NextAuth from 'next-auth'
import { authConfig } from './config'
import { PostgresAdapter } from './adapter'

const getSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  
  if (!secret && process.env.NEXT_PHASE === 'phase-production-build') {
    return 'temp-build-secret'
  }
  
  const isRealProduction = 
    process.env.NODE_ENV === 'production' && 
    process.env.NEXTAUTH_URL && 
    !process.env.NEXTAUTH_URL.includes('localhost') &&
    !process.env.NEXTAUTH_URL.includes('127.0.0.1')
  
  if (!secret && isRealProduction) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET environment variable is required in production. Please set it in your environment variables.')
  }
  
  if (!secret) {
    if (globalThis.window === undefined) {
      const defaultSecret = 'changeme-me-super-hard-secret'
      console.warn('⚠️  AUTH_SECRET/NEXTAUTH_SECRET not set. Using default secret. For production, set AUTH_SECRET in your .env.local or docker-compose.yml')
      return defaultSecret
    }
    return 'dev-secret-temp'
  }
  
  return secret
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  secret: getSecret(),
  adapter: PostgresAdapter(),
})

