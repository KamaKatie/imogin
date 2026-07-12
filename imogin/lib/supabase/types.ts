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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          color: string | null
          created_at: string
          currency: string
          icon: string | null
          id: string
          is_shared: boolean
          name: string
          partnership_id: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance?: number
          color?: string | null
          created_at?: string
          currency?: string
          icon?: string | null
          id?: string
          is_shared?: boolean
          name: string
          partnership_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance?: number
          color?: string | null
          created_at?: string
          currency?: string
          icon?: string | null
          id?: string
          is_shared?: boolean
          name?: string
          partnership_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_splits: {
        Row: {
          bill_id: string
          id: string
          percentage: number
          user_id: string
        }
        Insert: {
          bill_id: string
          id?: string
          percentage: number
          user_id: string
        }
        Update: {
          bill_id?: string
          id?: string
          percentage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_splits_subscription_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          active: boolean
          amount: number
          billing_cycle: string
          category_id: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          due_day: number | null
          icon_url: string | null
          id: string
          name: string
          next_billing_date: string
          partnership_id: string
          payment_account_id: string | null
          split_method: string
          split_payer_user_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          amount: number
          billing_cycle: string
          category_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          due_day?: number | null
          icon_url?: string | null
          id?: string
          name: string
          next_billing_date: string
          partnership_id: string
          payment_account_id?: string | null
          split_method?: string
          split_payer_user_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          amount?: number
          billing_cycle?: string
          category_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          due_day?: number | null
          icon_url?: string | null
          id?: string
          name?: string
          next_billing_date?: string
          partnership_id?: string
          payment_account_id?: string | null
          split_method?: string
          split_payer_user_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency: string
          end_date: string | null
          id: string
          partnership_id: string | null
          period: string
          start_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          partnership_id?: string | null
          period: string
          start_date: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          partnership_id?: string | null
          period?: string
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          partnership_id: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          partnership_id: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          partnership_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          account_id: string | null
          category_id: string | null
          color: string | null
          created_at: string
          currency: string
          current_amount: number
          description: string | null
          icon: string | null
          id: string
          name: string
          partnership_id: string | null
          status: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          partnership_id?: string | null
          status?: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          partnership_id?: string | null
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_members: {
        Row: {
          id: string
          joined_at: string
          partnership_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          partnership_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          partnership_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_members_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string
          id: string
          name: string | null
          share_code: string | null
          share_code_expires_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          share_code?: string | null
          share_code_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          share_code?: string | null
          share_code_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      transaction_splits: {
        Row: {
          amount: number
          created_at: string
          id: string
          percentage: number | null
          settled: boolean
          settled_at: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          percentage?: number | null
          settled?: boolean
          settled_at?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          percentage?: number | null
          settled?: boolean
          settled_at?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          bill_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_recurring: boolean
          is_split: boolean
          notes: string | null
          receipt_url: string | null
          split_method: string | null
          transfer_group_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          bill_id?: string | null
          category_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          is_split?: boolean
          notes?: string | null
          receipt_url?: string | null
          split_method?: string | null
          transfer_group_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          bill_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          is_split?: boolean
          notes?: string | null
          receipt_url?: string | null
          split_method?: string | null
          transfer_group_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_partnership_member: {
        Args: { partnership_id: string; user_id: string }
        Returns: boolean
      }
      seed_default_categories: {
        Args: { target_partnership_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
