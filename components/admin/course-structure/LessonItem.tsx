'use client'

import { useState, useRef } from 'react'
import { updateLesson, deleteLesson, createLesson } from '@/app/actions/courses'
import type { Database } from '@/types/database'
import type { CourseWithModules } from '@/lib/queries/courses'
import { VideoUploader } from './VideoUploader'
import { AttachmentSection } from './AttachmentSection'

type Lesson = CourseWithModules['modules'][0]['lessons'][0]
type Tier = Database['public']['Tables']['tiers']['Row']

interface LessonItemProps {
  lesson: Lesson
  lessonIndex: number
  moduleId: string
  tiers: Tier[]
  isExpanded: boolean
  onToggle: () => void
  onUpdate: () => void
  isPending: boolean
}

export function LessonItem({
  lesson,
  lessonIndex,
  moduleId,
  tiers,
  isExpanded,
  onToggle,
  onUpdate,
  isPending,
}: LessonItemProps) {
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState(lesson.title)
  const [expandedVideo, setExpandedVideo] = useState(false)
  const [expandedAttachments, setExpandedAttachments] = useState(false)

  const handleEditLesson = () => {
    setEditingLessonId(lesson.id)
    setLessonTitle(lesson.title)
  }

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim()) return

    try {
      const result = await updateLesson(lesson.id, {
        title: lessonTitle.trim(),
      })

      if (result.success) {
        setEditingLessonId(null)
        onUpdate()
      }
    } catch (err) {
      console.error('Error updating lesson:', err)
    }
  }

  const handleDeleteLesson = async () => {
    if (!confirm('Tem certeza que deseja excluir esta aula? Todos os anexos serão excluídos também.')) {
      return
    }

    try {
      const result = await deleteLesson(lesson.id)
      if (result.success) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error deleting lesson:', err)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-all duration-200 overflow-hidden">
      {/* Lesson Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0 h-7">
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            aria-label={isExpanded ? 'Recolher aula' : 'Expandir aula'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {editingLessonId === lesson.id ? (
            <div className="flex gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="flex-1 px-2 py-1 border border-purple-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLesson()
                  if (e.key === 'Escape') {
                    setEditingLessonId(null)
                    setLessonTitle(lesson.title)
                  }
                }}
              />
              <button
                onClick={handleSaveLesson}
                disabled={isPending || !lessonTitle.trim()}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingLessonId(null)
                  setLessonTitle(lesson.title)
                }}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-600 bg-white border border-gray-300 px-2.5 py-1 rounded flex-shrink-0 min-w-[32px] text-center flex items-center justify-center h-6">
                  {lessonIndex + 1}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate flex items-center">{lesson.title}</span>
                {lesson.video_url ? (
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full flex-shrink-0">
                    <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0019 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Vídeo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                    Sem vídeo
                  </span>
                )}
                {lesson.attachments && lesson.attachments.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                    {lesson.attachments.length} {lesson.attachments.length === 1 ? 'anexo' : 'anexos'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {editingLessonId !== lesson.id && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleEditLesson}
              disabled={isPending}
              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors disabled:opacity-50"
              aria-label="Editar aula"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteLesson}
              disabled={isPending}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
              aria-label="Excluir aula"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-slide-down">
          {/* Video Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <VideoUploader
              lesson={lesson}
              onUpdate={onUpdate}
              isExpanded={expandedVideo}
              onToggle={() => setExpandedVideo(!expandedVideo)}
            />
          </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <AttachmentSection
              lesson={lesson}
              tiers={tiers}
              onUpdate={onUpdate}
              isExpanded={expandedAttachments}
              onToggle={() => setExpandedAttachments(!expandedAttachments)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

