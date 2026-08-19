export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      friend_requests: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: string;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["friend_request_status"];
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: string;
          requester_id: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["friend_request_status"];
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: string;
          requester_id?: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["friend_request_status"];
        };
        Relationships: [
          {
            foreignKeyName: "friend_requests_addressee_id_fkey";
            columns: ["addressee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friend_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string;
          friend_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          friend_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          friend_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey";
            columns: ["friend_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plan_items: {
        Row: {
          approved: boolean;
          created_at: string;
          day_index: number;
          id: string;
          meal_plan_id: string;
          recipe_id: string;
          slot: Database["public"]["Enums"]["meal_slot"];
          updated_at: string;
        };
        Insert: {
          approved?: boolean;
          created_at?: string;
          day_index: number;
          id?: string;
          meal_plan_id: string;
          recipe_id: string;
          slot: Database["public"]["Enums"]["meal_slot"];
          updated_at?: string;
        };
        Update: {
          approved?: boolean;
          created_at?: string;
          day_index?: number;
          id?: string;
          meal_plan_id?: string;
          recipe_id?: string;
          slot?: Database["public"]["Enums"]["meal_slot"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plan_shares: {
        Row: {
          created_at: string;
          meal_plan_id: string;
          owner_id: string;
          recipient_id: string;
        };
        Insert: {
          created_at?: string;
          meal_plan_id: string;
          owner_id: string;
          recipient_id: string;
        };
        Update: {
          created_at?: string;
          meal_plan_id?: string;
          owner_id?: string;
          recipient_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_shares_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plan_shares_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plan_shares_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plans: {
        Row: {
          created_at: string;
          enabled_slots: Database["public"]["Enums"]["meal_slot"][];
          id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
          week_start: string;
        };
        Insert: {
          created_at?: string;
          enabled_slots?: Database["public"]["Enums"]["meal_slot"][];
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
          week_start: string;
        };
        Update: {
          created_at?: string;
          enabled_slots?: Database["public"]["Enums"]["meal_slot"][];
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
          week_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_enabled_slots: Database["public"]["Enums"]["meal_slot"][];
          default_meals_per_week: number;
          display_name: string | null;
          friend_discoverable: boolean;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_enabled_slots?: Database["public"]["Enums"]["meal_slot"][];
          default_meals_per_week?: number;
          display_name?: string | null;
          friend_discoverable?: boolean;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          default_enabled_slots?: Database["public"]["Enums"]["meal_slot"][];
          default_meals_per_week?: number;
          display_name?: string | null;
          friend_discoverable?: boolean;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_shares: {
        Row: {
          created_at: string;
          recipe_id: string;
          shared_by: string;
          shared_with: string;
        };
        Insert: {
          created_at?: string;
          recipe_id: string;
          shared_by: string;
          shared_with: string;
        };
        Update: {
          created_at?: string;
          recipe_id?: string;
          shared_by?: string;
          shared_with?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_shares_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_shares_shared_by_fkey";
            columns: ["shared_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_shares_shared_with_fkey";
            columns: ["shared_with"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_suggestions: {
        Row: {
          created_at: string;
          id: string;
          recipe_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reviewer_note: string | null;
          status: Database["public"]["Enums"]["suggestion_status"];
          suggested_by: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          recipe_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_note?: string | null;
          status?: Database["public"]["Enums"]["suggestion_status"];
          suggested_by: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          recipe_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_note?: string | null;
          status?: Database["public"]["Enums"]["suggestion_status"];
          suggested_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_suggestions_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_suggestions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_suggestions_suggested_by_fkey";
            columns: ["suggested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          ingredients: string[];
          meal_tags: Database["public"]["Enums"]["meal_slot"][];
          owner_id: string | null;
          prep_minutes: number;
          servings: number;
          source_recipe_id: string | null;
          status: Database["public"]["Enums"]["recipe_status"];
          steps: string[];
          tip: string | null;
          title: string;
          updated_at: string;
          visibility: Database["public"]["Enums"]["recipe_visibility"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          ingredients?: string[];
          meal_tags?: Database["public"]["Enums"]["meal_slot"][];
          owner_id?: string | null;
          prep_minutes?: number;
          servings?: number;
          source_recipe_id?: string | null;
          status?: Database["public"]["Enums"]["recipe_status"];
          steps?: string[];
          tip?: string | null;
          title: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["recipe_visibility"];
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          ingredients?: string[];
          meal_tags?: Database["public"]["Enums"]["meal_slot"][];
          owner_id?: string | null;
          prep_minutes?: number;
          servings?: number;
          source_recipe_id?: string | null;
          status?: Database["public"]["Enums"]["recipe_status"];
          steps?: string[];
          tip?: string | null;
          title?: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["recipe_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "recipes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_source_recipe_id_fkey";
            columns: ["source_recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      shopping_items: {
        Row: {
          category: string | null;
          checked: boolean;
          created_at: string;
          id: string;
          meal_plan_id: string | null;
          name: string;
          quantity: number;
          source: Database["public"]["Enums"]["shopping_item_source"];
          unit: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          checked?: boolean;
          created_at?: string;
          id?: string;
          meal_plan_id?: string | null;
          name: string;
          quantity?: number;
          source?: Database["public"]["Enums"]["shopping_item_source"];
          unit?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          checked?: boolean;
          created_at?: string;
          id?: string;
          meal_plan_id?: string | null;
          name?: string;
          quantity?: number;
          source?: Database["public"]["Enums"]["shopping_item_source"];
          unit?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_items_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shopping_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staples: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staples_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          granted_at: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          granted_at?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_friend_request: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      apply_generated_plan: {
        Args: {
          p_assignments: Json;
          p_slots: Database["public"]["Enums"]["meal_slot"][];
          p_week_start: string;
        };
        Returns: number;
      };
      approve_recipe_suggestion: {
        Args: { p_suggestion_id: string };
        Returns: string;
      };
      archive_catalog_recipe: {
        Args: { p_recipe_id: string };
        Returns: undefined;
      };
      copy_shared_plan: {
        Args: { p_meal_plan_id: string; p_week_start: string };
        Returns: number;
      };
      decline_friend_request: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
      is_friend: { Args: { p_other: string }; Returns: boolean };
      owns_meal_plan: { Args: { p_meal_plan_id: string }; Returns: boolean };
      owns_recipe: { Args: { p_recipe_id: string }; Returns: boolean };
      planned_ingredients: {
        Args: { p_meal_plan_id: string };
        Returns: {
          name: string;
        }[];
      };
      reject_recipe_suggestion: {
        Args: { p_note?: string; p_suggestion_id: string };
        Returns: undefined;
      };
      share_meal_plan: {
        Args: { p_meal_plan_id: string; p_recipient: string };
        Returns: undefined;
      };
      sync_generated_shopping_items: {
        Args: { p_week_start: string };
        Returns: number;
      };
    };
    Enums: {
      app_role: "user" | "admin";
      friend_request_status: "pending" | "accepted" | "declined";
      meal_slot: "breakfast" | "lunch" | "snack" | "dinner";
      recipe_status: "active" | "archived";
      recipe_visibility: "private" | "public";
      shopping_item_source: "generated" | "manual" | "staple";
      suggestion_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      friend_request_status: ["pending", "accepted", "declined"],
      meal_slot: ["breakfast", "lunch", "snack", "dinner"],
      recipe_status: ["active", "archived"],
      recipe_visibility: ["private", "public"],
      shopping_item_source: ["generated", "manual", "staple"],
      suggestion_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
