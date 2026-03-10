"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Send, Loader2, Reply, Edit2, Trash2, 
  Copy, MoreVertical, Check,
  Paperclip, X, FileText, Smile, Sparkles,
  Headset, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Pastikan path utility class benar

// Import Server Action AI
import { processAIResponse } from "@/actions/ai/legal-assistant";

const AI_BOT_USER_ID = "00000000-0000-0000-0000-000000000000";

// (Interface ChatProfile & ChatMessage tetap sama seperti aslinya)
export interface ChatProfile { full_name: string; role: string; email?: string; }
export interface ChatMessage {
  id: string; application_id: string; user_id: string; message: string; created_at: string;
  is_read: boolean; is_delivered: boolean; delivered_at?: string; read_at?: string;
  is_edited: boolean; edited_at?: string; reply_to_id?: string; reactions?: Record<string, string[]>;
  is_starred: boolean; attachment_type?: "image" | "document" | "audio" | "video";
  attachment_url?: string; profiles?: ChatProfile; reply_to?: ChatMessage;
}
export interface ChatBoxCoreProps {
  applicationId: string; initialMessages: ChatMessage[]; currentUserId: string;
  notificationSoundUrl: string; className?: string; title?: string; subtitle?: string;
  onTypingChange?: (isTyping: boolean) => void;
}

