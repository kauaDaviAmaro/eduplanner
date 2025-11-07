import type { Subscription } from '@/lib/queries/dashboard'
import type { ProfileWithTier } from '@/lib/queries/profiles'
import Link from 'next/link'

export function TierStatus({
  subscription,
  profile,
}: Readonly<{
  subscription: Subscription | null
  profile: ProfileWithTier | null
}>) {
  if (!profile) {
    return null
  }

  const tier = profile.tier
  const nextBillingDate = subscription?.next_billing_date
    ? new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')
    : null

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Seu Plano</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">{tier.name}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status:</span>
          <span
            className={`font-semibold ${
              subscription?.status === 'active' ? 'text-green-600' : 'text-yellow-600'
            }`}
          >
            {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        {nextBillingDate && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Próxima cobrança:</span>
            <span className="font-semibold text-gray-900">{nextBillingDate}</span>
          </div>
        )}
      </div>

      {tier.permission_level < 3 && (
        <Link
          href="/plans"
          className="mt-4 block text-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          Fazer Upgrade
        </Link>
      )}
    </div>
  )
}

