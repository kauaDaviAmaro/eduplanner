'use client'

import type { ProductType } from './filters-panel'

interface CategoryTabsProps {
  activeTab: ProductType
  onTabChange: (tab: ProductType) => void
  counts: {
    all: number
    files: number
    bundles: number
  }
}

export function CategoryTabs({ activeTab, onTabChange, counts }: CategoryTabsProps) {
  const tabs: Array<{ id: ProductType; label: string; count: number }> = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'files', label: 'Arquivos', count: counts.files },
    { id: 'bundles', label: 'Bundles', count: counts.bundles },
  ]

  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <nav className="flex space-x-4 md:space-x-8 min-w-max md:min-w-0" aria-label="Categorias">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-t ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
              {tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

