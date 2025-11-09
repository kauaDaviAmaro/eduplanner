import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getUserProgressStats } from '@/lib/queries/user-progress'
import { getDashboardData, getAvailableCertificates, getFavoriteCourses } from '@/lib/queries/dashboard'
import { getAllTiers, getActiveSubscription } from '@/lib/queries/subscriptions'
import { EditProfileForm } from '@/components/profile/edit-profile-form'
import { ProfileStats } from '@/components/profile/profile-stats'
import { ProfileCertificates } from '@/components/profile/profile-certificates'
import { CancelSubscriptionButton } from '@/components/profile/cancel-subscription-button'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

export default async function ProfilePage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    redirect('/login?error=' + encodeURIComponent('Sessão inválida. Por favor, faça login novamente.'))
  }

  if (!session?.user) {
    redirect('/login')
  }

  const profile = await getCurrentUserProfile()
  if (!profile) {
    redirect('/login?error=' + encodeURIComponent('Perfil não encontrado'))
  }

  const [progressStats, dashboardData, certificates, favoriteCourses, activeSubscription] = await Promise.all([
    getUserProgressStats(session.user.id),
    getDashboardData(session.user.id),
    getAvailableCertificates(session.user.id),
    getFavoriteCourses(session.user.id),
    getActiveSubscription(session.user.id),
  ])

  const accountCreatedDate = new Date(profile.created_at).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const allTiers = await getAllTiers()
  const isAdmin = session.user.isAdmin || false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile.name || null} 
        currentPath="/profile"
        isAdmin={isAdmin}
        currentTierId={profile.tier_id}
        tiers={allTiers}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações e visualize seu progresso</p>
        </div>

        {/* Profile Info Card */}
        <div className="mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name
                    ? profile.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U'}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {profile.name || 'Usuário'}
                </h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {profile.email || 'Não informado'}
                  </p>
                  <p>
                    <span className="font-medium">Tier:</span>{' '}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {profile.tier.name}
                    </span>
                    {profile.is_admin && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Admin
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Membro desde:</span> {accountCreatedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="mb-6">
          <EditProfileForm initialName={profile.name} />
        </div>

        {/* Cancel Subscription Button (if active subscription) */}
        {activeSubscription?.status === 'active' && (
          <div className="mb-6">
            <CancelSubscriptionButton
              subscriptionId={activeSubscription.id}
              tierName={profile.tier.name}
            />
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6">
          <ProfileStats
            overallProgress={dashboardData.overallProgress}
            progressStats={progressStats}
            certificatesCount={certificates.length}
            favoritesCount={favoriteCourses.length}
          />
        </div>

        {/* Certificates */}
        <div className="mb-6">
          <ProfileCertificates certificates={certificates} />
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-gray-200 transition-colors"
            >
              <div className="flex-shrink-0">
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Dashboard</p>
                <p className="text-sm text-gray-600">Ver seu progresso</p>
              </div>
            </Link>
            <Link
              href="/courses"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-gray-200 transition-colors"
            >
              <div className="flex-shrink-0">
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
              </div>
              <div>
                <p className="font-medium text-gray-900">Cursos</p>
                <p className="text-sm text-gray-600">Explorar cursos</p>
              </div>
            </Link>
            {profile.is_admin && (
              <Link
                href="/admin"
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-red-50 hover:border-red-200 border border-gray-200 transition-colors"
              >
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Admin</p>
                  <p className="text-sm text-gray-600">Painel administrativo</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

