'use client'

import { useState, useTransition } from 'react'
import { cancelActiveSubscription } from '@/app/actions/subscriptions'
import { useRouter } from 'next/navigation'

interface CancelSubscriptionButtonProps {
  subscriptionId: string
  tierName: string
}

export function CancelSubscriptionButton({ subscriptionId, tierName }: CancelSubscriptionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleCancel = () => {
    setMessage(null)
    setShowConfirm(true)
  }

  const handleConfirmCancel = () => {
    startTransition(async () => {
      const result = await cancelActiveSubscription()
      if (result.success) {
        setMessage({ type: 'success', text: 'Assinatura cancelada com sucesso!' })
        setShowConfirm(false)
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao cancelar assinatura' })
        setShowConfirm(false)
      }
    })
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
    setMessage(null)
  }

  if (showConfirm) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelar Assinatura</h3>
        <p className="text-gray-600 mb-4">
          Tem certeza que deseja cancelar sua assinatura do plano <strong>{tierName}</strong>?
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            Sua assinatura será cancelada ao final do período atual. Você continuará tendo acesso até a data de vencimento.
          </span>
        </p>

        {message && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            onClick={handleConfirmCancel}
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </button>
          <button
            onClick={handleCancelConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Assinatura Ativa</h3>
          <p className="text-sm text-gray-600">
            Você possui uma assinatura ativa do plano <strong>{tierName}</strong>
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
        >
          Cancelar Plano
        </button>
      </div>
    </div>
  )
}

