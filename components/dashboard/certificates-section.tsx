import type { Certificate } from '@/lib/queries/dashboard'
import type { Database } from '@/types/database'

type Course = Database['public']['Tables']['courses']['Row']

export async function CertificatesSection({
  certificates,
}: Readonly<{
  certificates: Array<Certificate & { course: Course | null }>
}>) {
  if (certificates.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Certificados Disponíveis</h3>
      </div>

      <div className="space-y-3">
        {certificates.map((cert) => {
          if (!cert.course) return null

          const issuedDate = new Date(cert.issued_at).toLocaleDateString('pt-BR')

          return (
            <div
              key={cert.id}
              className="bg-white rounded-lg p-4 border border-yellow-300 flex items-center justify-between"
            >
              <div>
                <h4 className="font-semibold text-gray-900">{cert.course.title}</h4>
                <p className="text-sm text-gray-600">Emitido em {issuedDate}</p>
              </div>
              {cert.certificate_url ? (
                <a
                  href={cert.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  Baixar
                </a>
              ) : (
                <span className="text-sm text-gray-500">Em breve</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

