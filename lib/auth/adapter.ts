import { Adapter } from 'next-auth/adapters'
import { query, queryOne } from '@/lib/db/client'
import { v4 as uuidv4 } from 'uuid'

// Helper function to get user by ID
async function getUserById(id: string) {
  const user = await queryOne<{
    id: string
    name: string | null
    email: string
    email_verified: Date | null
    image: string | null
    created_at: Date
    updated_at: Date
  }>(
    `SELECT id, name, email, email_verified, image, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  )

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.email_verified,
    image: user.image,
  }
}

export function PostgresAdapter(): Adapter {
  return {
    async createUser(user) {
      const userId = uuidv4()
      const now = new Date()

      await query(
        `INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, user.name, user.email, user.emailVerified, now, now]
      )

      return {
        id: userId,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      }
    },

    async getUser(id) {
      return getUserById(id)
    },

    async getUserByEmail(email) {
      const user = await queryOne<{
        id: string
        name: string | null
        email: string
        email_verified: Date | null
        image: string | null
        created_at: Date
        updated_at: Date
      }>(
        `SELECT id, name, email, email_verified, image, created_at, updated_at
         FROM users
         WHERE email = $1`,
        [email]
      )

      if (!user) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        image: user.image,
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await queryOne<{ user_id: string }>(
        `SELECT user_id
         FROM accounts
         WHERE provider = $1 AND provider_account_id = $2`,
        [provider, providerAccountId]
      )

      if (!account) return null

      return getUserById(account.user_id)
    },

    async updateUser(user) {
      const now = new Date()
      await query(
        `UPDATE users
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             email_verified = COALESCE($3, email_verified),
             image = COALESCE($4, image),
             updated_at = $5
         WHERE id = $6`,
        [user.name, user.email, user.emailVerified, user.image, now, user.id]
      )

      return getUserById(user.id) as Promise<any>
    },

    async linkAccount(account) {
      const accountId = uuidv4()
      const now = new Date()

      await query(
        `INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at, token_type,
          scope, id_token, session_state, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          accountId,
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token || null,
          account.access_token || null,
          account.expires_at || null,
          account.token_type || null,
          account.scope || null,
          account.id_token || null,
          account.session_state || null,
          now,
          now,
        ]
      )

      return account
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await query(
        `DELETE FROM accounts
         WHERE provider = $1 AND provider_account_id = $2`,
        [provider, providerAccountId]
      )
    },

    async createSession({ sessionToken, userId, expires }) {
      const sessionId = uuidv4()
      const now = new Date()

      await query(
        `INSERT INTO sessions (id, session_token, user_id, expires, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, sessionToken, userId, expires, now, now]
      )

      return {
        sessionToken,
        userId,
        expires,
      }
    },

    async getSessionAndUser(sessionToken) {
      const session = await queryOne<{
        id: string
        session_token: string
        user_id: string
        expires: Date
        created_at: Date
        updated_at: Date
      }>(
        `SELECT id, session_token, user_id, expires, created_at, updated_at
         FROM sessions
         WHERE session_token = $1`,
        [sessionToken]
      )

      if (!session) return null

      if (session.expires < new Date()) {
        await query(
          `DELETE FROM sessions WHERE session_token = $1`,
          [sessionToken]
        )
        return null
      }

      const user = await getUserById(session.user_id)
      if (!user) return null

      return {
        session: {
          sessionToken: session.session_token,
          userId: session.user_id,
          expires: session.expires,
        },
        user,
      }
    },

    async updateSession({ sessionToken, ...data }) {
      const now = new Date()
      await query(
        `UPDATE sessions
         SET expires = COALESCE($1, expires),
             updated_at = $2
         WHERE session_token = $3`,
        [data.expires, now, sessionToken]
      )

      const session = await queryOne<{
        session_token: string
        user_id: string
        expires: Date
      }>(
        `SELECT session_token, user_id, expires
         FROM sessions
         WHERE session_token = $1`,
        [sessionToken]
      )

      if (!session) return null

      return {
        sessionToken: session.session_token,
        userId: session.user_id,
        expires: session.expires,
      }
    },

    async deleteSession(sessionToken) {
      await query(
        `DELETE FROM sessions WHERE session_token = $1`,
        [sessionToken]
      )
    },

    async createVerificationToken({ identifier, expires, token }) {
      await query(
        `INSERT INTO verification_tokens (identifier, token, expires)
         VALUES ($1, $2, $3)
         ON CONFLICT (identifier, token) DO UPDATE
         SET expires = $3`,
        [identifier, token, expires]
      )

      return {
        identifier,
        token,
        expires,
      }
    },

    async useVerificationToken({ identifier, token }) {
      const verificationToken = await queryOne<{
        identifier: string
        token: string
        expires: Date
      }>(
        `SELECT identifier, token, expires
         FROM verification_tokens
         WHERE identifier = $1 AND token = $2`,
        [identifier, token]
      )

      if (!verificationToken) return null

      await query(
        `DELETE FROM verification_tokens
         WHERE identifier = $1 AND token = $2`,
        [identifier, token]
      )

      return verificationToken
    },
  }
}

