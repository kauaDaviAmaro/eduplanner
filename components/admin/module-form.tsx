'use client'

import { useState, useTransition } from 'react'
import { createModule, updateModule, deleteModule } from '@/app/actions/courses'
import type { Database } from '@/types/database'

type Module = Database['public']['Tables']['modules']['Row']

interface ModuleFormProps {
  courseId: string
  modules: Module[]
  onSuccess: () => void
  onCancel?: () => void
}

export function ModuleForm({ courseId, modules, onSuccess, onCancel }: ModuleFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Título do módulo é obrigatório')
      return
    }

    startTransition(async () => {
      try {
        if (editingModuleId) {
          const result = await updateModule(editingModuleId, {
            title: formData.title,
          })

          if (result.success) {
            setFormData({ title: '' })
            setEditingModuleId(null)
            setSuccessMessage('Módulo atualizado com sucesso!')
            setTimeout(() => setSuccessMessage(null), 3000)
            onSuccess()
          } else {
            setError(result.error || 'Erro ao atualizar módulo')
          }
        } else {
          const result = await createModule({
            courseId,
            title: formData.title,
          })

          if (result.success) {
            setFormData({ title: '' })
            setSuccessMessage('Módulo criado com sucesso!')
            setTimeout(() => setSuccessMessage(null), 3000)
            onSuccess()
          } else {
            setError(result.error || 'Erro ao criar módulo')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      }
    })
  }

  const handleEdit = (module: Module) => {
    setEditingModuleId(module.id)
    setFormData({ title: module.title })
  }

  const handleCancelEdit = () => {
    setEditingModuleId(null)
    setFormData({ title: '' })
  }

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas e anexos serão excluídos também.')) {
      return
    }

    setDeletingModuleId(moduleId)
    setError(null)

    try {
      const result = await deleteModule(moduleId)
      if (result.success) {
        setSuccessMessage('Módulo excluído com sucesso!')
        setTimeout(() => setSuccessMessage(null), 3000)
        onSuccess()
      } else {
        setError(result.error || 'Erro ao excluir módulo')
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setDeletingModuleId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Módulo</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Título do Módulo *
          </label>
          <input
            type="text"
            id="moduleTitle"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Fundamentos do React"
          />
        </div>

        <div className="flex justify-end space-x-3">
          {editingModuleId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar Edição
            </button>
          )}
          {onCancel && !editingModuleId && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isPending
              ? editingModuleId
                ? 'Salvando...'
                : 'Criando...'
              : editingModuleId
              ? 'Salvar Alterações'
              : 'Adicionar Módulo'}
          </button>
        </div>
      </form>

      {modules.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Módulos Criados</h4>
          <div className="space-y-2">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {index + 1}. {module.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(module)}
                    disabled={editingModuleId === module.id || !!deletingModuleId}
                    className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(module.id)}
                    disabled={deletingModuleId === module.id || !!editingModuleId}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {deletingModuleId === module.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

