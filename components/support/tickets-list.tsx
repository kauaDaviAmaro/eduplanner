import Link from 'next/link'
import type { SupportTicketWithMessageCount } from '@/lib/queries/support'

interface TicketsListProps {
  tickets: SupportTicketWithMessageCount[]
}

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
}

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const priorityColors: Record<string, string> = {
  low: 'text-gray-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
}

export function TicketsList({ tickets }: TicketsListProps) {
  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Meus Tickets</h3>
        <p className="text-gray-600">Você ainda não criou nenhum ticket de suporte.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Meus Tickets</h3>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/suporte/${ticket.id}`}
            className="block group bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors flex-1">
                {ticket.subject}
              </h4>
              <span
                className={`ml-3 px-2 py-1 text-xs font-semibold rounded border ${statusColors[ticket.status]}`}
              >
                {statusLabels[ticket.status] || ticket.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className={`font-medium ${priorityColors[ticket.priority]}`}>
                  Prioridade: {priorityLabels[ticket.priority] || ticket.priority}
                </span>
                <span>{ticket.message_count} mensagem{ticket.message_count !== 1 ? 's' : ''}</span>
              </div>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

