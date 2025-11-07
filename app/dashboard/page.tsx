import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getDashboardData } from '@/lib/queries/dashboard'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getAdminStats, getAllUsers, getAllCoursesForAdmin } from '@/lib/queries/admin'
import { getAllTiers } from '@/lib/queries/courses'
import { ProgressBar } from '@/components/dashboard/progress-bar'
import { ContinueWatching } from '@/components/dashboard/continue-watching'
import { TierStatus } from '@/components/dashboard/tier-status'
import { InProgressCourses } from '@/components/dashboard/in-progress-courses'
import { FavoritesSection } from '@/components/dashboard/favorites-section'
import { CertificatesSection } from '@/components/dashboard/certificates-section'
import { FilesSection } from '@/components/dashboard/files-section'
import { PlannerWidget } from '@/components/dashboard/planner-widget'
import { NotificationsPanel } from '@/components/dashboard/notifications-panel'
import { QuickAccessMenu } from '@/components/dashboard/quick-access-menu'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import { AdminStats } from '@/components/admin/admin-stats'
import { AdminUsers } from '@/components/admin/admin-users'
import { AdminCourses } from '@/components/admin/admin-courses'
import { AdminFiles } from '@/components/admin/admin-files'
import { getAllAttachmentsForAdmin } from '@/lib/queries/admin'
import { Navbar } from '@/components/layout/navbar'

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const currentTab = params.tab || 'dashboard'
  // Handle potential JWT session errors gracefully
  let session = null
  try {
    session = await auth()
  } catch (error) {
    // If there's a JWT session error (corrupted cookie or secret mismatch),
    // redirect to login to clear the session
    console.warn('Session error (likely corrupted cookie):', error)
    redirect('/login?error=' + encodeURIComponent('Sessão inválida. Por favor, faça login novamente.'))
  }

  if (!session?.user) {
    redirect('/login')
  }

  // Get profile first (required)
  const profile = await getCurrentUserProfile()
  if (!profile) {
    // If profile doesn't exist, it might be a new user - give them a chance
    // The trigger should create it automatically, but there might be a delay
    console.warn('Profile not found for user:', session.user.id)
    redirect('/login?error=' + encodeURIComponent('Perfil não encontrado. Se você acabou de criar a conta, aguarde alguns segundos e tente novamente.'))
  }

  // Get dashboard data with error handling
  let dashboardData
  try {
    dashboardData = await getDashboardData(session.user.id)
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // Use default values for dashboard data if loading fails
    dashboardData = {
      overallProgress: { percentage: 0, completedCourses: 0, totalCourses: 0 },
      lastWatchedLesson: null,
      subscription: null,
      inProgressCourses: [],
      favoriteCourses: [],
      availableCertificates: [],
      notifications: [],
      unreadNotificationsCount: 0,
      downloads: [],
      recentFiles: [],
      lessonPlans: [],
    }
  }

  // Check if user is admin and get admin data
  const isAdmin = session.user.isAdmin || false
  
  // Redirect non-admins trying to access admin tabs
  if ((currentTab === 'stats' || currentTab === 'users' || currentTab === 'courses' || currentTab === 'files') && !isAdmin) {
    redirect('/dashboard')
  }
  
  let adminStats = null
  let adminUsers = null
  let adminCourses = null
  let adminFiles = null
  let tiers = null

  if (isAdmin) {
    try {
      ;[adminStats, adminUsers, adminCourses, adminFiles, tiers] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllCoursesForAdmin(),
        getAllAttachmentsForAdmin(),
        getAllTiers(),
      ])
    } catch (error) {
      console.error('Error loading admin data:', error)
      // Continue without admin data if there's an error
    }
  }

  // Get tiers for admin tier selector
  const allTiers = tiers || (isAdmin ? await getAllTiers() : [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null} 
        currentPath="/dashboard"
        isAdmin={isAdmin}
        currentTierId={profile?.tier_id}
        tiers={allTiers}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tabs */}
        <DashboardTabs isAdmin={isAdmin} />

        {/* Dashboard Tab Content */}
        {currentTab === 'dashboard' && (
          <>
            {/* Top Section - Priority */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

          {/* Progress Bar */}
          <div className="mb-6">
            <ProgressBar percentage={dashboardData.overallProgress.percentage} />
          </div>

          {/* Continue Watching and Tier Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <ContinueWatching lastWatched={dashboardData.lastWatchedLesson} />
            </div>
            <div>
              <TierStatus subscription={dashboardData.subscription} profile={profile} />
            </div>
          </div>
        </div>

        {/* Library Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Biblioteca Pessoal</h2>

          {/* In Progress Courses */}
          <div className="mb-6">
            <InProgressCourses courses={dashboardData.inProgressCourses} />
          </div>

          {/* Favorites */}
          <div className="mb-6">
            <FavoritesSection courses={dashboardData.favoriteCourses} />
          </div>

          {/* Certificates */}
          {dashboardData.availableCertificates.length > 0 && (
            <div className="mb-6">
              <CertificatesSection certificates={dashboardData.availableCertificates} />
            </div>
          )}

          {/* Recent Files */}
          <div className="mb-6">
            <FilesSection files={dashboardData.recentFiles} />
          </div>
        </div>

        {/* Action Tools Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ferramentas de Ação</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Planner Widget */}
            <PlannerWidget initialPlans={dashboardData.lessonPlans} />

            {/* Notifications Panel */}
            <NotificationsPanel
              notifications={dashboardData.notifications}
              unreadCount={dashboardData.unreadNotificationsCount}
            />
          </div>
        </div>

            {/* Quick Access */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Acessos Rápidos</h2>
              <QuickAccessMenu />
            </div>
          </>
        )}

        {/* Admin Statistics Tab */}
        {currentTab === 'stats' && isAdmin && adminStats && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Estatísticas</h1>
            <p className="text-gray-600 mb-6">Visualize estatísticas gerais do sistema</p>
            <AdminStats stats={adminStats} />
          </div>
        )}

        {/* Admin Users Tab */}
        {currentTab === 'users' && isAdmin && adminUsers && tiers && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Usuários</h1>
            <p className="text-gray-600 mb-6">Gerencie usuários do sistema</p>
            <AdminUsers users={adminUsers} tiers={tiers} />
          </div>
        )}

        {/* Admin Courses Tab */}
        {currentTab === 'courses' && isAdmin && adminCourses && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Cursos</h1>
            <p className="text-gray-600 mb-6">Gerencie cursos do sistema</p>
            <AdminCourses courses={adminCourses} />
          </div>
        )}

        {/* Admin Files Tab */}
        {currentTab === 'files' && isAdmin && adminFiles && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Arquivos</h1>
            <p className="text-gray-600 mb-6">Gerencie arquivos do sistema</p>
            <AdminFiles attachments={adminFiles} />
          </div>
        )}

      </main>
    </div>
  )
}

