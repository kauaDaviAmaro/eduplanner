import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getFileProductsWithPurchaseStatus } from '@/lib/queries/file-products'
import { getProductsWithPurchaseStatus } from '@/lib/queries/products'
import { LojaPageClient } from '@/components/shop/loja-page-client'
import { Navbar } from '@/components/layout/navbar'

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

  // Calculate price range
  const allPrices = [
    ...fileProducts.map((p) => p.price),
    ...products.map((p) => p.price),
  ]
  const priceRange = {
    min: allPrices.length > 0 ? Math.floor(Math.min(...allPrices)) : 0,
    max: allPrices.length > 0 ? Math.ceil(Math.max(...allPrices)) : 1000,
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      fileProducts
        .filter((p) => p.tags && p.tags.length > 0)
        .flatMap((p) => p.tags || [])
    )
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={userName}
        currentPath="/loja"
        isAdmin={isAdmin}
        currentTierId={currentTierId}
        tiers={tiers}
      />
      <LojaPageClient
        fileProducts={fileProducts}
        products={products}
        isAuthenticated={isAuthenticated}
        canceled={canceled}
        error={error}
        priceRange={priceRange}
        availableTags={allTags}
      />
    </div>
  )
}
