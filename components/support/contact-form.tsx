'use client'

import { useState, useActionState, useEffect } from 'react'
import { createTicket } from '@/app/actions/support'
import { useRouter } from 'next/navigation'

interface ContactFormProps {
  readonly userEmail?: string | null
  readonly isAuthenticated?: boolean
}

export function ContactForm({ userEmail, isAuthenticated = false }: ContactFormProps) {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState(userEmail || '')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [errors, setErrors] = useState<{ subject?: string; email?: string; message?: string }>({})
  const [state, formAction, isPending] = useActionState(createTicket, null)

  // Handle success redirect
  useEffect(() => {
    if (state?.success && state.ticketId) {
      // Redirect to ticket view or show success message
      router.push(`/suporte?success=true&ticketId=${state.ticketId}`)
      router.refresh()
    }
  }, [state, router])

  const validateSubject = (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'O assunto é obrigatório'
    }
    if (value.trim().length < 3) {
      return 'O assunto deve ter pelo menos 3 caracteres'
    }
    return null
  }

  const validateEmail = (value: string) => {
    if (!isAuthenticated && (!value || value.trim().length === 0)) {
      return 'Email é obrigatório'
    }
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email inválido'
    }
    return null
  }

  const validateMessage = (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'A mensagem é obrigatória'
    }
    if (value.trim().length < 10) {
      return 'A mensagem deve ter pelo menos 10 caracteres'
    }
    return null
  }

  const handleBlur = (field: 'subject' | 'email' | 'message', value: string) => {
    if (field === 'subject') {
      const error = validateSubject(value)
      setErrors((prev) => ({ ...prev, subject: error || undefined }))
    } else if (field === 'email') {
      const error = validateEmail(value)
      setErrors((prev) => ({ ...prev, email: error || undefined }))
    } else {
      const error = validateMessage(value)
      setErrors((prev) => ({ ...prev, message: error || undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const subjectError = validateSubject(subject)
    const emailError = !isAuthenticated ? validateEmail(email) : null
    const messageError = validateMessage(message)

    if (subjectError || emailError || messageError) {
      e.preventDefault()
      setErrors({
        subject: subjectError || undefined,
        email: emailError || undefined,
        message: messageError || undefined,
      })
      return
    }

    setErrors({})
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-gray-700">
            Assunto *
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={subject}
            required
            onChange={(e) => {
              setSubject(e.target.value)
              if (errors.subject) {
                setErrors((prev) => ({ ...prev, subject: undefined }))
              }
            }}
            onBlur={(e) => handleBlur('subject', e.target.value)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-4 ${
              errors.subject
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-200'
            }`}
            placeholder="Descreva brevemente o problema"
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600 animate-slide-down">{errors.subject}</p>
          )}
        </div>

        {!isAuthenticated && (
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
              Email *
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
              className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-4 ${
                errors.email
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-200'
              }`}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 animate-slide-down">{errors.email}</p>
            )}
          </div>
        )}

        {isAuthenticated && <input type="hidden" name="email" value={email || ''} />}

        <div>
          <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-gray-700">
            Prioridade
          </label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-200"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-semibold text-gray-700">
            Mensagem *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={message}
            required
            onChange={(e) => {
              setMessage(e.target.value)
              if (errors.message) {
                setErrors((prev) => ({ ...prev, message: undefined }))
              }
            }}
            onBlur={(e) => handleBlur('message', e.target.value)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-4 resize-none ${
              errors.message
                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-purple-200'
            }`}
            placeholder="Descreva seu problema ou dúvida em detalhes..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600 animate-slide-down">{errors.message}</p>
          )}
        </div>
      </div>

      {state && !state.success && state.error && (
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 animate-fade-in">
          <p className="text-sm font-medium text-red-800">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            Enviando...
          </span>
        ) : (
          'Enviar Ticket'
        )}
      </button>
    </form>
  )
}

