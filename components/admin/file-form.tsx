'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createAttachment, updateAttachment } from '@/app/actions/courses'
import type { Database } from '@/types/database'
import type { Course } from '@/lib/queries/courses'
import type { AttachmentForAdmin } from '@/lib/queries/admin'

type Tier = Database['public']['Tables']['tiers']['Row']
type Module = Database['public']['Tables']['modules']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']

interface FileFormProps {
  attachment?: AttachmentForAdmin | null
  courses: Course[]
  tiers: Tier[]
  onSuccess: () => void
  onCancel?: () => void
}

export function FileForm({ attachment, courses, tiers, onSuccess, onCancel }: FileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isFileWithoutCourse, setIsFileWithoutCourse] = useState<boolean>(
    !attachment?.course_id
  )
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    attachment?.course_id || ''
  )
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    attachment?.module_id || ''
  )
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    attachment?.lesson_id || ''
  )
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [formData, setFormData] = useState({
    fileName: attachment?.file_name || '',
    fileType: attachment?.file_type || 'PDF',
    minimumTierId: attachment?.minimum_tier_id || tiers[0]?.id || 0,
  })

  const isEditMode = !!attachment

  // Load modules when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      fetch(`/api/courses/${selectedCourseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.modules) {
            setModules(data.modules)
            // If editing and module matches, keep it selected
            if (attachment?.module_id) {
              const moduleExists = data.modules.find(
                (m: Module) => m.id === attachment.module_id
              )
              if (!moduleExists) {
                setSelectedModuleId('')
                setLessons([])
                setSelectedLessonId('')
              }
            }
          } else {
            setModules([])
            setLessons([])
            setSelectedModuleId('')
            setSelectedLessonId('')
          }
        })
        .catch(() => {
          setModules([])
          setLessons([])
        })
    } else {
      setModules([])
      setLessons([])
      setSelectedModuleId('')
      setSelectedLessonId('')
    }
  }, [selectedCourseId, attachment?.module_id])

  // Load lessons when module is selected
  useEffect(() => {
    if (selectedModuleId && modules.length > 0) {
      const module = modules.find((m) => m.id === selectedModuleId)
      if (module) {
        // Get lessons from the course data
        fetch(`/api/courses/${selectedCourseId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.modules) {
              const selectedModule = data.modules.find(
                (m: Module) => m.id === selectedModuleId
              )
              if (selectedModule?.lessons) {
                setLessons(selectedModule.lessons)
                // If editing and lesson matches, keep it selected
                if (attachment?.lesson_id) {
                  const lessonExists = selectedModule.lessons.find(
                    (l: Lesson) => l.id === attachment.lesson_id
                  )
                  if (!lessonExists) {
                    setSelectedLessonId('')
                  }
                }
              } else {
                setLessons([])
                setSelectedLessonId('')
              }
            }
          })
          .catch(() => {
            setLessons([])
            setSelectedLessonId('')
          })
      }
    } else {
      setLessons([])
      setSelectedLessonId('')
    }
  }, [selectedModuleId, modules, selectedCourseId, attachment?.lesson_id])

  const handleFileUpload = async (file: File, attachmentId: string) => {
    setUploadingFile(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Request presigned URL for attachment upload
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: 'attachment',
          contentType: file.type,
          attachmentId,
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
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              // Confirm upload
              const completeResponse = await fetch('/api/upload/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  attachmentId,
                  storageKey,
                  fileType: 'attachment',
                }),
              })

              if (!completeResponse.ok) {
                const errorData = await completeResponse.json()
                throw new Error(errorData.error || 'Erro ao confirmar upload')
              }

              setUploadProgress(100)
              setTimeout(() => {
                setUploadingFile(false)
                setUploadProgress(0)
                setSuccessMessage('Arquivo enviado com sucesso!')
                setTimeout(() => setSuccessMessage(null), 3000)
                resolve()
              }, 500)
            } catch (err: any) {
              reject(err)
            }
          } else {
            reject(new Error('Erro ao fazer upload do arquivo'))
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
      setError(err.message || 'Erro ao fazer upload do arquivo')
      setUploadingFile(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.fileName.trim()) {
      setError('Nome do arquivo é obrigatório')
      return
    }

    // If file is without course, only validate tier
    if (isFileWithoutCourse) {
      if (!formData.minimumTierId) {
        setError('Tier mínimo é obrigatório')
        return
      }
    } else {
      // If file is with course, validate course, module and lesson
      if (!selectedCourseId) {
        setError('Selecione um curso')
        return
      }

      if (!selectedModuleId) {
        setError('Selecione um módulo')
        return
      }

      if (!selectedLessonId) {
        setError('Selecione uma lição')
        return
      }

      if (!formData.minimumTierId) {
        setError('Tier mínimo é obrigatório')
        return
      }
    }

    const file = selectedFile || fileInputRef.current?.files?.[0]

    // For new attachments, file is required
    if (!isEditMode && !file) {
      setError('Por favor, selecione um arquivo')
      return
    }

    // If file is provided, validate it
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
      const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx']
      if (!allowedExtensions.includes(fileExtension)) {
        setError(`Formato de arquivo não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`)
        return
      }

      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
        return
      }
    }

    startTransition(async () => {
      try {
        if (isEditMode && attachment) {
          // Update existing attachment
          const result = await updateAttachment(attachment.id, {
            fileName: formData.fileName,
            fileType: formData.fileType,
            minimumTierId: formData.minimumTierId,
            lessonId: isFileWithoutCourse ? undefined : selectedLessonId || undefined,
          })

          if (result.success) {
            // If a new file is provided, upload it
            if (file) {
              await handleFileUpload(file, attachment.id)
              setTimeout(() => {
                onSuccess()
              }, 2000)
            } else {
              setSuccessMessage('Arquivo atualizado com sucesso!')
              setTimeout(() => {
                onSuccess()
              }, 2000)
            }
          } else {
            setError(result.error || 'Erro ao atualizar arquivo')
          }
        } else {
          // Create new attachment
          const result = await createAttachment({
            lessonId: isFileWithoutCourse ? null : selectedLessonId || undefined,
            fileName: formData.fileName,
            fileType: formData.fileType,
            minimumTierId: formData.minimumTierId,
          })

          if (result.success && result.attachmentId && file) {
            // Upload the file
            await handleFileUpload(file, result.attachmentId)
            setFormData({
              fileName: '',
              fileType: 'PDF',
              minimumTierId: tiers[0]?.id || 0,
            })
            setSelectedCourseId('')
            setSelectedModuleId('')
            setSelectedLessonId('')
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
            setTimeout(() => {
              onSuccess()
            }, 2000)
          } else if (result.success) {
            setSuccessMessage('Arquivo criado com sucesso!')
            setTimeout(() => {
              onSuccess()
            }, 2000)
          } else {
            setError(result.error || 'Erro ao criar arquivo')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      }
    })
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setSelectedFile(file)
      // Auto-detect file type from extension
      const extension = file.name.split('.').pop()?.toUpperCase() || ''
      const fileTypeMap: Record<string, string> = {
        PDF: 'PDF',
        PPT: 'PPT',
        PPTX: 'PPTX',
        DOC: 'DOC',
        DOCX: 'DOCX',
        XLS: 'XLS',
        XLSX: 'XLSX',
      }
      if (fileTypeMap[extension]) {
        setFormData({ ...formData, fileType: fileTypeMap[extension] })
      }
      // Auto-fill file name if empty
      if (!formData.fileName.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData({ ...formData, fileName: nameWithoutExt })
      }
    } else {
      setSelectedFile(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('PPT')) {
      return (
        <svg className="h-12 w-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('DOC')) {
      return (
        <svg className="h-12 w-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('XLS')) {
      return (
        <svg className="h-12 w-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    }
    return (
      <svg className="h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          {isEditMode ? (
            <>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Arquivo
            </>
          ) : (
            <>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Novo Arquivo
            </>
          )}
        </h2>
        <p className="text-purple-100 text-sm mt-1">
          {isEditMode ? 'Atualize as informações do arquivo' : 'Preencha os dados abaixo para adicionar um novo arquivo'}
        </p>
      </div>

      <div className="p-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Without Course Option */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="fileWithoutCourse"
              checked={isFileWithoutCourse}
              onChange={(e) => {
                setIsFileWithoutCourse(e.target.checked)
                if (e.target.checked) {
                  setSelectedCourseId('')
                  setSelectedModuleId('')
                  setSelectedLessonId('')
                  setModules([])
                  setLessons([])
                }
              }}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5"
            />
            <div className="ml-3">
              <label htmlFor="fileWithoutCourse" className="block text-sm font-medium text-gray-900 cursor-pointer">
                Arquivo sem curso
              </label>
              <p className="text-sm text-gray-600 mt-0.5">
                Este arquivo será acessível apenas por tier, sem estar vinculado a um curso específico
              </p>
            </div>
          </div>
        </div>

        {/* Course Selection Section */}
        {!isFileWithoutCourse && (
          <div className="space-y-4 border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Vinculação ao Curso
            </h3>

            {/* Course Selection */}
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                Curso <span className="text-red-500">*</span>
              </label>
              <select
                id="courseId"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value)
                  setSelectedModuleId('')
                  setSelectedLessonId('')
                }}
                required={!isFileWithoutCourse}
                disabled={isEditMode || isFileWithoutCourse}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">Selecione um curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Module Selection */}
            <div>
              <label htmlFor="moduleId" className="block text-sm font-medium text-gray-700 mb-2">
                Módulo <span className="text-red-500">*</span>
              </label>
              <select
                id="moduleId"
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value)
                  setSelectedLessonId('')
                }}
                required={!isFileWithoutCourse}
                disabled={!selectedCourseId || modules.length === 0 || isEditMode || isFileWithoutCourse}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">{selectedCourseId ? 'Selecione um módulo' : 'Selecione um curso primeiro'}</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
              {selectedCourseId && modules.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Este curso não possui módulos
                </p>
              )}
            </div>

            {/* Lesson Selection */}
            <div>
              <label htmlFor="lessonId" className="block text-sm font-medium text-gray-700 mb-2">
                Lição <span className="text-red-500">*</span>
              </label>
              <select
                id="lessonId"
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                required={!isFileWithoutCourse}
                disabled={!selectedModuleId || lessons.length === 0 || isFileWithoutCourse}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">{selectedModuleId ? 'Selecione uma lição' : 'Selecione um módulo primeiro'}</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
              {selectedModuleId && lessons.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Este módulo não possui lições
                </p>
              )}
            </div>
          </div>
        )}

        {/* File Information Section */}
        <div className="space-y-4 border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Informações do Arquivo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Name */}
            <div>
              <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Arquivo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fileName"
                value={formData.fileName}
                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Ex: Material Complementar"
              />
            </div>

            {/* File Type */}
            <div>
              <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Arquivo
              </label>
              <select
                id="fileType"
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="PDF">PDF</option>
                <option value="PPT">PPT</option>
                <option value="PPTX">PPTX</option>
                <option value="DOC">DOC</option>
                <option value="DOCX">DOCX</option>
                <option value="XLS">XLS</option>
                <option value="XLSX">XLSX</option>
              </select>
            </div>
          </div>

          {/* Minimum Tier */}
          <div>
            <label htmlFor="minimumTierId" className="block text-sm font-medium text-gray-700 mb-2">
              Tier Mínimo <span className="text-red-500">*</span>
            </label>
            <select
              id="minimumTierId"
              value={formData.minimumTierId}
              onChange={(e) => setFormData({ ...formData, minimumTierId: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} (Nível {tier.permission_level})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Usuários precisam ter este tier ou superior para acessar o arquivo
            </p>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload do Arquivo {!isEditMode && <span className="text-red-500">*</span>}
          </h3>

          {/* Drag and Drop Area */}
          {!isEditMode && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                required={!isEditMode}
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="hidden"
              />
              {!selectedFile ? (
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div className="mt-4">
                    <label
                      htmlFor="file"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Selecionar arquivo
                    </label>
                    <p className="mt-2 text-sm text-gray-600">ou arraste e solte aqui</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Formatos permitidos: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX (máx. 100MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-shrink-0">{getFileIcon(formData.fileType)}</div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Edit Mode File Display */}
          {isEditMode && attachment?.file_url && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{getFileIcon(attachment.file_type)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                  <p className="text-xs text-gray-500 mt-1">Arquivo atual</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Enviado
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Para substituir, selecione um novo arquivo abaixo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="mt-3 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadingFile && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <svg className="animate-spin h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium text-purple-900">Enviando arquivo...</p>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-purple-700">{Math.round(uploadProgress)}% concluído</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending || uploadingFile}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || uploadingFile}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : uploadingFile ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : isEditMode ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Alterações
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Arquivo
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