export function ChatBoxCore({ 
  applicationId, initialMessages, currentUserId, notificationSoundUrl, className, title, subtitle, onTypingChange,
}: ChatBoxCoreProps) {
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const notificationSoundUrlRef = useRef(notificationSoundUrl);
  const markAsDeliveredRef = useRef<(id: string) => Promise<void>>(async () => {});

  useEffect(() => { 
    notificationSoundUrlRef.current = notificationSoundUrl;
    const audio = new Audio(notificationSoundUrl);
    audio.preload = 'auto'; 
    notificationAudioRef.current = audio;
    return () => { audio.pause(); notificationAudioRef.current = null; };
  }, [notificationSoundUrl]);

  const unlockNotificationAudio = React.useCallback(() => {
    if (audioUnlockedRef.current) return;
    const audio = notificationAudioRef.current;
    if (!audio) return;
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => { audio.pause(); audio.currentTime = 0; audioUnlockedRef.current = true; }).catch(() => {});
      }
    } catch {}
  }, []);

  const playNotificationSound = React.useCallback(() => {
    const audio = notificationAudioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0; audio.volume = 1;
      const playPromise = audio.play();
      if (playPromise !== undefined) { playPromise.catch((e) => console.log("Audio prevented:", e)); }
    } catch {}
  }, []);
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<ChatProfile | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<ChatProfile | null>(null);
  const [isHandoverMode, setIsHandoverMode] = useState(false);

  const scrollToBottom = () => { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const checkHandoverStatus = async () => {
      const { data } = await supabase.from('applications').select('ai_paused_until').eq('id', applicationId).single();
      if (data?.ai_paused_until) { setIsHandoverMode(new Date(data.ai_paused_until) > new Date()); }
    };
    checkHandoverStatus();
  }, [applicationId, supabase]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: myProfile } = await supabase.from('profiles').select('full_name, role, email').eq('id', currentUserId).single();
      setCurrentUserProfile(myProfile);
      const otherUserId = messages.find(m => m.user_id !== currentUserId)?.user_id;
      if (otherUserId) {
        const { data: otherProfile } = await supabase.from('profiles').select('full_name, role, email').eq('id', otherUserId).single();
        setOtherUserProfile(otherProfile);
      }
    };
    fetchProfiles();
  }, [currentUserId, messages, supabase]);

  // REALTIME
  useEffect(() => {
    const messageChannel = supabase.channel(`messages-${applicationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` }, async (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { data: profile } = await supabase.from('profiles').select('full_name, role, email').eq('id', newMsg.user_id).single();
          let replyToData = null;
          if (newMsg.reply_to_id) {
            const { data } = await supabase.from('application_messages').select('*, profiles:profiles!application_messages_user_id_fkey(full_name, role)').eq('id', newMsg.reply_to_id).single();
            replyToData = data;
          }
          const enriched: ChatMessage = { ...newMsg, profiles: profile ?? undefined, reply_to: replyToData as ChatMessage | undefined };
          setMessages(prev => { if (prev.some(m => m.id === enriched.id)) return prev; return [...prev, enriched]; });
          if (newMsg.user_id !== currentUserId) { playNotificationSound(); await markAsDeliveredRef.current(newMsg.id); }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` }, (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` }, (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      }).subscribe();

    const typingChannel = supabase.channel(`typing-${applicationId}`, { config: { presence: { key: currentUserId } } });
    typingChannel.on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState();
        const users: { id: string; name: string }[] = [];
        for (const id in state) {
          const presenceEntry = state[id][0] as any;
          if (presenceEntry.isTyping && id !== currentUserId) users.push({ id, name: presenceEntry.name || "Seseorang" });
        }
        setTypingUsers(users); onTypingChange?.(users.length > 0);
      }).subscribe();

    typingChannelRef.current = typingChannel;
    return () => { supabase.removeChannel(messageChannel); supabase.removeChannel(typingChannel); };
  }, [applicationId, currentUserId, supabase, playNotificationSound, onTypingChange]);

  const markAsDelivered = React.useCallback(async (id: string) => { await supabase.from('application_messages').update({ is_delivered: true }).eq('id', id); }, [supabase]);
  useEffect(() => { markAsDeliveredRef.current = markAsDelivered; }, [markAsDelivered]);

  const handleTyping = () => {
    if (!typingChannelRef.current) return;
    typingChannelRef.current.track({ isTyping: true, name: currentUserProfile?.full_name || "User" });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { typingChannelRef.current?.track({ isTyping: false, name: currentUserProfile?.full_name || "User" }); }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); unlockNotificationAudio();
    const text = newMessage.trim();
    if (!text && !selectedFile) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingChannelRef.current?.track({ isTyping: false, name: currentUserProfile?.full_name });

    setSending(true);
    try {
      let attachmentUrl = null; let attachmentType = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${applicationId}/${Date.now()}_${currentUserId}.${fileExt}`;
        await supabase.storage.from('chat-attachments').upload(filePath, selectedFile);
        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = data.publicUrl; attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
      }

      const { error } = await supabase.from('application_messages').insert({
        application_id: applicationId, user_id: currentUserId, message: text || "(File terlampir)",
        reply_to_id: replyingTo?.id || null, attachment_url: attachmentUrl, attachment_type: attachmentType,
      });

      if (error) throw error;
      setNewMessage(""); setReplyingTo(null); setSelectedFile(null);
      if (text && currentUserProfile?.role === 'client') { processAIResponse(applicationId, text).catch(e => console.error("AI Error:", e)); }
    } catch (error: any) { toast.error("Gagal mengirim: " + error.message); } finally { setSending(false); }
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, message: editingText.trim(), is_edited: true } : m));
    const idToEdit = editingMessageId; const textToEdit = editingText.trim();
    setEditingMessageId(null); setEditingText("");
    await supabase.from('application_messages').update({ message: textToEdit, is_edited: true, edited_at: new Date().toISOString() }).eq('id', idToEdit).eq('user_id', currentUserId);
  };

  const handleDeleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    await supabase.from('application_messages').delete().eq('id', msgId).eq('user_id', currentUserId);
  };

  const handleDeleteAllMessages = async () => {
    setMessages([]); setShowDeleteAllDialog(false);
    await supabase.from('application_messages').delete().eq('application_id', applicationId).eq('user_id', currentUserId);
    toast.success("Semua pesan dihapus");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const getDisplayName = () => {
    if (title) return title;
    if (isHandoverMode && currentUserProfile?.role === 'client') return "Tim Support Bandarin";
    return currentUserProfile?.role === 'admin' ? (otherUserProfile?.full_name || "Klien") : "Bandarin AI Assistant";
  };

  return (
    <>
      <Card className={cn("flex flex-col flex-1 min-h-[420px] max-h-[calc(100vh-10rem)] shadow-2xl rounded-3xl overflow-hidden border-0", className)}>
        
        {/* HEADER - Premium Dark Blue */}
        <CardHeader className="p-4 bg-deep-space-blue-950 text-white flex flex-row items-center justify-between border-b border-tuscan-sun-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-tuscan-sun-500 text-deep-space-blue-950 flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(232,169,23,0.3)]">
              {isHandoverMode && currentUserProfile?.role === 'client' ? <Headset className="h-5 w-5" /> : getDisplayName().substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">{getDisplayName()}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {typingUsers.length > 0 ? (
                  <span className="text-tuscan-sun-400 animate-pulse">Mengetik...</span>
                ) : (
                  <span className="text-cool-steel-400">
                    {isHandoverMode && currentUserProfile?.role === 'client' ? "Live Agent" : "Online"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-cool-steel-300 hover:text-white hover:bg-white/10"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => setShowDeleteAllDialog(true)} className="text-red-600 font-bold"><Trash2 className="h-4 w-4 mr-2" /> Bersihkan Chat</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* PRIVACY BANNER */}
        <div className="bg-deep-space-blue-900 px-4 py-2 border-b border-deep-space-blue-800 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-tuscan-sun-500" />
          <p className="text-[10px] font-medium text-cool-steel-300 tracking-wide">
            Enkripsi End-to-End. Pesan Anda aman dan rahasia.
          </p>
        </div>

        {/* MESSAGES AREA */}
        <CardContent className="flex-1 overflow-y-auto p-5 space-y-5 bg-bright-snow-50 dark:bg-deep-space-blue-950" ref={scrollRef} onClick={unlockNotificationAudio}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-cool-steel-300">
              <Smile className="h-12 w-12 mb-3 opacity-30 text-tuscan-sun-500" />
              <p className="text-sm font-bold tracking-tight text-cool-steel-400">Pesan aman Anda dimulai di sini.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            const isBot = msg.user_id === AI_BOT_USER_ID;
            const canEdit = isMe && (new Date().getTime() - new Date(msg.created_at).getTime()) < 15 * 60 * 1000;

            return (
              <div key={msg.id} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] flex flex-col", isMe ? "items-end" : "items-start")}>
                  
                  {msg.reply_to && (
                    <div className="mb-1 p-2 rounded-xl bg-cool-steel-100 dark:bg-deep-space-blue-800 border-l-4 border-tuscan-sun-500 text-xs opacity-80">
                      <p className="font-bold text-deep-space-blue-900 dark:text-tuscan-sun-400">{msg.reply_to.profiles?.full_name || 'User'}</p>
                      <p className="truncate text-cool-steel-600 dark:text-cool-steel-300">{msg.reply_to.message}</p>
                    </div>
                  )}

                  {/* CHAT BUBBLES */}
                  <div className={cn("relative p-4 rounded-3xl shadow-sm text-[13px] leading-relaxed", 
                    isMe ? "bg-deep-space-blue-900 text-white rounded-tr-sm" : 
                    isBot ? "bg-vanilla-cream-50 border border-vanilla-cream-200 text-deep-space-blue-950 dark:bg-deep-space-blue-800 dark:border-deep-space-blue-700 dark:text-white rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)]" : 
                    "bg-white border border-cool-steel-100 text-deep-space-blue-950 dark:bg-deep-space-blue-900 dark:border-deep-space-blue-800 dark:text-white rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)]")}>
                    
                    {isBot && (
                      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-vanilla-cream-200 dark:border-deep-space-blue-700">
                        <Sparkles className="h-3.5 w-3.5 text-tuscan-sun-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-tuscan-sun-600 dark:text-tuscan-sun-400">Bandarin AI</span>
                      </div>
                    )}

                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEditMessage()} className="h-9 text-sm bg-black/5 text-white border-white/20" autoFocus />
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-6 w-6 text-white hover:bg-white/20"><X className="h-3 w-3"/></Button>
                          <Button size="icon" variant="ghost" onClick={handleEditMessage} className="h-6 w-6 text-white hover:bg-white/20"><Check className="h-3 w-3"/></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.attachment_url && (
                          <div className="mb-3">
                            {msg.attachment_type === 'image' ? <img src={msg.attachment_url} className="rounded-xl max-h-48 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.attachment_url)} /> : <a href={msg.attachment_url} target="_blank" className="text-xs font-bold underline flex gap-1.5 items-center bg-black/5 p-2 rounded-lg"><FileText className="h-4 w-4 text-tuscan-sun-500"/> Unduh Dokumen</a>}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap font-medium">{msg.message}</div>
                      </>
                    )}
                    
                    <div className={cn("text-[9px] mt-2 font-bold tracking-wider uppercase", isMe ? "text-cool-steel-300 text-right" : "text-cool-steel-400 text-right")}>
                      {msg.is_edited && "Edited • "}{format(new Date(msg.created_at), "HH:mm")}
                    </div>
                  </div>

                  {!editingMessageId && (
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-cool-steel-200" onClick={() => setReplyingTo(msg)}><Reply className="h-3 w-3 text-cool-steel-500"/></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-cool-steel-200"><MoreVertical className="h-3 w-3 text-cool-steel-500"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {canEdit && <DropdownMenuItem onClick={() => {setEditingMessageId(msg.id); setEditingText(msg.message);}} className="font-bold"><Edit2 className="h-4 w-4 mr-2"/>Edit</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => {navigator.clipboard.writeText(msg.message); toast.success("Disalin");}} className="font-bold"><Copy className="h-4 w-4 mr-2"/>Salin</DropdownMenuItem>
                          {isMe && <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-red-600 font-bold"><Trash2 className="h-4 w-4 mr-2"/>Hapus</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* INPUT FOOTER */}
        <div className="border-t border-cool-steel-200 bg-white dark:bg-deep-space-blue-950 p-3">
          {replyingTo && (
            <div className="px-4 py-2 bg-vanilla-cream-50 dark:bg-deep-space-blue-900 rounded-xl mb-3 flex items-center justify-between text-xs border border-vanilla-cream-200 dark:border-deep-space-blue-800">
              <div className="flex items-center gap-2 truncate">
                <Reply className="h-3.5 w-3.5 text-tuscan-sun-500"/>
                <span className="font-black text-deep-space-blue-950 dark:text-tuscan-sun-400">Membalas {replyingTo.profiles?.full_name}:</span>
                <span className="truncate max-w-[200px] font-medium text-cool-steel-500">{replyingTo.message}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setReplyingTo(null)} className="h-5 w-5 hover:bg-black/5"><X className="h-3 w-3"/></Button>
            </div>
          )}
          
          {selectedFile && (
            <div className="px-4 py-2 bg-cool-steel-50 dark:bg-deep-space-blue-900 rounded-xl mb-3 flex items-center justify-between text-xs border border-cool-steel-200 dark:border-deep-space-blue-800">
              <div className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5 text-deep-space-blue-500"/> <span className="font-bold">{selectedFile.name}</span></div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedFile(null)} className="h-5 w-5 hover:bg-black/5"><X className="h-3 w-3"/></Button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-end gap-3 bg-cool-steel-50 dark:bg-deep-space-blue-900 p-1.5 rounded-3xl border border-cool-steel-200 dark:border-deep-space-blue-800 transition-all focus-within:border-tuscan-sun-400 focus-within:ring-2 focus-within:ring-tuscan-sun-400/20">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 h-10 w-10 text-cool-steel-500 hover:text-deep-space-blue-900 rounded-full hover:bg-cool-steel-200 dark:hover:bg-deep-space-blue-800">
              <Paperclip className="h-5 w-5"/>
            </Button>
            <Textarea 
              value={newMessage} 
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
              placeholder={isHandoverMode && currentUserProfile?.role === 'client' ? "Tanya ke Tim Support..." : "Ketik pesan Anda..."} 
              className="min-h-[40px] max-h-[120px] bg-transparent border-0 focus-visible:ring-0 resize-none px-2 py-3 text-[13px] font-medium placeholder:text-cool-steel-400 shadow-none" 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)} 
            />
            <Button type="submit" disabled={sending || (!newMessage.trim() && !selectedFile)} className="rounded-full h-10 w-10 shrink-0 bg-tuscan-sun-500 hover:bg-tuscan-sun-400 text-deep-space-blue-950 shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </Button>
          </form>
        </div>
      </Card>

      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="font-black text-deep-space-blue-950">Hapus Semua Pesan?</DialogTitle></DialogHeader>
          <p className="text-sm font-medium text-cool-steel-500">Tindakan ini tidak dapat dibatalkan. Riwayat percakapan akan dihapus dari sisi Anda.</p>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowDeleteAllDialog(false)}>Batal</Button>
            <Button variant="destructive" className="rounded-xl font-bold bg-red-600 hover:bg-red-700" onClick={handleDeleteAllMessages}>Ya, Hapus Semua</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}