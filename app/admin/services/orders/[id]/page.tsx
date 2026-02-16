// app/admin/services/orders/[id]/page.tsx
export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import OrderDetailClient from "./order-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. AMBIL DETAIL ORDER
  // Menggunakan alias FK eksplisit (!applications_userid_fkey) untuk menghindari error ambiguitas
  const { data: order, error: orderError } = await supabase
    .from("applications")
    .select(`
      *,
      services:services!applications_service_id_fkey (
        id, name, price, description
      ),
      profiles:profiles!applications_userid_fkey (
        id, full_name, email, phone, handedness, role
      )
    `)
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("Order Fetch Error:", JSON.stringify(orderError, null, 2));
    return notFound();
  }

  // 2. AMBIL RIWAYAT CHAT
  // Menggunakan alias FK eksplisit (!application_messages_sender_id_fkey)
  // karena nama constraint Anda 'sender_id' tapi kolomnya 'user_id'
  const { data: messages, error: msgError } = await supabase
    .from("application_messages")
    .select(`
      id,
      application_id,
      user_id,
      message,
      created_at,
      is_read,
      attachment_url,
      profiles:profiles!application_messages_sender_id_fkey (
        full_name,
        role
      )
    `)
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("Messages Fetch Error:", JSON.stringify(msgError, null, 2));
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <OrderDetailClient 
        initialOrder={order} 
        initialMessages={messages || []} 
      />
    </div>
  );
}