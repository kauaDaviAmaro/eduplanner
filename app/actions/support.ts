'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { createSupportTicket } from '@/lib/queries/support'

type CreateTicketState = {
  success: boolean
  error: string
  ticketId?: string
} | null

export async function createTicket(
  prevState: CreateTicketState,
  formData: FormData
): Promise<CreateTicketState> {
  try {
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const email = formData.get('email') as string | null
    const priority = (formData.get('priority') as 'low' | 'medium' | 'high') || 'medium'

    // Validation
    if (!subject || subject.trim().length === 0) {
      return {
        success: false,
        error: 'O assunto é obrigatório',
      }
    }

    if (!message || message.trim().length === 0) {
      return {
        success: false,
        error: 'A mensagem é obrigatória',
      }
    }

    // Get user ID if authenticated
    const userId = await getCurrentUserId()

    // If not authenticated, email is required
    if (!userId && (!email || email.trim().length === 0)) {
      return {
        success: false,
        error: 'Email é obrigatório para usuários não autenticados',
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        error: 'Email inválido',
      }
    }

    // Create ticket
    const ticket = await createSupportTicket({
      user_id: userId || null,
      email: email?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      priority,
    })

    // TODO: Send email notification to support team
    // This can be implemented later with nodemailer or similar service
    // For now, we just log it
    console.log('New support ticket created:', {
      ticketId: ticket.id,
      subject: ticket.subject,
      email: ticket.email || 'N/A (authenticated user)',
    })

    revalidatePath('/suporte')
    revalidatePath('/dashboard')

    return {
      success: true,
      error: '',
      ticketId: ticket.id,
    }
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return {
      success: false,
      error: 'Erro ao criar ticket. Por favor, tente novamente.',
    }
  }
}

