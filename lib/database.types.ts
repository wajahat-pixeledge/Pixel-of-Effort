export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      entry_categories: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          requires_project: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          requires_project?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          requires_project?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entry_statuses: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          requires_comment: boolean;
          is_blocker: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          requires_comment?: boolean;
          is_blocker?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          requires_comment?: boolean;
          is_blocker?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      access_rules: {
        Row: {
          access_value: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          note: string | null;
          rule_type: Database["public"]["Enums"]["access_rule_type"];
          updated_at: string;
        };
        Insert: {
          access_value: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          note?: string | null;
          rule_type?: Database["public"]["Enums"]["access_rule_type"];
          updated_at?: string;
        };
        Update: {
          access_value?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          note?: string | null;
          rule_type?: Database["public"]["Enums"]["access_rule_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_rules_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"];
          actor_user_id: string | null;
          created_at: string;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string | null;
          table_name: string;
        };
        Insert: {
          action: Database["public"]["Enums"]["audit_action"];
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: Database["public"]["Enums"]["audit_action"];
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          table_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          access_status: Database["public"]["Enums"]["access_status"];
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          access_status?: Database["public"]["Enums"]["access_status"];
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          access_status?: Database["public"]["Enums"]["access_status"];
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      project_assignments: {
        Row: {
          active_from: string;
          active_until: string | null;
          assigned_by: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          project_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active_from?: string;
          active_until?: string | null;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          project_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active_from?: string;
          active_until?: string | null;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          project_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      time_entries: {
        Row: {
          category: Database["public"]["Enums"]["time_entry_category"];
          comment: string | null;
          created_at: string;
          id: string;
          minutes: number;
          project_id: string | null;
          status_flag: Database["public"]["Enums"]["time_entry_status_flag"] | null;
          updated_at: string;
          user_id: string;
          work_date: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["time_entry_category"];
          comment?: string | null;
          created_at?: string;
          id?: string;
          minutes: number;
          project_id?: string | null;
          status_flag?: Database["public"]["Enums"]["time_entry_status_flag"] | null;
          updated_at?: string;
          user_id: string;
          work_date: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["time_entry_category"];
          comment?: string | null;
          created_at?: string;
          id?: string;
          minutes?: number;
          project_id?: string | null;
          status_flag?: Database["public"]["Enums"]["time_entry_status_flag"] | null;
          updated_at?: string;
          user_id?: string;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bootstrap_profile_for_current_user: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      current_user_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_user_is_approved: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      email_matches_access_rule: {
        Args: { email_input: string };
        Returns: boolean;
      };
      email_matches_allowed_rule: {
        Args: { email_input: string };
        Returns: boolean;
      };
      is_project_assigned: {
        Args: {
          project_input: string;
          user_input: string;
          work_date_input?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      access_rule_type: "domain" | "email" | "pattern";
      access_status: "pending" | "approved" | "rejected";
      app_role: "admin" | "user";
      audit_action: "insert" | "update" | "delete" | "other";
      time_entry_category: "project" | "time_off" | "office_process" | "free_open";
      time_entry_status_flag: "none" | "needs_review" | "blocked";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Row"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
