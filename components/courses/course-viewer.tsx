'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoPlayer } from './video-player'
import { CourseSidebar } from './course-sidebar'
import type { CourseWithModules } from '@/lib/queries/courses'
import type { Database } from '@/types/database'

type UserProgress = Database['public']['Tables']['user_progress']['Row']

interface CourseViewerProps {
  course: CourseWithModules
  initialProgress: UserProgress[]
}

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  progressPercentage: number
  lessonTitle: string
}

function ConfirmationModal({ isOpen, onClose, onConfirm, onCancel, progressPercentage, lessonTitle }: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-scaleIn border border-gray-100">
        <div className="p-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Marcar como concluída?</h3>
            <p className="text-gray-600 mb-2 text-center">
              Você assistiu <span className="font-bold text-purple-600">{Math.round(progressPercentage)}%</span> da aula
            </p>
            <p className="text-sm font-medium text-gray-800 mb-4 text-center">
              &quot;{lessonTitle}&quot;
            </p>
            <p className="text-sm text-gray-500 text-center">
              Deseja marcar esta aula como concluída antes de continuar?
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-semibold shadow-lg shadow-purple-500/30"
            >
              Sim, marcar como concluída
            </button>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium"
            >
              Não, apenas navegar
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CourseViewer({ course, initialProgress }: CourseViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [progress, setProgress] = useState<UserProgress[]>(initialProgress)
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [pendingNextLesson, setPendingNextLesson] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Get all lessons in order (modules and lessons are already sorted from the database)
  const allLessons = useMemo(() => {
    const lessons: Array<{
      id: string
      title: string
      duration: number
      moduleId: string
      moduleTitle: string
    }> = []

    // Modules are already sorted by order, and lessons within each module are also sorted
    course.modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        lessons.push({
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          moduleId: module.id,
          moduleTitle: module.title,
        })
      })
    })

    return lessons
  }, [course])

  // Get current lesson index
  const currentLessonIndex = useMemo(() => {
    if (!currentLessonId) return -1
    return allLessons.findIndex((l) => l.id === currentLessonId)
  }, [currentLessonId, allLessons])

  // Get previous and next lessons
  const previousLesson = useMemo(() => {
    if (currentLessonIndex <= 0) return null
    return allLessons[currentLessonIndex - 1]
  }, [currentLessonIndex, allLessons])

  const nextLesson = useMemo(() => {
    if (currentLessonIndex < 0 || currentLessonIndex >= allLessons.length - 1) return null
    return allLessons[currentLessonIndex + 1]
  }, [currentLessonIndex, allLessons])

  // Get current lesson data
  const currentLesson = useMemo(() => {
    if (!currentLessonId) return null
    for (const module of course.modules) {
      const lesson = module.lessons.find((l) => l.id === currentLessonId)
      if (lesson) {
        return { ...lesson, moduleTitle: module.title }
      }
    }
    return null
  }, [currentLessonId, course])

  // Initialize lesson from URL or find first/last watched
  useEffect(() => {
    const lessonParam = searchParams.get('lesson')
    
    if (lessonParam) {
      // Check if lesson exists in course
      const lessonExists = allLessons.some((l) => l.id === lessonParam)
      if (lessonExists) {
        setCurrentLessonId(lessonParam)
        return
      }
    }

    // Find last watched lesson
    const lastWatched = progress
      .filter((p) => p.time_watched > 0)
      .sort((a, b) => {
        const dateA = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0
        const dateB = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0
        return dateB - dateA
      })[0]

    if (lastWatched && allLessons.some((l) => l.id === lastWatched.lesson_id)) {
      setCurrentLessonId(lastWatched.lesson_id)
    } else if (allLessons.length > 0) {
      // Default to first lesson
      setCurrentLessonId(allLessons[0].id)
    }
  }, [searchParams, allLessons, progress])

  // Update URL when lesson changes
  useEffect(() => {
    if (currentLessonId) {
      const url = new URL(window.location.href)
      url.searchParams.set('lesson', currentLessonId)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [currentLessonId, router])

  const handleLessonSelect = useCallback((lessonId: string) => {
    setIsLoadingLesson(true)
    setCurrentLessonId(lessonId)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setIsLoadingLesson(false), 300)
  }, [])

  const handleProgressUpdate = useCallback((timeWatched: number, isCompleted: boolean) => {
    if (!currentLessonId) return

    setProgress((prev) => {
      const existing = prev.find((p) => p.lesson_id === currentLessonId)
      if (existing) {
        return prev.map((p) =>
          p.lesson_id === currentLessonId
            ? {
                ...p,
                time_watched: timeWatched,
                is_completed: isCompleted || p.is_completed,
                last_watched_at: new Date().toISOString(),
              }
            : p
        )
      } else {
        return [
          ...prev,
          {
            id: '',
            user_id: '',
            lesson_id: currentLessonId,
            time_watched: timeWatched,
            is_completed: isCompleted,
            last_watched_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      }
    })
  }, [currentLessonId])

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  // Mark lesson as completed manually
  const handleCompleteLesson = useCallback(async () => {
    if (!currentLessonId || !currentLesson) return

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: currentLessonId,
          timeWatched: currentTime || currentLesson.duration,
          isCompleted: true,
        }),
      })

      if (response.ok) {
        handleProgressUpdate(currentTime || currentLesson.duration, true)
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
      }
    } catch (err) {
      console.error('Error completing lesson:', err)
    }
  }, [currentLessonId, currentLesson, currentTime, handleProgressUpdate])

  // Check if current lesson is completed
  const isCurrentLessonCompleted = useMemo(() => {
    if (!currentLessonId) return false
    const lessonProgress = progress.find((p) => p.lesson_id === currentLessonId)
    return lessonProgress?.is_completed || false
  }, [currentLessonId, progress])

  // Get progress percentage for current lesson
  const currentLessonProgressPercentage = useMemo(() => {
    if (!currentLessonId || !currentLesson) return 0
    const lessonProgress = progress.find((p) => p.lesson_id === currentLessonId)
    if (!lessonProgress || !currentLesson.duration) return 0
    return (lessonProgress.time_watched / currentLesson.duration) * 100
  }, [currentLessonId, currentLesson, progress])

  // Handle next lesson navigation with confirmation
  const handleNextLessonClick = useCallback(() => {
    if (!nextLesson) return

    // If lesson is already completed, navigate directly
    if (isCurrentLessonCompleted) {
      handleLessonSelect(nextLesson.id)
      return
    }

    // Show confirmation modal
    setPendingNextLesson(nextLesson.id)
    setShowCompletionModal(true)
  }, [nextLesson, isCurrentLessonCompleted, handleLessonSelect])

  // Handle modal confirmation
  const handleModalConfirm = useCallback(async () => {
    if (!currentLessonId || !currentLesson) return

    // Mark as completed
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: currentLessonId,
          timeWatched: currentTime || currentLesson.duration,
          isCompleted: true,
        }),
      })

      if (response.ok) {
        handleProgressUpdate(currentTime || currentLesson.duration, true)
      }
    } catch (err) {
      console.error('Error completing lesson:', err)
    }

    // Navigate to next lesson
    if (pendingNextLesson) {
      setShowCompletionModal(false)
      handleLessonSelect(pendingNextLesson)
      setPendingNextLesson(null)
    }
  }, [currentLessonId, currentLesson, currentTime, pendingNextLesson, handleProgressUpdate, handleLessonSelect])

  // Handle modal cancel (just navigate)
  const handleModalCancel = useCallback(() => {
    if (pendingNextLesson) {
      setShowCompletionModal(false)
      handleLessonSelect(pendingNextLesson)
      setPendingNextLesson(null)
    }
  }, [pendingNextLesson, handleLessonSelect])

  const handleVideoEnded = useCallback(() => {
    // Auto-advance to next lesson if available
    if (nextLesson) {
      setTimeout(() => {
        handleLessonSelect(nextLesson.id)
      }, 2000) // Wait 2 seconds before auto-advancing
    }
  }, [nextLesson, handleLessonSelect])

  // Calculate course progress
  const courseProgress = useMemo(() => {
    const totalLessons = allLessons.length
    const completedLessons = progress.filter((p) => p.is_completed).length
    return {
      total: totalLessons,
      completed: completedLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    }
  }, [allLessons.length, progress])

  // Get initial time for current lesson
  const initialTime = useMemo(() => {
    if (!currentLessonId) return 0
    const lessonProgress = progress.find((p) => p.lesson_id === currentLessonId)
    return lessonProgress?.time_watched || 0
  }, [currentLessonId, progress])

  if (!currentLessonId || !currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-gray-600 font-medium">Carregando aula...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Course Progress Bar - Enhanced */}
      {courseProgress.total > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Progresso do Curso</span>
                <span className="text-xs text-gray-500">Continue aprendendo!</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-600 block">
                {courseProgress.percentage}%
              </span>
              <span className="text-xs text-gray-500">
                {courseProgress.completed}/{courseProgress.total} aulas
              </span>
            </div>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/30"
              style={{ width: `${courseProgress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Info Card - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 backdrop-blur-sm animate-fade-in animate-delay-100 transform transition-all hover:shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
                    {currentLesson.moduleTitle}
                  </span>
                  {isCurrentLessonCompleted && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-50 border border-green-200">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Concluída
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                  {currentLesson.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{Math.floor(currentLesson.duration / 60)} minutos</span>
                  </div>
                  {currentLessonProgressPercentage > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-medium">{Math.round(currentLessonProgressPercentage)}% assistido</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className={`relative transition-all duration-300 ${isLoadingLesson ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {isLoadingLesson && (
              <div className="absolute inset-0 bg-gray-100 rounded-2xl flex items-center justify-center z-10 animate-pulse">
                <div className="text-center space-y-3">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
                  <p className="text-sm text-gray-600 font-medium">Carregando vídeo...</p>
                </div>
              </div>
            )}
            <div className={`transform transition-all duration-300 ${isLoadingLesson ? 'scale-95' : 'scale-100'}`}>
              <VideoPlayer
                key={currentLessonId}
                lessonId={currentLessonId}
                title={undefined}
                onProgressUpdate={handleProgressUpdate}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                initialTime={initialTime}
              />
            </div>
          </div>

          {/* Complete Lesson Button - Enhanced */}
          {!isCurrentLessonCompleted && (
            <div className="flex justify-center animate-fade-in animate-delay-200">
              <button
                onClick={handleCompleteLesson}
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/30 font-semibold text-base"
              >
                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Marcar Aula como Concluída</span>
              </button>
            </div>
          )}

          {/* Success Toast - Enhanced */}
          {showSuccessToast && (
            <div className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slideIn border border-green-400/30 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Aula concluída!</p>
                <p className="text-xs text-green-50">Parabéns pelo progresso</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons - Enhanced */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => previousLesson && handleLessonSelect(previousLesson.id)}
              disabled={!previousLesson}
              className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                previousLesson
                  ? 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-300 hover:shadow-lg transform hover:scale-105 active:scale-95'
                  : 'bg-gray-50 border-2 border-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg
                className={`w-5 h-5 transition-transform ${previousLesson ? 'group-hover:-translate-x-1' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Aula Anterior</span>
            </button>

            <button
              onClick={handleNextLessonClick}
              disabled={!nextLesson}
              className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                nextLesson
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl shadow-purple-500/30 transform hover:scale-105 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Próxima Aula</span>
              <svg
                className={`w-5 h-5 transition-transform ${nextLesson ? 'group-hover:translate-x-1' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <CourseSidebar
            course={course}
            currentLessonId={currentLessonId}
            progress={progress}
            onLessonSelect={handleLessonSelect}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false)
          setPendingNextLesson(null)
        }}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        progressPercentage={currentLessonProgressPercentage}
        lessonTitle={currentLesson?.title || ''}
      />
    </div>
  )
}

