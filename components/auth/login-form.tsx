'use client'

import { useState, useActionState, useEffect } from 'react'
import { signIn } from '@/app/actions/auth'
import Link from 'next/link'

interface LoginFormProps {
  readonly redirect?: string
  readonly error?: string
}

export function LoginForm({ redirect, error: initialError }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [state, formAction, isPending] = useActionState(signIn, null)
  const [serverError, setServerError] = useState<string | null>(initialError || null)

  // Sync server error from action state
  useEffect(() => {
    if (state && typeof state === 'object' && 'error' in state && !state.success) {
      setServerError(state.error || 'Erro ao fazer login. Tente novamente.')
    }
  }, [state])

  const validateEmail = (value: string) => {
    if (!value) {
      return 'Email é obrigatório'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Email inválido'
    }
    return null
  }

  const validatePassword = (value: string) => {
    if (!value) {
      return 'Senha é obrigatória'
    }
    if (value.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres'
    }
    return null
  }

  const handleBlur = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      const error = validateEmail(value)
      setErrors((prev) => ({ ...prev, email: error || undefined }))
    } else {
      const error = validatePassword(value)
      setErrors((prev) => ({ ...prev, password: error || undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (emailError || passwordError) {
      e.preventDefault()
      setErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      })
      return
    }

    setErrors({})
    setServerError(null)
    // Let the form submit naturally - formAction will handle it
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {redirect && <input type="hidden" name="redirect" value={redirect} />}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            required
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }))
              }
            }}
            onBlur={(e) => handleBlur('email', e.target.value)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-4 dark:bg-gray-100 dark:text-gray-900 sm:text-sm ${
              errors.email
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:bg-red-100 dark:border-red-400 dark:focus:ring-red-300'
                : 'border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-200 dark:border-gray-300 dark:focus:border-purple-400 dark:focus:ring-purple-900'
            }`}
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-700 animate-slide-down">
              {errors.email}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-700">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            required
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }))
              }
            }}
            onBlur={(e) => handleBlur('password', e.target.value)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-4 dark:bg-gray-100 dark:text-gray-900 sm:text-sm ${
              errors.password
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:bg-red-100 dark:border-red-400 dark:focus:ring-red-300'
                : 'border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-200 dark:border-gray-300 dark:focus:border-purple-400 dark:focus:ring-purple-900'
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-700 animate-slide-down">
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {(initialError || serverError) && (
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 dark:bg-red-100 dark:border-red-300 animate-fade-in">
          <p className="text-sm font-medium text-red-800 dark:text-red-900">
            {serverError || initialError}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-purple-800"
      >
        {isPending ? (
          <span className="flex items-center justify-center">
            <svg
              className="mr-2 h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Entrando...
          </span>
        ) : (
          'Entrar'
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-600">
          Não tem uma conta?{' '}
          <Link
            href="/signup"
            className="font-bold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-700 dark:hover:text-purple-800"
          >
            Criar conta gratuita
          </Link>
        </p>
      </div>
    </form>
  )
}

