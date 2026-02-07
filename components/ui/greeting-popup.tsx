"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Sun, Sunset, Moon, X } from "lucide-react";

export function GreetingPopup() {
  const [show, setShow] = useState(false);
  const [greeting, setGreeting] = useState({ text: "", icon: Sun, color: "" });

  useEffect(() => {
    // 1. Cek Session Storage (Agar tidak spam)
    const hasGreeted = sessionStorage.getItem("bandarin_greeted");
    if (hasGreeted) return;

    // 2. Tentukan Pesan Berdasarkan Waktu
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) {
      setGreeting({ 
        text: "Selamat Pagi! Awali hari dengan semangat baru.", 
        icon: Coffee, 
        color: "text-orange-600" 
      });
    } else if (hour >= 11 && hour < 15) {
      setGreeting({ 
        text: "Selamat Siang! Tetap produktif dan fokus.", 
        icon: Sun, 
        color: "text-yellow-500" 
      });
    } else if (hour >= 15 && hour < 18) {
      setGreeting({ 
        text: "Selamat Sore! Jangan lupa istirahat sejenak.", 
        icon: Sunset, 
        color: "text-orange-400" 
      });
    } else {
      setGreeting({ 
        text: "Selamat Malam! Waktunya evaluasi capaian hari ini.", 
        icon: Moon, 
        color: "text-blue-500" 
      });
    }

    // 3. Tampilkan Popup
    const timerDelay = setTimeout(() => setShow(true), 1500); // Delay sedikit saat load

    // 4. Hilangkan Otomatis setelah 5 detik
    const timerHide = setTimeout(() => {
      handleClose();
    }, 1500 + 5000); // 1.5s delay + 5s tampil

    return () => {
      clearTimeout(timerDelay);
      clearTimeout(timerHide);
    };
  }, []);

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
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="fixed top-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-gray-200 dark:border-slate-800 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 max-w-md w-full sm:w-auto">
            
            <div className={`p-2 bg-gray-100 dark:bg-slate-800 rounded-full ${greeting.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {greeting.text}
              </p>
            </div>

            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}