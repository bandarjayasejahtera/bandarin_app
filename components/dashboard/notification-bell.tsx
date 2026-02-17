// components/dashboard/notification-bell.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NOTIFICATION_SOUND = "/sounds/bell-ring-notification.wav";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supabase] = useState(() => createClient());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  // Unlock audio on first user interaction (browser policy: autoplay butuh interaksi)
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        })
        .catch(() => {});
      audioUnlockedRef.current = true;
    }
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      setNotifications(data || []);
    };

    fetchNotifications();

    // 2. Setup Realtime Listener
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          // Tambahkan notifikasi baru ke state
          setNotifications(prev => [payload.new, ...prev]);
          
          // 3. Putar suara notifikasi (akan berhasil jika user sudah pernah interaksi/unlock)
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1;
            audioRef.current.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [userId, supabase]);

  const markAsRead = async () => {
    if (notifications.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    setNotifications([]);
  };

  return (
    <Popover onOpenChange={(open) => !open && markAsRead()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-zinc-800"
          onPointerDown={unlockAudio}
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-zinc-400" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse shadow-sm" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="end">
        <div className="p-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest flex justify-between items-center">
          <span>Notifikasi Baru</span>
          {notifications.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{notifications.length}</span>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-[10px] font-medium uppercase tracking-tighter">
              Tidak ada notifikasi baru saat ini.
            </div>
          ) : (
            notifications.map((n) => (
              <Link 
                key={n.id} 
                href={n.link || "#"} 
                className="block p-4 border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[11px] font-black text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                    {n.title}
                  </p>
                  <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter whitespace-nowrap ml-2">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2">{n.message}</p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}