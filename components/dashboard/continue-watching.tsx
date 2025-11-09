import Link from 'next/link'
import type { LastWatchedLesson } from '@/lib/queries/dashboard'

export function ContinueWatching({ lastWatched }: { lastWatched: LastWatchedLesson | null }) {
  if (!lastWatched) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Continuar Assistindo</h3>
        <p className="text-gray-600 mb-4">Você ainda não começou nenhum curso.</p>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          Explorar Cursos
        </Link>
      </div>
    )
  }

  const { course, module, lesson, progress } = lastWatched
  const progressPercentage = progress.time_watched > 0 ? Math.min(100, (progress.time_watched / 60) * 10) : 0

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Continuar Assistindo</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">{course.title}</p>
        <p className="text-sm text-gray-500 mb-2">{module.title}</p>
        <h4 className="text-lg font-semibold text-gray-900">{lesson.title}</h4>
      </div>

      {progress.time_watched > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {progress.is_completed ? 'Concluída' : 'Em andamento'}
          </p>
        </div>
      )}

      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-white font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
        Continuar Assistindo
      </Link>
    </div>
  )
}





