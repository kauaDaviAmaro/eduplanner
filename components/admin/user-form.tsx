'use client'

import { useState, useTransition } from 'react'
import { createUser, updateUser } from '@/app/actions/users'
import type { UserWithProfile } from '@/lib/queries/admin'
import type { Database } from '@/types/database'

type Tier = Database['public']['Tables']['tiers']['Row']

interface UserFormProps {
  user?: UserWithProfile | null
  tiers: Tier[]
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, tiers, onSuccess, onCancel }: UserFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    tierId: user?.profile?.tier.id || tiers[0]?.id || 0,
    isAdmin: user?.profile?.is_admin || false,
  })

  const isEditMode = !!user

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email) {
      setError('Email é obrigatório')
      return
    }

    if (!isEditMode && !formData.password) {
      setError('Senha é obrigatória para novos usuários')
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    startTransition(async () => {
      try {
        if (isEditMode) {
          const result = await updateUser(user.id, {
            name: formData.name || undefined,
            email: formData.email,
            tierId: formData.tierId,
            isAdmin: formData.isAdmin,
            password: formData.password || undefined,
          })

          if (result.success) {
            onSuccess()
          } else {
            setError(result.error || 'Erro ao atualizar usuário')
          }
        } else {
          const result = await createUser({
            name: formData.name || undefined,
            email: formData.email,
            password: formData.password,
            tierId: formData.tierId,
            isAdmin: formData.isAdmin,
          })

          if (result.success) {
            onSuccess()
          } else {
            setError(result.error || 'Erro ao criar usuário')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nome do usuário"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="usuario@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha {isEditMode ? '(deixe em branco para não alterar)' : '*'}
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEditMode}
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="tierId" className="block text-sm font-medium text-gray-700 mb-1">
                Tier
              </label>
              <select
                id="tierId"
                value={formData.tierId}
                onChange={(e) => setFormData({ ...formData, tierId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name} (Nível {tier.permission_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
                Administrador
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


