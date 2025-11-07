'use client'

import { signOut } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-700 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all group"
        title="Sair"
      >
        <svg
          className="h-5 w-5 text-red-500 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span className="hidden sm:inline">Sair</span>
      </button>
    </form>
  )
}

