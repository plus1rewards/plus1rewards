export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          member_id: string | null
          member_name: string | null
          member_phone: string | null
          message: string
          metadata: Json | null
          priority: string | null
          read: boolean | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          member_name?: string | null
          member_phone?: string | null
          message: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          member_name?: string | null
          member_phone?: string | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
