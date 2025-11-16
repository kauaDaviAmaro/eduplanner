import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllAttachmentsForAdmin } from '@/lib/queries/admin'
import { getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import { FileProductForm } from '@/components/admin/file-product-form'

export default async function NewFileProductPage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const [attachments, tiers, profile] = await Promise.all([
    getAllAttachmentsForAdmin(),
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  // Get attachments that already have products
  const { queryMany } = await import('@/lib/db/client')
  const attachmentsWithProducts = await queryMany<{ attachment_id: string }>(
    `SELECT attachment_id FROM file_products`
  )
  const attachmentIdsWithProducts = new Set(attachmentsWithProducts.map((p) => p.attachment_id))

  // Filter out attachments that already have a product
  const availableAttachments = attachments.filter(
    (attachment) => !attachmentIdsWithProducts.has(attachment.id)
  )

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Produto Individual</h1>
          <p className="text-gray-600">Crie um novo produto para vender um arquivo individualmente</p>
        </div>

        <FileProductForm attachments={availableAttachments} tiers={tiers} />
      </main>
    </div>
  )
}

