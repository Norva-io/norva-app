/**
 * Supabase Database Types
 * Auto-generated types for type-safe database queries
 */

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
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          full_name: string | null
          email_grant_id: string | null
          email_provider: 'outlook' | 'gmail' | null
          email_connected_at: string | null
          stripe_customer_id: string | null
          plan: 'free' | 'starter' | 'pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          full_name?: string | null
          nylas_grant_id?: string | null
          email_provider?: 'outlook' | 'gmail' | null
          email_connected_at?: string | null
          stripe_customer_id?: string | null
          plan?: 'free' | 'starter' | 'pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          full_name?: string | null
          nylas_grant_id?: string | null
          email_provider?: 'outlook' | 'gmail' | null
          email_connected_at?: string | null
          stripe_customer_id?: string | null
          plan?: 'free' | 'starter' | 'pro'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          domain: string
          primary_contact_email: string | null
          health_score: number | null
          health_status: 'at_risk' | 'stable' | 'healthy' | null
          last_analyzed_at: string | null
          total_emails_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          domain: string
          primary_contact_email?: string | null
          health_score?: number | null
          health_status?: 'at_risk' | 'stable' | 'healthy' | null
          last_analyzed_at?: string | null
          total_emails_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          domain?: string
          primary_contact_email?: string | null
          health_score?: number | null
          health_status?: 'at_risk' | 'stable' | 'healthy' | null
          last_analyzed_at?: string | null
          total_emails_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      emails: {
        Row: {
          id: string
          client_id: string | null
          external_id: string
          subject: string | null
          from_email: string
          to_emails: string[]
          sent_at: string
          received_at: string
          sentiment: 'positive' | 'neutral' | 'negative' | null
          sentiment_score: number | null
          preview: string | null
          thread_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          external_id: string
          subject?: string | null
          from_email: string
          to_emails: string[]
          sent_at: string
          received_at: string
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          sentiment_score?: number | null
          preview?: string | null
          thread_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          external_id?: string
          subject?: string | null
          from_email?: string
          to_emails?: string[]
          sent_at?: string
          received_at?: string
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          sentiment_score?: number | null
          preview?: string | null
          thread_id?: string | null
          created_at?: string
        }
      }
      client_health_history: {
        Row: {
          id: string
          client_id: string
          health_score: number
          snapshot_date: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          health_score: number
          snapshot_date: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          health_score?: number
          snapshot_date?: string
          created_at?: string
        }
      }
      client_insights: {
        Row: {
          id: string
          client_id: string
          insight_type: 'warning' | 'info' | 'success'
          insight_text: string
          category: string | null
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          insight_type: 'warning' | 'info' | 'success'
          insight_text: string
          category?: string | null
          priority?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          insight_type?: 'warning' | 'info' | 'success'
          insight_text?: string
          category?: string | null
          priority?: number
          created_at?: string
        }
      }
      analysis_jobs: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          progress: number
          error_message: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          progress?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          progress?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Email = Database['public']['Tables']['emails']['Row']
export type ClientHealthHistory = Database['public']['Tables']['client_health_history']['Row']
export type ClientInsight = Database['public']['Tables']['client_insights']['Row']
export type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type EmailInsert = Database['public']['Tables']['emails']['Insert']
export type ClientHealthHistoryInsert = Database['public']['Tables']['client_health_history']['Insert']
export type ClientInsightInsert = Database['public']['Tables']['client_insights']['Insert']
export type AnalysisJobInsert = Database['public']['Tables']['analysis_jobs']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type EmailUpdate = Database['public']['Tables']['emails']['Update']
export type ClientHealthHistoryUpdate = Database['public']['Tables']['client_health_history']['Update']
export type ClientInsightUpdate = Database['public']['Tables']['client_insights']['Update']
export type AnalysisJobUpdate = Database['public']['Tables']['analysis_jobs']['Update']