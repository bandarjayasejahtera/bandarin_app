/**
 * Order status values matching the database schema.
 */
export type OrderStatus = "pending" | "process" | "done" | "cancelled";

/**
 * Order record from the `orders` table (Supabase).
 */
export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at?: string;
}
