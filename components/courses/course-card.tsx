'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CourseWithProgress } from '@/lib/queries/dashboard'
import { toggleCourseFavorite } from '@/app/actions/courses'
import type { Database } from '@/types/database'

type Tier = Database['public']['Tables']['tiers']['Row']

interface CourseCardProps {
  course: CourseWithProgress
  isFavorite: boolean
  tier?: Tier | null
}

export function CourseCard({ course, isFavorite: initialIsFavorite, tier }: CourseCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPending, startTransition] = useTransition()

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      const result = await toggleCourseFavorite(course.id)
      if (result.success) {
        setIsFavorite(result.isFavorite)
      }
    })
  }

  const hasProgress = course.progress.total > 0

  return (
    <div className="group bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all overflow-hidden relative">
      <Link href={`/courses/${course.id}`} className="block">
        {/* Thumbnail */}
        {course.thumbnail_url ? (
          <div className="w-full h-40 bg-gray-200 overflow-hidden relative">
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Favorite Button - Overlay on Thumbnail */}
            <button
              onClick={handleToggleFavorite}
              disabled={isPending}
              className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all transform hover:scale-110 z-10 ${
                isFavorite
                  ? 'bg-yellow-400/90 hover:bg-yellow-400'
                  : 'bg-white/80 hover:bg-white'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              {isFavorite ? (
                <svg
                  className="h-6 w-6 text-yellow-600 fill-current"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center relative">
            <svg
              className="h-12 w-12 text-purple-400"
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
            {/* Favorite Button - Overlay on Placeholder */}
            <button
              onClick={handleToggleFavorite}
              disabled={isPending}
              className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all transform hover:scale-110 z-10 ${
                isFavorite
                  ? 'bg-yellow-400/90 hover:bg-yellow-400'
                  : 'bg-white/80 hover:bg-white'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              {isFavorite ? (
                <svg
                  className="h-6 w-6 text-yellow-600 fill-current"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
            {course.title}
          </h3>

          {/* Description */}
          {course.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
          )}

          {/* Progress Bar */}
          {hasProgress && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">
                  {course.progress.completed}/{course.progress.total} aulas
                </span>
                <span className="font-semibold text-purple-600">{course.progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${course.progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Tier Badge */}
          {tier && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {tier.name}
              </span>
            </div>
          )}

          {/* No Progress Indicator */}
          {!hasProgress && (
            <div className="mt-2 text-xs text-gray-500">Curso disponível</div>
          )}
        </div>
      </Link>
    </div>
  )
}

