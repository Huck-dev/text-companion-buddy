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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      compute_executions: {
        Row: {
          completed_at: string | null
          cost_credits: number
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          function_name: string
          host_earnings: number | null
          host_id: string | null
          id: string
          parameters: Json | null
          platform_earnings: number | null
          requester_id: string
          result: Json | null
          server_name: string
          server_type: Database["public"]["Enums"]["server_type"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["execution_status"]
        }
        Insert: {
          completed_at?: string | null
          cost_credits: number
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name: string
          host_earnings?: number | null
          host_id?: string | null
          id?: string
          parameters?: Json | null
          platform_earnings?: number | null
          requester_id: string
          result?: Json | null
          server_name: string
          server_type?: Database["public"]["Enums"]["server_type"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
        }
        Update: {
          completed_at?: string | null
          cost_credits?: number
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string
          host_earnings?: number | null
          host_id?: string | null
          id?: string
          parameters?: Json | null
          platform_earnings?: number | null
          requester_id?: string
          result?: Json | null
          server_name?: string
          server_type?: Database["public"]["Enums"]["server_type"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
        }
        Relationships: [
          {
            foreignKeyName: "compute_executions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "compute_hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      compute_hosts: {
        Row: {
          capabilities: Json | null
          compatible_server_types:
            | Database["public"]["Enums"]["server_type"][]
            | null
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string | null
          location: string | null
          name: string
          profit_share_percentage: number | null
          server_info: Json | null
          server_type: Database["public"]["Enums"]["server_type"] | null
          status: Database["public"]["Enums"]["compute_host_status"]
          successful_executions: number | null
          total_earnings: number | null
          total_executions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capabilities?: Json | null
          compatible_server_types?:
            | Database["public"]["Enums"]["server_type"][]
            | null
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string | null
          location?: string | null
          name: string
          profit_share_percentage?: number | null
          server_info?: Json | null
          server_type?: Database["public"]["Enums"]["server_type"] | null
          status?: Database["public"]["Enums"]["compute_host_status"]
          successful_executions?: number | null
          total_earnings?: number | null
          total_executions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capabilities?: Json | null
          compatible_server_types?:
            | Database["public"]["Enums"]["server_type"][]
            | null
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string | null
          location?: string | null
          name?: string
          profit_share_percentage?: number | null
          server_info?: Json | null
          server_type?: Database["public"]["Enums"]["server_type"] | null
          status?: Database["public"]["Enums"]["compute_host_status"]
          successful_executions?: number | null
          total_earnings?: number | null
          total_executions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compute_payments: {
        Row: {
          amount: number
          created_at: string
          execution_id: string | null
          host_id: string
          id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          execution_id?: string | null
          host_id: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          execution_id?: string | null
          host_id?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compute_payments_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "compute_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compute_payments_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "compute_hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          model_used: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          model_used?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          model_used?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_name: string
          friend_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_name: string
          friend_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_name?: string
          friend_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          solana_address: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          solana_address?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          solana_address?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      servers: {
        Row: {
          app_url: string | null
          code: string | null
          created_at: string
          description: string | null
          endpoint: string
          id: string
          is_public: boolean
          name: string
          server_type: Database["public"]["Enums"]["server_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          app_url?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          endpoint: string
          id?: string
          is_public?: boolean
          name: string
          server_type: Database["public"]["Enums"]["server_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          app_url?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          endpoint?: string
          id?: string
          is_public?: boolean
          name?: string
          server_type?: Database["public"]["Enums"]["server_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_deposits: {
        Row: {
          amount_usdc: number
          created_at: string | null
          credits_awarded: number
          id: string
          network: string | null
          processed_at: string | null
          transaction_hash: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          amount_usdc: number
          created_at?: string | null
          credits_awarded: number
          id?: string
          network?: string | null
          processed_at?: string | null
          transaction_hash: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          amount_usdc?: number
          created_at?: string | null
          credits_awarded?: number
          id?: string
          network?: string | null
          processed_at?: string | null
          transaction_hash?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      select_best_host: {
        Args: {
          preferred_location?: string
          required_capabilities: string[]
          required_server_type?: Database["public"]["Enums"]["server_type"]
        }
        Returns: string
      }
    }
    Enums: {
      compute_host_status: "online" | "offline" | "busy" | "maintenance"
      execution_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      server_type: "mcp" | "a2a" | "misc"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      compute_host_status: ["online", "offline", "busy", "maintenance"],
      execution_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      server_type: ["mcp", "a2a", "misc"],
    },
  },
} as const
