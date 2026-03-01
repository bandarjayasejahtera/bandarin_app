// app/admin/services/orders/page.tsx
export const dynamic = "force-dynamic";

import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  MessageCircle // <-- Tambahkan icon pesan
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Ambil data user admin yang sedang login
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch semua aplikasi dengan join ke profiles, services, DAN application_messages
  const { data: orders, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles:profiles!applications_userid_fkey (full_name, email),
      services:services!applications_service_id_fkey (name),
      application_messages (id, is_read, user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", JSON.stringify(error, null, 2));
  }

  const safeOrders = orders || [];

  // Fungsi Helper untuk warna status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'quoted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'process': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Semua Pesanan & Pengajuan</h1>
          <p className="text-slate-500 text-sm">Pantau dan kelola seluruh alur legalitas klien Bandarin.</p>
        </div>
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Perlu Review</p>
          <p className="text-2xl font-black text-orange-600">{safeOrders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Dalam Proses</p>
          <p className="text-2xl font-black text-purple-600">{safeOrders.filter(o => o.status === 'process').length}</p>
        </div>
      </div>

      {/* Tabel Pesanan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pelanggan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Layanan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Quotation</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeOrders.length > 0 ? (
                safeOrders.map((order: any) => {
                  // Hitung pesan yang belum dibaca dari Klien
                  const unreadCount = order.application_messages?.filter(
                    (m: any) => !m.is_read && m.user_id !== user?.id
                  ).length || 0;

                  return (
                    <tr 
                      key={order.id} 
                      className={`transition-colors ${unreadCount > 0 ? 'bg-blue-50/40 hover:bg-blue-50/80' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{order.profiles?.full_name || 'User Tanpa Nama'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{order.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${unreadCount > 0 ? 'bg-blue-100' : 'bg-blue-50'}`}>
                            <FileText className={`h-3 w-3 ${unreadCount > 0 ? 'text-blue-700' : 'text-blue-600'}`} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{order.services?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`capitalize font-bold px-3 py-1 ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">
                        {order.quoted_price ? `Rp ${order.quoted_price.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/admin/services/orders/${order.id}`} className="relative inline-block">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`font-bold gap-2 transition-all ${
                              unreadCount > 0 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-md shadow-blue-200' 
                              : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                            }`}
                          >
                            {unreadCount > 0 ? <MessageCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />} 
                            {unreadCount > 0 ? 'Balas' : 'Kelola'}
                          </Button>
                          
                          {/* BADGE MERAH PADA TOMBOL */}
                          {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-bounce">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    {error ? (
                      <span className="text-red-500">Gagal memuat data (Lihat Console).</span>
                    ) : (
                      "Belum ada pengajuan masuk."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}