import Link from 'next/link'
import type { CourseWithProgress } from '@/lib/queries/dashboard'

export function InProgressCourses({ courses }: { courses: CourseWithProgress[] }) {
  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Cursos em Andamento</h3>
        <p className="text-gray-600">Você ainda não começou nenhum curso.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Cursos em Andamento</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            {course.thumbnail_url && (
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h4>
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
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
          </Link>
        ))}
      </div>
    </div>
  )
}





