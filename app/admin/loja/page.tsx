import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getFileProducts } from '@/lib/queries/file-products'
import { getProducts } from '@/lib/queries/products'
import { getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import { ProductsAdminList } from '@/components/admin/products-admin-list'
import Link from 'next/link'

export default async function AdminLojaPage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const [fileProducts, products, tiers, profile] = await Promise.all([
    getFileProducts(true), // Include inactive
    getProducts(true), // Include inactive
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null}
        currentPath="/admin/loja"
        isAdmin={true}
        currentTierId={profile?.tier_id}
        tiers={tiers}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento da Loja</h1>
            <p className="text-gray-600">Gerencie produtos individuais e bundles da loja</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/loja/file-product/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Novo Produto Individual
            </Link>
            <Link
              href="/admin/loja/product/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Novo Bundle
            </Link>
          </div>
        </div>

        <ProductsAdminList fileProducts={fileProducts} products={products} />
      </main>
    </div>
  )
}

