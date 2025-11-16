'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogoutButton } from './logout-button'
import { TierSelector } from './tier-selector'
import type { Tier } from '@/lib/queries/subscriptions'

interface NavbarProps {
  readonly userName: string | null
  readonly currentPath?: string
  readonly isAdmin?: boolean
  readonly currentTierId?: number
  readonly tiers?: Tier[]
}

const isPlans = (currentPath?: string) => currentPath === '/plans'

interface DropdownProps {
  readonly label: string
  readonly icon: React.ReactNode
  readonly isOpen: boolean
  readonly onToggle: () => void
  readonly isActive: boolean
  readonly children: React.ReactNode
  readonly dropdownRef: React.RefObject<HTMLDivElement | null>
}

function Dropdown({ label, icon, isOpen, onToggle, isActive, children, dropdownRef }: DropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-purple-100 text-purple-700 border border-purple-200'
            : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50 border border-transparent'
        }`}
      >
        {icon}
        <span>{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {children}
        </div>
      )}
    </div>
  )
}

export function Navbar({ userName, currentPath, isAdmin = false, currentTierId, tiers = [] }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  const navDropdownRef = useRef<HTMLDivElement>(null)
  const shopDropdownRef = useRef<HTMLDivElement>(null)
  const supportDropdownRef = useRef<HTMLDivElement>(null)
  
  const isDashboard = currentPath === '/dashboard'
  const isCourses = currentPath === '/courses' || (currentPath?.startsWith('/courses/') ?? false)
  const isFiles = currentPath === '/files'
  const isPlansPage = isPlans(currentPath)
  const isLoja = currentPath === '/loja' || (currentPath?.startsWith('/loja/') ?? false)
  const isHelp = currentPath === '/ajuda'
  const isSupport = currentPath === '/suporte' || (currentPath?.startsWith('/suporte/') ?? false)

  // Seção 1: Navegação
  const navigationLinks = [
    { href: '/dashboard', label: 'Dashboard', isActive: isDashboard },
    { href: '/courses', label: 'Cursos', isActive: isCourses },
    { href: '/files', label: 'Biblioteca', isActive: isFiles },
  ]

  // Seção 2: Loja/Compras
  const shopLinks = [
    { href: '/loja', label: 'Loja', isActive: isLoja },
    { href: '/plans', label: 'Planos', isActive: isPlansPage },
  ]

  // Seção 3: Suporte
  const supportLinks = [
    { href: '/ajuda', label: 'Ajuda', isActive: isHelp },
    { href: '/suporte', label: 'Suporte', isActive: isSupport },
  ]

  const isNavActive = navigationLinks.some(link => link.isActive)
  const isShopActive = shopLinks.some(link => link.isActive)
  const isSupportActive = supportLinks.some(link => link.isActive)

  // Verificar se o usuário tem tier Pro ou Premium
  const currentTier = tiers.find(t => t.id === currentTierId)
  const isProOrPremium = currentTier && (currentTier.name === 'Professor Pro' || currentTier.name === 'Premium')
  const isManagePlan = currentPath === '/profile'

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const refs = [navDropdownRef, shopDropdownRef, supportDropdownRef]
      const clickedOutside = refs.every(ref => 
        ref.current && !ref.current.contains(event.target as Node)
      )
      if (clickedOutside) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const linkClassName = (isActive: boolean) =>
    `block px-3 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-purple-50 text-purple-700 font-medium'
        : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
    }`

  const mobileLinkClassName = (isActive: boolean) =>
    `block px-4 py-3 rounded-lg text-base font-medium transition-all ${
      isActive
        ? 'bg-purple-100 text-purple-700 border border-purple-200'
        : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
    }`

  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown)
  }

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

          {/* Desktop Navigation - Três Dropdowns */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Dropdown 1: Navegação */}
            <Dropdown
              label="Navegação"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              isOpen={openDropdown === 'nav'}
              onToggle={() => handleDropdownToggle('nav')}
              isActive={isNavActive}
              dropdownRef={navDropdownRef}
            >
              <div className="px-3 py-2">
                <div className="space-y-0.5">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpenDropdown(null)}
                      className={linkClassName(link.isActive)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </Dropdown>

            {/* Dropdown 2: Loja/Compras */}
            <Dropdown
              label="Loja"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              isOpen={openDropdown === 'shop'}
              onToggle={() => handleDropdownToggle('shop')}
              isActive={isShopActive}
              dropdownRef={shopDropdownRef}
            >
              <div className="px-3 py-2">
                <div className="space-y-0.5">
                  {shopLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpenDropdown(null)}
                      className={linkClassName(link.isActive)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </Dropdown>

            {/* Dropdown 3: Suporte */}
            <Dropdown
              label="Suporte"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              isOpen={openDropdown === 'support'}
              onToggle={() => handleDropdownToggle('support')}
              isActive={isSupportActive}
              dropdownRef={supportDropdownRef}
            >
              <div className="px-3 py-2">
                <div className="space-y-0.5">
                  {supportLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpenDropdown(null)}
                      className={linkClassName(link.isActive)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {isProOrPremium && (
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <Link
                      href="/profile"
                      onClick={() => setOpenDropdown(null)}
                      className={linkClassName(isManagePlan)}
                    >
                      Gerenciar Plano
                    </Link>
                  </div>
                )}
                {isAdmin && (
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-3">
                      Administração
                    </p>
                    <Link
                      href="/admin/loja"
                      onClick={() => setOpenDropdown(null)}
                      className={linkClassName(currentPath?.startsWith('/admin/loja') ?? false)}
                    >
                      Admin Loja
                    </Link>
                  </div>
                )}
              </div>
            </Dropdown>

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
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsMobileMenuOpen(false)
              }
            }}
            aria-label="Fechar menu"
          />
          <div className="absolute left-0 right-0 top-16 bg-white border-b border-gray-200 shadow-lg z-50 lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Navegação */}
              <div>
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

              {/* Loja */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Loja
                </p>
                <div className="space-y-1">
                  {shopLinks.map((link) => (
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

              {/* Suporte */}
              <div>
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
                {isProOrPremium && (
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileLinkClassName(isManagePlan)}
                  >
                    Gerenciar Plano
                  </Link>
                )}
                {isAdmin && (
                  <div className="border-t border-gray-200 mt-2 pt-2">
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
              </div>

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
