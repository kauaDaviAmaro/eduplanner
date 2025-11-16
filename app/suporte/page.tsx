import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { getUserTickets } from '@/lib/queries/support'
import { getPublicCourses, getAllTiers as getAllTiersFromCourses } from '@/lib/queries/courses'
import { getPublicAttachments } from '@/lib/queries/attachments'
import { getFileProductsWithPurchaseStatus } from '@/lib/queries/file-products'
import { getProductsWithPurchaseStatus } from '@/lib/queries/products'
import { Navbar } from '@/components/layout/navbar'
import { ContactForm } from '@/components/support/contact-form'
import { TicketsList } from '@/components/support/tickets-list'
import { FeaturedCoursesSection } from '@/components/courses/featured-courses-section'
import { FeaturedProductsSection } from '@/components/shop/featured-products-section'
import { FeaturedFilesSection } from '@/components/files/featured-files-section'
import Link from 'next/link'

interface SupportPageProps {
  searchParams: Promise<{ success?: string; ticketId?: string }>
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams
  const success = params.success === 'true'
  const ticketId = params.ticketId

  let session = null
  let profile = null
  let isAdmin = false
  let allTiers: any[] = []
  let userTickets: any[] = []

  try {
    session = await auth()
    if (session?.user) {
      profile = await getCurrentUserProfile()
      isAdmin = session.user.isAdmin || false
      allTiers = await getAllTiers()
      // Get user tickets if authenticated
      try {
        userTickets = await getUserTickets(session.user.id)
      } catch (error) {
        console.error('Error loading user tickets:', error)
        userTickets = []
      }
    }
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error:', error)
    }
  }

  // Get featured content for landing page
  let featuredFileProducts: Awaited<ReturnType<typeof getFileProductsWithPurchaseStatus>> = []
  let featuredProducts: Awaited<ReturnType<typeof getProductsWithPurchaseStatus>> = []
  let featuredCourses: Awaited<ReturnType<typeof getPublicCourses>> = []
  let featuredFiles: Awaited<ReturnType<typeof getPublicAttachments>> = []
  let tiers: Awaited<ReturnType<typeof getAllTiersFromCourses>> = []
  
  try {
    const [allFileProducts, allProducts, publicCourses, publicFiles, allTiersFromCourses] = await Promise.all([
      getFileProductsWithPurchaseStatus(),
      getProductsWithPurchaseStatus(),
      getPublicCourses(10),
      getPublicAttachments(10),
      getAllTiersFromCourses(),
    ])

    // Get first 4 active products of each type
    featuredFileProducts = allFileProducts.filter(p => p.is_active).slice(0, 4)
    featuredProducts = allProducts.filter(p => p.is_active).slice(0, 4)
    featuredCourses = publicCourses
    featuredFiles = publicFiles
    tiers = allTiersFromCourses
  } catch (error) {
    // If database is not available during build, just show empty content
    console.warn('Could not load content for support page:', error)
  }
  
  const isAuthenticated = !!session?.user

  return (
    <div className="min-h-screen bg-gray-50">
      {session?.user && profile ? (
        <Navbar
          userName={profile.name || null}
          currentPath="/suporte"
          isAdmin={isAdmin}
          currentTierId={profile.tier_id}
          tiers={allTiers}
        />
      ) : (
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
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
                <span className="text-xl font-bold text-gray-900">EduPlanner</span>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/courses"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Cursos
                  </Link>
                  <Link
                    href="/loja"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Loja
                  </Link>
                  <Link
                    href="/files"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Biblioteca
                  </Link>
                  <Link
                    href="/plans"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Planos
                  </Link>
                  <Link
                    href="/ajuda"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Ajuda
                  </Link>
                </div>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700"
                >
                  Começar grátis
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 sm:text-5xl">Suporte</h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Entre em contato conosco. Nossa equipe está pronta para ajudar!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        {success && (
          <div className="mb-8 rounded-xl bg-green-50 border-2 border-green-200 p-6 animate-fade-in">
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5"
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
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">Ticket criado com sucesso!</h3>
                <p className="text-green-800">
                  Seu ticket foi criado e nossa equipe entrará em contato em breve.
                  {ticketId && (
                    <span className="block mt-1 text-sm">
                      ID do ticket: <span className="font-mono font-semibold">{ticketId}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Ticket</h2>
              <ContactForm
                userEmail={profile?.email || null}
                isAuthenticated={!!session?.user}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Help Links */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Precisa de ajuda rápida?</h3>
              <div className="space-y-3">
                <Link
                  href="/ajuda"
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <svg
                    className="h-5 w-5 text-purple-600 group-hover:text-purple-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                    Central de Ajuda
                  </span>
                </Link>
                <a
                  href="mailto:suporte@eduplanner.com"
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <svg
                    className="h-5 w-5 text-purple-600 group-hover:text-purple-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                    Enviar Email
                  </span>
                </a>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tempo de Resposta</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nossa equipe geralmente responde em até 24 horas úteis.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Segunda a Sexta: 9h - 18h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Finais de semana: Respostas limitadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Tickets (if authenticated) */}
        {session?.user && userTickets.length > 0 && (
          <div className="mt-12">
            <TicketsList tickets={userTickets} />
          </div>
        )}
      </main>

      {/* Courses Section */}
      <FeaturedCoursesSection
        courses={featuredCourses}
        tiers={tiers}
        isAuthenticated={isAuthenticated}
      />

      {/* Shop Section */}
      <FeaturedProductsSection
        fileProducts={featuredFileProducts}
        products={featuredProducts}
        isAuthenticated={isAuthenticated}
      />

      {/* Files Section */}
      <FeaturedFilesSection
        files={featuredFiles}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}

