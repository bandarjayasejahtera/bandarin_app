// components/ui/greeting-popup.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sunrise, Sun, Moon, X, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function GreetingPopup() {
  const [show, setShow] = useState(false);
  const [greeting, setGreeting] = useState({ title: "", subText: "", icon: Sun, color: "" });
  const supabase = createClient();

  useEffect(() => {
    // 1. Cek Session Storage agar tidak muncul berulang kali di sesi yang sama
    const hasGreeted = sessionStorage.getItem("bandarin_greeted");
    if (hasGreeted) return;

    const fetchRandomQuote = async () => {
      const hour = new Date().getHours();
      let category = "malam";
      let title = "Selamat Malam!";
      let icon = Moon;
      let color = "text-blue-500";

      // LOGIKA AUTO SOLAR: Penentuan kategori berdasarkan waktu sistem
      if (hour >= 5 && hour < 11) {
        category = "pagi"; title = "Selamat Pagi!"; icon = Sunrise; color = "text-orange-500";
      } else if (hour >= 11 && hour < 15) {
        category = "siang"; title = "Selamat Siang!"; icon = Sun; color = "text-yellow-500";
      } else if (hour >= 15 && hour < 18) {
        category = "sore"; title = "Selamat Sore!"; icon = Sun; color = "text-orange-400";
      }

      try {
        /**
         * PENGAMBILAN DATA RANDOM:
         * Kita mengambil hingga 50 baris untuk kategori tersebut.
         * Dengan limit yang lebih besar, variasi antar user akan semakin tinggi.
         */
        const { data, error } = await supabase
          .from('motivational_quotes')
          .select('quote')
          .eq('category', category)
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          // Pilih satu secara acak dari pool data yang didapat
          const randomIndex = Math.floor(Math.random() * data.length);
          const selectedQuote = data[randomIndex].quote;

          setGreeting({ title, subText: selectedQuote, icon, color });
          
          // Munculkan popup dengan sedikit delay
          setTimeout(() => setShow(true), 1500);

          // Sembunyikan otomatis setelah 5 detik tampil
          setTimeout(() => handleClose(), 6500);
        }
      } catch (err) {
        console.error("Error fetching random quote:", err);
      }
    };

    fetchRandomQuote();
  }, [supabase]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("bandarin_greeted", "true");
  };

  const Icon = greeting.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-24 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-3xl p-5 flex items-start gap-4 max-w-lg w-full ring-1 ring-black/5">
            <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 ${greeting.color} shrink-0`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">
                  {greeting.title}
                </h3>
                <Sparkles className="h-3 w-3 text-tuscan-sun-500 animate-pulse" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {greeting.subText}
              </p>
            </div>
            <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}