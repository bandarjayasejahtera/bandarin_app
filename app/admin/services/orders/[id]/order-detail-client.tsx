"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Save, CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function OrderDetailClient({ order, agents }: { order: any, agents: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  
  const [status, setStatus] = useState(order.status);
  const [price, setPrice] = useState(order.quoted_price || "");
  const [agentId, setAgentId] = useState(order.assigned_agent_id || "");
  const [notes, setNotes] = useState(order.admin_notes || "");

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // 1. UPDATE DATA PENGJUAN
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: status,
          quoted_price: price === "" ? null : Number(price),
          assigned_agent_id: agentId === "" ? null : agentId,
          admin_notes: notes,
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // 2. KIRIM NOTIFIKASI OTOMATIS KE USER
      // Kita buat pesan yang dinamis berdasarkan perubahan
      let notifTitle = "Update Pengajuan";
      let notifMessage = `Status pengajuan ${order.services?.name} Anda kini: ${status}.`;

      if (status === 'quoted' && price) {
        notifTitle = "Penawaran Harga Tersedia";
        notifMessage = `Admin telah mengirimkan penawaran harga untuk ${order.services?.name}. Silakan cek detailnya.`;
      }

      await supabase.from("notifications").insert({
        user_id: order.user_id, // ID User pemilik pengajuan
        title: notifTitle,
        message: notifMessage,
        link: `/dashboard/applications/${order.id}`,
        is_read: false
      });

      alert("Data berhasil diperbarui dan notifikasi telah dikirim ke klien!");
      router.refresh();
    } catch (error: any) {
      alert("Gagal update: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BAGIAN DATA FORMULIR USER (TETAP SAMA) */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <FileText className="h-5 w-5" />
            <h2 className="font-bold text-lg">Data Pengajuan User</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(order.form_data || {}).map(([key, value]: [string, any]) => (
              <div key={key} className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{key.replace(/_/g, ' ')}</Label>
                <div className="text-sm font-semibold text-slate-800">
                  {typeof value === 'string' && value.includes('/') ? (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 font-bold flex items-center gap-2"
                      onClick={async () => {
                        const { data } = await supabase.storage.from('application-docs').getPublicUrl(value);
                        window.open(data.publicUrl, '_blank');
                      }}
                    >
                      <Download className="h-3 w-3" /> Lihat Dokumen
                    </Button>
                  ) : (
                    value?.toString() || "-"
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FORM MANAJEMEN ADMIN (SEKARANG DENGAN AUTO-NOTIFICATION) */}
      <Card className="border-primary/20 shadow-md">
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Tindakan Admin & Penawaran
            </h2>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none capitalize font-bold">
              Status Saat Ini: {order.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">Harga Penawaran (Quotation)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
                <Input 
                  type="number" 
                  className="pl-10 font-bold text-blue-600" 
                  placeholder="Masukkan harga..."
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Update Status Alur Kerja</Label>
              <select 
                className="w-full p-2 border rounded-md bg-background text-sm font-bold text-primary"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Menunggu Review</option>
                <option value="quoted">Kirim Penawaran (Quoted)</option>
                <option value="process">Proses Pengerjaan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>

          <Button 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-black text-lg gap-2 shadow-lg"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
            Simpan & Beri Tahu Klien
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}