'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface DashboardTabsProps {
  isAdmin: boolean
}

function DashboardTabsContent({ isAdmin }: DashboardTabsProps) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
    },
    ...(isAdmin
      ? [
          {
            id: 'stats',
            label: 'Estatísticas',
            href: '/dashboard?tab=stats',
          },
          {
            id: 'users',
            label: 'Usuários',
            href: '/dashboard?tab=users',
          },
          {
            id: 'courses',
            label: 'Cursos',
            href: '/dashboard?tab=courses',
          },
          {
            id: 'files',
            label: 'Arquivos',
            href: '/dashboard?tab=files',
          },
        ]
      : []),
  ]

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function DashboardTabs({ isAdmin }: DashboardTabsProps) {
  return (
    <Suspense fallback={
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <div className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500">
            Dashboard
          </div>
          {isAdmin && (
            <>
              <div className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500">
                Estatísticas
              </div>
              <div className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500">
                Usuários
              </div>
              <div className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500">
                Cursos
              </div>
              <div className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500">
                Arquivos
              </div>
            </>
          )}
        </nav>
      </div>
    }>
      <DashboardTabsContent isAdmin={isAdmin} />
    </Suspense>
  )
}

