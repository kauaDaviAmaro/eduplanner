import { queryOne, queryMany } from '@/lib/db/client'
import { Database } from '@/types/database'

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Tier = Database['public']['Tables']['tiers']['Row']

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const subscription = await queryOne<Subscription>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1 AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  )

  return subscription
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  const subscription = await queryOne<Subscription>(
    `SELECT * FROM subscriptions
     WHERE payment_provider_id = $1
     LIMIT 1`,
    [stripeSubscriptionId]
  )

  return subscription
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const subscriptions = await queryMany<Subscription>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  )

  return subscriptions
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  userId: string,
  tierId: number,
  stripeSubscriptionId: string,
  status: 'active' | 'past_due' | 'canceled' = 'active',
  nextBillingDate?: Date
): Promise<Subscription> {
  const subscription = await queryOne<Subscription>(
    `INSERT INTO subscriptions (user_id, tier_id, status, payment_provider_id, next_billing_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [userId, tierId, status, stripeSubscriptionId, nextBillingDate || null]
  )

  if (!subscription) {
    throw new Error('Failed to create subscription')
  }

  return subscription
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'active' | 'past_due' | 'canceled',
  nextBillingDate?: Date
): Promise<Subscription> {
  const subscription = await queryOne<Subscription>(
    `UPDATE subscriptions
     SET status = $1, next_billing_date = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, nextBillingDate || null, subscriptionId]
  )

  if (!subscription) {
    throw new Error('Failed to update subscription')
  }

  return subscription
}

/**
 * Update subscription by Stripe ID
 */
export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  status: 'active' | 'past_due' | 'canceled',
  nextBillingDate?: Date
): Promise<Subscription | null> {
  const subscription = await queryOne<Subscription>(
    `UPDATE subscriptions
     SET status = $1, next_billing_date = $2, updated_at = NOW()
     WHERE payment_provider_id = $3
     RETURNING *`,
    [status, nextBillingDate || null, stripeSubscriptionId]
  )

  return subscription
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
  const subscription = await queryOne<Subscription>(
    `UPDATE subscriptions
     SET status = 'canceled', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [subscriptionId]
  )

  if (!subscription) {
    throw new Error('Failed to cancel subscription')
  }

  return subscription
}

/**
 * Get all tiers
 */
export async function getAllTiers(): Promise<Tier[]> {
  const tiers = await queryMany<Tier>(
    `SELECT * FROM tiers ORDER BY permission_level ASC`
  )

  return tiers
}

/**
 * Get tier by ID
 */
export async function getTierById(tierId: number): Promise<Tier | null> {
  const tier = await queryOne<Tier>(
    `SELECT * FROM tiers WHERE id = $1`,
    [tierId]
  )

  return tier
}

/**
 * Update user's tier
 */
export async function updateUserTier(userId: string, tierId: number): Promise<void> {
  await queryOne(
    `UPDATE profiles
     SET tier_id = $1, updated_at = NOW()
     WHERE id = $2`,
    [tierId, userId]
  )
}




