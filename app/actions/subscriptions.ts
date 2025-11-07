'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { isAdmin } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { getTierById, updateUserTier, getActiveSubscription, cancelSubscription } from '@/lib/queries/subscriptions'
import { stripe } from '@/lib/stripe/client'

/**
 * Server action to initiate checkout for a tier
 */
export async function initiateCheckout(tierId: number) {
  const userId = await getCurrentUserId()

  if (!userId) {
    redirect('/login?redirect=/plans')
  }

  // Verify tier exists
  const tier = await getTierById(tierId)
  if (!tier) {
    throw new Error('Tier not found')
  }

  // Redirect to checkout API route
  redirect(`/api/stripe/checkout?tierId=${tierId}`)
}

/**
 * Change user's tier (admin only - for testing purposes)
 */
export async function changeOwnTier(tierId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return { success: false, error: 'Acesso negado: apenas administradores podem realizar esta ação' }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verify tier exists
    const tier = await getTierById(tierId)
    if (!tier) {
      return { success: false, error: 'Tier não encontrado' }
    }

    // Update user's tier
    await updateUserTier(userId, tierId)

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    revalidatePath('/')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao alterar tier' }
  }
}

/**
 * Cancel user's active subscription
 */
export async function cancelActiveSubscription(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Get active subscription
    const subscription = await getActiveSubscription(userId)

    if (!subscription) {
      return { success: false, error: 'Nenhuma assinatura ativa encontrada' }
    }

    if (!subscription.payment_provider_id) {
      return { success: false, error: 'Assinatura não possui ID do provedor de pagamento' }
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

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    revalidatePath('/')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao cancelar assinatura' }
  }
}

