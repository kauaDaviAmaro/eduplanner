import Link from 'next/link'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getFileProductsWithPurchaseStatus } from '@/lib/queries/file-products'
import { getProductsWithPurchaseStatus } from '@/lib/queries/products'
import { FeaturedProductsSection } from '@/components/shop/featured-products-section'

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    session = null
  }
  const user = session?.user

  // Get featured products for landing page (limit to 4 of each type)
  let featuredFileProducts: Awaited<ReturnType<typeof getFileProductsWithPurchaseStatus>> = []
  let featuredProducts: Awaited<ReturnType<typeof getProductsWithPurchaseStatus>> = []
  
  try {
    const [allFileProducts, allProducts] = await Promise.all([
      getFileProductsWithPurchaseStatus(),
      getProductsWithPurchaseStatus(),
    ])

    // Get first 4 active products of each type
    featuredFileProducts = allFileProducts.filter(p => p.is_active).slice(0, 4)
    featuredProducts = allProducts.filter(p => p.is_active).slice(0, 4)
  } catch (error) {
    // If database is not available during build, just show empty products
    console.warn('Could not load products for landing page:', error)
  }
  
  const isAuthenticated = !!user

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-200 bg-white/80 dark:bg-gray-50/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
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
              <span className="text-xl font-bold text-gray-900 dark:text-gray-900">EduPlanner</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/ajuda"
                className="text-sm font-medium text-gray-700 dark:text-gray-700 hover:text-purple-600 dark:hover:text-purple-600 transition-colors"
              >
                Ajuda
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 dark:text-gray-700 hover:text-purple-600 dark:hover:text-purple-600 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700"
                  >
                    Começar grátis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-50 dark:via-gray-50 dark:to-gray-50 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-900 sm:text-6xl animate-fade-in">
              Transforme sua carreira com{' '}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                educação de qualidade
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-600 animate-fade-in animate-delay-100">
              Acesse centenas de cursos, materiais exclusivos e aprenda no seu próprio ritmo.
              Junte-se a milhares de alunos que já transformaram suas carreiras.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in animate-delay-200">
              {user ? (
                <Link
                  href="/courses"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
                >
                  Explorar Cursos
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
                  >
                    Começar grátis
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border-2 border-gray-300 dark:border-gray-300 bg-white dark:bg-white px-8 py-4 text-lg font-semibold text-gray-900 dark:text-gray-900 transition-all hover:bg-gray-50 dark:hover:bg-gray-50"
                  >
                    Entrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900 sm:text-4xl">
              Por que escolher o EduPlanner?
            </h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-600">
              Tudo que você precisa para acelerar seu aprendizado
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {[
              {
                name: 'Cursos Atualizados',
                description:
                  'Conteúdo sempre atualizado com as melhores práticas do mercado e tecnologias mais recentes.',
                icon: (
                  <svg
                    className="h-6 w-6 text-purple-600"
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
                ),
              },
              {
                name: 'Material Exclusivo',
                description:
                  'PDFs, apresentações, templates e recursos para download. Tudo organizado e acessível.',
                icon: (
                  <svg
                    className="h-6 w-6 text-purple-600"
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
                ),
              },
              {
                name: 'Aprenda no Seu Ritmo',
                description:
                  'Acesse quando e onde quiser. Pause, retome e aprenda no tempo que funciona para você.',
                icon: (
                  <svg
                    className="h-6 w-6 text-purple-600"
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
                ),
              },
              {
                name: 'Certificados Reconhecidos',
                description:
                  'Receba certificados válidos ao concluir os cursos e compartilhe no seu LinkedIn.',
                icon: (
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                ),
              },
              {
                name: 'Acesso Imediato',
                description:
                  'Comece a aprender assim que se cadastrar. Sem espera, sem complicação.',
                icon: (
                  <svg
                    className="h-6 w-6 text-purple-600"
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
                ),
              },
              {
                name: 'Comunidade Ativa',
                description:
                  'Conecte-se com outros alunos e professores. Tire dúvidas e compartilhe conhecimento.',
                icon: (
                  <svg
                    className="h-6 w-6 text-purple-600"
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
                ),
              },
            ].map((feature, index) => (
              <div
                key={feature.name}
                className="flex flex-col rounded-2xl bg-white dark:bg-white p-8 shadow-lg transition-all hover:shadow-xl animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-100">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <FeaturedProductsSection
        fileProducts={featuredFileProducts}
        products={featuredProducts}
        isAuthenticated={isAuthenticated}
      />

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Junte-se a milhares de alunos
            </h2>
            <p className="mt-2 text-lg text-white/90">
              Veja os números que comprovam nossa qualidade
            </p>
          </div>
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-3 lg:mx-0 lg:max-w-none">
            {[
              { name: 'Alunos Ativos', value: '10.000+' },
              { name: 'Cursos Disponíveis', value: '500+' },
              { name: 'Horas de Conteúdo', value: '5.000+' },
            ].map((stat) => (
              <div
                key={stat.name}
                className="flex flex-col rounded-2xl bg-white/10 backdrop-blur-sm p-8 text-center"
              >
                <dt className="text-sm font-semibold text-white/80">{stat.name}</dt>
                <dd className="mt-2 text-4xl font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900 sm:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-600">
              Crie sua conta gratuita e comece a aprender hoje mesmo
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link
                  href="/courses"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
                >
                  Explorar Cursos
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
                >
                  Criar conta gratuita
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-3">
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
              <span className="text-lg font-bold text-gray-900 dark:text-gray-900">EduPlanner</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-600">
              © 2024 EduPlanner. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
