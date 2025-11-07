'use client'

import { useState, useTransition } from 'react'
import { createLesson } from '@/app/actions/courses'

interface LessonFormProps {
  moduleId: string
  onSuccess: () => void
  isPending: boolean
}

export function LessonForm({ moduleId, onSuccess, isPending }: LessonFormProps) {
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [localPending, startTransition] = useTransition()

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newLessonTitle.trim()
    if (!title) return

    startTransition(async () => {
      try {
        const result = await createLesson({
          moduleId,
          title,
        })

        if (result.success) {
          setNewLessonTitle('')
          onSuccess()
        }
      } catch (err) {
        console.error('Error creating lesson:', err)
      }
    })
  }

  const pending = isPending || localPending

  return (
    <form onSubmit={handleCreateLesson} className="mb-4 pb-4 border-b border-gray-200">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <input
            type="text"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            placeholder="Nome da nova aula..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            disabled={pending}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !newLessonTitle.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow text-sm font-medium flex items-center gap-2"
        >
          {pending ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Criando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar Aula
            </>
          )}
        </button>
      </div>
    </form>
  )
}

