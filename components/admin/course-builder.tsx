'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { publishCourse } from '@/app/actions/courses'
import { CourseForm } from './course-form'
import { ThumbnailForm } from './thumbnail-form'
import { CourseStructure } from './course-structure'
import type { Database } from '@/types/database'
import type { CourseWithModules } from '@/lib/queries/courses'

type Tier = Database['public']['Tables']['tiers']['Row']

interface CourseBuilderProps {
  course?: CourseWithModules | null
  tiers: Tier[]
}

type Step = 'course' | 'thumbnail' | 'modules' | 'publish'

export function CourseBuilder({ course: initialCourse, tiers }: CourseBuilderProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(initialCourse ? 'thumbnail' : 'course')
  const [courseId, setCourseId] = useState<string | null>(initialCourse?.id || null)
  const [course, setCourse] = useState<CourseWithModules | null>(initialCourse ?? null)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh course data
  const refreshCourse = useCallback(async () => {
    if (!courseId) return

    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
      }
    } catch (err) {
      console.error('Error refreshing course:', err)
    }
  }, [courseId])

  const handleCourseCreated = async (newCourseId: string) => {
    setCourseId(newCourseId)
    // Immediately refresh to get full course data so thumbnail upload can work
    await refreshCourse()
    setCurrentStep('thumbnail')
  }

  const handleThumbnailComplete = () => {
    refreshCourse()
    setCurrentStep('modules')
  }

  const handleModuleCreated = () => {
    refreshCourse()
  }

  const validateCourseForPublishing = (): { valid: boolean; error?: string } => {
    if (!course) {
      return { valid: false, error: 'Curso não encontrado' }
    }

    // Check if course has at least one module
    if (!course.modules || course.modules.length === 0) {
      return { valid: false, error: 'O curso deve ter pelo menos um módulo antes de ser publicado' }
    }

    // Check if at least one module has lessons
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    if (totalLessons === 0) {
      return { valid: false, error: 'O curso deve ter pelo menos uma aula antes de ser publicado' }
    }

    // Check if all lessons have videos
    const lessonsWithoutVideo = course.modules
      .flatMap((m) => m.lessons)
      .filter((l) => !l.video_url || !l.storage_key)

    if (lessonsWithoutVideo.length > 0) {
      return {
        valid: false,
        error: `Existem ${lessonsWithoutVideo.length} aula(s) sem vídeo. Todas as aulas devem ter vídeo antes de publicar.`,
      }
    }

    return { valid: true }
  }

  const handlePublish = async () => {
    if (!courseId) return

    // Validate course before publishing
    const validation = validateCourseForPublishing()
    if (!validation.valid) {
      setError(validation.error || 'Curso não está pronto para publicação')
      return
    }

    setPublishing(true)
    setError(null)

    try {
      const result = await publishCourse(courseId)
      if (result.success) {
        router.push('/dashboard?tab=courses')
      } else {
        setError(result.error || 'Erro ao publicar curso')
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setPublishing(false)
    }
  }


  const goToPreviousStep = () => {
    if (currentStep === 'publish') {
      setCurrentStep('modules')
    } else if (currentStep === 'modules') {
      setCurrentStep('thumbnail')
    } else if (currentStep === 'thumbnail') {
      setCurrentStep('course')
    }
  }

  // Refresh course data when navigating back to course or thumbnail step
  useEffect(() => {
    if ((currentStep === 'course' || currentStep === 'thumbnail') && courseId) {
      const fetchCourse = async () => {
        try {
          const response = await fetch(`/api/courses/${courseId}`)
          if (response.ok) {
            const data = await response.json()
            setCourse(data)
          }
        } catch (err) {
          console.error('Error refreshing course:', err)
        }
      }
      fetchCourse()
    }
  }, [currentStep, courseId])

  const steps: { key: Step; label: string; description: string }[] = [
    { key: 'course', label: 'Curso', description: 'Informações básicas' },
    { key: 'thumbnail', label: 'Thumbnail', description: 'Imagem de capa' },
    { key: 'modules', label: 'Estrutura', description: 'Módulos, aulas, vídeos e anexos' },
    { key: 'publish', label: 'Publicar', description: 'Finalizar e publicar' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

  if (!courseId && currentStep !== 'course') {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <p className="text-gray-600">Por favor, crie o curso primeiro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-600">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/dashboard?tab=courses" className="hover:text-purple-600">
              Dashboard
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/dashboard?tab=courses" className="hover:text-purple-600">
              Cursos
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">
            {initialCourse ? 'Editar Curso' : 'Criar Novo Curso'}
          </li>
        </ol>
      </nav>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {initialCourse ? 'Editar Curso' : 'Criar Novo Curso'}
          </h1>
        </div>

        <div className="flex items-center space-x-4 overflow-x-auto pb-4 w-full justify-center">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep
            const isCompleted = index < currentStepIndex
            const isAccessible = index <= currentStepIndex || (courseId && index > 0)

            return (
              <div key={step.key} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentStep(step.key)
                    }
                  }}
                  disabled={!isAccessible}
                  className={`flex flex-col items-center ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-purple-600' : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div>
        {currentStep === 'course' && (
          <CourseForm
            course={course || undefined}
            courseId={courseId}
            tiers={tiers}
            onSuccess={handleCourseCreated}
          />
        )}

        {currentStep === 'thumbnail' && course && (
          <ThumbnailForm
            course={course}
            onSuccess={handleThumbnailComplete}
            onCancel={goToPreviousStep}
          />
        )}

        {currentStep === 'modules' && courseId && course && (
          <div className="w-full space-y-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={goToPreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                ← Voltar para Thumbnail
              </button>
            </div>
            <div className="w-full">
              <CourseStructure course={course} onUpdate={handleModuleCreated} tiers={tiers} />
            </div>
            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep('publish')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md font-medium flex items-center gap-2"
              >
                Próximo
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'publish' && courseId && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Publicar Curso</h2>
            <p className="text-gray-600 mb-6">
              Revise o curso antes de publicar. Após a publicação, o curso ficará visível para
              todos os usuários com o tier mínimo necessário.
            </p>

            {course && (
              <div className="mb-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Resumo do Curso</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Título:</p>
                      <p className="font-medium text-gray-900">{course.title}</p>
                    </div>
                    {course.description && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Descrição:</p>
                        <p className="text-gray-900">{course.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Módulos:</p>
                      <p className="font-medium text-gray-900">{course.modules.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Aulas:</p>
                      <p className="font-medium text-gray-900">
                        {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Anexos:</p>
                      <p className="font-medium text-gray-900">
                        {course.modules.reduce(
                          (acc, m) =>
                            acc + m.lessons.reduce((a, l) => a + l.attachments.length, 0),
                          0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Aulas com vídeo:</p>
                      <p className="font-medium text-gray-900">
                        {
                          course.modules
                            .flatMap((m) => m.lessons)
                            .filter((l) => l.video_url).length
                        }
                        /{course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validation Status */}
                {(() => {
                  const validation = validateCourseForPublishing()
                  return (
                    <div
                      className={`p-4 rounded-lg border ${
                        validation.valid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start">
                        {validation.valid ? (
                          <>
                            <svg
                              className="h-5 w-5 text-green-600 mt-0.5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Curso pronto para publicação
                              </p>
                              <p className="text-sm text-green-700 mt-1">
                                Todas as validações foram aprovadas.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5 text-yellow-600 mt-0.5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Curso não está pronto para publicação
                              </p>
                              <p className="text-sm text-yellow-700 mt-1">{validation.error}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={goToPreviousStep}
                disabled={publishing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                ← Voltar para Estrutura
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !validateCourseForPublishing().valid}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? 'Publicando...' : 'Publicar Curso'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

