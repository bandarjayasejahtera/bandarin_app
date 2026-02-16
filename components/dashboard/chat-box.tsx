"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Send, User, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatBox({ applicationId, initialMessages, currentUserId }: any) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 1. AKTIFKAN REALTIME LISTENER
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          setMessages((prev: any) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, supabase]);

  // 2. LOGIKA OTOMATIS TANDAI PESAN TERBACA
  useEffect(() => {
    const markAsRead = async () => {
      await supabase
        .from('application_messages')
        .update({ is_read: true })
        .eq('application_id', applicationId)
        .neq('user_id', currentUserId) // Hanya tandai pesan milik lawan bicara
        .eq('is_read', false);
    };

    if (messages.length > 0) {
      markAsRead();
    }
  }, [applicationId, messages, currentUserId, supabase]);

  // 3. AUTO SCROLL KE BAWAH SAAT ADA PESAN BARU
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const { error } = await supabase
      .from('application_messages')
      .insert({
        application_id: applicationId,
        user_id: currentUserId,
        message: newMessage,
      });

    if (error) alert("Gagal mengirim pesan");
    setNewMessage("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header Chat */}
      <div className="p-4 border-b bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Diskusi Proyek</span>
      </div>

      {/* Area Pesan */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg: any) => {
          const isMe = msg.user_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
                isMe 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                {msg.message}
                <p className={`text-[9px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Chat */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tulis pesan..."
          className="rounded-xl border-2 focus-visible:ring-primary/20"
        />
        <Button size="icon" className="rounded-xl shrink-0 h-10 w-10" disabled={sending}>
          {sending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
        </Button>
      </form>
    </div>
  );
}