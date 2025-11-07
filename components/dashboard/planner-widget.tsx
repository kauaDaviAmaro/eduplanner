'use client'

import { useState } from 'react'
import type { LessonPlan } from '@/lib/queries/dashboard'
import { createLessonPlan, updateLessonPlan, deleteLessonPlan } from '@/app/actions/dashboard'

export function PlannerWidget({ initialPlans }: Readonly<{ initialPlans: LessonPlan[] }>) {
  const [plans, setPlans] = useState(initialPlans)
  const [isCreating, setIsCreating] = useState(false)
  const [newPlanTitle, setNewPlanTitle] = useState('')

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) return

    const result = await createLessonPlan({
      title: newPlanTitle,
      items: [],
    })

    if (result.success) {
      setNewPlanTitle('')
      setIsCreating(false)
      // Reload page to refresh data
      window.location.reload()
    }
  }

  const upcomingPlans = plans
    .filter((plan) => {
      if (!plan.due_date) return false
      const dueDate = new Date(plan.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dueDate >= today
    })
    .slice(0, 3)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Planejador de Aulas</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
        >
          {isCreating ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {isCreating && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            value={newPlanTitle}
            onChange={(e) => setNewPlanTitle(e.target.value)}
            placeholder="Título do planejamento..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreatePlan()
              }
            }}
          />
          <button
            onClick={handleCreatePlan}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Criar
          </button>
        </div>
      )}

      {upcomingPlans.length === 0 && !isCreating && (
        <p className="text-gray-600 text-sm">Nenhum planejamento pendente.</p>
      )}

      <div className="space-y-3">
        {upcomingPlans.map((plan) => {
          const items = Array.isArray(plan.items) ? (plan.items as any[]) : []
          const completedItems = items.filter((item) => item.completed).length
          const totalItems = items.length

          return (
            <div key={plan.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{plan.title}</h4>
                {plan.due_date && (
                  <span className="text-xs text-gray-500">
                    {new Date(plan.due_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              {totalItems > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                      style={{ width: `${(completedItems / totalItems) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {completedItems}/{totalItems}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {plans.length > 3 && (
        <button className="mt-4 w-full text-sm text-purple-600 hover:text-purple-700 font-semibold">
          Ver todos ({plans.length})
        </button>
      )}
    </div>
  )
}

