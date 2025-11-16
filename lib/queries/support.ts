import { query, queryOne, queryMany } from '@/lib/db/client'
import { Database } from '@/types/database'

type SupportTicket = Database['public']['Tables']['support_tickets']['Row']
type SupportMessage = Database['public']['Tables']['support_messages']['Row']

export type SupportTicketWithMessages = SupportTicket & {
  messages: SupportMessage[]
  user_name?: string | null
  user_email?: string | null
}

export type SupportTicketWithMessageCount = SupportTicket & {
  message_count: number
}

/**
 * Create a new support ticket with initial message
 */
export async function createSupportTicket(
  data: {
    user_id?: string | null
    email?: string | null
    subject: string
    message: string
    priority?: 'low' | 'medium' | 'high'
  }
): Promise<SupportTicketWithMessages> {
  const ticket = await queryOne<SupportTicket>(
    `INSERT INTO support_tickets (user_id, email, subject, priority, status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING *`,
    [data.user_id || null, data.email || null, data.subject, data.priority || 'medium']
  )

  if (!ticket) {
    throw new Error('Failed to create support ticket')
  }

  // Add initial message
  const initialMessage = await queryOne<SupportMessage>(
    `INSERT INTO support_messages (ticket_id, user_id, message, is_from_support)
     VALUES ($1, $2, $3, false)
     RETURNING *`,
    [ticket.id, data.user_id || null, data.message]
  )

  return {
    ...ticket,
    messages: initialMessage ? [initialMessage] : [],
  }
}

/**
 * Get all tickets for a specific user
 */
export async function getUserTickets(userId: string): Promise<SupportTicketWithMessageCount[]> {
  const tickets = await queryMany<SupportTicketWithMessageCount>(
    `SELECT st.*, 
            COUNT(sm.id)::int as message_count
     FROM support_tickets st
     LEFT JOIN support_messages sm ON st.id = sm.ticket_id
     WHERE st.user_id = $1
     GROUP BY st.id
     ORDER BY st.created_at DESC`,
    [userId]
  )

  return tickets
}

/**
 * Get a ticket by ID with all messages
 */
export async function getTicketById(
  ticketId: string,
  userId?: string
): Promise<SupportTicketWithMessages | null> {
  // Build query with optional user check
  let sql = `
    SELECT st.*,
           u.name as user_name,
           u.email as user_email
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    WHERE st.id = $1
  `
  const params: (string | undefined)[] = [ticketId]

  // If userId provided, ensure user owns the ticket
  if (userId) {
    sql += ' AND st.user_id = $2'
    params.push(userId)
  }

  const ticket = await queryOne<SupportTicket & { user_name?: string | null; user_email?: string | null }>(sql, params)

  if (!ticket) {
    return null
  }

  // Get all messages for this ticket
  const messages = await queryMany<SupportMessage>(
    `SELECT sm.*
     FROM support_messages sm
     WHERE sm.ticket_id = $1
     ORDER BY sm.created_at ASC`,
    [ticketId]
  )

  return {
    ...ticket,
    messages,
  }
}

/**
 * Add a message to an existing ticket
 */
export async function addMessageToTicket(
  ticketId: string,
  data: {
    user_id?: string | null
    message: string
    is_from_support?: boolean
  }
): Promise<SupportMessage> {
  const message = await queryOne<SupportMessage>(
    `INSERT INTO support_messages (ticket_id, user_id, message, is_from_support)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, data.user_id || null, data.message, data.is_from_support || false]
  )

  if (!message) {
    throw new Error('Failed to add message to ticket')
  }

  // Update ticket's updated_at timestamp
  await query(
    `UPDATE support_tickets 
     SET updated_at = NOW()
     WHERE id = $1`,
    [ticketId]
  )

  return message
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
): Promise<SupportTicket> {
  const ticket = await queryOne<SupportTicket>(
    `UPDATE support_tickets
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, ticketId]
  )

  if (!ticket) {
    throw new Error('Failed to update ticket status')
  }

  return ticket
}

/**
 * Get tickets by email (for non-authenticated users)
 */
export async function getTicketsByEmail(email: string): Promise<SupportTicketWithMessageCount[]> {
  const tickets = await queryMany<SupportTicketWithMessageCount>(
    `SELECT st.*,
            COUNT(sm.id)::int as message_count
     FROM support_tickets st
     LEFT JOIN support_messages sm ON st.id = sm.ticket_id
     WHERE st.email = $1 AND st.user_id IS NULL
     GROUP BY st.id
     ORDER BY st.created_at DESC`,
    [email]
  )

  return tickets
}

