import { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { queryOne } from '@/lib/db/client'
import bcrypt from 'bcryptjs'

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required for Docker and development environments
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await queryOne<{
          id: string
          email: string
          name: string | null
          password: string | null
        }>(
          `SELECT u.id, u.email, u.name, 
                  (SELECT password FROM accounts WHERE user_id = u.id AND type = 'credentials' LIMIT 1) as password
           FROM users u
           WHERE u.email = $1`,
          [credentials.email as string]
        )

        if (!user) {
          return null
        }

        if (!user.password) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const profile = await queryOne<{
          tier_id: number
          is_admin: boolean
          permission_level: number
        }>(
          `SELECT p.tier_id, p.is_admin, t.permission_level
           FROM profiles p
           INNER JOIN tiers t ON p.tier_id = t.id
           WHERE p.id = $1`,
          [user.id]
        )

        if (profile) {
          token.tierId = profile.tier_id
          token.isAdmin = profile.is_admin
          token.permissionLevel = profile.permission_level
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.tierId = token.tierId as number
        session.user.isAdmin = token.isAdmin as boolean
        session.user.permissionLevel = token.permissionLevel as number
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}

