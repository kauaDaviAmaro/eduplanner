import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId, getCurrentUser } from '@/lib/auth/helpers'
import { getTierById, getActiveSubscription, updateUserTier } from '@/lib/queries/subscriptions'
import { stripe } from '@/lib/stripe/client'
import { getBaseUrl } from '@/lib/stripe/config'
import { createSubscription } from '@/lib/queries/subscriptions'

export const runtime = 'nodejs'

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tierId } = body

    if (!tierId) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 })
    }

    // Get tier information
    const tier = await getTierById(tierId)
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    // Skip checkout for free tier
    if (tier.price_monthly === 0) {
      // Update user tier directly
      await updateUserTier(userId, tierId)
      return NextResponse.json({ success: true, message: 'Tier updated successfully' })
    }

    // Check if user already has an active subscription
    const existingSubscription = await getActiveSubscription(userId)
    if (existingSubscription && existingSubscription.tier_id === tierId) {
      return NextResponse.json(
        { error: 'You already have an active subscription for this tier' },
        { status: 400 }
      )
    }

    // Get user email
    const user = await getCurrentUser()
    const customerEmail = user?.email || undefined

    // Create Stripe Checkout Session
    const baseUrl = getBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: tier.name,
              description: tier.description || undefined,
            },
            unit_amount: Math.round(tier.price_monthly * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId,
        tierId: tierId.toString(),
      },
      success_url: `${baseUrl}/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/plans?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          tierId: tierId.toString(),
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/checkout
 * Redirect to checkout (for server actions)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.redirect(new URL('/login?redirect=/plans', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const tierIdParam = searchParams.get('tierId')

    if (!tierIdParam) {
      return NextResponse.redirect(new URL('/plans?error=missing_tier', request.url))
    }

    const tierId = parseInt(tierIdParam, 10)
    if (isNaN(tierId)) {
      return NextResponse.redirect(new URL('/plans?error=invalid_tier', request.url))
    }

    // Get tier information
    const tier = await getTierById(tierId)
    if (!tier) {
      return NextResponse.redirect(new URL('/plans?error=tier_not_found', request.url))
    }

    // Skip checkout for free tier
    if (tier.price_monthly === 0) {
      await updateUserTier(userId, tierId)
      return NextResponse.redirect(new URL('/plans?success=free_tier_activated', request.url))
    }

    // Check if user already has an active subscription
    const existingSubscription = await getActiveSubscription(userId)
    if (existingSubscription && existingSubscription.tier_id === tierId) {
      return NextResponse.redirect(new URL('/plans?error=already_subscribed', request.url))
    }

    // Get user email
    const user = await getCurrentUser()
    const customerEmail = user?.email || undefined

    // Create Stripe Checkout Session
    const baseUrl = getBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: tier.name,
              description: tier.description || undefined,
            },
            unit_amount: Math.round(tier.price_monthly * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId,
        tierId: tierId.toString(),
      },
      success_url: `${baseUrl}/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/plans?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          tierId: tierId.toString(),
        },
      },
    })

    if (!session.url) {
      return NextResponse.redirect(new URL('/plans?error=checkout_failed', request.url))
    }

    return NextResponse.redirect(session.url)
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.redirect(new URL('/plans?error=checkout_failed', request.url))
  }
}

