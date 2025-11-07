import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignUpForm } from '@/components/auth/signup-form'
import Link from 'next/link'

export default async function SignUpPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string; success?: string }>
}>) {
  // Handle potential JWT session errors gracefully
  let session = null
  try {
    session = await auth()
  } catch (error) {
    // If there's a JWT session error (corrupted cookie or secret mismatch),
    // treat it as no session - user can still sign up
    console.warn('Session error (likely corrupted cookie):', error)
    session = null
  }
  
  const params = await searchParams

  // If user is already logged in, redirect
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo - Formulário */}
      <div className="flex w-full flex-col justify-center bg-white px-4 py-12 dark:bg-gray-50 sm:px-6 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-600 dark:hover:text-gray-900"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar para página inicial
          </Link>
          <div className="mb-8 animate-slide-in-left">
            <div className="mb-6 flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 animate-scale-in">
                <svg
                  className="h-7 w-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">EduPlanner</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900">
              Comece sua jornada!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-600">
              Crie sua conta e transforme sua carreira hoje mesmo
            </p>
          </div>

          <SignUpForm error={params.error} success={params.success} />
        </div>
      </div>

      {/* Lado direito - Conteúdo visual */}
      <div className="hidden bg-gradient-to-br from-orange-600 via-pink-600 to-rose-600 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12">
        <div className="mx-auto max-w-md text-center text-white animate-slide-in-right">
          <div className="mb-8 animate-scale-in animate-delay-200">
            <svg
              className="mx-auto h-24 w-24 text-white/90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h3 className="mb-4 text-3xl font-bold animate-fade-in animate-delay-300">Junte-se a milhares de alunos</h3>
          <p className="mb-8 text-lg text-white/90 animate-fade-in animate-delay-400">
            Aprenda com os melhores professores e acelere seu crescimento profissional
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4 text-left animate-slide-up animate-delay-100">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Certificados reconhecidos</h4>
                <p className="text-sm text-white/80">Receba certificados válidos ao concluir os cursos</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 text-left animate-slide-up animate-delay-200">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Aprenda no seu ritmo</h4>
                <p className="text-sm text-white/80">Acesse quando e onde quiser, sem pressa</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 text-left animate-slide-up animate-delay-300">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Comunidade ativa</h4>
                <p className="text-sm text-white/80">Conecte-se com outros alunos e professores</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

