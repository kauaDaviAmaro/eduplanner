import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ redirect?: string; error?: string }>
}>) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    session = null
  }
  
  const params = await searchParams

  if (session?.user) {
    redirect(params.redirect || '/dashboard')
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 animate-scale-in">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900">EduPlanner</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900">
              Bem-vindo de volta!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-600">
              Entre na sua conta para continuar aprendendo
            </p>
          </div>

          <LoginForm redirect={params.redirect} error={params.error} />
        </div>
      </div>

      {/* Lado direito - Conteúdo visual */}
      <div className="hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="mb-4 text-3xl font-bold animate-fade-in animate-delay-300">Transforme sua carreira</h3>
          <p className="mb-8 text-lg text-white/90 animate-fade-in animate-delay-400">
            Acesse centenas de cursos, materiais exclusivos e aprenda no seu ritmo
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
                <h4 className="font-semibold">Cursos atualizados</h4>
                <p className="text-sm text-white/80">Conteúdo sempre atualizado com as melhores práticas</p>
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Material exclusivo</h4>
                <p className="text-sm text-white/80">PDFs, apresentações e recursos para download</p>
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Acesso imediato</h4>
                <p className="text-sm text-white/80">Comece a aprender assim que entrar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

