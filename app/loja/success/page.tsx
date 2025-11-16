import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string
  }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    redirect('/login')
  }

  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams
  const sessionId = params.session_id

  const [tiers] = await Promise.all([
    getAllTiers(),
  ])

  const profile = await getCurrentUserProfile()
  if (!profile) {
    redirect('/login')
  }

  const currentTierId = profile.tier_id
  const userName = profile.name
  const isAdmin = session.user.isAdmin || false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={userName} 
        currentPath="/loja"
        isAdmin={isAdmin}
        currentTierId={currentTierId}
        tiers={tiers}
      />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
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
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compra Realizada com Sucesso!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Obrigado pela sua compra! Você já tem acesso permanente aos arquivos adquiridos.
          </p>

          {sessionId && (
            <p className="text-sm text-gray-500 mb-8">
              ID da sessão: {sessionId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/loja"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Continuar Comprando
            </Link>
            <Link
              href="/files"
              className="rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
            >
              Ver Meus Arquivos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

