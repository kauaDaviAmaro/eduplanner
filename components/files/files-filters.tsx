'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import type { Database } from '@/types/database'
import type { Course } from '@/lib/queries/courses'

type Tier = Database['public']['Tables']['tiers']['Row']

interface FilesFiltersProps {
  tiers: Tier[]
  courses: Course[]
}

type FileTypeFilter = 'all' | 'PDF' | 'PPT' | 'DOC' | 'XLS' | 'other'
type SortOption = 'date' | 'name' | 'course'

export function FilesFilters({ tiers, courses }: FilesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [courseFilter, setCourseFilter] = useState(searchParams.get('course') || 'all')
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>(
    (searchParams.get('fileType') as FileTypeFilter) || 'all'
  )
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || 'all')
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'date'
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (courseFilter !== 'all') params.set('course', courseFilter)
    if (fileTypeFilter !== 'all') params.set('fileType', fileTypeFilter)
    if (tierFilter !== 'all') params.set('tier', tierFilter)
    if (sortBy !== 'date') params.set('sort', sortBy)

    startTransition(() => {
      const queryString = params.toString()
      router.push(`/files${queryString ? `?${queryString}` : ''}`, { scroll: false })
    })
  }, [search, courseFilter, fileTypeFilter, tierFilter, sortBy, router])

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Buscar arquivo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome de arquivo..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Course Filter */}
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
              Curso
            </label>
            <select
              id="course"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todos os cursos</option>
              <option value="no-course">Sem curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* File Type Filter */}
          <div>
            <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de arquivo
            </label>
            <select
              id="fileType"
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value as FileTypeFilter)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todos</option>
              <option value="PDF">PDF</option>
              <option value="PPT">PowerPoint</option>
              <option value="DOC">Word</option>
              <option value="XLS">Excel</option>
              <option value="other">Outros</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-2">
              Tier
            </label>
            <select
              id="tier"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todos</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id.toString()}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="date">Data (mais recente)</option>
              <option value="name">Nome (A-Z)</option>
              <option value="course">Curso</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(search || courseFilter !== 'all' || fileTypeFilter !== 'all' || tierFilter !== 'all' || sortBy !== 'date') && (
          <div>
            <button
              onClick={() => {
                setSearch('')
                setCourseFilter('all')
                setFileTypeFilter('all')
                setTierFilter('all')
                setSortBy('date')
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

