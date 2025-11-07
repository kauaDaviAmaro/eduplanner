'use client'

import { useState, useActionState } from 'react'
import { signUp } from '@/app/actions/auth'
import Link from 'next/link'

interface SignUpFormProps {
  error?: string
  success?: string
}

export function SignUpForm({ error: initialError, success: initialSuccess }: SignUpFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [state, formAction, isPending] = useActionState(signUp, null)

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

  const validateName = (value: string) => {
    if (value && value.length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres'
    }
    return null
  }

  const handleBlur = (field: 'name' | 'email' | 'password', value: string) => {
    if (field === 'name') {
      const error = validateName(value)
      setErrors((prev) => ({ ...prev, name: error || undefined }))
    } else if (field === 'email') {
      const error = validateEmail(value)
      setErrors((prev) => ({ ...prev, email: error || undefined }))
    } else {
      const error = validatePassword(value)
      setErrors((prev) => ({ ...prev, password: error || undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const nameError = name ? validateName(name) : null
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (nameError || emailError || passwordError) {
      e.preventDefault()
      setErrors({
        name: nameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
      })
      return
    }

    setErrors({})
    // Let the form submit naturally - formAction will handle it
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-700">
            Nome <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }))
              }
            }}
            onBlur={(e) => handleBlur('name', e.target.value)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-4 dark:bg-gray-100 dark:text-gray-900 sm:text-sm ${
              errors.name
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:bg-red-100 dark:border-red-400 dark:focus:ring-red-300'
                : 'border-gray-200 bg-gray-50 focus:border-orange-500 focus:ring-orange-200 dark:border-gray-300 dark:focus:border-orange-400 dark:focus:ring-orange-900'
            }`}
            placeholder="Seu nome completo"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-700 animate-slide-down">
              {errors.name}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
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
                : 'border-gray-200 bg-gray-50 focus:border-orange-500 focus:ring-orange-200 dark:border-gray-300 dark:focus:border-orange-400 dark:focus:ring-orange-900'
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
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
                : 'border-gray-200 bg-gray-50 focus:border-orange-500 focus:ring-orange-200 dark:border-gray-300 dark:focus:border-orange-400 dark:focus:ring-orange-900'
            }`}
            placeholder="Mínimo 6 caracteres"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.password ? (
              <p className="text-sm text-red-600 dark:text-red-400 animate-slide-down">
                {errors.password}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-600">
                Use pelo menos 6 caracteres para sua senha
              </p>
            )}
            {password.length > 0 && !errors.password && (
              <div className="flex items-center space-x-1 animate-fade-in">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-xs text-green-600 dark:text-green-400">Válido</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {initialError && (
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 dark:bg-red-100 dark:border-red-300 animate-fade-in">
          <p className="text-sm font-medium text-red-800 dark:text-red-900">
            {initialError}
          </p>
        </div>
      )}

      {initialSuccess && (
        <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 dark:bg-green-100 dark:border-green-300 animate-fade-in">
          <p className="text-sm font-medium text-green-800 dark:text-green-900">
            {initialSuccess}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-pink-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-orange-700 hover:to-pink-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-orange-800"
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
            Criando conta...
          </span>
        ) : (
          'Criar conta gratuita'
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-600">
          Já tem uma conta?{' '}
          <Link
            href="/login"
            className="font-bold text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-700 dark:hover:text-orange-800"
          >
            Entre aqui
          </Link>
        </p>
      </div>
    </form>
  )
}

