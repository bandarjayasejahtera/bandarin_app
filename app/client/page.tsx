// app/client/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle2, 
  FileBadge, 
  ArrowRight, 
  Plus,
  Sunrise,
  Sun,
  Moon,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from "@/utils/supabase/client";

export default function UserDashboard() {
  const [stats, setStats] = useState({ pending: 0, process: 0, completed: 0 });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [greetingData, setGreetingData] = useState({ 
    title: "Selamat Datang", 
    quote: "Memuat...", 
    icon: Sun, 
    color: "text-primary" 
  });
  
  const supabase = createClient();

  const refreshApplications = useCallback(
    async (uid: string) => {
      setDbError(null); 

      try {
        // 1. Fetch Statistik
        const { data: apps, error: statsError } = await supabase
          .from('applications')
          .select('status')
          .eq('user_id', uid);

        if (statsError) throw new Error(`Stats Error: ${statsError.message}`);

        if (apps) {
          const counts = apps.reduce((acc: any, curr) => {
            if (curr.status === 'pending') acc.pending++;
            if (curr.status === 'process') acc.process++;
            if (curr.status === 'completed') acc.completed++;
            return acc;
          }, { pending: 0, process: 0, completed: 0 });
          setStats(counts);
        }

        // 2. Fetch SEMUA Pengajuan + Cek Pesan Baru
        // PERBAIKAN: Menambahkan nama Foreign Key secara eksplisit
        const { data: allOngoing, error: appsError } = await supabase
          .from('applications')
          .select(`
            id, 
            status, 
            updated_at,
            services!applications_service_id_fkey(name),
            application_messages (id, is_read, user_id)
          `)
          .eq('user_id', uid)
          .order('updated_at', { ascending: false });

        if (appsError) {
          throw new Error(`Query Error: ${appsError.message}`);
        }

        if (allOngoing && allOngoing.length > 0) {
          const mappedOngoing = allOngoing.map(app => {
            const messages = app.application_messages || [];
            
            // Supabase akan mengembalikan data di dalam key 'services' meskipun kita menggunakan sintaks !fk
            const servicesData = app.services;
            
            const serviceName = Array.isArray(servicesData) 
              ? servicesData[0]?.name 
              : servicesData?.name || "Layanan Tidak Diketahui";

            return {
              ...app,
              serviceName,
              hasNewMessage: messages.some((m: any) => !m.is_read && m.user_id !== uid)
            };
          });
          setRecentApplications(mappedOngoing);
        } else {
          setRecentApplications([]);
        }
      } catch (error: any) {
        console.error("Dashboard Fetch Error:", error);
        setDbError(error.message || "Gagal mengambil data dari database.");
      }
    },
    [supabase]
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await refreshApplications(user.id);

      const hour = new Date().getHours();
      let category = "malam", title = "Selamat Malam", icon = Moon, color = "text-indigo-500";
      if (hour >= 5 && hour < 11) { category = "pagi"; title = "Selamat Pagi"; icon = Sunrise; color = "text-orange-500"; }
      else if (hour >= 11 && hour < 15) { category = "siang"; title = "Selamat Siang"; icon = Sun; color = "text-yellow-500"; }
      else if (hour >= 15 && hour < 18) { category = "sore"; title = "Selamat Sore"; icon = Sun; color = "text-orange-400"; }

      const { data: quoteData } = await supabase
        .from('motivational_quotes')
        .select('quote')
        .eq('category', category)
        .limit(50);

      if (quoteData && quoteData.length > 0) {
        setGreetingData({
          title,
          quote: quoteData[Math.floor(Math.random() * quoteData.length)].quote,
          icon,
          color
        });
      } else {
        setGreetingData(prev => ({ ...prev, title, icon, color, quote: "Siap melegalkan bisnis Anda hari ini?" }));
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, refreshApplications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`client-dashboard-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` }, () => refreshApplications(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'application_messages' }, () => refreshApplications(userId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId, refreshApplications]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-10 pb-20">
      
      {/* ERROR BANNER */}
      {dbError && (
        <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-bold text-sm">Gagal Memuat Data</h3>
            <p className="text-red-600 dark:text-red-300 text-xs mt-1">{dbError}</p>
          </div>
        </div>
      )}

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
          { label: "Pending", val: stats.pending, icon: Clock, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: "Proses", val: stats.process, icon: FileBadge, color: "text-primary", bg: "bg-primary/5" },
          { label: "Selesai", val: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-card transition-shadow hover:shadow-md">
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
            Pengajuan Saya
            {recentApplications.some(a => a.hasNewMessage) && (
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-bounce" />
            )}
          </h2>
          <Link href="/client/applications" className="text-sm font-bold text-primary hover:underline">Lihat Detail</Link>
        </div>

        <div className="grid gap-4">
          {recentApplications.length > 0 ? (
            recentApplications.map((app) => (
              <Link key={app.id} href={`/client/applications/${app.id}`}>
                <Card className={`group border-2 transition-all hover:border-primary/40 ${app.hasNewMessage ? 'border-primary/30 bg-primary/5' : 'border-slate-100 dark:border-slate-800'}`}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${app.hasNewMessage ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {app.hasNewMessage ? <MessageSquare className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{app.serviceName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-black uppercase py-0 ${
                              app.status === 'completed' ? 'border-green-500 text-green-600 dark:text-green-400' :
                              app.status === 'process' ? 'border-primary text-primary' :
                              'border-orange-500 text-orange-600 dark:text-orange-400'
                            }`}
                          >
                            {app.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Update: {new Date(app.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {app.hasNewMessage && (
                        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-primary animate-pulse">
                          <AlertCircle className="h-3.5 w-3.5" /> Pesan Baru dari Admin/AI
                        </div>
                      )}
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-400 font-medium">
                {dbError ? "Menunggu perbaikan koneksi data..." : "Belum ada riwayat pengajuan layanan saat ini."}
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}