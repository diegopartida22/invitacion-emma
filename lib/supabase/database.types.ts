// Generado desde el proyecto Supabase (fhyyydyfmerfnnnfjoge).
// Para regenerarlo después de cambiar el esquema:
//   npx supabase gen types typescript --project-id fhyyydyfmerfnnnfjoge > lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_login_attempts: {
        Row: {
          fails: number;
          ip: string;
          locked_until: string | null;
          updated_at: string;
        };
        Insert: {
          fails?: number;
          ip: string;
          locked_until?: string | null;
          updated_at?: string;
        };
        Update: {
          fails?: number;
          ip?: string;
          locked_until?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          allowed_adults: number;
          allowed_kids: number;
          child_name: string | null;
          code: string;
          confirmed_adults: number;
          confirmed_kids: number;
          created_at: string;
          display_name: string | null;
          id: string;
          invite_sent_at: string | null;
          message: string | null;
          mother_name: string | null;
          phone: string | null;
          responded_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          allowed_adults?: number;
          allowed_kids?: number;
          child_name?: string | null;
          code?: string;
          confirmed_adults?: number;
          confirmed_kids?: number;
          created_at?: string;
          id?: string;
          invite_sent_at?: string | null;
          message?: string | null;
          mother_name?: string | null;
          phone?: string | null;
          responded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          allowed_adults?: number;
          allowed_kids?: number;
          child_name?: string | null;
          code?: string;
          confirmed_adults?: number;
          confirmed_kids?: number;
          created_at?: string;
          id?: string;
          invite_sent_at?: string | null;
          message?: string | null;
          mother_name?: string | null;
          phone?: string | null;
          responded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rsvp_log: {
        Row: {
          adults: number;
          created_at: string;
          guest_id: string;
          id: number;
          kids: number;
          message: string | null;
          status: string;
        };
        Insert: {
          adults: number;
          created_at?: string;
          guest_id: string;
          id?: never;
          kids: number;
          message?: string | null;
          status: string;
        };
        Update: {
          adults?: number;
          created_at?: string;
          guest_id?: string;
          id?: never;
          kids?: number;
          message?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvp_log_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      gen_guest_code: { Args: { p_prefix?: string }; Returns: string };
      register_login_attempt: {
        Args: {
          p_ip: string;
          p_ok: boolean;
          p_max?: number;
          p_lockout?: string;
        };
        Returns: {
          allowed: boolean;
          retry_after_seconds: number;
        }[];
      };
      get_invitation: {
        Args: { p_code: string };
        Returns: {
          allowed_adults: number;
          allowed_kids: number;
          code: string;
          confirmed_adults: number;
          confirmed_kids: number;
          display_name: string;
          message: string;
          status: string;
        }[];
      };
      submit_rsvp: {
        Args: {
          p_adults?: number;
          p_code: string;
          p_kids?: number;
          p_message?: string;
          p_status: string;
        };
        Returns: {
          allowed_adults: number;
          allowed_kids: number;
          code: string;
          confirmed_adults: number;
          confirmed_kids: number;
          display_name: string;
          message: string;
          status: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type GuestRow = Database["public"]["Tables"]["guests"]["Row"];
export type GuestInsert = Database["public"]["Tables"]["guests"]["Insert"];
export type GuestUpdate = Database["public"]["Tables"]["guests"]["Update"];
export type InvitationRow =
  Database["public"]["Functions"]["get_invitation"]["Returns"][number];
