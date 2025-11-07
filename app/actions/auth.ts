'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth'
import { createUserWithPassword } from '@/lib/auth/helpers'
import { query } from '@/lib/db/client'

type SignUpState = {
  success: boolean
  error: string
} | null

export async function signUp(
  prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password) {
    redirect('/signup?error=' + encodeURIComponent('Email e senha são obrigatórios'))
  }

  if (password.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('A senha deve ter pelo menos 6 caracteres'))
  }

  // Create user with password
  const user = await createUserWithPassword(email, password, name)

  if (!user) {
    redirect('/signup?error=' + encodeURIComponent('Email já está em uso'))
  }

  // Sign in the user after registration
  try {
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch (error) {
    console.error('Error signing in after registration:', error)
    redirect('/signup?error=' + encodeURIComponent('Conta criada, mas falha ao fazer login. Tente fazer login manualmente.'))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

type SignInState = {
  success: boolean
  error: string
  redirectTo: string | null
} | null

export async function signIn(
  prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const redirectTo = formData.get('redirect') as string | null

    if (!email || !password) {
      return {
        success: false,
        error: 'Email e senha são obrigatórios',
        redirectTo: redirectTo || null,
      }
    }

    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      return {
        success: false,
        error: 'Email ou senha incorretos',
        redirectTo: redirectTo || null,
      }
    }

    // Revalidate paths
    revalidatePath('/', 'layout')
    revalidatePath('/dashboard', 'layout')

    // Use redirect() to ensure cookies are properly sent in the response
    redirect(redirectTo || '/dashboard')
  } catch (error) {
    console.error('Unexpected error in signIn:', error)

    return {
      success: false,
      error: 'Erro inesperado ao fazer login. Tente novamente.',
      redirectTo: null,
    }
  }
}

export async function signOut() {
  await nextAuthSignOut({ redirect: false })
  revalidatePath('/', 'layout')
  redirect('/login')
}

