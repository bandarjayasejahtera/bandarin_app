// app/admin/services/orders/[id]/order-detail-client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Send, CheckCircle2, Clock, 
  AlertCircle, FileText, User, Phone, 
  DollarSign, Briefcase, Calendar, MoreVertical
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Utils
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type OrderType = any;
type MessageType = any;

interface OrderDetailClientProps {
  initialOrder: OrderType;
  initialMessages: MessageType[];
}

export default function OrderDetailClient({ initialOrder, initialMessages }: OrderDetailClientProps) {
  // --- PERBAIKAN UTAMA: SINGLETON CLIENT ---
  // Menggunakan useState agar client tidak dibuat ulang setiap render (ketik/update state)
  const [supabase] = useState(() => createClient());
  
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // State
  const [order, setOrder] = useState(initialOrder);
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Indikator koneksi

  // --- 1. REALTIME SUBSCRIPTION ---
  // Pastikan tabel application_messages & applications ada di Supabase Dashboard → Database → Replication → supabase_realtime
  useEffect(() => {
    scrollToBottom();

    const channel = supabase
      .channel(`order-room-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${order.id}`,
        },
        (payload) => {
          const newId = (payload.new as { id: string }).id;
          fetchNewMessage(newId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
          toast.info("Status pesanan diperbarui otomatis.");
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast.error("Gagal terhubung ke Live Chat.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  // Helper: Fetch pesan baru (dari realtime INSERT) dan dedupe dengan optimistic
  const fetchNewMessage = async (messageId: string) => {
    const { data } = await supabase
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
      .eq("id", messageId)
      .single();

    if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        // Ganti optimistic (id diawali 'opt-') yang isi pesan sama dengan real message
        const replaced = prev.map((m) =>
          String(m.id).startsWith("opt-") && (m as any).message === data.message ? data : m
        );
        if (replaced.some((m) => m.id === data.id)) return replaced;
        return [...prev, data];
      });
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // --- 2. ACTIONS ---

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sesi habis, login ulang.");
      setIsSending(false);
      return;
    }

    const text = newMessage.trim();
    // Optimistic: tampilkan pesan langsung, nanti diganti oleh realtime
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: MessageType = {
      id: optimisticId,
      application_id: order.id,
      user_id: user.id,
      message: text,
      created_at: new Date().toISOString(),
      is_read: false,
      attachment_url: null,
      profiles: { full_name: "Anda", role: "admin" },
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    scrollToBottom();

    const { error } = await supabase.from("application_messages").insert({
      application_id: order.id,
      user_id: user.id,
      message: text,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error("Send Error:", error);
      toast.error("Gagal mengirim pesan.");
    }
    setIsSending(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      toast.error("Gagal update status");
    } else {
      toast.success(`Status diubah ke ${newStatus}`);
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handlePriceUpdate = async (formData: FormData) => {
    const price = formData.get("quoted_price");
    if (!price) return;

    const { error } = await supabase
      .from("applications")
      .update({ 
        quoted_price: price,
        status: 'quoted'
      })
      .eq("id", order.id);

    if (error) toast.error("Gagal menyimpan harga");
    else toast.success("Penawaran harga terkirim!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'process': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'quoted': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Navigasi */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/services/orders">
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            ORDER #{order.id.slice(0, 8).toUpperCase()}
            <Badge variant="outline" className={`capitalize ${getStatusColor(order.status)} border-2`}>
              {order.status}
            </Badge>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
             Dibuat pada {format(new Date(order.created_at), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
             {isConnected ? (
                <span className="text-green-600 text-[10px] font-bold px-2 py-0.5 bg-green-100 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE
                </span>
             ) : (
                <span className="text-red-500 text-[10px] font-bold px-2 py-0.5 bg-red-100 rounded-full">OFFLINE</span>
             )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        
        {/* KOLOM KIRI: Detail Order & Kontrol */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <Card className="border-l-4 border-l-blue-600 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Kontrol Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Ubah Status Pengerjaan</label>
                <Select 
                  disabled={isUpdating} 
                  value={order.status} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="h-12 font-bold">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu Review</SelectItem>
                    <SelectItem value="quoted">Penawaran Dikirim</SelectItem>
                    <SelectItem value="process">Dalam Proses</SelectItem>
                    <SelectItem value="review">Review Dokumen</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              <form action={handlePriceUpdate} className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Estimasi Biaya (Quotation)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      name="quoted_price" 
                      defaultValue={order.quoted_price} 
                      placeholder="Contoh: 1500000" 
                      className="pl-9 font-mono"
                    />
                  </div>
                  <Button type="submit" size="sm" className="bg-slate-900 text-white">Save</Button>
                </div>
                <p className="text-[10px] text-slate-400">Mengisi harga akan mengubah status ke 'Quoted'.</p>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Informasi Klien</CardTitle>
              <User className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                  {order.profiles?.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{order.profiles?.full_name || "Tanpa Nama"}</p>
                  <p className="text-xs text-slate-500">{order.profiles?.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">{order.profiles?.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">{order.services?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: Chat Room */}
        <div className="lg:col-span-2 flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live Chat & Diskusi
            </h3>
            <Button variant="ghost" size="sm" className="text-xs text-slate-400">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6 bg-slate-50/30">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <FileText className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Belum ada pesan. Mulai diskusi sekarang.</p>
                </div>
              )}
              
              {messages.map((msg) => {
                const isAdmin = msg.profiles?.role === 'admin'; 
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isAdmin 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                      <p className={`text-[10px] mt-1 text-slate-400 ${isAdmin ? 'text-right' : 'text-left'}`}>
                        {msg.profiles?.full_name} • {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
              <Textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan balasan..." 
                className="min-h-[50px] max-h-[150px] resize-none rounded-xl border-slate-200 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isSending || !newMessage.trim()}
                className="h-[50px] w-[50px] rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0 shadow-lg shadow-blue-500/30 transition-all"
              >
                {isSending ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="h-5 w-5 text-white" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}