// app/user/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Briefcase, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  FileBadge, 
  ArrowRight, 
  Plus,
  Sunrise,
  Sun,
  Moon,
  X,
  Sparkles,
  MessageSquare, // Ikon untuk pesan
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from "@/utils/supabase/client";

export default function UserDashboard() {
  const [showGreet, setShowGreet] = useState(false);
  const [stats, setStats] = useState({ pending: 0, process: 0, completed: 0 });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [greetingData, setGreetingData] = useState({ 
    title: "Selamat Datang", 
    quote: "Memuat kata mutiara...", 
    icon: Sun, 
    color: "text-primary" 
  });
  
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Statistik
      const { data: apps } = await supabase
        .from('applications')
        .select('status')
        .eq('user_id', user.id);

      if (apps) {
        const counts = apps.reduce((acc: any, curr) => {
          if (curr.status === 'pending') acc.pending++;
          if (curr.status === 'process') acc.process++;
          if (curr.status === 'completed') acc.completed++;
          return acc;
        }, { pending: 0, process: 0, completed: 0 });
        setStats(counts);
      }

      // 2. Fetch Pengajuan Aktif + Cek Pesan Baru
      const { data: ongoing } = await supabase
        .from('applications')
        .select(`
          id, 
          status, 
          updated_at,
          services (name),
          application_messages (id, is_read, user_id)
        `)
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (ongoing) {
        // Logika sederhana untuk indikator pesan baru: 
        // Ada pesan yang is_read = false DAN pengirimnya bukan user ini
        const mappedOngoing = ongoing.map(app => ({
          ...app,
          hasNewMessage: app.application_messages?.some((m: any) => !m.is_read && m.user_id !== user.id)
        }));
        setRecentApplications(mappedOngoing);
      }

      // 3. Logika Greeting (Tetap sesuai permintaan sebelumnya)
      const hour = new Date().getHours();
      let category = "malam", title = "Selamat Malam", icon = Moon, color = "text-indigo-500";
      if (hour >= 5 && hour < 11) { category = "pagi"; title = "Selamat Pagi"; icon = Sunrise; color = "text-orange-500"; }
      else if (hour >= 11 && hour < 15) { category = "siang"; title = "Selamat Siang"; icon = Sun; color = "text-yellow-500"; }
      else if (hour >= 15 && hour < 18) { category = "sore"; title = "Selamat Sore"; icon = Sun; color = "text-orange-400"; }

      const { data: quoteData } = await supabase.from('motivational_quotes').select('quote').eq('category', category).limit(50);
      if (quoteData && quoteData.length > 0) {
        setGreetingData({ title, quote: quoteData[Math.floor(Math.random() * quoteData.length)].quote, icon, color });
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-10 pb-20">
      {/* HEADER & QUOTE */}
      <section className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div className="space-y-1 max-w-2xl">
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 ${greetingData.color}`}>
            <greetingData.icon className="h-4 w-4" />
            <span>{greetingData.title}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary">Dashboard Saya</h1>
          <p className="text-muted-foreground font-medium italic">"{greetingData.quote}"</p>
        </div>
        <Link href="/client/applications/new">
          <Button className="h-14 px-8 rounded-2xl shadow-xl font-black bg-primary flex items-center gap-2 hover:scale-105 transition-all">
            <Plus className="h-5 w-5" /> Mulai Pengajuan Baru
          </Button>
        </Link>
      </section>

      {/* STATS GRID */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {[
          { label: "Pending", val: stats.pending, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Proses", val: stats.process, icon: FileBadge, color: "text-primary", bg: "bg-primary/5" },
          { label: "Selesai", val: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-card">
            <CardContent className="p-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-4xl font-black text-primary">{item.val}</p>
              </div>
              <div className={`p-4 rounded-2xl ${item.bg} ${item.color}`}><item.icon className="h-8 w-8" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PENGAJUAN AKTIF & PESAN BARU */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Pengajuan Aktif
            {recentApplications.some(a => a.hasNewMessage) && (
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-bounce" />
            )}
          </h2>
          <Link href="/client/applications" className="text-sm font-bold text-primary hover:underline">Lihat Semua</Link>
        </div>

        <div className="grid gap-4">
          {recentApplications.length > 0 ? (
            recentApplications.map((app) => (
              <Link key={app.id} href={`/client/applications/${app.id}`}>
                <Card className={`group border-2 transition-all hover:border-primary/40 ${app.hasNewMessage ? 'border-primary/30 bg-primary/5' : 'border-slate-100'}`}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${app.hasNewMessage ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {app.hasNewMessage ? <MessageSquare className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{app.services?.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-black uppercase py-0">{app.status}</Badge>
                          <span className="text-[10px] text-slate-400 font-medium">Update: {new Date(app.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {app.hasNewMessage && (
                        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-primary animate-pulse">
                          <AlertCircle className="h-3.5 w-3.5" /> Pesan Baru dari Admin
                        </div>
                      )}
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400 font-medium">Belum ada pengajuan aktif saat ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* POPULAR SERVICES (Bagian bawah tetap ada) */}
    </motion.div>
  );
}