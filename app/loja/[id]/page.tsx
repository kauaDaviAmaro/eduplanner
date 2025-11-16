import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { getFileProductById } from '@/lib/queries/file-products'
import { getFileProductImages } from '@/lib/queries/file-product-images'
import { getFileProductsWithPurchaseStatus } from '@/lib/queries/file-products'
import { FileProductDetail } from '@/components/shop/file-product-detail'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

interface FileProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FileProductPage({ params }: FileProductPageProps) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    session = null
  }

  const { id } = await params

  // Get product details
  const product = await getFileProductById(id)
  if (!product) {
    redirect('/loja?error=file_product_not_found')
  }

  if (!product.is_active) {
    redirect('/loja?error=file_product_unavailable')
  }

  // Get product images
  const images = await getFileProductImages(id)

  // Get purchase status
  let productWithPurchaseStatus
  if (session?.user) {
    const products = await getFileProductsWithPurchaseStatus()
    productWithPurchaseStatus = products.find((p) => p.id === id)
  }

  if (!productWithPurchaseStatus) {
    productWithPurchaseStatus = { ...product, is_purchased: false }
  }

  // Get user info for navbar
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

  const tiers = await getAllTiers()
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

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/loja" className="hover:text-purple-600 transition-colors">
              Loja
            </Link>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <FileProductDetail
        product={productWithPurchaseStatus}
        images={images}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}

