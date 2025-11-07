import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { getActiveSubscription, cancelSubscription } from '@/lib/queries/subscriptions'
import { stripe } from '@/lib/stripe/client'

export const runtime = 'nodejs'

/**
 * POST /api/stripe/cancel
 * Cancel a user's active subscription
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active subscription
    const subscription = await getActiveSubscription(userId)

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    if (!subscription.payment_provider_id) {
      return NextResponse.json(
        { error: 'Subscription does not have a payment provider ID' },
        { status: 400 }
      )
    }

    // Cancel subscription in Stripe (cancel at period end)
    try {
      await stripe.subscriptions.update(subscription.payment_provider_id, {
        cancel_at_period_end: true,
      })
    } catch (stripeError: any) {
      console.error('Error canceling subscription in Stripe:', stripeError)
      // Continue to cancel in database even if Stripe call fails
    }

    // Update subscription status in database
    await cancelSubscription(subscription.id)

    return NextResponse.json({ success: true, message: 'Subscription canceled successfully' })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    )
  }
}

