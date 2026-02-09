// app/(user)/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
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
  
  // State awal
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
    const fetchQuote = async () => {
      const hour = new Date().getHours();
      
      // Inisialisasi variabel
      let category = "";
      let title = "";
      let icon = Sun;
      let color = "";

      // --- LOGIKA AUTO SOLAR (Waktu) YANG LEBIH EKSPLISIT ---
      if (hour >= 5 && hour < 11) {
        // Pagi (05.00 - 10.59)
        category = "pagi"; 
        title = "Selamat Pagi"; 
        icon = Sunrise; 
        color = "text-orange-500";
      } else if (hour >= 11 && hour < 15) {
        // Siang (11.00 - 14.59)
        category = "siang"; 
        title = "Selamat Siang"; 
        icon = Sun; 
        color = "text-yellow-500";
      } else if (hour >= 15 && hour < 18) {
        // Sore (15.00 - 17.59)
        category = "sore"; 
        title = "Selamat Sore"; 
        icon = Sun; 
        color = "text-orange-400";
      } else {
        // Malam (18.00 - 04.59) -> DITAMBAHKAN SECARA EKSPLISIT DI SINI
        category = "malam"; 
        title = "Selamat Malam"; 
        icon = Moon; 
        color = "text-indigo-500";
      }

      try {
        // Mengambil pool 50 quote sesuai kategori waktu
        const { data, error } = await supabase
          .from('motivational_quotes')
          .select('quote')
          .eq('category', category)
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          // --- RANDOMIZER ---
          const randomIndex = Math.floor(Math.random() * data.length);
          const selectedQuote = data[randomIndex].quote;

          // Update state
          setGreetingData({ title, quote: selectedQuote, icon, color });

          // Cek session storage untuk Popup
          const hasGreeted = sessionStorage.getItem("bandarin_greeted");
          if (!hasGreeted) {
            setTimeout(() => setShowGreet(true), 1000);
            setTimeout(() => {
              setShowGreet(false);
              sessionStorage.setItem("bandarin_greeted", "true");
            }, 6000);
          }
        } else {
          // Fallback jika database kosong/error tapi waktu berhasil dideteksi
          setGreetingData(prev => ({ ...prev, title, icon, color, quote: "Tetap semangat membangun bisnis Anda!" }));
        }
      } catch (err) {
        console.error("Gagal mengambil quote:", err);
        // Tetap update greeting title (Pagi/Siang/Malam) meski quote gagal load
        setGreetingData(prev => ({ ...prev, title, icon, color, quote: "Semoga harimu menyenangkan!" }));
      }
    };

    fetchQuote();
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
          {/* Label Waktu (Pagi/Siang/Sore/Malam) */}
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 ${greetingData.color}`}>
            <greetingData.icon className="h-4 w-4" />
            <span>{greetingData.title}</span>
          </div>

          <h1 className="text-4xl font-black tracking-tighter text-primary">Dashboard Saya</h1>
          
          {/* QUOTE DINAMIS */}
          <motion.p 
            key={greetingData.quote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground font-medium italic leading-relaxed"
          >
            "{greetingData.quote}"
          </motion.p>
        </div>
        
        <Button className="h-14 px-8 rounded-2xl shadow-xl font-bold bg-primary hover:brightness-110 flex items-center gap-2 transition-all hover:scale-105">
          <Plus className="h-5 w-5" />
          Mulai Pengajuan Baru
        </Button>
      </section>

      {/* --- GRID STATUS --- */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {[
          { label: "Belum Lunas - Pending", val: "2", icon: Clock, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: "Proses - Submited", val: "17", icon: FileBadge, color: "text-primary", bg: "bg-primary/5" },
          { label: "Selesai - Approved", val: "15", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },

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