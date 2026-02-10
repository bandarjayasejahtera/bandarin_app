"use client";

import React, { useEffect, useState } from "react";
import { Bell, Circle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 1. Ambil notifikasi awal
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

    // 2. Listener Real-time
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          // Opsional: Mainkan suara notifikasi halus di sini
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  const markAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    setNotifications([]);
  };

  return (
    <Popover onOpenChange={(open) => !open && markAsRead()}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-6 w-6 text-slate-600" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="end">
        <div className="p-4 bg-primary text-white font-black text-sm uppercase tracking-widest">
          Notifikasi Baru
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Tidak ada notifikasi baru.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                <p className="text-xs font-black text-slate-900 mb-1">{n.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}