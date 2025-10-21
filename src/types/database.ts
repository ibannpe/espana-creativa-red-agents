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
          email: string
          name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          linkedin_url: string | null
          website_url: string | null
          skills: string[] | null
          interests: string[] | null
          completed_pct: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          skills?: string[] | null
          interests?: string[] | null
          completed_pct?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          skills?: string[] | null
          interests?: string[] | null
          completed_pct?: number
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          role_id: number
          created_at?: string
        }
        Update: {
          user_id?: string
          role_id?: number
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: number
          title: string
          description: string | null
          start_date: string | null
          end_date: string | null
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: number
          title: string
          description: string
          skills: string[] | null
          project_id: number | null
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          skills?: string[] | null
          project_id?: number | null
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          skills?: string[] | null
          project_id?: number | null
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          sender_id: string
          receiver_id: string | null
          body: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: number
          sender_id: string
          receiver_id?: string | null
          body: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          sender_id?: string
          receiver_id?: string | null
          body?: string
          is_public?: boolean
          created_at?: string
        }
      }
      interests: {
        Row: {
          user_id: string
          project_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          project_id: number
          created_at?: string
        }
        Update: {
          user_id?: string
          project_id?: number
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