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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-scaleIn">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Marcar como concluída?</h3>
          <p className="text-gray-600 mb-4">
            Você assistiu <span className="font-semibold text-purple-600">{Math.round(progressPercentage)}%</span> da aula <span className="font-medium">&quot;{lessonTitle}&quot;</span>.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Deseja marcar esta aula como concluída antes de continuar?
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Sim, marcar como concluída
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Não, apenas navegar
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Cancelar
          </button>
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
        <div className="text-center">
          <p className="text-gray-600">Carregando aula...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Course Progress Bar */}
      {courseProgress.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso do Curso</span>
            <span className="text-sm font-semibold text-purple-600">
              {courseProgress.completed}/{courseProgress.total} aulas ({courseProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${courseProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lesson Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {currentLesson.moduleTitle}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
                <p className="text-sm text-gray-600">
                  Duração: {Math.floor(currentLesson.duration / 60)} minutos
                </p>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className={isLoadingLesson ? 'opacity-50 transition-opacity' : ''}>
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

          {/* Complete Lesson Button */}
          {!isCurrentLessonCompleted && (
            <div className="flex justify-center">
              <button
                onClick={handleCompleteLesson}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Concluir Aula</span>
              </button>
            </div>
          )}

          {/* Success Toast */}
          {showSuccessToast && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slideIn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Aula marcada como concluída!</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => previousLesson && handleLessonSelect(previousLesson.id)}
              disabled={!previousLesson}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                previousLesson
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300 hover:shadow-md'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Aula Anterior</span>
            </button>

            <button
              onClick={handleNextLessonClick}
              disabled={!nextLesson}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                nextLesson
                  ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Próxima Aula</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
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

