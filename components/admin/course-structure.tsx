'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'
import type { CourseWithModules } from '@/lib/queries/courses'
import { ModuleItem } from './course-structure/ModuleItem'
import { ModuleForm } from './course-structure/ModuleForm'

type Tier = Database['public']['Tables']['tiers']['Row']

interface CourseStructureProps {
  readonly course: CourseWithModules
  readonly onUpdate: () => void
  readonly tiers: Tier[]
}

export function CourseStructure({ course, onUpdate, tiers }: CourseStructureProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending] = useState(false)

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleModuleCreated = (moduleId?: string) => {
    if (moduleId) {
      setExpandedModules(new Set([...expandedModules, moduleId]))
    }
          onUpdate()
  }

  return (
    <div className="w-full max-w-none bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Estrutura do Curso</h3>
          <p className="text-sm text-gray-500">
            Organize os módulos e aulas do seu curso
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0 ml-4">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="font-medium">
            {course.modules.length} {course.modules.length === 1 ? 'módulo' : 'módulos'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-down">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Fechar erro"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Create New Module Form */}
      <div className="w-full">
        <ModuleForm courseId={course.id} onSuccess={handleModuleCreated} isPending={isPending} />
        </div>

      {/* Modules List */}
      <div className="w-full space-y-4">
        {course.modules.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum módulo criado ainda</h4>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Comece criando seu primeiro módulo usando o formulário acima. Cada módulo pode conter várias aulas.
            </p>
          </div>
        ) : (
          course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="animate-scale-in" style={{ animationDelay: `${moduleIndex * 0.05}s` }}>
              <ModuleItem
                module={module}
                moduleIndex={moduleIndex}
                courseId={course.id}
                tiers={tiers}
                isExpanded={expandedModules.has(module.id)}
                onToggle={() => toggleModule(module.id)}
                onUpdate={onUpdate}
                isPending={isPending}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
