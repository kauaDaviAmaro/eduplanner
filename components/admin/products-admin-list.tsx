'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFileProduct, deleteProduct } from '@/app/actions/products'
import { formatPrice } from '@/lib/stripe/config'
import type { FileProduct } from '@/lib/queries/file-products'
import type { Product } from '@/lib/queries/products'

interface ProductsAdminListProps {
  fileProducts: FileProduct[]
  products: Product[]
}

export function ProductsAdminList({ fileProducts, products }: ProductsAdminListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'files' | 'bundles'>('files')

  const handleDeleteFileProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeletingId(id)
    try {
      const result = await deleteFileProduct(id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Erro ao deletar produto')
      }
    } catch (error) {
      alert('Erro ao deletar produto')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este bundle? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeletingId(id)
    try {
      const result = await deleteProduct(id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Erro ao deletar bundle')
      }
    } catch (error) {
      alert('Erro ao deletar bundle')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('files')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Produtos Individuais ({fileProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bundles'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bundles ({products.length})
          </button>
        </nav>
      </div>

      {/* File Products */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {fileProducts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Nenhum produto individual cadastrado</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arquivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.file_name}</div>
                        <div className="text-sm text-gray-500">{product.file_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.price * 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/admin/loja/file-product/${product.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </a>
                          <button
                            onClick={() => handleDeleteFileProduct(product.id)}
                            disabled={deletingId === product.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deletingId === product.id ? 'Deletando...' : 'Deletar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bundles */}
      {activeTab === 'bundles' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Nenhum bundle cadastrado</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bundle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arquivos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.attachment_count} {product.attachment_count === 1 ? 'arquivo' : 'arquivos'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.price * 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/admin/loja/product/${product.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </a>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deletingId === product.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deletingId === product.id ? 'Deletando...' : 'Deletar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

