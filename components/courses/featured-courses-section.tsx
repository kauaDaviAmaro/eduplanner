'use client'

import Link from 'next/link'
import type { Course } from '@/lib/queries/courses'
import type { Database } from '@/types/database'
import { CourseCard } from './course-card'

type Tier = Database['public']['Tables']['tiers']['Row']

interface FeaturedCoursesSectionProps {
  courses: Course[]
  tiers: Tier[]
  isAuthenticated: boolean
}

export function FeaturedCoursesSection({
  courses,
  tiers,
  isAuthenticated,
}: FeaturedCoursesSectionProps) {
  if (courses.length === 0) {
    return null
  }

  // Create tier map for quick lookup
  const tierMap = new Map(tiers.map((tier) => [tier.id, tier]))

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Nossos Cursos
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Explore nossa biblioteca completa de cursos e aprenda no seu ritmo
          </p>
        </div>

        {/* Courses Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const tier = tierMap.get(course.minimum_tier_id) || null
            return (
              <CourseCard
                key={course.id}
                course={course}
                tier={tier}
                isPublic={!isAuthenticated}
              />
            )
          })}
        </div>

        {/* View All Link */}
        <div className="mt-12 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
          >
            Ver todos os cursos
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Login CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 rounded-xl bg-blue-50 border-2 border-blue-200 p-6 text-center max-w-2xl mx-auto">
            <p className="text-base text-blue-900 mb-4 font-medium">
              Faça login para acessar os cursos e começar a aprender!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login?redirect=/courses"
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Fazer Login
              </Link>
              <Link
                href="/signup?redirect=/courses"
                className="rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

