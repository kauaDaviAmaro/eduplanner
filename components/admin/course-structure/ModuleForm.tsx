'use client'

import { useState, useTransition } from 'react'
import { createModule } from '@/app/actions/courses'

interface ModuleFormProps {
  courseId: string
  onSuccess: (moduleId?: string) => void
  isPending: boolean
}

export function ModuleForm({ courseId, onSuccess, isPending }: ModuleFormProps) {
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [localPending, startTransition] = useTransition()

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModuleTitle.trim()) return

    startTransition(async () => {
      try {
        const result = await createModule({
          courseId,
          title: newModuleTitle.trim(),
        })

        if (result.success) {
          setNewModuleTitle('')
          onSuccess(result.moduleId)
        }
      } catch (err) {
        console.error('Error creating module:', err)
      }
    })
  }

  const pending = isPending || localPending

  return (
    <form onSubmit={handleCreateModule} className="mb-6 pb-6 border-b border-gray-200">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Nome do novo módulo..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={pending}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !newModuleTitle.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium flex items-center gap-2"
        >
          {pending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Criando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar Módulo
            </>
          )}
        </button>
      </div>
    </form>
  )
}

