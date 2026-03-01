// app/client/applications/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FileText, Clock, MessageCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { markMessagesAsReadAction } from "@/actions/update-status/chat-actions";

// Fungsi Helper untuk Styling Status
const getStatusStyles = (status: string) => {
  switch (status) {
    case 'pending': return 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30';
    case 'process': return 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30';
    case 'completed': return 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
    default: return 'border-slate-500 text-slate-600 bg-slate-50 dark:bg-slate-900/30';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'MENUNGGU';
    case 'process': return 'DIPROSES';
    case 'completed': return 'SELESAI';
    default: return status.toUpperCase();
  }
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchApplications = useCallback(async (userId: string) => {
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          services!applications_service_id_fkey(name),
          application_messages (id, is_read, user_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Query Error: ${error.message}`);

      if (data) {
        setApplications(data);
      }
    } catch (error: any) {
      console.error("Fetch Apps Error:", error);
      setDbError(error.message);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchApplications(user.id);
      }
      setLoading(false);
    };
    init();
  }, [supabase, fetchApplications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('applications-list-changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'application_messages' }, 
        () => fetchApplications(user.id)
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` }, 
        () => fetchApplications(user.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchApplications]);

  // Tandai pesan sudah dibaca saat card diklik
  const handleMarkAsRead = async (appId: string) => {
    if (!user) return;

    // 1. Optimistic update (langsung hilangkan badge di layar)
    setApplications(prevApps =>
      prevApps.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            application_messages: (app.application_messages || []).map((m: { user_id?: string; is_read?: boolean }) =>
              m.user_id !== user.id ? { ...m, is_read: true } : m
            )
          };
        }
        return app;
      })
    );

    // 2. Server action untuk update di DB (RLS-safe)
    const result = await markMessagesAsReadAction(appId);
    if (result?.success) {
      fetchApplications(user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Riwayat Pengajuan</h1>
      </div>

      {dbError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Gagal Memuat Data</h3>
            <p className="text-red-600 text-xs mt-1">{dbError}</p>
          </div>
        </div>
      )}

      {/* --- LIST PENGAJUAN --- */}
      <div className="grid gap-6">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => {
            const unreadMessages = app.application_messages?.filter(
              (m: any) => !m.is_read && m.user_id !== user?.id
            ).length || 0;

            const serviceName = Array.isArray(app.services) 
              ? app.services[0]?.name 
              : app.services?.name || "Layanan Tidak Diketahui";

            return (
              <Link 
                key={app.id} 
                href={`/client/applications/${app.id}`}
                // EKSEKUSI FUNGSI KETIKA CARD DIKLIK
                onClick={() => {
                  if (unreadMessages > 0) {
                    handleMarkAsRead(app.id);
                  }
                }}
              >
                <Card className={cn(
                  "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-900",
                  unreadMessages > 0 
                    ? "border-blue-500 bg-blue-50/30 shadow-blue-100 dark:bg-blue-900/10 dark:shadow-none" 
                    : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
                )}>
                  {/* Dekorasi Aksen Warna Status */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                    app.status === 'completed' ? "bg-emerald-500" : 
                    app.status === 'process' ? "bg-blue-500" : 
                    app.status === 'pending' ? "bg-yellow-500" : "bg-slate-300 dark:bg-slate-700"
                  )} />

                  <CardContent className="p-0">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        {/* Icon Container */}
                        <div className={cn(
                          "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                          unreadMessages > 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50" : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500"
                        )}>
                          <FileText className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                            {serviceName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4">
                            <Badge variant="outline" className={cn(
                              "font-black text-[10px] uppercase px-3 py-1 border-2 tracking-widest ring-1 ring-transparent",
                              getStatusStyles(app.status)
                            )}>
                              {getStatusLabel(app.status)}
                            </Badge>
                            
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase">
                              <Clock className="h-3.5 w-3.5" />
                              {format(new Date(app.created_at), "dd MMM yyyy", { locale: idLocale })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info & Action Section */}
                      <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                        {unreadMessages > 0 && (
                          <div className="flex items-center gap-2 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-full animate-pulse ring-2 ring-rose-200 dark:ring-rose-900">
                            <MessageCircle className="h-4 w-4 fill-rose-600 dark:fill-rose-400" />
                            <span className="text-[11px] font-black">{unreadMessages} PESAN BARU</span>
                          </div>
                        )}
                        
                        <div className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                          Lihat Detail
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Pengajuan</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Anda belum memiliki riwayat pengajuan layanan. Silakan mulai pengajuan baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}