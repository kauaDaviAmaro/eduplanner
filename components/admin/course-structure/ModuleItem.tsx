'use client'

import { useState } from 'react'
import { updateModule, deleteModule } from '@/app/actions/courses'
import type { Database } from '@/types/database'
import type { CourseWithModules } from '@/lib/queries/courses'
import { LessonItem } from './LessonItem'
import { LessonForm } from './LessonForm'

type Module = Database['public']['Tables']['modules']['Row']
type Tier = Database['public']['Tables']['tiers']['Row']

interface ModuleItemProps {
  module: Module & { lessons: CourseWithModules['modules'][0]['lessons'] }
  moduleIndex: number
  courseId: string
  tiers: Tier[]
  isExpanded: boolean
  onToggle: () => void
  onUpdate: () => void
  isPending: boolean
}

export function ModuleItem({
  module,
  moduleIndex,
  tiers,
  isExpanded,
  onToggle,
  onUpdate,
  isPending,
}: ModuleItemProps) {
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [moduleTitle, setModuleTitle] = useState(module.title)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  const handleEditModule = () => {
    setEditingModuleId(module.id)
    setModuleTitle(module.title)
  }

  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) return

    try {
      const result = await updateModule(module.id, {
        title: moduleTitle.trim(),
      })

      if (result.success) {
        setEditingModuleId(null)
        onUpdate()
      }
    } catch (err) {
      console.error('Error updating module:', err)
    }
  }

  const handleDeleteModule = async () => {
    if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas e anexos serão excluídos também.')) {
      return
    }

    try {
      const result = await deleteModule(module.id)
      if (result.success) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error deleting module:', err)
    }
  }

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId)
    } else {
      newExpanded.add(lessonId)
    }
    setExpandedLessons(newExpanded)
  }

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0 h-8">
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            aria-label={isExpanded ? 'Recolher módulo' : 'Expandir módulo'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {editingModuleId === module.id ? (
            <div className="flex gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveModule()
                  if (e.key === 'Escape') {
                    setEditingModuleId(null)
                    setModuleTitle(module.title)
                  }
                }}
              />
              <button
                onClick={handleSaveModule}
                disabled={isPending || !moduleTitle.trim()}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setEditingModuleId(null)
                  setModuleTitle(module.title)
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full flex-shrink-0 min-w-[85px] text-center flex items-center justify-center h-7">
                  Módulo {moduleIndex + 1}
                </span>
                <span className="font-semibold text-gray-900 truncate flex items-center">{module.title}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0 flex items-center justify-center h-6">
                  {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
                </span>
              </div>
            </>
          )}
        </div>
        {editingModuleId !== module.id && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleEditModule}
              disabled={isPending}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Editar módulo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteModule}
              disabled={isPending}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Excluir módulo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Module Content (Lessons) */}
      {isExpanded && (
        <div className="p-4 bg-white animate-slide-down">
          {/* Create New Lesson Form */}
          <LessonForm moduleId={module.id} onSuccess={onUpdate} isPending={isPending} />

          {/* Lessons List */}
          <div className="space-y-3">
            {module.lessons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm">Nenhuma aula criada ainda</p>
              </div>
            ) : (
              module.lessons.map((lesson, lessonIndex) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  lessonIndex={lessonIndex}
                  moduleId={module.id}
                  tiers={tiers}
                  isExpanded={expandedLessons.has(lesson.id)}
                  onToggle={() => toggleLesson(lesson.id)}
                  onUpdate={onUpdate}
                  isPending={isPending}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

