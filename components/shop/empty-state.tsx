interface EmptyStateProps {
  hasFilters?: boolean
  searchQuery?: string
  onClearFilters?: () => void
}

export function EmptyState({ hasFilters = false, searchQuery, onClearFilters }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        {/* Illustration */}
        <div className="mb-6 flex justify-center">
          <svg
            className="h-24 w-24 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {hasFilters || searchQuery
            ? 'Nenhum produto encontrado'
            : 'Nenhum produto disponível'}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {hasFilters || searchQuery ? (
            <>
              {searchQuery ? (
                <>Não encontramos produtos para &quot;<span className="font-medium">{searchQuery}</span>&quot;.</>
              ) : (
                'Tente ajustar os filtros para encontrar o que procura.'
              )}
            </>
          ) : (
            'Não há produtos disponíveis no momento. Volte em breve!'
          )}
        </p>

      {/* Action button */}
      {hasFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="Limpar todos os filtros"
        >
          <svg
            className="h-4 w-4 mr-2"
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
          Limpar filtros
        </button>
      )}
      </div>
    </div>
  )
}

