'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const isDashboard = currentPath === '/dashboard'
  const isCourses = currentPath === '/courses' || (currentPath?.startsWith('/courses/') ?? false)
  const isFiles = currentPath === '/files'
  const isProfile = currentPath === '/profile'
  const isPlansPage = isPlans(currentPath)
  const isLoja = currentPath === '/loja' || (currentPath?.startsWith('/loja/') ?? false)
  const isHelp = currentPath === '/ajuda'
  const isSupport = currentPath === '/suporte' || (currentPath?.startsWith('/suporte/') ?? false)

  // Links agrupados por categoria para o dropdown
  const navigationLinks = [
    { href: '/dashboard', label: 'Dashboard', isActive: isDashboard },
    { href: '/courses', label: 'Cursos', isActive: isCourses },
    { href: '/files', label: 'Biblioteca', isActive: isFiles },
  ]

  const supportLinks = [
    { href: '/ajuda', label: 'Ajuda', isActive: isHelp },
    { href: '/suporte', label: 'Suporte', isActive: isSupport },
  ]

  // Verificar se algum link do dropdown está ativo
  const hasActiveLink = navigationLinks.some(link => link.isActive) || 
                        supportLinks.some(link => link.isActive) || 
                        (isAdmin && currentPath?.startsWith('/admin/loja'))

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const linkClassName = (isActive: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-purple-100 text-purple-700 border border-purple-200'
        : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
    }`

  const mobileLinkClassName = (isActive: boolean) =>
    `block px-4 py-3 rounded-lg text-base font-medium transition-all ${
      isActive
        ? 'bg-purple-100 text-purple-700 border border-purple-200'
        : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
    }`

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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  hasActiveLink
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span>Menu</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {/* Navegação */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Navegação
                    </p>
                    <div className="space-y-0.5">
                      {navigationLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            link.isActive
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Suporte */}
                  <div className="px-3 py-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Suporte
                    </p>
                    <div className="space-y-0.5">
                      {supportLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            link.isActive
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Admin */}
                  {isAdmin && (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Administração
                      </p>
                      <Link
                        href="/admin/loja"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                          currentPath?.startsWith('/admin/loja')
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                        }`}
                      >
                        Admin Loja
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loja - Botão destacado */}
            <Link
              href="/loja"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isLoja
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-sm hover:shadow-md'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>Loja</span>
              </span>
            </Link>

            {/* Planos - Botão destacado */}
            <Link
              href="/plans"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPlansPage
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow-md'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <span>Planos</span>
              </span>
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

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <Link
              href="/profile"
              className="flex items-center space-x-1 px-2 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all"
            >
              <svg
                className="h-5 w-5 text-purple-500"
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
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-purple-600 transition-all"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 right-0 top-16 bg-white border-b border-gray-200 shadow-lg z-50 lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              {/* Navegação */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Navegação
                </p>
                <div className="space-y-1">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileLinkClassName(link.isActive)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Loja e Planos destacados */}
              <div className="mb-3 space-y-2">
                <Link
                  href="/loja"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium text-white transition-all ${
                    isLoja
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-md'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-sm'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <span>Loja</span>
                  </span>
                </Link>
                <Link
                  href="/plans"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium text-white transition-all ${
                    isPlansPage
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    <span>Planos</span>
                  </span>
                </Link>
              </div>

              {/* Suporte */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Suporte
                </p>
                <div className="space-y-1">
                  {supportLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileLinkClassName(link.isActive)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin */}
              {isAdmin && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    Administração
                  </p>
                  <Link
                    href="/admin/loja"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileLinkClassName(currentPath?.startsWith('/admin/loja') ?? false)}
                  >
                    Admin Loja
                  </Link>
                </div>
              )}

              {isAdmin && currentTierId && tiers.length > 0 && (
                <div className="px-4 py-2">
                  <TierSelector tiers={tiers} currentTierId={currentTierId} />
                </div>
              )}
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-4 py-3 rounded-lg border border-gray-300 text-base font-medium text-gray-700 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <svg
                  className="h-5 w-5 text-purple-500"
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
              <div className="px-4 py-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
