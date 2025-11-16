import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId, getCurrentUser } from '@/lib/auth/helpers'
import { getFileProductById, hasFilePurchase } from '@/lib/queries/file-products'
import { stripe } from '@/lib/stripe/client'
import { getBaseUrl } from '@/lib/stripe/config'

export const runtime = 'nodejs'

/**
 * POST /api/stripe/checkout-file
 * Create a Stripe Checkout session for file product (one-time payment)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileProductId } = body

    if (!fileProductId) {
      return NextResponse.json({ error: 'File product ID is required' }, { status: 400 })
    }

    // Get file product information
    const fileProduct = await getFileProductById(fileProductId)
    if (!fileProduct) {
      return NextResponse.json({ error: 'File product not found' }, { status: 404 })
    }

    if (!fileProduct.is_active) {
      return NextResponse.json({ error: 'File product is not available' }, { status: 400 })
    }

    // Check if user already purchased this file
    const alreadyPurchased = await hasFilePurchase(fileProductId, userId)
    if (alreadyPurchased) {
      return NextResponse.json(
        { error: 'You already purchased this file' },
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
              name: fileProduct.title,
              description: fileProduct.description || undefined,
            },
            unit_amount: Math.round(fileProduct.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId,
        fileProductId,
        type: 'file_product',
      },
      success_url: `${baseUrl}/loja/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/loja?canceled=true`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating file checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/checkout-file
 * Redirect to checkout (for server actions)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      const searchParams = request.nextUrl.searchParams
      const fileProductId = searchParams.get('fileProductId')
      return NextResponse.redirect(
        new URL(`/login?redirect=/loja&fileProductId=${fileProductId}`, request.url)
      )
    }

    const searchParams = request.nextUrl.searchParams
    const fileProductIdParam = searchParams.get('fileProductId')

    if (!fileProductIdParam) {
      return NextResponse.redirect(new URL('/loja?error=missing_file_product', request.url))
    }

    // Get file product information
    const fileProduct = await getFileProductById(fileProductIdParam)
    if (!fileProduct) {
      return NextResponse.redirect(new URL('/loja?error=file_product_not_found', request.url))
    }

    if (!fileProduct.is_active) {
      return NextResponse.redirect(new URL('/loja?error=file_product_unavailable', request.url))
    }

    // Check if user already purchased this file
    const alreadyPurchased = await hasFilePurchase(fileProductIdParam, userId)
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
              name: fileProduct.title,
              description: fileProduct.description || undefined,
            },
            unit_amount: Math.round(fileProduct.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId,
        fileProductId: fileProductIdParam,
        type: 'file_product',
      },
      success_url: `${baseUrl}/loja/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/loja?canceled=true`,
    })

    if (!session.url) {
      return NextResponse.redirect(new URL('/loja?error=checkout_failed', request.url))
    }

    return NextResponse.redirect(session.url)
  } catch (error: any) {
    console.error('Error creating file checkout session:', error)
    return NextResponse.redirect(new URL('/loja?error=checkout_failed', request.url))
  }
}

