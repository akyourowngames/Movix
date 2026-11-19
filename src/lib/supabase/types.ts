export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      likes: {
        Row: {
          created_at: string
          genres: number[]
          media_type: string
          poster_path: string | null
          title: string | null
          tmdb_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          genres?: number[]
          media_type: string
          poster_path?: string | null
          title?: string | null
          tmdb_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          genres?: number[]
          media_type?: string
          poster_path?: string | null
          title?: string | null
          tmdb_id?: number
          user_id?: string
        }
        Relationships: []
      }
      playback: {
        Row: {
          episode: number | null
          media_type: string
          season: number | null
          title: string | null
          tmdb_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          episode?: number | null
          media_type: string
          season?: number | null
          title?: string | null
          tmdb_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          episode?: number | null
          media_type?: string
          season?: number | null
          title?: string | null
          tmdb_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          genres: number[]
          language: string | null
          media_type: string
          poster_path: string | null
          title: string
          tmdb_id: number
          user_id: string
          watched_at: string
        }
        Insert: {
          genres?: number[]
          language?: string | null
          media_type: string
          poster_path?: string | null
          title: string
          tmdb_id: number
          user_id: string
          watched_at?: string
        }
        Update: {
          genres?: number[]
          language?: string | null
          media_type?: string
          poster_path?: string | null
          title?: string
          tmdb_id?: number
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          genres: number[]
          language: string | null
          media_type: string
          poster_path: string | null
          title: string
          tmdb_id: number
          user_id: string
        }
        Insert: {
          added_at?: string
          genres?: number[]
          language?: string | null
          media_type: string
          poster_path?: string | null
          title: string
          tmdb_id: number
          user_id: string
        }
        Update: {
          added_at?: string
          genres?: number[]
          language?: string | null
          media_type?: string
          poster_path?: string | null
          title?: string
          tmdb_id?: number
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
