import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllAttachmentsForAdmin } from '@/lib/queries/admin'
import { getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import { ProductForm } from '@/components/admin/product-form'

export default async function NewProductPage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const [attachments, tiers, profile] = await Promise.all([
    getAllAttachmentsForAdmin(),
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Bundle</h1>
          <p className="text-gray-600">Crie um novo bundle com múltiplos arquivos</p>
        </div>

        <ProductForm attachments={attachments} tiers={tiers} />
      </main>
    </div>
  )
}

