'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar produtos...' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, onChange])

  // Sync with external value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
          aria-label="Buscar produtos"
        />

        {/* Clear button */}
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Limpar busca"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

