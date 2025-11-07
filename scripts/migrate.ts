#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Automatically runs all migrations in order
 * 
 * Usage:
 *   npm run migrate
 *   or
 *   tsx scripts/migrate.ts
 */

import { Pool } from 'pg'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

// Migration tracking table
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  );
`

async function getAppliedMigrations(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version')
    return result.rows.map((row) => row.version)
  } catch (error: any) {
    // Table doesn't exist yet, return empty array
    if (error.code === '42P01') {
      return []
    }
    throw error
  }
}

async function markMigrationApplied(version: string): Promise<void> {
  await pool.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version])
}

async function runMigration(filePath: string, version: string): Promise<void> {
  const sql = await readFile(filePath, 'utf-8')
  
  console.log(`📦 Running migration: ${version}...`)
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await markMigrationApplied(version)
    await client.query('COMMIT')
    console.log(`✅ Migration ${version} applied successfully`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`❌ Error applying migration ${version}:`, error)
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n')

  try {
    // Create migration tracking table
    await pool.query(MIGRATION_TABLE)
    console.log('✅ Migration tracking table ready\n')

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations()
    console.log(`📋 Applied migrations: ${appliedMigrations.length}\n`)

    // Read migration files
    const migrationsDir = join(process.cwd(), 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort() // Sort alphabetically (001, 002, 003...)

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found in migrations/ directory')
      return
    }

    console.log(`📁 Found ${migrationFiles.length} migration file(s)\n`)

    // Run pending migrations
    let appliedCount = 0
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '')
      
      if (appliedMigrations.includes(version)) {
        console.log(`⏭️  Skipping ${version} (already applied)`)
        continue
      }

      const filePath = join(migrationsDir, file)
      await runMigration(filePath, version)
      appliedCount++
      console.log('')
    }

    if (appliedCount === 0) {
      console.log('✨ All migrations are up to date!')
    } else {
      console.log(`✨ Successfully applied ${appliedCount} migration(s)`)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

