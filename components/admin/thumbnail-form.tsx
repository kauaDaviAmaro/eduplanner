'use client'

import { useState } from 'react'
import { updateCourse } from '@/app/actions/courses'
import type { Database } from '@/types/database'

type Course = Database['public']['Tables']['courses']['Row']

interface ThumbnailFormProps {
  course: Course
  onSuccess: () => void
  onCancel?: () => void
}

export function ThumbnailForm({ course, onSuccess, onCancel }: ThumbnailFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course.thumbnail_url || null)

  const handleThumbnailUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem')
      return
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    if (!allowedExtensions.includes(extension)) {
      setError(`Formato de imagem não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`)
      return
    }

    // Validate file size (default 10MB for thumbnails)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    setUploadingThumbnail(true)
    setError(null)

    try {
      // Request presigned URL for thumbnail upload
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: 'thumbnail',
          contentType: file.type,
          courseId: course.id,
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json()
        throw new Error(errorData.error || 'Erro ao solicitar upload')
      }

      const { uploadUrl, storageKey } = await requestResponse.json()

      // Upload file directly to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do thumbnail')
      }

      // Confirm upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageKey,
          fileType: 'thumbnail',
          courseId: course.id,
        }),
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Erro ao confirmar upload')
      }

      const { fileUrl } = await completeResponse.json()
      setThumbnailUrl(fileUrl)

      // Update course with thumbnail URL
      const updateResult = await updateCourse(course.id, {
        thumbnailUrl: fileUrl,
      })

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erro ao atualizar curso')
      }

      setSuccessMessage('Thumbnail enviado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do thumbnail')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleContinue = () => {
    onSuccess()
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Thumbnail do Curso</h2>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thumbnail *
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Adicione uma imagem de capa para o curso. Formatos aceitos: JPG, PNG, WEBP (máximo 10MB)
          </p>
          <div className="space-y-2">
            {thumbnailUrl && (
              <div className="relative">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-64 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleThumbnailUpload(file)
                }
              }}
              disabled={uploadingThumbnail}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
            />
            {uploadingThumbnail && (
              <p className="text-sm text-gray-500">Fazendo upload...</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={uploadingThumbnail}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={uploadingThumbnail}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

