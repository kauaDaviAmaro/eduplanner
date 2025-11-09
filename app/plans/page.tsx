import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getActiveSubscription } from '@/lib/queries/subscriptions'
import { PlansGrid } from '@/components/plans/plans-grid'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

interface PlansPageProps {
  searchParams: Promise<{
    success?: string
    canceled?: string
    error?: string
    session_id?: string
  }>
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    session = null
  }

  const params = await searchParams
  const success = params.success === 'true'
  const canceled = params.canceled === 'true'
  const error = params.error

  const tiers = await getAllTiers()

  let currentTierId: number | undefined
  let userName: string | null = null
  let isAdmin = false

  if (session?.user) {
    const profile = await getCurrentUserProfile()
    if (profile) {
      currentTierId = profile.tier_id
      userName = profile.name
      isAdmin = session.user.isAdmin || false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={userName} 
        currentPath="/plans"
        isAdmin={isAdmin}
        currentTierId={currentTierId}
        tiers={tiers}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal para Você
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Desbloqueie todo o potencial da plataforma com nossos planos flexíveis.
            Cancele a qualquer momento.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-8 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-600 mr-2"
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
              <p className="text-sm font-medium text-green-800">
                Assinatura realizada com sucesso! Você já pode acessar todos os recursos do seu plano.
              </p>
            </div>
          </div>
        )}

        {canceled && (
          <div className="mb-8 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-yellow-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-medium text-yellow-800">
                Checkout cancelado. Nenhuma cobrança foi realizada.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">
                {error === 'missing_tier' && 'Tier não especificado.'}
                {error === 'invalid_tier' && 'Tier inválido.'}
                {error === 'tier_not_found' && 'Tier não encontrado.'}
                {error === 'already_subscribed' && 'Você já possui uma assinatura ativa para este plano.'}
                {error === 'checkout_failed' && 'Erro ao processar checkout. Tente novamente.'}
                {error === 'free_tier_activated' && 'Plano gratuito ativado com sucesso!'}
                {!['missing_tier', 'invalid_tier', 'tier_not_found', 'already_subscribed', 'checkout_failed', 'free_tier_activated'].includes(error) && `Erro: ${error}`}
              </p>
            </div>
          </div>
        )}

        {/* Login CTA for non-authenticated users */}
        {!session?.user && (
          <div className="mb-8 rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
            <p className="text-sm text-blue-800 mb-4">
              Faça login para assinar um plano e começar a aprender hoje mesmo!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/login?redirect=/plans`}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Fazer Login
              </Link>
              <Link
                href={`/signup?redirect=/plans`}
                className="rounded-lg border-2 border-purple-600 px-6 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <PlansGrid tiers={tiers} currentTierId={currentTierId} />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Você continuará tendo acesso até o final do período pago.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Como funciona o upgrade de plano?
              </h3>
              <p className="text-gray-600">
                Ao fazer upgrade, você terá acesso imediato aos recursos do novo plano. A cobrança será ajustada proporcionalmente.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quais métodos de pagamento são aceitos?
              </h3>
              <p className="text-gray-600">
                Aceitamos cartões de crédito e débito através do Stripe, uma plataforma segura de pagamentos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

