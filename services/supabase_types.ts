
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      drivers: {
        Row: {
          created_at: string;
          current_location: unknown | null;
          id: string;
          is_online: boolean | null;
          user_id: string;
          vehicle_type: string;
        };
        Insert: {
          created_at?: string;
          current_location?: unknown | null;
          id?: string;
          is_online?: boolean | null;
          user_id: string;
          vehicle_type: string;
        };
        Update: {
          created_at?: string;
          current_location?: unknown | null;
          id?: string;
          is_online?: boolean | null;
          user_id?: string;
          vehicle_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_available: boolean | null;
          name: string;
          price: number;
          restaurant_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean | null;
          name: string;
          price: number;
          restaurant_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean | null;
          name?: string;
          price?: number;
          restaurant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          menu_item_id: string;
          order_id: string;
          price: number;
          quantity: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          menu_item_id: string;
          order_id: string;
          price: number;
          quantity: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          menu_item_id?: string;
          order_id?: string;
          price?: number;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          commission_amount: number;
          created_at: string;
          customer_id: string;
          delivery_fee: number;
          driver_id: string | null;
          id: string;
          restaurant_id: string;
          status: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          commission_amount: number;
          created_at?: string;
          customer_id: string;
          delivery_fee: number;
          driver_id?: string | null;
          id?: string;
          restaurant_id: string;
          status: string;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          commission_amount?: number;
          created_at?: string;
          customer_id?: string;
          delivery_fee?: number;
          driver_id?: string | null;
          id?: string;
          restaurant_id?: string;
          status?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string;
          created_at: string;
          id: string;
          is_active: boolean | null;
          name: string;
          phone_number: string;
          user_id: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          phone_number: string;
          user_id: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          phone_number?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          id: string;
          password_hash: string;
          phone_number: string;
          raw_app_meta_data: Json | null;
          role: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          password_hash: string;
          phone_number: string;
          raw_app_meta_data?: Json | null;
          role: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          password_hash?: string;
          phone_number?: string;
          raw_app_meta_data?: Json | null;
          role?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | {
        schema: keyof Database;
        table: keyof (Database[NonNullable<PublicTableNameOrOptions["schema"]>]["Tables"] & Database[NonNullable<PublicTableNameOrOptions["schema"]>]["Views"])
      },
> = PublicTableNameOrOptions extends {
  schema: keyof Database;
  table: keyof (Database[NonNullable<PublicTableNameOrOptions["schema"]>]["Tables"] & Database[NonNullable<PublicTableNameOrOptions["schema"]>]["Views"])
}
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[PublicTableNameOrOptions["table"]]["Row"]
  : (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions["Row"]];

export type User = Tables<'users'>;
export type Restaurant = Tables<'restaurants'>;
export type MenuItem = Tables<'menu_items'>;
export type Driver = Tables<'drivers'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
