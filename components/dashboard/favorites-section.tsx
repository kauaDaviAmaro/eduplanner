import Link from 'next/link'
import type { Course } from '@/lib/queries/dashboard'

export function FavoritesSection({ courses }: Readonly<{ courses: Course[] }>) {
  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Favoritos</h3>
        <p className="text-gray-600">Você ainda não favoritou nenhum curso.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Favoritos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            {course.thumbnail_url && (
              <div className="w-full h-24 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <h4 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  )
}

