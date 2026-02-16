//before
// components/dashboard/chat-box-core.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Send, Loader2, Reply, Edit2, Trash2, 
  Star, Copy, MoreVertical, Check, CheckCheck,
  Clock, Paperclip, X, ImageIcon, FileText, Smile
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
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/applicationSchema/utils";

// ==================== TYPES (exported for wrappers) ====================
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
}

// ==================== EMOJI REACTIONS ====================
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ==================== CORE COMPONENT ====================
export function ChatBoxCore({
  applicationId,
  initialMessages,
  currentUserId,
  notificationSoundUrl,
  className,
  title,
  subtitle,
}: ChatBoxCoreProps) {
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<any>(null);
  const onlineChannelRef = useRef<any>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const notificationSoundUrlRef = useRef(notificationSoundUrl);
  const markAsDeliveredRef = useRef<(id: string) => Promise<void>>(async () => {});

  useEffect(() => {
    notificationSoundUrlRef.current = notificationSoundUrl;
  }, [notificationSoundUrl]);

  const unlockNotificationAudio = React.useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    const url = notificationSoundUrlRef.current;
    try {
      const audio = new Audio(url);
      notificationAudioRef.current = audio;
      audio.volume = 0;
      audio.play().then(() => audio.pause()).catch(() => {});
      audio.volume = 1;
    } catch {
      // ignore
    }
  }, []);

  const playNotificationSound = React.useCallback(() => {
    const url = notificationSoundUrlRef.current;
    try {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.volume = 1;
        notificationAudioRef.current.currentTime = 0;
        notificationAudioRef.current.play().catch(() => {});
        return;
      }
      const audio = new Audio(url);
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // ===== STATE MANAGEMENT =====
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const normalized = initialMessages.map((m: any) => ({
      ...m,
      id: m.id,
      user_id: m.user_id ?? m.sender_id,
    })) as ChatMessage[];
    return normalized.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [channelsReady, setChannelsReady] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<ChatProfile | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<ChatProfile | null>(null);

  // ===== SYNC MESSAGES ON MOUNT (merge with current so realtime messages are never lost) =====
  useEffect(() => {
    if (!applicationId || !currentUserId) return;
    let cancelled = false;
    const sync = async () => {
      const { data: rows } = await supabase
        .from('application_messages')
        .select('*, profiles:profiles!application_messages_user_id_fkey(full_name, role, email)')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      const list = rows ?? [];
      const normalized = list.map((r: any) => ({
        ...r,
        user_id: r.user_id ?? r.sender_id,
        profiles: r.profiles ?? undefined,
        reply_to: undefined,
      })) as ChatMessage[];
      normalized.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(prev => {
        const byId = new Map(normalized.map(m => [m.id, m]));
        prev.forEach(m => { if (!byId.has(m.id)) byId.set(m.id, m); });
        return [...byId.values()].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
    };
    sync();
    return () => { cancelled = true; };
  }, [applicationId, currentUserId, supabase]);

  // ===== POLLING FALLBACK (pesan tampil tanpa refresh jika realtime tertunda) =====
  useEffect(() => {
    if (!applicationId || !currentUserId) return;
    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const { data: rows } = await supabase
          .from("application_messages")
          .select("id, application_id, user_id, message, created_at, is_read, is_delivered, attachment_url, attachment_type, reply_to_id, is_edited, is_starred")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: true });
        if (!rows?.length) return;
        const normalized = rows.map((r: any) => ({ ...r, user_id: r.user_id ?? r.sender_id })) as ChatMessage[];
        setMessages(prev => {
          const prevIds = new Set(prev.map(m => m.id));
          const toAdd = normalized.filter(r => !prevIds.has(r.id));
          if (toAdd.length === 0) return prev;
          const next = [...prev, ...toAdd];
          next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return next;
        });
      } catch {
        // ignore
      }
    };
    const interval = setInterval(poll, 4000);
    poll();
    return () => clearInterval(interval);
  }, [applicationId, currentUserId, supabase]);

  // ===== FETCH USER PROFILES =====
  useEffect(() => {
    const fetchProfiles = async () => {
      // Fetch current user profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', currentUserId)
        .single();

      setCurrentUserProfile(myProfile);

      // Fetch other user profile (for display)
      // Mencari ID user lain dari pesan yang ada
      const otherUserId = messages.find(m => m.user_id !== currentUserId)?.user_id;
      if (otherUserId) {
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('full_name, role, email')
          .eq('id', otherUserId)
          .single();
        setOtherUserProfile(otherProfile);
      }
    };

    fetchProfiles();
  }, [currentUserId, messages, supabase]);

  // ===== REALTIME SUBSCRIPTIONS =====
  useEffect(() => {
    scrollToBottom();

    // 1. Message Updates (INSERT, UPDATE, DELETE)
    const messageChannel = supabase
      .channel(`messages-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${applicationId}`,
        },
        async (payload) => {
          try {
            const raw = payload.new as Record<string, unknown>;
            const senderId = (raw?.user_id ?? raw?.sender_id) as string | undefined;
            const msgId = raw?.id != null ? String(raw.id) : null;
            if (!senderId || !msgId) return;
            const newMsg = { ...raw, id: msgId, user_id: senderId } as ChatMessage;

            let profile: ChatProfile | null = null;
            try {
              const { data } = await supabase
                .from('profiles')
                .select('full_name, role, email')
                .eq('id', newMsg.user_id)
                .single();
              profile = data ?? null;
            } catch {
              // use message without profile
            }

            let replyToMsg: ChatMessage | null = null;
            if (newMsg.reply_to_id) {
              try {
                const { data: replyData } = await supabase
                  .from('application_messages')
                  .select('*, profiles:profiles!application_messages_user_id_fkey(full_name, role)')
                  .eq('id', newMsg.reply_to_id)
                  .single();
                if (replyData) replyToMsg = { ...replyData, profiles: (replyData as any).profiles ?? undefined } as ChatMessage;
              } catch {
                // skip reply_to
              }
            }

            const enrichedMsg: ChatMessage = {
              ...newMsg,
              profiles: profile ?? undefined,
              reply_to: replyToMsg ?? undefined,
            };

            setMessages(prev => {
              if (prev.some(m => m.id === enrichedMsg.id)) return prev;
              const next = [...prev, enrichedMsg];
              next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              return next;
            });

            setTimeout(() => scrollToBottom(), 150);

            if (newMsg.user_id !== currentUserId) {
              try {
                playNotificationSound();
              } catch {
                // ignore
              }
              void markAsDeliveredRef.current(newMsg.id);
            }
          } catch (err) {
            console.error('[ChatBoxCore] Realtime INSERT error:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          try {
            const raw = payload.new as Record<string, unknown>;
            const updated = raw ? { ...raw, user_id: (raw.user_id ?? raw.sender_id) as string | undefined } as Partial<ChatMessage> : null;
            if (updated?.id) {
              setMessages(prev =>
                prev.map(m => (m.id === updated.id ? { ...m, ...updated } : m))
              );
            }
          } catch (err) {
            console.error('[ChatBoxCore] Realtime UPDATE error:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          const deleted = payload.old as { id?: string };
          if (deleted?.id) setMessages(prev => prev.filter(m => m.id !== deleted.id));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[ChatBoxCore] Realtime channel error for application', applicationId);
        }
      });

    // 2. Typing Indicator (Presence)
    const typingChannel = supabase
      .channel(`typing-${applicationId}`, {
        config: { 
          presence: { 
            key: currentUserId 
          } 
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState() as Record<string, Array<{ typing?: boolean; name?: string; display_name?: string }>>;
        const typing = Object.keys(state)
          .filter(id => id !== currentUserId && state[id]?.[0]?.typing)
          .map(id => state[id]?.[0]?.display_name || state[id]?.[0]?.name || 'Someone');
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          typingChannelRef.current = typingChannel;
          await typingChannel.track({ 
            typing: false, 
            name: currentUserId 
          });
        }
      });

    // 3. Online Status
    const onlineChannel = supabase
      .channel(`online-${applicationId}`, {
        config: { 
          presence: { 
            key: currentUserId 
          } 
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = onlineChannel.presenceState();
        const online = Object.keys(state);
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          onlineChannelRef.current = onlineChannel;
          await onlineChannel.track({ 
            online_at: new Date().toISOString() 
          });
          setChannelsReady(true);
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
      if (onlineChannelRef.current) {
        supabase.removeChannel(onlineChannelRef.current);
      }
    };
  }, [applicationId, currentUserId, supabase]);

  // ===== AUTO-MARK READ =====
  useEffect(() => {
    const markUnreadAsRead = async () => {
      const unreadIds = messages
        .filter(m => m.user_id !== currentUserId && !m.is_read)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('application_messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', unreadIds);
      }
    };

    markUnreadAsRead();
  }, [messages, currentUserId, supabase]);

  // ===== HELPER FUNCTIONS =====
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const markAsDelivered = React.useCallback(async (messageId: string) => {
    await supabase
      .from('application_messages')
      .update({ 
        is_delivered: true, 
        delivered_at: new Date().toISOString() 
      })
      .eq('id', messageId);
  }, [supabase]);

  useEffect(() => {
    markAsDeliveredRef.current = markAsDelivered;
  }, [markAsDelivered]);

  const sendTypingIndicator = async (isTyping: boolean) => {
    if (!typingChannelRef.current || !channelsReady) return;
    
    try {
      await typingChannelRef.current.track({ 
        typing: isTyping, 
        name: currentUserId 
      });
    } catch (error) {
      console.error("Typing indicator error:", error);
    }
  };

  // ===== MESSAGE ACTIONS =====
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockNotificationAudio();
    const text = newMessage.trim();
    if (!text && !selectedFile) return;

    setSending(true);

    try {
      let attachmentUrl = null;
      let attachmentType = null;

      // Handle file upload
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${currentUserId}.${fileExt}`;
        const filePath = `${applicationId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments') // Pastikan bucket ini ada di Supabase
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Fallback jika bucket belum ada, tetap kirim pesan teks
          if (!uploadError.message.includes('Bucket not found')) {
             throw new Error("Gagal upload file: " + uploadError.message);
          }
        } else {
            const { data: { publicUrl } } = supabase.storage
              .from('chat-attachments')
              .getPublicUrl(filePath);

            attachmentUrl = publicUrl;
            
            if (selectedFile.type.startsWith('image/')) {
              attachmentType = 'image';
            } else if (selectedFile.type.startsWith('video/')) {
              attachmentType = 'video';
            } else if (selectedFile.type.startsWith('audio/')) {
              attachmentType = 'audio';
            } else {
              attachmentType = 'document';
            }
        }
      }

      const { error } = await supabase
        .from('application_messages')
        .insert({
          application_id: applicationId,
          user_id: currentUserId,
          message: text || "(File terlampir)",
          reply_to_id: replyingTo?.id || null,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          is_delivered: false,
          is_read: false,
        });

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
      setSelectedFile(null);
      await sendTypingIndicator(false);
      
      toast.success("Pesan terkirim");
    } catch (error: any) {
      console.error("Send Error:", error);
      toast.error("Gagal mengirim pesan: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return;

    const { error } = await supabase
      .from('application_messages')
      .update({ 
        message: editingText.trim(), 
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', editingMessageId)
      .eq('user_id', currentUserId); // Security: only owner can edit

    if (error) {
      console.error("Edit error:", error);
      toast.error("Gagal edit pesan");
    } else {
      setEditingMessageId(null);
      setEditingText("");
      toast.success("Pesan diperbarui");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('application_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', currentUserId); // Security: only owner can delete

    if (error) {
      console.error("Delete error:", error);
      toast.error("Gagal hapus pesan");
    } else {
      toast.success("Pesan dihapus");
    }
  };

  const handleDeleteAllMessages = async () => {
    const { error } = await supabase
      .from('application_messages')
      .delete()
      .eq('application_id', applicationId)
      .eq('user_id', currentUserId); // Only delete own messages

    if (error) {
      console.error("Delete all error:", error);
      toast.error("Gagal hapus semua pesan");
    } else {
      setShowDeleteAllDialog(false);
      toast.success("Semua pesan Anda dihapus");
    }
  };

  const handleStarMessage = async (messageId: string, currentStarred: boolean) => {
    const { error } = await supabase
      .from('application_messages')
      .update({ is_starred: !currentStarred })
      .eq('id', messageId)
      .eq('user_id', currentUserId); // Security: only owner can star

    if (error) {
      console.error("Star error:", error);
      toast.error("Gagal membintangi pesan");
    } else {
      toast.success(currentStarred ? "Bintang dihapus" : "Pesan dibintangi");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const reactions = message.reactions || {};
    const userList = reactions[emoji] || [];
    
    // Toggle reaction
    const newUserList = userList.includes(currentUserId)
      ? userList.filter(id => id !== currentUserId)
      : [...userList, currentUserId];

    const newReactions = { ...reactions };
    
    if (newUserList.length === 0) {
      delete newReactions[emoji];
    } else {
      newReactions[emoji] = newUserList;
    }

    const { error } = await supabase
      .from('application_messages')
      .update({ reactions: newReactions })
      .eq('id', messageId);

    if (error) {
      console.error("Reaction error:", error);
      toast.error("Gagal memberi reaksi");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File maksimal 10MB");
        return;
      }
      setSelectedFile(file);
      toast.success("File siap dikirim");
    }
  };

  // ===== MESSAGE STATUS ICON =====
  const getStatusIcon = (msg: ChatMessage) => {
    const isMe = msg.user_id === currentUserId;
    if (!isMe) return null;

    if (!msg.is_delivered) {
      return <Clock className="h-3 w-3 text-slate-400" />;
    } else if (msg.is_delivered && !msg.is_read) {
      return <CheckCheck className="h-3 w-3 text-slate-400" />;
    } else if (msg.is_read) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return <Check className="h-3 w-3 text-slate-400" />;
  };

  // ===== DISPLAY NAME =====
  const getDisplayName = () => {
    // Show other user's name (Client for Admin, Admin for Client)
    if (currentUserProfile?.role === 'admin') {
      return otherUserProfile?.full_name || "Klien";
    } else {
      return otherUserProfile?.full_name || "Admin Support";
    }
  };

  // ===== RENDER =====
  const displayTitle = title ?? getDisplayName();
  const displaySubtitle = subtitle ?? (typingUsers.length > 0 ? "mengetik..." : (onlineUsers.length > 1 ? "● Online" : "○ Offline"));

  return (
    <>
      <div className={cn("flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative", className)}>
        
        {/* ===== HEADER ===== */}
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 text-sm shadow-inner">
                {displayTitle.substring(0, 2).toUpperCase()}
              </div>
              {onlineUsers.length > 1 && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-slate-900 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{displayTitle}</h3>
              {subtitle !== undefined ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{displaySubtitle}</p>
              ) : typingUsers.length > 0 ? (
                <p className="text-xs text-blue-600 font-bold animate-pulse flex items-center gap-1">
                  <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-75"/>
                  <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-100"/>
                  <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-150"/>
                  mengetik...
                </p>
              ) : (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {onlineUsers.length > 1 ? "● Online" : "○ Offline"}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50 h-10 w-10">
                <MoreVertical className="h-5 w-5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
              <DropdownMenuItem onClick={() => {
                const starred = messages.filter(m => m.is_starred && m.user_id === currentUserId);
                toast.info(`${starred.length} pesan berbintang`);
              }} className="rounded-xl cursor-pointer font-medium">
                <Star className="h-4 w-4 mr-2" />
                Pesan Berbintang
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteAllDialog(true)}
                className="text-red-600 focus:text-red-600 rounded-xl cursor-pointer font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua Pesan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ===== MESSAGES AREA ===== */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/30 scroll-smooth"
          onClick={unlockNotificationAudio}
          role="presentation"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                 <Smile className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">Belum ada pesan</p>
              <p className="text-xs font-medium">Mulai percakapan dengan menyapa!</p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isMe = msg.user_id === currentUserId;
            const canEdit = isMe && 
              (new Date().getTime() - new Date(msg.created_at).getTime()) < 15 * 60 * 1000;
            const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Reply Preview */}
                  {msg.reply_to && (
                    <div className={`mb-1 p-3 rounded-2xl text-xs flex items-center gap-2 max-w-full ${
                      isMe 
                        ? 'bg-blue-50 border border-blue-100 text-blue-900' 
                        : 'bg-white border border-slate-100 text-slate-600'
                    }`}>
                      <div className="w-1 h-full bg-blue-400 rounded-full absolute left-0 top-0 bottom-0" />
                      <Reply className="h-3 w-3 shrink-0 opacity-50" />
                      <div>
                        <p className="font-bold opacity-70 mb-0.5">
                          {msg.reply_to.profiles?.full_name || 'Pengguna'}
                        </p>
                        <p className="truncate opacity-50">{msg.reply_to.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`relative px-5 py-3 shadow-sm text-sm leading-relaxed ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-[1.5rem] rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-[1.5rem] rounded-tl-sm border border-slate-100 dark:border-slate-700'
                  }`}>
                    
                    {/* Star Indicator */}
                    {msg.is_starred && (
                      <Star className="absolute -top-1.5 -right-1.5 h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-md z-10" />
                    )}

                    {/* Attachment Preview */}
                    {msg.attachment_url && (
                      <div className="mb-3 mt-1">
                        {msg.attachment_type === 'image' && (
                          <div className="relative group/img overflow-hidden rounded-xl bg-black/5">
                            <img 
                              src={msg.attachment_url} 
                              alt="Attachment" 
                              className="max-w-full h-auto max-h-64 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                              onClick={() => window.open(msg.attachment_url, '_blank')}
                            />
                          </div>
                        )}
                        {msg.attachment_type === 'document' && (
                          <a 
                            href={msg.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                            }`}
                          >
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">Dokumen Terlampir</p>
                                <p className="text-[10px] opacity-70">Klik untuk unduh</p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Message Text */}
                    {editingMessageId === msg.id ? (
                      <div className="flex gap-2 min-w-[200px]">
                        <Input 
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditMessage();
                            if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditingText("");
                            }
                          }}
                          className="text-sm flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                          autoFocus
                        />
                        <Button size="icon" variant="secondary" onClick={handleEditMessage} className="h-9 w-9 shrink-0 rounded-full shadow-lg">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingMessageId(null); setEditingText(""); }} className="h-9 w-9 shrink-0 rounded-full hover:bg-white/20 text-white">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    )}
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 transition-all hover:scale-110 border ${
                              users.includes(currentUserId)
                                ? 'bg-blue-100 border-blue-200 text-blue-700'
                                : 'bg-white border-slate-100 text-slate-600'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{users.length}</span>
                          </button>
                        ))}
                      </div>
                  )}

                  {/* Footer: Time, Edit, Status & Actions */}
                  <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Timestamp & Status */}
                    <div className="flex items-center gap-1 opacity-60">
                         {getStatusIcon(msg)}
                         <span className="text-[10px] font-bold">{format(new Date(msg.created_at), "HH:mm")}</span>
                         {msg.is_edited && <span className="text-[9px] italic">edited</span>}
                    </div>

                    {/* Message Actions (Hover) */}
                    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/50 backdrop-blur-sm rounded-full p-0.5 shadow-sm border border-slate-100 ${isMe ? 'mr-2' : 'ml-2'}`}>
                        {/* Quick Reactions */}
                        {QUICK_REACTIONS.slice(0, 3).map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all text-sm hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                        
                        <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-100">
                              <MoreVertical className="h-3 w-3 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-xl">
                            <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="gap-2 cursor-pointer">
                              <Reply className="h-3.5 w-3.5" /> Balas
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => { setEditingMessageId(msg.id); setEditingText(msg.message); }} className="gap-2 cursor-pointer">
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(msg.message); toast.success("Disalin"); }} className="gap-2 cursor-pointer">
                              <Copy className="h-3.5 w-3.5" /> Salin
                            </DropdownMenuItem>
                            {isMe && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                                    </DropdownMenuItem>
                                </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
          
          <div ref={scrollRef} />
        </div>

        {/* ===== FOOTER AREA ===== */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            {/* Reply Preview Bar */}
            {replyingTo && (
              <div className="px-4 py-2 bg-blue-50/50 flex items-center justify-between border-b border-blue-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-8 w-1 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-700">Membalas {replyingTo.profiles?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[300px]">{replyingTo.message}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-6 w-6 rounded-full hover:bg-blue-100">
                  <X className="h-3 w-3 text-blue-600" />
                </Button>
              </div>
            )}

            {/* File Preview Bar */}
            {selectedFile && (
              <div className="px-4 py-2 bg-emerald-50/50 flex items-center justify-between border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Paperclip className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="h-6 w-6 rounded-full hover:bg-emerald-100">
                  <X className="h-3 w-3 text-emerald-600" />
                </Button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 flex items-end gap-3">
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              />

              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-full h-11 w-11 bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                  <Textarea 
                    value={newMessage}
                    onFocus={unlockNotificationAudio}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      sendTypingIndicator(e.target.value.length > 0);
                    }}
                    placeholder="Ketik pesan..." 
                    className="min-h-[44px] max-h-[150px] py-3 pl-4 pr-4 resize-none rounded-[1.5rem] border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50/50 transition-all custom-scrollbar"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
              </div>

              <Button 
                type="submit"
                size="icon" 
                disabled={sending || (!newMessage.trim() && !selectedFile)}
                className={`shrink-0 rounded-full h-11 w-11 shadow-lg transition-all duration-300 ${
                    sending || (!newMessage.trim() && !selectedFile)
                    ? 'bg-slate-200 text-slate-400 shadow-none scale-90'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-blue-500/30'
                }`}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
              </Button>
            </form>
        </div>
      </div>

      {/* ===== DELETE DIALOG ===== */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-center text-slate-900">Hapus Semua Pesan?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Tindakan ini akan menghapus permanen semua riwayat pesan Anda di ruang obrolan ini. Pihak admin mungkin masih memiliki salinan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center mt-4">
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)} className="rounded-xl px-6 font-bold">
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllMessages} className="rounded-xl px-6 font-bold bg-red-600 hover:bg-red-700">
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}