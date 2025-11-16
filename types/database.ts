export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tiers: {
        Row: {
          id: number
          name: string
          price_monthly: number
          description: string | null
          download_limit: number | null
          permission_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          price_monthly: number
          description?: string | null
          download_limit?: number | null
          permission_level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          price_monthly?: number
          description?: string | null
          download_limit?: number | null
          permission_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          tier_id: number
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          tier_id: number
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          tier_id?: number
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          minimum_tier_id: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          minimum_tier_id: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          minimum_tier_id?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          duration: number
          video_url: string | null
          storage_key: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          duration?: number
          video_url?: string | null
          storage_key?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          duration?: number
          video_url?: string | null
          storage_key?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          lesson_id: string
          file_name: string
          file_type: string
          file_url: string
          minimum_tier_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          file_name: string
          file_type: string
          file_url: string
          minimum_tier_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          file_name?: string
          file_type?: string
          file_url?: string
          minimum_tier_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier_id: number
          status: 'active' | 'past_due' | 'canceled'
          next_billing_date: string | null
          payment_provider_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier_id: number
          status: 'active' | 'past_due' | 'canceled'
          next_billing_date?: string | null
          payment_provider_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier_id?: number
          status?: 'active' | 'past_due' | 'canceled'
          next_billing_date?: string | null
          payment_provider_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          is_completed: boolean
          time_watched: number
          last_watched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          is_completed?: boolean
          time_watched?: number
          last_watched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          is_completed?: boolean
          time_watched?: number
          last_watched_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          lesson_id: string | null
          attachment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id?: string | null
          lesson_id?: string | null
          attachment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string | null
          lesson_id?: string | null
          attachment_id?: string | null
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          issued_at: string
          certificate_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          issued_at?: string
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          issued_at?: string
          certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      user_downloads: {
        Row: {
          id: string
          user_id: string
          attachment_id: string
          downloaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          attachment_id: string
          downloaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          attachment_id?: string
          downloaded_at?: string
        }
      }
      lesson_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          course_id: string | null
          items: Json
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          course_id?: string | null
          items?: Json
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          course_id?: string | null
          items?: Json
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      file_products: {
        Row: {
          id: string
          attachment_id: string
          title: string
          description: string | null
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          attachment_id: string
          title: string
          description?: string | null
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          attachment_id?: string
          title?: string
          description?: string | null
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          thumbnail_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          thumbnail_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          thumbnail_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_attachments: {
        Row: {
          id: string
          product_id: string
          attachment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          attachment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          attachment_id?: string
          created_at?: string
        }
      }
      file_purchases: {
        Row: {
          id: string
          user_id: string
          file_product_id: string
          stripe_payment_intent_id: string
          amount_paid: number
          purchased_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_product_id: string
          stripe_payment_intent_id: string
          amount_paid: number
          purchased_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_product_id?: string
          stripe_payment_intent_id?: string
          amount_paid?: number
          purchased_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_purchases: {
        Row: {
          id: string
          user_id: string
          product_id: string
          stripe_payment_intent_id: string
          amount_paid: number
          purchased_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          stripe_payment_intent_id: string
          amount_paid: number
          purchased_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          stripe_payment_intent_id?: string
          amount_paid?: number
          purchased_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          subject: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email?: string | null
          subject: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string | null
          subject?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
        }
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          user_id: string | null
          message: string
          is_from_support: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id?: string | null
          message: string
          is_from_support?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string | null
          message?: string
          is_from_support?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permission_level: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

