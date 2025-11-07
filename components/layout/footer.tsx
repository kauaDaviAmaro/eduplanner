import Link from 'next/link'
import { auth } from '@/lib/auth'

export async function Footer() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.warn('Session error in footer:', error)
    session = null
  }

  const user = session?.user
  const isAdmin = user?.isAdmin || false

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
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
              <span className="text-xl font-bold text-white">EduPlanner</span>
            </Link>
            <p className="text-sm text-gray-400">
              Transforme sua carreira com educação de qualidade. Acesse centenas de cursos e materiais exclusivos.
            </p>
          </div>

          {/* Geral Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Geral
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/ajuda"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  Ajuda
                </Link>
              </li>
              {!user && (
                <>
                  <li>
                    <Link
                      href="/login"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Entrar
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Cadastrar
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Cursos Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Cursos
            </h3>
            <ul className="space-y-3">
              {user && (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/courses"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Lista de Cursos
                    </Link>
                  </li>
                </>
              )}
              {!user && (
                <li>
                  <Link
                    href="/courses"
                    className="text-sm hover:text-purple-400 transition-colors"
                  >
                    Explorar Cursos
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Conta & Admin Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {isAdmin ? 'Admin' : 'Conta'}
            </h3>
            <ul className="space-y-3">
              {user && (
                <>
                  <li>
                    <Link
                      href="/profile"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/files"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Biblioteca de Arquivos
                    </Link>
                  </li>
                </>
              )}
              {isAdmin && (
                <>
                  <li>
                    <Link
                      href="/admin/courses/new"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Criar Curso
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard?tab=courses"
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      Gerenciar Cursos
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} EduPlanner. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
              >
                Termos de Uso
              </Link>
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

