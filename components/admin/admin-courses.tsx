'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteCourse } from '@/app/actions/courses'
import type { CourseWithTier } from '@/lib/queries/admin'

export function AdminCourses({ courses }: { courses: CourseWithTier[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Gerenciamento de Cursos</h3>
          <Link
            href="/admin/courses/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Criar Novo Curso
          </Link>
        </div>
        <p className="text-gray-600">Nenhum curso encontrado. Clique em "Criar Novo Curso" para começar.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o curso "${courseTitle}"?\n\nEsta ação não pode ser desfeita e excluirá:\n- Todos os módulos\n- Todas as aulas\n- Todos os vídeos\n- Todos os anexos\n- A thumbnail do curso`)) {
      return
    }

    setDeletingCourseId(courseId)
    setError(null)

    startTransition(async () => {
      try {
        const result = await deleteCourse(courseId)
        if (result.success) {
          router.refresh()
        } else {
          setError(result.error || 'Erro ao excluir curso')
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      } finally {
        setDeletingCourseId(null)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Gerenciamento de Cursos</h3>
        <Link
          href="/admin/courses/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
        >
          Criar Novo Curso
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Fechar erro"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tier Mínimo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de Criação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {course.thumbnail_url ? (
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-purple-400"
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
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      {course.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {course.tier.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(course.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="text-purple-600 hover:text-purple-900 transition-colors"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      disabled={isPending || deletingCourseId === course.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label={`Excluir curso ${course.title}`}
                    >
                      {deletingCourseId === course.id ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Excluindo...
                        </span>
                      ) : (
                        'Excluir'
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Total: {courses.length} curso{courses.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

