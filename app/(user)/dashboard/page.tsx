// app/(user)/dashboard/page.tsx
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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from "@/utils/supabase/client";

export default function UserDashboard() {
  const [showGreet, setShowGreet] = useState(false);
  const [stats, setStats] = useState({ pending: 0, process: 0, completed: 0 });
  
  // State awal greeting
  const [greetingData, setGreetingData] = useState({ 
    title: "Selamat Datang", 
    quote: "Memuat kata mutiara...", 
    icon: Sun, 
    color: "text-primary" 
  });
  
  const supabase = createClient();

  const services = [
    { title: "NIB Perorangan", desc: "OSS RBA cepat.", icon: Zap },
    { title: "Pendirian PT", desc: "Legalitas lengkap.", icon: Briefcase },
    { title: "Izin BPOM", desc: "Sertifikasi edar.", icon: ShieldCheck },
    { title: "SLHS", desc: "Sertifikasi Laik Higienis.", icon: ShieldCheck },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Ambil Statistik Riil
      const { data: apps } = await supabase
        .from('applications')
        .select('status')
        .eq('user_id', user.id);

      if (apps) {
        const counts = apps.reduce((acc: any, curr) => {
          // Mapping status dari DB ke state stats
          if (curr.status === 'pending') acc.pending++;
          if (curr.status === 'process') acc.process++;
          if (curr.status === 'completed') acc.completed++;
          return acc;
        }, { pending: 0, process: 0, completed: 0 });
        setStats(counts);
      }

      // 2. Logika Greeting & Quotes
      const hour = new Date().getHours();
      let category = "";
      let title = "";
      let icon = Sun;
      let color = "";

      if (hour >= 5 && hour < 11) {
        category = "pagi"; title = "Selamat Pagi"; icon = Sunrise; color = "text-orange-500";
      } else if (hour >= 11 && hour < 15) {
        category = "siang"; title = "Selamat Siang"; icon = Sun; color = "text-yellow-500";
      } else if (hour >= 15 && hour < 18) {
        category = "sore"; title = "Selamat Sore"; icon = Sun; color = "text-orange-400";
      } else {
        category = "malam"; title = "Selamat Malam"; icon = Moon; color = "text-indigo-500";
      }

      try {
        const { data: quoteData, error } = await supabase
          .from('motivational_quotes')
          .select('quote')
          .eq('category', category)
          .limit(50);

        if (!error && quoteData && quoteData.length > 0) {
          const randomIndex = Math.floor(Math.random() * quoteData.length);
          setGreetingData({ title, quote: quoteData[randomIndex].quote, icon, color });
          
          const hasGreeted = sessionStorage.getItem("bandarin_greeted");
          if (!hasGreeted) {
            setTimeout(() => setShowGreet(true), 1000);
            setTimeout(() => {
              setShowGreet(false);
              sessionStorage.setItem("bandarin_greeted", "true");
            }, 6000);
          }
        } else {
          setGreetingData(prev => ({ ...prev, title, icon, color, quote: "Tetap semangat membangun bisnis Anda!" }));
        }
      } catch (err) {
        setGreetingData(prev => ({ ...prev, title, icon, color, quote: "Semoga harimu menyenangkan!" }));
      }
    };

    fetchData();
  }, [supabase]);

  const closeGreeting = () => {
    setShowGreet(false);
    sessionStorage.setItem("bandarin_greeted", "true");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="relative space-y-10"
    >
      {/* --- POPUP GREETING --- */}
      <AnimatePresence>
        {showGreet && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-3xl p-6 flex items-start gap-4 max-w-lg w-full">
              <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 ${greetingData.color} shrink-0`}>
                <greetingData.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">
                    {greetingData.title}
                  </h3>
                  <Sparkles className="h-3 w-3 text-tuscan-sun-500 animate-pulse" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {greetingData.quote}
                </p>
              </div>
              <button onClick={closeGreeting} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER DASHBOARD --- */}
      <section className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div className="space-y-1 max-w-2xl">
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 ${greetingData.color}`}>
            <greetingData.icon className="h-4 w-4" />
            <span>{greetingData.title}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary">Dashboard Saya</h1>
          <motion.p 
            key={greetingData.quote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground font-medium italic leading-relaxed"
          >
            "{greetingData.quote}"
          </motion.p>
        </div>
        
        {/* Tombol Terhubung ke Pengajuan Baru */}
        <Link href="/dashboard/applications/new">
          <Button className="h-14 px-8 rounded-2xl shadow-xl font-bold bg-primary hover:brightness-110 flex items-center gap-2 transition-all hover:scale-105">
            <Plus className="h-5 w-5" />
            Mulai Pengajuan Baru
          </Button>
        </Link>
      </section>

      {/* --- GRID STATUS DINAMIS --- */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {[
          { label: "Belum Lunas - Pending", val: stats.pending.toString(), icon: Clock, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: "Proses - Submited", val: stats.process.toString(), icon: FileBadge, color: "text-primary", bg: "bg-primary/5" },
          { label: "Selesai - Approved", val: stats.completed.toString(), icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all group">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-4xl font-black text-primary">{item.val}</p>
              </div>
              <div className={`p-4 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- KATALOG LAYANAN --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Layanan Populer</h2>
          <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5">Lihat Semua</Button>
        </div>

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
          {services.map((svc, i) => (
            <Card key={i} className="group cursor-pointer hover:border-primary/50 transition-all bg-card border-border/50">
              <CardContent className="p-6 flex items-start gap-5 text-left">
                <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <svc.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight mb-1 truncate">{svc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{svc.desc}</p>
                </div>
                <div className="mt-1 text-muted-foreground group-hover:text-primary transition-colors">
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}