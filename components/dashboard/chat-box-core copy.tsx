"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Send, Loader2, Reply, Edit2, Trash2, 
  Copy, MoreVertical, Check,
  Paperclip, X, ImageIcon, FileText, Smile, Sparkles,
  Headset, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/applicationSchema/utils";

// Import Server Action AI
import { processAIResponse } from "@/actions/ai/legal-assistant";

// Konstanta ID Bot
const AI_BOT_USER_ID = "00000000-0000-0000-0000-000000000000";

// ==================== TYPES ====================
export interface ChatProfile {
  full_name: string;
  role: string;
  email?: string;
}

export interface ChatMessage {
  id: string;
  application_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_delivered: boolean;
  delivered_at?: string;
  read_at?: string;
  is_edited: boolean;
  edited_at?: string;
  reply_to_id?: string;
  reactions?: Record<string, string[]>;
  is_starred: boolean;
  attachment_type?: "image" | "document" | "audio" | "video";
  attachment_url?: string;
  profiles?: ChatProfile;
  reply_to?: ChatMessage;
}

export interface ChatBoxCoreProps {
  applicationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  notificationSoundUrl: string;
  className?: string;
  title?: string;
  subtitle?: string;
  onTypingChange?: (isTyping: boolean) => void;
}

// ==================== CORE COMPONENT ====================
export function ChatBoxCore({ 
  applicationId, 
  initialMessages, 
  currentUserId,
  notificationSoundUrl,
  className,
  title,
  subtitle,
  onTypingChange,
}: ChatBoxCoreProps) {
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio Refs
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const notificationSoundUrlRef = useRef(notificationSoundUrl);
  const markAsDeliveredRef = useRef<(id: string) => Promise<void>>(async () => {});

  // 1. Preload Audio saat component mount / URL berubah
  useEffect(() => { 
    notificationSoundUrlRef.current = notificationSoundUrl;
    const audio = new Audio(notificationSoundUrl);
    audio.preload = 'auto'; // Paksa browser download metadata & data
    notificationAudioRef.current = audio;

    return () => {
      audio.pause();
      notificationAudioRef.current = null;
    };
  }, [notificationSoundUrl]);

  // 2. Unlock Audio (User Interaction) - Agar bisa autoplay
  const unlockNotificationAudio = React.useCallback(() => {
    if (audioUnlockedRef.current) return;

    const audio = notificationAudioRef.current;
    if (!audio) return;

    try {
      // Pancing browser bahwa user sudah berinteraksi
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audioUnlockedRef.current = true;
          })
          .catch(() => {
            // Ignore error jika belum boleh play
          });
      }
    } catch {}
  }, []);

  // 3. Play Sound (Instant)
  const playNotificationSound = React.useCallback(() => {
    const audio = notificationAudioRef.current;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.volume = 1;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
           console.log("Audio playback prevented:", error);
        });
      }
    } catch {}
  }, []);
  
  // ===== STATE =====
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

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Check Handover Status (Pause AI)
  useEffect(() => {
    const checkHandoverStatus = async () => {
      const { data } = await supabase.from('applications').select('ai_paused_until').eq('id', applicationId).single();
      if (data?.ai_paused_until) {
        setIsHandoverMode(new Date(data.ai_paused_until) > new Date());
      }
    };
    checkHandoverStatus();
  }, [applicationId, supabase]);

  // Fetch Profiles
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

  // ===== REALTIME & PRESENCE =====
  useEffect(() => {
    // 1. Message Channel
    const messageChannel = supabase.channel(`messages-${applicationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` }, async (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { data: profile } = await supabase.from('profiles').select('full_name, role, email').eq('id', newMsg.user_id).single();
          
          let replyToData = null;
          if (newMsg.reply_to_id) {
            const { data } = await supabase.from('application_messages').select('*, profiles:profiles!application_messages_user_id_fkey(full_name, role)').eq('id', newMsg.reply_to_id).single();
            replyToData = data;
          }

          const enriched: ChatMessage = {
            ...newMsg,
            profiles: profile ?? undefined,
            reply_to: replyToData as ChatMessage | undefined,
          };

          setMessages(prev => {
            if (prev.some(m => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
          
          if (newMsg.user_id !== currentUserId) {
            playNotificationSound();
            await markAsDeliveredRef.current(newMsg.id);
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` }, (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` }, (payload) => {
          const deleted = payload.old as ChatMessage;
          setMessages(prev => prev.filter(m => m.id !== deleted.id));
      })
      .subscribe();

    // 2. Typing Indicator (Presence)
    const typingChannel = supabase.channel(`typing-${applicationId}`, {
      config: { presence: { key: currentUserId } }
    });

    typingChannel
      .on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState();
        const users: { id: string; name: string }[] = [];
        
        for (const id in state) {
          const presenceEntry = state[id][0] as any;
          if (presenceEntry.isTyping && id !== currentUserId) {
            users.push({ id, name: presenceEntry.name || "Seseorang" });
          }
        }
        setTypingUsers(users);
        onTypingChange?.(users.length > 0);
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => { 
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [applicationId, currentUserId, supabase, playNotificationSound, onTypingChange]);

  // Mark Delivered Helper
  const markAsDelivered = React.useCallback(async (id: string) => {
    await supabase.from('application_messages').update({ is_delivered: true }).eq('id', id);
  }, [supabase]);
  useEffect(() => { markAsDeliveredRef.current = markAsDelivered; }, [markAsDelivered]);

  // Typing Logic
  const handleTyping = () => {
    if (!typingChannelRef.current) return;

    typingChannelRef.current.track({ 
      isTyping: true, 
      name: currentUserProfile?.full_name || "User" 
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.track({ 
        isTyping: false, 
        name: currentUserProfile?.full_name || "User" 
      });
    }, 3000);
  };

  // ===== ACTIONS =====

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockNotificationAudio();
    const text = newMessage.trim();
    if (!text && !selectedFile) return;

    // Hentikan typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingChannelRef.current?.track({ isTyping: false, name: currentUserProfile?.full_name });

    setSending(true);
    try {
      let attachmentUrl = null;
      let attachmentType = null;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${currentUserId}.${fileExt}`;
        const filePath = `${applicationId}/${fileName}`;
        await supabase.storage.from('chat-attachments').upload(filePath, selectedFile);
        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = data.publicUrl;
        attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
      }

      const { error } = await supabase.from('application_messages').insert({
        application_id: applicationId,
        user_id: currentUserId,
        message: text || "(File terlampir)",
        reply_to_id: replyingTo?.id || null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
      setSelectedFile(null);
      toast.success("Pesan terkirim");

      if (text && currentUserProfile?.role === 'client') {
        processAIResponse(applicationId, text).catch(e => console.error("AI Error:", e));
      }
    } catch (error: any) {
      toast.error("Gagal mengirim: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, message: editingText.trim(), is_edited: true } : m));
    const idToEdit = editingMessageId;
    const textToEdit = editingText.trim();
    setEditingMessageId(null);
    setEditingText("");
    const { error } = await supabase.from('application_messages')
      .update({ message: textToEdit, is_edited: true, edited_at: new Date().toISOString() })
      .eq('id', idToEdit).eq('user_id', currentUserId);
    if (error) toast.error("Gagal update di server");
  };

  const handleDeleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    const { error } = await supabase.from('application_messages').delete().eq('id', msgId).eq('user_id', currentUserId);
    if (error) toast.error("Gagal hapus di server");
  };

  const handleDeleteAllMessages = async () => {
    setMessages([]);
    setShowDeleteAllDialog(false);
    await supabase.from('application_messages').delete().eq('application_id', applicationId).eq('user_id', currentUserId);
    toast.success("Semua pesan dihapus");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const getDisplayName = () => {
    if (title) return title;
    if (isHandoverMode && currentUserProfile?.role === 'client') return "Arin | Admin - Support";
    return currentUserProfile?.role === 'admin' ? (otherUserProfile?.full_name || "Klien") : "Bandarin AI Assistant";
  };

  // ===== RENDER =====
  return (
    <>
      <Card className={cn("flex flex-col flex-1 min-h-[420px] max-h-[calc(100vh-10rem)] shadow-xl rounded-3xl overflow-hidden border-slate-200 dark:border-slate-800", className)}>
        
        {/* HEADER */}
        <CardHeader className={cn("p-4 border-b flex flex-row items-center justify-between", isHandoverMode && currentUserProfile?.role === 'client' ? "bg-orange-50 dark:bg-orange-950/20" : "bg-slate-50 dark:bg-slate-900")}>
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm", isHandoverMode && currentUserProfile?.role === 'client' ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary")}>
              {isHandoverMode && currentUserProfile?.role === 'client' ? <Headset className="h-5 w-5" /> : getDisplayName().substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold">{getDisplayName()}</h3>
              
              {/* STATUS LOGIC: REPLACING 'ONLINE' WITH 'TYPING' */}
              <p className="text-xs">
                {typingUsers.length > 0 ? (
                  <span className="text-primary font-medium animate-pulse">
                    Sedang mengetik...
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {isHandoverMode && currentUserProfile?.role === 'client' ? "Human Support Aktif" : "Online"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => setShowDeleteAllDialog(true)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Hapus Semua</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* PRIVACY BANNER */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 px-4 py-2 border-b border-indigo-100/50 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
            Privasi Terjamin: Pesan akan dihapus otomatis setelah 7 hari.
          </p>
        </div>

        {/* MESSAGES */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/30" ref={scrollRef} onClick={unlockNotificationAudio}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400"><Smile className="h-12 w-12 mb-3 opacity-20" /><p className="text-sm">Belum ada pesan</p></div>
          )}

          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            const isBot = msg.user_id === AI_BOT_USER_ID;
            const canEdit = isMe && (new Date().getTime() - new Date(msg.created_at).getTime()) < 15 * 60 * 1000;

            return (
              <div key={msg.id} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] flex flex-col", isMe ? "items-end" : "items-start")}>
                  
                  {msg.reply_to && (
                    <div className="mb-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-l-4 border-slate-400 text-xs opacity-80">
                      <p className="font-bold">{msg.reply_to.profiles?.full_name || 'User'}</p>
                      <p className="truncate">{msg.reply_to.message}</p>
                    </div>
                  )}

                  <div className={cn("relative p-3 rounded-2xl shadow-sm", 
                    isMe ? "bg-primary text-white rounded-tr-none" : 
                    isBot ? "bg-indigo-50 border border-indigo-100 text-slate-800 dark:bg-indigo-900/40 dark:text-white rounded-tl-none" : 
                    "bg-white border border-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white rounded-tl-none")}>
                    
                    {isBot && (
                      <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-indigo-200/50">
                        <Sparkles className="h-3 w-3 text-indigo-600" />
                        <span className="text-[10px] font-bold uppercase text-indigo-700">Andar AI</span>
                      </div>
                    )}

                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEditMessage()} className="h-8 text-sm bg-black/10" autoFocus />
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-6 w-6"><X className="h-3 w-3"/></Button>
                          <Button size="icon" variant="ghost" onClick={handleEditMessage} className="h-6 w-6"><Check className="h-3 w-3"/></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.attachment_url && (
                          <div className="mb-2">
                            {msg.attachment_type === 'image' ? <img src={msg.attachment_url} className="rounded-lg max-h-40 cursor-pointer" onClick={() => window.open(msg.attachment_url)} /> : <a href={msg.attachment_url} target="_blank" className="text-xs underline flex gap-1"><FileText className="h-3 w-3"/> Dokumen</a>}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </>
                    )}
                    
                    <div className="text-[9px] mt-1 text-right opacity-60">
                      {msg.is_edited && "edited • "}{format(new Date(msg.created_at), "HH:mm")}
                    </div>
                  </div>

                  {!editingMessageId && (
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(msg)}><Reply className="h-3 w-3"/></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {canEdit && <DropdownMenuItem onClick={() => {setEditingMessageId(msg.id); setEditingText(msg.message);}}><Edit2 className="h-4 w-4 mr-2"/>Edit</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => {navigator.clipboard.writeText(msg.message); toast.success("Disalin");}}><Copy className="h-4 w-4 mr-2"/>Salin</DropdownMenuItem>
                          {isMe && <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2"/>Hapus</DropdownMenuItem>}
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

        {/* FOOTER */}
        <div className="border-t bg-white dark:bg-slate-900">
          {replyingTo && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between text-xs border-b border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 truncate">
                <Reply className="h-3 w-3 text-blue-600"/>
                <span className="font-bold">Membalas {replyingTo.profiles?.full_name}:</span>
                <span className="truncate max-w-[200px]">{replyingTo.message}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setReplyingTo(null)} className="h-5 w-5"><X className="h-3 w-3"/></Button>
            </div>
          )}
          
          {selectedFile && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 flex items-center justify-between text-xs border-b border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2"><Paperclip className="h-3 w-3 text-green-600"/><span>{selectedFile.name}</span></div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedFile(null)} className="h-5 w-5"><X className="h-3 w-3"/></Button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="p-4 flex items-end gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 h-10 w-10"><Paperclip className="h-5 w-5"/></Button>
            <Textarea 
              value={newMessage} 
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }} 
              placeholder={isHandoverMode && currentUserProfile?.role === 'client' ? "Ketik pesan untuk Admin Arin..." : "Ketik pesan..."} 
              className="min-h-[40px] max-h-[120px] rounded-2xl resize-none" 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)} 
            />
            <Button type="submit" disabled={sending || (!newMessage.trim() && !selectedFile)} className="rounded-full h-10 w-10 shrink-0">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </Card>

      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent><DialogTitle>Hapus Semua?</DialogTitle><DialogFooter><Button onClick={() => setShowDeleteAllDialog(false)}>Batal</Button><Button variant="destructive" onClick={handleDeleteAllMessages}>Hapus</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}