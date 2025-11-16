import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import {
  createSubscription,
  updateSubscriptionByStripeId,
  getSubscriptionByStripeId,
  updateUserTier,
} from '@/lib/queries/subscriptions'
import {
  createFilePurchase,
  getFilePurchaseByPaymentIntentId,
} from '@/lib/queries/file-products'
import {
  createProductPurchase,
  getProductPurchaseByPaymentIntentId,
} from '@/lib/queries/products'
import Stripe from 'stripe'

export const runtime = 'nodejs'

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Handle subscription checkouts
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const userId = subscription.metadata?.userId || session.metadata?.userId
          const tierId = subscription.metadata?.tierId || session.metadata?.tierId

          if (!userId || !tierId) {
            console.error('Missing userId or tierId in subscription metadata')
            break
          }

          // Check if subscription already exists
          const existingSubscription = await getSubscriptionByStripeId(subscription.id)

          if (!existingSubscription) {
            // Create new subscription
            const nextBillingDate = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined

            await createSubscription(
              userId,
              parseInt(tierId, 10),
              subscription.id,
              subscription.status === 'active' ? 'active' : 'past_due',
              nextBillingDate
            )

            // Update user tier
            await updateUserTier(userId, parseInt(tierId, 10))
          }
        }
        // Handle one-time payment checkouts (file products and bundles)
        else if (session.mode === 'payment' && session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          )

          // Only process if payment was successful
          if (paymentIntent.status !== 'succeeded') {
            break
          }

          const userId = session.metadata?.userId
          const type = session.metadata?.type

          if (!userId) {
            console.error('Missing userId in session metadata')
            break
          }

          const amountPaid = paymentIntent.amount / 100 // Convert from cents

          // Handle file product purchase
          if (type === 'file_product') {
            const fileProductId = session.metadata?.fileProductId
            if (!fileProductId) {
              console.error('Missing fileProductId in session metadata')
              break
            }

            // Check if purchase already exists
            const existingPurchase = await getFilePurchaseByPaymentIntentId(paymentIntent.id)
            if (!existingPurchase) {
              await createFilePurchase(userId, fileProductId, paymentIntent.id, amountPaid)
            }
          }
          // Handle bundle purchase
          else if (type === 'product') {
            const productId = session.metadata?.productId
            if (!productId) {
              console.error('Missing productId in session metadata')
              break
            }

            // Check if purchase already exists
            const existingPurchase = await getProductPurchaseByPaymentIntentId(paymentIntent.id)
            if (!existingPurchase) {
              await createProductPurchase(userId, productId, paymentIntent.id, amountPaid)
            }
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Get the checkout session from payment intent metadata
        const sessionId = paymentIntent.metadata?.session_id
        if (!sessionId) {
          // If no session_id, try to find purchase by payment intent ID
          const filePurchase = await getFilePurchaseByPaymentIntentId(paymentIntent.id)
          const productPurchase = await getProductPurchaseByPaymentIntentId(paymentIntent.id)
          
          if (!filePurchase && !productPurchase) {
            console.log('Payment intent succeeded but no matching purchase found')
          }
          break
        }

        // Retrieve the session to get metadata
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        const userId = session.metadata?.userId
        const type = session.metadata?.type

        if (!userId) {
          console.error('Missing userId in session metadata')
          break
        }

        const amountPaid = paymentIntent.amount / 100 // Convert from cents

        // Handle file product purchase
        if (type === 'file_product') {
          const fileProductId = session.metadata?.fileProductId
          if (!fileProductId) {
            console.error('Missing fileProductId in session metadata')
            break
          }

          // Check if purchase already exists
          const existingPurchase = await getFilePurchaseByPaymentIntentId(paymentIntent.id)
          if (!existingPurchase) {
            await createFilePurchase(userId, fileProductId, paymentIntent.id, amountPaid)
          }
        }
        // Handle bundle purchase
        else if (type === 'product') {
          const productId = session.metadata?.productId
          if (!productId) {
            console.error('Missing productId in session metadata')
            break
          }

          // Check if purchase already exists
          const existingPurchase = await getProductPurchaseByPaymentIntentId(paymentIntent.id)
          if (!existingPurchase) {
            await createProductPurchase(userId, productId, paymentIntent.id, amountPaid)
          }
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        const userId = subscription.metadata?.userId
        const tierId = subscription.metadata?.tierId

        if (!userId || !tierId) {
          console.error('Missing userId or tierId in subscription metadata')
          break
        }

        // Check if subscription already exists
        const existingSubscription = await getSubscriptionByStripeId(subscription.id)

        if (!existingSubscription) {
          const nextBillingDate = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined

          await createSubscription(
            userId,
            parseInt(tierId, 10),
            subscription.id,
            subscription.status === 'active' ? 'active' : 'past_due',
            nextBillingDate
          )

          // Update user tier
          await updateUserTier(userId, parseInt(tierId, 10))
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const userId = subscription.metadata?.userId
        const tierId = subscription.metadata?.tierId

        if (!userId || !tierId) {
          console.error('Missing userId or tierId in subscription metadata')
          break
        }

        // Update subscription status
        const nextBillingDate = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined

        let status: 'active' | 'past_due' | 'canceled' = 'active'
        if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
          status = 'canceled'
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          status = 'past_due'
        }

        await updateSubscriptionByStripeId(subscription.id, status, nextBillingDate)

        // Update user tier if subscription is active
        if (status === 'active') {
          await updateUserTier(userId, parseInt(tierId, 10))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status to canceled
        await updateSubscriptionByStripeId(subscription.id, 'canceled')

        // Note: We don't downgrade the user tier here automatically
        // This allows them to keep access until the period ends
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
  }
}





