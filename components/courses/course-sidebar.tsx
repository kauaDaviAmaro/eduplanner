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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden backdrop-blur-sm animate-fade-in animate-delay-200">
      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Conteúdo do Curso</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} {course.modules.reduce((acc, m) => acc + m.lessons.length, 0) === 1 ? 'aula' : 'aulas'}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
        <div className="divide-y divide-gray-100/50">
          {course.modules.map((module) => {
            const isExpanded = expandedModules.has(module.id)
            const moduleLessons = module.lessons

            return (
              <div key={module.id} className="bg-white transition-all">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 transform transition-transform duration-200 group-hover:scale-110">
                      {isExpanded ? (
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                          <svg
                            className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors"
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
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">{module.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {moduleLessons.length} {moduleLessons.length === 1 ? 'aula' : 'aulas'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Module Lessons */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-gradient-to-br from-gray-50/50 to-purple-50/30">
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
                          className={`border-l-4 transition-all duration-200 ${
                            isCurrent
                              ? 'border-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm'
                              : 'border-transparent hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          <button
                            onClick={() => onLessonSelect(lesson.id)}
                            className="w-full px-5 py-3.5 text-left group transition-all duration-200"
                          >
                            <div className="flex items-start gap-3">
                              {/* Status Icon */}
                              <div className="flex-shrink-0 mt-0.5">
                                {status === 'completed' ? (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <svg
                                      className="w-3.5 h-3.5 text-white"
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
                                  <div className="w-6 h-6 rounded-full border-2 border-purple-600 bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></div>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white group-hover:border-purple-400 group-hover:bg-purple-50 flex items-center justify-center transition-all">
                                    <span className="text-xs text-gray-500 group-hover:text-purple-600 font-semibold transition-colors">
                                      {index + 1}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Lesson Info */}
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`text-sm font-semibold leading-snug ${
                                    isCurrent 
                                      ? 'text-purple-900' 
                                      : 'text-gray-800 group-hover:text-purple-700 transition-colors'
                                  }`}
                                >
                                  {lesson.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-gray-500 font-medium">
                                      {formatDuration(lesson.duration)}
                                    </p>
                                  </div>
                                  {status === 'in-progress' && progressPercentage > 0 && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${progressPercentage}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500 font-medium">{Math.round(progressPercentage)}%</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Attachments */}
                          {lesson.attachments.length > 0 && (
                            <div className="px-5 pb-3 pl-14">
                              <div className="space-y-1.5">
                                {lesson.attachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenPreview(attachment, module.title, lesson.title)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-white hover:text-purple-600 rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-purple-200 group/attach"
                                  >
                                    <div className="w-5 h-5 rounded-md bg-purple-100 group-hover/attach:bg-purple-200 flex items-center justify-center transition-colors">
                                      <svg
                                        className="w-3 h-3 text-purple-600"
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
                                    </div>
                                    <span className="truncate font-medium">{attachment.file_name}</span>
                                    <span className="text-gray-400 text-[10px] ml-auto">
                                      {attachment.file_type}
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
                </div>
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333ea, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7e22ce, #4f46e5);
        }
      `}</style>
    </div>
  )
}

