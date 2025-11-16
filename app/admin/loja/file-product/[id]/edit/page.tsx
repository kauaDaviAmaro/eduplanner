import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getFileProductById } from '@/lib/queries/file-products'
import { getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import { FileProductForm } from '@/components/admin/file-product-form'

interface EditFileProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditFileProductPage({ params }: EditFileProductPageProps) {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const { id } = await params
  const [fileProduct, tiers, profile] = await Promise.all([
    getFileProductById(id),
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  if (!fileProduct) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Produto Individual</h1>
          <p className="text-gray-600">Edite as informações do produto</p>
        </div>

        <FileProductForm fileProduct={fileProduct} />
      </main>
    </div>
  )
}

