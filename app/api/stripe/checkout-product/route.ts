import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId, getCurrentUser } from '@/lib/auth/helpers'
import { getProductById, hasProductPurchase } from '@/lib/queries/products'
import { stripe } from '@/lib/stripe/client'
import { getBaseUrl } from '@/lib/stripe/config'

export const runtime = 'nodejs'

/**
 * POST /api/stripe/checkout-product
 * Create a Stripe Checkout session for product bundle (one-time payment)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get product information
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.is_active) {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
    }

    // Check if user already purchased this bundle
    const alreadyPurchased = await hasProductPurchase(productId, userId)
    if (alreadyPurchased) {
      return NextResponse.json(
        { error: 'You already purchased this bundle' },
        { status: 400 }
      )
    }

    // Get user email
    const user = await getCurrentUser()
    const customerEmail = user?.email || undefined

    // Create Stripe Checkout Session (one-time payment, not subscription)
    const baseUrl = getBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: product.title,
              description: product.description || undefined,
            },
            unit_amount: Math.round(product.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId,
        productId,
        type: 'product',
      },
      success_url: `${baseUrl}/loja/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/loja?canceled=true`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating product checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/checkout-product
 * Redirect to checkout (for server actions)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      const searchParams = request.nextUrl.searchParams
      const productId = searchParams.get('productId')
      return NextResponse.redirect(
        new URL(`/login?redirect=/loja&productId=${productId}`, request.url)
      )
    }

    const searchParams = request.nextUrl.searchParams
    const productIdParam = searchParams.get('productId')

    if (!productIdParam) {
      return NextResponse.redirect(new URL('/loja?error=missing_product', request.url))
    }

    // Get product information
    const product = await getProductById(productIdParam)
    if (!product) {
      return NextResponse.redirect(new URL('/loja?error=product_not_found', request.url))
    }

    if (!product.is_active) {
      return NextResponse.redirect(new URL('/loja?error=product_unavailable', request.url))
    }

    // Check if user already purchased this bundle
    const alreadyPurchased = await hasProductPurchase(productIdParam, userId)
    if (alreadyPurchased) {
      return NextResponse.redirect(new URL('/loja?error=already_purchased', request.url))
    }

    // Get user email
    const user = await getCurrentUser()
    const customerEmail = user?.email || undefined

    // Create Stripe Checkout Session
    const baseUrl = getBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: product.title,
              description: product.description || undefined,
            },
            unit_amount: Math.round(product.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId,
        productId: productIdParam,
        type: 'product',
      },
      success_url: `${baseUrl}/loja/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/loja?canceled=true`,
    })

    if (!session.url) {
      return NextResponse.redirect(new URL('/loja?error=checkout_failed', request.url))
    }

    return NextResponse.redirect(session.url)
  } catch (error: any) {
    console.error('Error creating product checkout session:', error)
    return NextResponse.redirect(new URL('/loja?error=checkout_failed', request.url))
  }
}

