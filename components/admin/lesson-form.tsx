'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createLesson, updateLesson, deleteLesson } from '@/app/actions/courses'
import type { Database } from '@/types/database'

type Lesson = Database['public']['Tables']['lessons']['Row']
type Module = Database['public']['Tables']['modules']['Row']

interface LessonFormProps {
  moduleId: string
  lessons: Lesson[]
  onSuccess: () => void
  onCancel?: () => void
}

export function LessonForm({ moduleId, lessons, onSuccess, onCancel }: LessonFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [videoUrls, setVideoUrls] = useState<{ [key: string]: string }>({})
  const [loadingVideo, setLoadingVideo] = useState<{ [key: string]: boolean }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
  })

  const handleVideoUpload = async (file: File, lessonId: string) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Por favor, selecione um arquivo de vídeo')
      return
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['mp4', 'webm', 'mov', 'avi']
    if (!allowedExtensions.includes(extension)) {
      setError(`Formato de vídeo não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`)
      return
    }

    // Validate file size (default 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      setError(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    setUploadingVideo(lessonId)
    setUploadProgress({ [lessonId]: 0 })
    setError(null)

    try {
      // Request presigned URL for video upload
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: 'video',
          contentType: file.type,
          lessonId,
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json()
        throw new Error(errorData.error || 'Erro ao solicitar upload')
      }

      const { uploadUrl, storageKey } = await requestResponse.json()

      // Upload file directly to MinIO with progress tracking
      const xhr = new XMLHttpRequest()

      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress({ [lessonId]: percentComplete })
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              // Get video duration from file
              const duration = await getVideoDuration(file)

              // Confirm upload
              const completeResponse = await fetch('/api/upload/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lessonId,
                  storageKey,
                  fileType: 'video',
                  duration: Math.round(duration),
                }),
              })

              if (!completeResponse.ok) {
                const errorData = await completeResponse.json()
                throw new Error(errorData.error || 'Erro ao confirmar upload')
              }

              setUploadProgress({ [lessonId]: 100 })
              setSuccessMessage('Vídeo enviado com sucesso!')
              // Fetch video URL to display it
              await fetchVideoUrl(lessonId)
              setTimeout(() => {
                setUploadingVideo(null)
                setUploadProgress({})
                setSuccessMessage(null)
                resolve()
              }, 500)
            } catch (err: any) {
              reject(err)
            }
          } else {
            reject(new Error('Erro ao fazer upload do vídeo'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Erro de conexão durante o upload'))
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do vídeo')
      setUploadingVideo(null)
      setUploadProgress({})
    }
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.onerror = () => reject(new Error('Erro ao ler duração do vídeo'))
      video.src = URL.createObjectURL(file)
    })
  }

  const fetchVideoUrl = async (lessonId: string) => {
    if (videoUrls[lessonId]) return // Already loaded
    
    setLoadingVideo((prev) => ({ ...prev, [lessonId]: true }))
    try {
      const response = await fetch(`/api/videos/${lessonId}`)
      if (response.ok) {
        const data = await response.json()
        setVideoUrls((prev) => ({ ...prev, [lessonId]: data.url }))
      }
    } catch (err) {
      console.error('Error fetching video URL:', err)
    } finally {
      setLoadingVideo((prev) => ({ ...prev, [lessonId]: false }))
    }
  }

  // Fetch video URLs for lessons that have videos
  useEffect(() => {
    lessons.forEach((lesson) => {
      if (lesson.video_url && !videoUrls[lesson.id] && !loadingVideo[lesson.id]) {
        fetchVideoUrl(lesson.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons.map(l => l.id).join(',')])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Título da aula é obrigatório')
      return
    }

    startTransition(async () => {
      try {
        if (editingLessonId) {
          const result = await updateLesson(editingLessonId, {
            title: formData.title,
          })

          if (result.success) {
            setFormData({ title: '' })
            setEditingLessonId(null)
            setSuccessMessage('Aula atualizada com sucesso!')
            setTimeout(() => setSuccessMessage(null), 3000)
            onSuccess()
          } else {
            setError(result.error || 'Erro ao atualizar aula')
          }
        } else {
          const result = await createLesson({
            moduleId,
            title: formData.title,
          })

          if (result.success && result.lessonId) {
            setFormData({ title: '' })
            setSuccessMessage('Aula criada com sucesso!')
            setTimeout(() => setSuccessMessage(null), 3000)
            onSuccess()
          } else {
            setError(result.error || 'Erro ao criar aula')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      }
    })
  }

  const handleEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setFormData({ title: lesson.title })
  }

  const handleCancelEdit = () => {
    setEditingLessonId(null)
    setFormData({ title: '' })
  }

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula? O vídeo e todos os anexos serão excluídos também.')) {
      return
    }

    setDeletingLessonId(lessonId)
    setError(null)

    try {
      const result = await deleteLesson(lessonId)
      if (result.success) {
        setSuccessMessage('Aula excluída com sucesso!')
        setTimeout(() => setSuccessMessage(null), 3000)
        onSuccess()
      } else {
        setError(result.error || 'Erro ao excluir aula')
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setDeletingLessonId(null)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const lessonId = lessons[lessons.length - 1]?.id
    if (!lessonId) {
      setError('Crie uma aula primeiro antes de fazer upload de vídeo')
      return
    }

    await handleVideoUpload(file, lessonId)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Aula</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="lessonTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Título da Aula *
          </label>
          <input
            type="text"
            id="lessonTitle"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Introdução aos Hooks"
          />
        </div>

        <div className="flex justify-end space-x-3">
          {editingLessonId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar Edição
            </button>
          )}
          {onCancel && !editingLessonId && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isPending
              ? editingLessonId
                ? 'Salvando...'
                : 'Criando...'
              : editingLessonId
              ? 'Salvar Alterações'
              : 'Adicionar Aula'}
          </button>
        </div>
      </form>

      {lessons.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aulas Criadas</h4>
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const isUploading = uploadingVideo === lesson.id
              const progress = uploadProgress[lesson.id] || 0

              return (
                <div
                  key={lesson.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {lesson.title}
                    </span>
                    <div className="flex items-center space-x-2">
                      {lesson.video_url ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Vídeo enviado
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Sem vídeo
                        </span>
                      )}
                      <button
                        onClick={() => handleEdit(lesson)}
                        disabled={editingLessonId === lesson.id || !!deletingLessonId}
                        className="px-2 py-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        disabled={deletingLessonId === lesson.id || !!editingLessonId}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingLessonId === lesson.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </div>

                  {lesson.video_url ? (
                    <div className="mt-3">
                      {loadingVideo[lesson.id] ? (
                        <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-gray-500">Carregando vídeo...</p>
                        </div>
                      ) : videoUrls[lesson.id] ? (
                        <div className="w-full">
                          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                              src={videoUrls[lesson.id]}
                              controls
                              className="w-full h-full"
                              playsInline
                            >
                              Seu navegador não suporta a tag de vídeo.
                            </video>
                          </div>
                          <button
                            onClick={() => fetchVideoUrl(lesson.id)}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-800"
                          >
                            Atualizar URL do vídeo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fetchVideoUrl(lesson.id)}
                          className="mt-2 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Carregar Vídeo
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input
                        ref={index === lessons.length - 1 ? fileInputRef : undefined}
                        type="file"
                        accept="video/*"
                        onChange={index === lessons.length - 1 ? handleFileSelect : undefined}
                        disabled={isUploading}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                      />
                      {isUploading && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round(progress)}% concluído
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

