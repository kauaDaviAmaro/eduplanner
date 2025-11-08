'use client'

import { useState, useTransition } from 'react'
import { changeOwnTier } from '@/app/actions/subscriptions'
import type { Tier } from '@/lib/queries/subscriptions'

interface TierSelectorProps {
  tiers: Tier[]
  currentTierId: number
}

export function TierSelector({ tiers, currentTierId }: TierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const currentTier = tiers.find(t => t.id === currentTierId)

  const handleTierChange = (tierId: number) => {
    if (tierId === currentTierId) {
      setIsOpen(false)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await changeOwnTier(tierId)
      if (result.success) {
        setIsOpen(false)
        // Refresh the page to update the tier display
        window.location.reload()
      } else {
        setError(result.error || 'Erro ao alterar tier')
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-purple-300 bg-purple-50 text-sm font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Mudar tier (Admin)"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
        <span>{currentTier?.name || 'Tier'}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-gray-200 shadow-lg z-50">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Selecionar Tier
              </div>
              {error && (
                <div className="px-3 py-2 mb-2 text-xs text-red-600 bg-red-50 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                {tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => handleTierChange(tier.id)}
                    disabled={isPending || tier.id === currentTierId}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                      tier.id === currentTierId
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tier.name}</span>
                      {tier.id === currentTierId && (
                        <svg
                          className="h-4 w-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    {tier.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {tier.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


