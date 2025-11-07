'use client'

import { useState, useEffect } from 'react'
import type { CourseWithModules } from '@/lib/queries/courses'

type Lesson = CourseWithModules['modules'][0]['lessons'][0]

interface VideoUploaderProps {
  lesson: Lesson
  onUpdate: () => void
  isExpanded: boolean
  onToggle: () => void
}

export function VideoUploader({ lesson, onUpdate, isExpanded, onToggle }: VideoUploaderProps) {
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        globalThis.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.onerror = () => reject(new Error('Erro ao ler duração do vídeo'))
      video.src = globalThis.URL.createObjectURL(file)
    })
  }

  const fetchVideoUrl = async () => {
    if (videoUrl) return
    
    setLoadingVideo(true)
    try {
      const response = await fetch(`/api/videos/${lesson.id}`)
      if (response.ok) {
        const data = await response.json()
        setVideoUrl(data.url)
      }
    } catch (err) {
      console.error('Error fetching video URL:', err)
    } finally {
      setLoadingVideo(false)
    }
  }

  useEffect(() => {
    if (lesson.video_url && !videoUrl && isExpanded) {
      fetchVideoUrl()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.video_url, isExpanded])

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo')
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['mp4', 'webm', 'mov', 'avi']
    if (!allowedExtensions.includes(extension)) {
      alert(`Formato de vídeo não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`)
      return
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      alert(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    setUploadingVideo(true)
    setUploadProgress(0)
    setVideoUrl(null)

    try {
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: 'video',
          contentType: file.type,
          lessonId: lesson.id,
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json()
        throw new Error(errorData.error || 'Erro ao solicitar upload')
      }

      const { uploadUrl, storageKey } = await requestResponse.json()
      const xhr = new XMLHttpRequest()

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const duration = await getVideoDuration(file)

              const completeResponse = await fetch('/api/upload/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lessonId: lesson.id,
                  storageKey,
                  fileType: 'video',
                  duration: Math.round(duration),
                }),
              })

              if (!completeResponse.ok) {
                const errorData = await completeResponse.json()
                throw new Error(errorData.error || 'Erro ao confirmar upload')
              }

              setUploadProgress(100)
              onToggle()
              onUpdate()
              setTimeout(async () => {
                await fetchVideoUrl()
                setUploadingVideo(false)
                setUploadProgress(0)
              }, 600)
              resolve()
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
      alert(err.message || 'Erro ao fazer upload do vídeo')
      setUploadingVideo(false)
      setUploadProgress(0)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Ocultar vídeo
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {lesson.video_url ? 'Mostrar vídeo' : 'Adicionar vídeo'}
            </>
          )}
        </button>
        {lesson.video_url && (
          <button
            onClick={() => {
              const fileInput = document.createElement('input')
              fileInput.type = 'file'
              fileInput.accept = 'video/*'
              fileInput.onchange = (e: any) => {
                const file = e.target.files?.[0]
                if (file) handleVideoUpload(file)
              }
              fileInput.click()
            }}
            disabled={uploadingVideo}
            className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors"
          >
            Trocar vídeo
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 animate-slide-down">
          {lesson.video_url ? (
            <>
              {loadingVideo ? (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Carregando vídeo...</p>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="w-full">
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                      playsInline
                    >
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                  </div>
                </div>
              ) : (
                <button
                  onClick={fetchVideoUrl}
                  className="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Carregar Vídeo
                </button>
              )}
            </>
          ) : (
            <div>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleVideoUpload(file)
                  e.target.value = ''
                }}
                disabled={uploadingVideo}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 cursor-pointer"
              />
            </div>
          )}

          {uploadingVideo && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                {Math.round(uploadProgress)}% concluído
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

