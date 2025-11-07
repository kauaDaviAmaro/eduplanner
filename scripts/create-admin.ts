#!/usr/bin/env tsx
/**
 * Create Default Admin Users
 * 
 * Usage:
 *   npm run create-admin
 *   or
 *   tsx scripts/create-admin.ts
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env file if it exists
try {
  const envPath = join(process.cwd(), '.env')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      const value = valueParts.join('=').trim()
      if (key && value && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  // .env file doesn't exist, that's okay
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

interface AdminUser {
  email: string
  password: string
  name: string
}

// Default admin users
const defaultAdmins: AdminUser[] = [
  {
    email: 'admin@eduplanner.com',
    password: 'admin123',
    name: 'Administrador',
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin Example',
  },
]

async function createAdmin(admin: AdminUser): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [admin.email]
    )

    if (existingUser.rows.length > 0) {
      const userId = existingUser.rows[0].id
      
      // Check if profile exists
      const existingProfile = await client.query(
        'SELECT id FROM profiles WHERE id = $1',
        [userId]
      )

      if (existingProfile.rows.length > 0) {
        // Update profile to be admin
        await client.query(
          `UPDATE profiles 
           SET is_admin = true, updated_at = NOW()
           WHERE id = $1`,
          [userId]
        )
      } else {
        // Profile doesn't exist, create it
        const tierResult = await client.query(
          'SELECT id FROM tiers ORDER BY permission_level ASC LIMIT 1'
        )
        
        if (tierResult.rows.length === 0) {
          throw new Error('No tier found. Please run migrations first.')
        }
        
        const tierId = tierResult.rows[0].id
        
        await client.query(
          `INSERT INTO profiles (id, email, name, tier_id, is_admin, created_at, updated_at)
           VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
          [userId, admin.email, admin.name, tierId]
        )
      }

      // Check if account exists, if not create it
      const existingAccount = await client.query(
        'SELECT id FROM accounts WHERE user_id = $1 AND type = $2',
        [userId, 'credentials']
      )

      if (existingAccount.rows.length === 0) {
        // Hash password
        const hashedPassword = await bcrypt.hash(admin.password, 10)
        
        // Create account with password
        await client.query(
          `INSERT INTO accounts (
            user_id, type, provider, provider_account_id,
            password, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [userId, 'credentials', 'credentials', userId, hashedPassword]
        )
      } else {
        // Update password
        const hashedPassword = await bcrypt.hash(admin.password, 10)
        await client.query(
          `UPDATE accounts 
           SET password = $1, updated_at = NOW()
           WHERE user_id = $2 AND type = $3`,
          [hashedPassword, userId, 'credentials']
        )
      }

      console.log(`✅ Admin atualizado: ${admin.email}`)
    } else {
      // Create new user
      const userId = uuidv4()
      const hashedPassword = await bcrypt.hash(admin.password, 10)

      // Create user
      await client.query(
        `INSERT INTO users (id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, admin.email, admin.name]
      )

      // Get default tier (lowest permission_level)
      const tierResult = await client.query(
        'SELECT id FROM tiers ORDER BY permission_level ASC LIMIT 1'
      )

      if (tierResult.rows.length === 0) {
        throw new Error('No tier found. Please run migrations first.')
      }

      const tierId = tierResult.rows[0].id

      // Create profile as admin (trigger may have already created it, so use ON CONFLICT)
      await client.query(
        `INSERT INTO profiles (id, email, name, tier_id, is_admin, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE 
         SET is_admin = true, email = $2, name = $3, updated_at = NOW()`,
        [userId, admin.email, admin.name, tierId]
      )

      // Create account with password
      await client.query(
        `INSERT INTO accounts (
          user_id, type, provider, provider_account_id,
          password, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [userId, 'credentials', 'credentials', userId, hashedPassword]
      )

      console.log(`✅ Admin criado: ${admin.email}`)
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  console.log('🚀 Criando administradores padrão...\n')

  try {
    for (const admin of defaultAdmins) {
      await createAdmin(admin)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Senha: ${admin.password}\n`)
    }

    console.log('✨ Administradores criados com sucesso!')
    console.log('\n📝 Credenciais padrão:')
    defaultAdmins.forEach((admin) => {
      console.log(`   ${admin.email} / ${admin.password}`)
    })
  } catch (error) {
    console.error('❌ Erro ao criar administradores:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

