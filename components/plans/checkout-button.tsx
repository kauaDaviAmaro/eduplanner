'use client'

import { useTransition } from 'react'
import { initiateCheckout } from '@/app/actions/subscriptions'
import { formatPrice } from '@/lib/stripe/config'

interface CheckoutButtonProps {
  tierId: number
  price: number
  isCurrentTier?: boolean
  isFree?: boolean
}

export function CheckoutButton({ tierId, price, isCurrentTier, isFree }: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleCheckout = () => {
    startTransition(async () => {
      try {
        await initiateCheckout(tierId)
      } catch (error) {
        console.error('Error initiating checkout:', error)
      }
    })
  }

  if (isCurrentTier) {
    return (
      <button
        disabled
        className="w-full rounded-lg bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 cursor-not-allowed"
      >
        Plano Atual
      </button>
    )
  }

  if (isFree) {
    return (
      <button
        onClick={handleCheckout}
        disabled={isPending}
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Processando...' : 'Ativar Plano Grátis'}
      </button>
    )
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isPending}
      className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Processando...' : `Assinar por ${formatPrice(price * 100)}/mês`}
    </button>
  )
}


