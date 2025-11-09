import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

/**
 * Check if we're in build phase
 */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build' ||
         (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY)
}

/**
 * Get Stripe client instance (lazy initialization)
 * This prevents errors during build time when environment variables may not be available
 * The validation will happen at runtime when the Stripe API is actually called
 */
function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    // During build, allow creation with placeholder to avoid errors
    // At runtime, Stripe will validate the key when used
    if (!secretKey && !isBuildPhase()) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    
    // Use placeholder during build, actual key at runtime
    stripeInstance = new Stripe(secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

/**
 * Export stripe with lazy initialization
 * The actual Stripe client is only created when first accessed at runtime
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance()
    const value = instance[prop as keyof Stripe]
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})


