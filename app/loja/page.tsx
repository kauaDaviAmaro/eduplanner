import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getFileProductsWithPurchaseStatus } from '@/lib/queries/file-products'
import { getProductsWithPurchaseStatus } from '@/lib/queries/products'
import { ProductsGrid } from '@/components/shop/products-grid'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

interface LojaPageProps {
  searchParams: Promise<{
    canceled?: string
    error?: string
    fileProductId?: string
    productId?: string
  }>
}

export default async function LojaPage({ searchParams }: LojaPageProps) {
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
  const canceled = params.canceled === 'true'
  const error = params.error

  // Get products (visible to everyone, even non-logged users)
  const [fileProducts, products, tiers] = await Promise.all([
    getFileProductsWithPurchaseStatus(),
    getProductsWithPurchaseStatus(),
    getAllTiers(),
  ])

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

  const isAuthenticated = !!session?.user

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={userName} 
        currentPath="/loja"
        isAdmin={isAdmin}
        currentTierId={currentTierId}
        tiers={tiers}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Loja de Jogos e Arquivos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compre arquivos individuais ou bundles completos. Acesso permanente após a compra.
          </p>
        </div>

        {/* Error Messages */}
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
                Compra cancelada. Nenhuma cobrança foi realizada.
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
                {error === 'missing_file_product' && 'Produto não especificado.'}
                {error === 'file_product_not_found' && 'Produto não encontrado.'}
                {error === 'file_product_unavailable' && 'Produto não está disponível.'}
                {error === 'missing_product' && 'Bundle não especificado.'}
                {error === 'product_not_found' && 'Bundle não encontrado.'}
                {error === 'product_unavailable' && 'Bundle não está disponível.'}
                {error === 'already_purchased' && 'Você já comprou este produto.'}
                {error === 'checkout_failed' && 'Erro ao processar checkout. Tente novamente.'}
                {!['missing_file_product', 'file_product_not_found', 'file_product_unavailable', 'missing_product', 'product_not_found', 'product_unavailable', 'already_purchased', 'checkout_failed'].includes(error) && `Erro: ${error}`}
              </p>
            </div>
          </div>
        )}

        {/* Login CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
            <p className="text-sm text-blue-800 mb-4">
              Faça login para comprar produtos e ter acesso permanente aos arquivos!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/login?redirect=/loja`}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Fazer Login
              </Link>
              <Link
                href={`/signup?redirect=/loja`}
                className="rounded-lg border-2 border-purple-600 px-6 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <ProductsGrid
          fileProducts={fileProducts}
          products={products}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}

