'use client'

import { useState, useTransition, useEffect } from 'react'
import { createCourse } from '@/app/actions/courses'
import type { Database } from '@/types/database'

type Tier = Database['public']['Tables']['tiers']['Row']
type Course = Database['public']['Tables']['courses']['Row']

interface CourseFormProps {
  course?: Course | null
  courseId?: string | null
  tiers: Tier[]
  onSuccess: (courseId: string) => void
  onCancel?: () => void
}

export function CourseForm({ course, courseId: propCourseId, tiers, onSuccess, onCancel }: CourseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    minimumTierId: course?.minimum_tier_id || tiers[0]?.id || 0,
  })

  // Use courseId from prop if available, otherwise from course
  // Also track locally when course is created
  const [localCourseId, setLocalCourseId] = useState<string | null>(null)
  const effectiveCourseId = propCourseId || localCourseId || course?.id
  const isEditMode = !!course

  // Update form data when course prop changes (e.g., when user navigates back)
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        minimumTierId: course.minimum_tier_id || tiers[0]?.id || 0,
      })
      setLocalCourseId(course.id)
    }
  }, [course?.id, course?.title, course?.description, course?.minimum_tier_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Título do curso é obrigatório')
      return
    }

    if (!formData.minimumTierId) {
      setError('Tier mínimo é obrigatório')
      return
    }

    startTransition(async () => {
      try {
        const result = await createCourse({
          title: formData.title,
          description: formData.description || undefined,
          minimumTierId: formData.minimumTierId,
        })

        if (result.success && result.courseId) {
          // Update local courseId so thumbnail upload can work immediately
          setLocalCourseId(result.courseId)
          setSuccessMessage('Curso criado com sucesso! Agora você pode fazer upload do thumbnail.')
          setTimeout(() => {
            setSuccessMessage(null)
            onSuccess(result.courseId)
          }, 2000)
        } else {
          setError(result.error || 'Erro ao criar curso')
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Editar Curso' : 'Criar Novo Curso'}
      </h2>

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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título do Curso *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Introdução ao React"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Descreva o conteúdo do curso..."
          />
        </div>

        <div>
          <label htmlFor="minimumTierId" className="block text-sm font-medium text-gray-700 mb-1">
            Tier Mínimo *
          </label>
          <select
            id="minimumTierId"
            value={formData.minimumTierId}
            onChange={(e) => setFormData({ ...formData, minimumTierId: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} (Nível {tier.permission_level})
              </option>
            ))}
          </select>
        </div>


        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
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
            {isPending ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar Curso'}
          </button>
        </div>
      </form>
    </div>
  )
}

