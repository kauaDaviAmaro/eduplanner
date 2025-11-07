'use client'

import { CheckoutButton } from './checkout-button'
import { formatPrice } from '@/lib/stripe/config'
import type { Tier } from '@/lib/queries/subscriptions'

interface PlanCardProps {
  tier: Tier
  isCurrentTier?: boolean
  isPopular?: boolean
}

export function PlanCard({ tier, isCurrentTier, isPopular }: PlanCardProps) {
  const isFree = tier.price_monthly === 0

  return (
    <div
      className={`relative rounded-2xl border-2 p-8 transition-all ${
        isPopular
          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-xl scale-105'
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1 text-xs font-bold text-white">
            Mais Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
        <div className="mb-4">
          {isFree ? (
            <div className="text-4xl font-bold text-gray-900">Grátis</div>
          ) : (
            <>
              <div className="text-4xl font-bold text-gray-900">
                {formatPrice(tier.price_monthly * 100)}
              </div>
              <div className="text-sm text-gray-600">por mês</div>
            </>
          )}
        </div>
        {tier.description && (
          <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
          <span className="text-sm text-gray-700">
            Acesso a cursos do nível {tier.permission_level}
          </span>
        </div>
        {tier.download_limit !== null ? (
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
            <span className="text-sm text-gray-700">
              {tier.download_limit} downloads por mês
            </span>
          </div>
        ) : (
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
            <span className="text-sm text-gray-700">Downloads ilimitados</span>
          </div>
        )}
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
          <span className="text-sm text-gray-700">Certificados de conclusão</span>
        </div>
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
          <span className="text-sm text-gray-700">Suporte por email</span>
        </div>
      </div>

      <CheckoutButton
        tierId={tier.id}
        price={tier.price_monthly}
        isCurrentTier={isCurrentTier}
        isFree={isFree}
      />
    </div>
  )
}

