'use client'

import { useState } from 'react'
import type { CourseWithModules } from '@/lib/queries/courses'
import type { Database } from '@/types/database'
import type { AttachmentWithContext } from '@/lib/queries/attachments'
import { FilePreviewModal } from '@/components/files/file-preview-modal'

type UserProgress = Database['public']['Tables']['user_progress']['Row']
type Attachment = Database['public']['Tables']['attachments']['Row']

interface CourseSidebarProps {
  course: CourseWithModules
  currentLessonId: string
  progress: UserProgress[]
  onLessonSelect: (lessonId: string) => void
}

export function CourseSidebar({
  course,
  currentLessonId,
  progress,
  onLessonSelect,
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map((m) => m.id))
  )
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentWithContext | null>(null)

  // Create progress map for quick lookup
  const progressMap = new Map<string, UserProgress>()
  progress.forEach((p) => {
    progressMap.set(p.lesson_id, p)
  })

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const buildAttachmentWithContext = async (
    attachment: Attachment,
    moduleTitle: string,
    lessonTitle: string
  ): Promise<AttachmentWithContext> => {
    // Fetch tier name from API
    let tierName = 'N/A'
    let tierPermissionLevel = 0
    
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/tier`)
      if (response.ok) {
        const data = await response.json()
        tierName = data.tier_name || 'N/A'
        tierPermissionLevel = data.tier_permission_level || 0
      }
    } catch (error) {
      console.error('Error fetching tier info:', error)
    }

    return {
      id: attachment.id,
      file_name: attachment.file_name,
      file_type: attachment.file_type,
      file_url: attachment.file_url,
      minimum_tier_id: attachment.minimum_tier_id,
      created_at: attachment.created_at,
      course_id: course.id,
      course_title: course.title,
      lesson_id: attachment.lesson_id,
      lesson_title: lessonTitle,
      module_title: moduleTitle,
      tier_name: tierName,
      tier_permission_level: tierPermissionLevel,
    }
  }

  const handleOpenPreview = async (attachment: Attachment, moduleTitle: string, lessonTitle: string) => {
    const attachmentWithContext = await buildAttachmentWithContext(attachment, moduleTitle, lessonTitle)
    setPreviewAttachment(attachmentWithContext)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const getLessonStatus = (lessonId: string) => {
    const lessonProgress = progressMap.get(lessonId)
    if (!lessonProgress) {
      return 'not-started'
    }
    if (lessonProgress.is_completed) {
      return 'completed'
    }
    if (lessonProgress.time_watched > 0) {
      return 'in-progress'
    }
    return 'not-started'
  }

  const getLessonProgressPercentage = (lessonId: string, duration: number) => {
    const lessonProgress = progressMap.get(lessonId)
    if (!lessonProgress || !duration || duration === 0) {
      return 0
    }
    return Math.min((lessonProgress.time_watched / duration) * 100, 100)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <h2 className="text-xl font-semibold text-gray-900">Conteúdo do Curso</h2>
        <p className="text-sm text-gray-600 mt-1">
          {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas
        </p>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        <div className="divide-y divide-gray-100">
          {course.modules.map((module) => {
            const isExpanded = expandedModules.has(module.id)
            const moduleLessons = module.lessons

            return (
              <div key={module.id} className="bg-white">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-600"
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
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{module.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {moduleLessons.length} {moduleLessons.length === 1 ? 'aula' : 'aulas'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Module Lessons */}
                {isExpanded && (
                  <div className="bg-gray-50/50">
                    {moduleLessons.map((lesson, index) => {
                      const isCurrent = lesson.id === currentLessonId
                      const status = getLessonStatus(lesson.id)
                      const progressPercentage = getLessonProgressPercentage(
                        lesson.id,
                        lesson.duration
                      )

                      return (
                        <div
                          key={lesson.id}
                          className={`border-l-4 transition-all ${
                            isCurrent
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-transparent hover:border-purple-200 hover:bg-purple-50/50'
                          }`}
                        >
                          <button
                            onClick={() => onLessonSelect(lesson.id)}
                            className="w-full px-4 py-3 text-left group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Status Icon */}
                              <div className="flex-shrink-0 mt-0.5">
                                {status === 'completed' ? (
                                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                ) : status === 'in-progress' ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-purple-600 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                    <span className="text-xs text-gray-400 font-medium">
                                      {index + 1}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Lesson Info */}
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`text-sm font-medium ${
                                    isCurrent ? 'text-purple-900' : 'text-gray-800 group-hover:text-purple-700'
                                  }`}
                                >
                                  {lesson.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatDuration(lesson.duration)}
                                  </p>
                                  {status === 'in-progress' && progressPercentage > 0 && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-purple-600 h-1.5 rounded-full transition-all"
                                          style={{ width: `${progressPercentage}%` }}
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Attachments */}
                          {lesson.attachments.length > 0 && (
                            <div className="px-4 pb-3 pl-12">
                              <div className="space-y-1.5">
                                {lesson.attachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenPreview(attachment, module.title, lesson.title)
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-white rounded hover:text-purple-600 transition-colors"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    <span className="truncate">{attachment.file_name}</span>
                                    <span className="text-gray-400 text-[10px]">
                                      ({attachment.file_type})
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview Modal */}
      {previewAttachment && (
        <FilePreviewModal
          attachment={previewAttachment}
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  )
}

