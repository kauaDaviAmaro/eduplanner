import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getProductWithDetails } from '@/lib/queries/products'
import { getAllAttachmentsForAdmin } from '@/lib/queries/admin'
import { getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import { ProductForm } from '@/components/admin/product-form'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const { id } = await params
  const [product, attachments, tiers, profile] = await Promise.all([
    getProductWithDetails(id),
    getAllAttachmentsForAdmin(),
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  if (!product) {
    redirect('/admin/loja')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null}
        currentPath="/admin/loja"
        isAdmin={true}
        currentTierId={profile?.tier_id}
        tiers={tiers}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Bundle</h1>
          <p className="text-gray-600">Edite as informações do bundle</p>
        </div>

        <ProductForm product={product} attachments={attachments} tiers={tiers} />
      </main>
    </div>
  )
}

