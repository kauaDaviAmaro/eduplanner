import NextAuth from 'next-auth'
import { authConfig } from './config'
import { PostgresAdapter } from './adapter'

// Get secret with proper fallback handling
// NextAuth v5 supports both AUTH_SECRET (preferred) and NEXTAUTH_SECRET (backward compatibility)
const getSecret = () => {
  // Check for AUTH_SECRET first (NextAuth v5 preferred), then NEXTAUTH_SECRET (backward compatibility)
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  
  // During build phase, use temporary secret if not set
  if (!secret && process.env.NEXT_PHASE === 'phase-production-build') {
    return 'temp-build-secret'
  }
  
  // Check if we're in a real production environment (not localhost)
  const isRealProduction = 
    process.env.NODE_ENV === 'production' && 
    process.env.NEXTAUTH_URL && 
    !process.env.NEXTAUTH_URL.includes('localhost') &&
    !process.env.NEXTAUTH_URL.includes('127.0.0.1')
  
  // Only throw error in real production environments (not Docker localhost)
  if (!secret && isRealProduction) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET environment variable is required in production. Please set it in your environment variables.')
  }
  
  // For Docker/local development (NODE_ENV=production but localhost), use default or warn
  if (!secret) {
    // Check if we're in a server context (not browser)
    if (globalThis.window === undefined) {
      const defaultSecret = 'changeme-me-super-hard-secret'
      console.warn('⚠️  AUTH_SECRET/NEXTAUTH_SECRET not set. Using default secret. For production, set AUTH_SECRET in your .env.local or docker-compose.yml')
      return defaultSecret
    }
    // Browser context shouldn't reach here, but just in case
    return 'dev-secret-temp'
  }
  
  return secret
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  secret: getSecret(),
  adapter: PostgresAdapter(),
})

