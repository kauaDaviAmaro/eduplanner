import Link from 'next/link'
import { LogoutButton } from './logout-button'
import { TierSelector } from './tier-selector'
import type { Tier } from '@/lib/queries/subscriptions'

interface NavbarProps {
  userName: string | null
  currentPath?: string
  isAdmin?: boolean
  currentTierId?: number
  tiers?: Tier[]
}

const isPlans = (currentPath?: string) => currentPath === '/plans'

export function Navbar({ userName, currentPath, isAdmin = false, currentTierId, tiers = [] }: NavbarProps) {
  const isDashboard = currentPath === '/dashboard'
  const isCourses = currentPath === '/courses' || (currentPath?.startsWith('/courses/') ?? false)
  const isFiles = currentPath === '/files'
  const isProfile = currentPath === '/profile'
  const isPlansPage = isPlans(currentPath)
  const isHelp = currentPath === '/ajuda'

  return (
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
          <div className="flex items-center space-x-1">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isDashboard
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/courses"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isCourses
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              Cursos
            </Link>
            <Link
              href="/files"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isFiles
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              Biblioteca
            </Link>
            <Link
              href="/plans"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isPlansPage
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              Planos
            </Link>
            <Link
              href="/ajuda"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isHelp
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              Ajuda
            </Link>
            {isAdmin && currentTierId && tiers.length > 0 && (
              <TierSelector tiers={tiers} currentTierId={currentTierId} />
            )}
            <Link
              href="/profile"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <svg
                className="h-5 w-5 text-purple-500 group-hover:text-purple-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{userName || 'Usuário'}</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}

