// components/dashboard/chat-box-core.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Send, Loader2, Reply, Edit2, Trash2, 
  Copy, MoreVertical, Check, CheckCheck,
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
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
  /** Called when someone else is typing (e.g. to show indicator in parent) */
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
  const onlineChannelRef = useRef<any>(null);
  
  // ===== NOTIFICATION SOUND REFS =====
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const notificationSoundUrlRef = useRef(notificationSoundUrl);
  const markAsDeliveredRef = useRef<(id: string) => Promise<void>>(async () => {});

  // Update notification sound URL if it changes
  useEffect(() => {
    notificationSoundUrlRef.current = notificationSoundUrl;
  }, [notificationSoundUrl]);

  // ===== NOTIFICATION SOUND FUNCTIONS =====
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
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
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

  // ===== AUTO SCROLL TO BOTTOM =====
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Scroll otomatis setiap ada pesan baru
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ===== FETCH USER PROFILES =====
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', currentUserId)
        .single();

      setCurrentUserProfile(myProfile);

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
            const newMsg = payload.new as ChatMessage;
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, role, email')
              .eq('id', newMsg.user_id)
              .single();

            let replyToMsg = null;
            if (newMsg.reply_to_id) {
              const { data: replyData } = await supabase
                .from('application_messages')
                .select('*, profiles:profiles!application_messages_user_id_fkey(full_name, role)')
                .eq('id', newMsg.reply_to_id)
                .single();
              replyToMsg = replyData;
            }

            const enrichedMsg: ChatMessage = {
              ...newMsg,
              profiles: profile ?? undefined,
              reply_to: replyToMsg ?? undefined,
            };

            setMessages(prev => {
              if (prev.some(m => m.id === enrichedMsg.id)) return prev;
              return [...prev, enrichedMsg];
            });

            // Play notification sound if message is from other user
            if (newMsg.user_id !== currentUserId) {
              try {
                playNotificationSound();
              } catch {
                // ignore
              }
              await markAsDeliveredRef.current(newMsg.id);
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
          const updated = payload.new as ChatMessage;
          setMessages(prev => 
            prev.map(m => m.id === updated.id ? { ...m, ...updated } : m)
          );
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
          const deleted = payload.old as ChatMessage;
          setMessages(prev => prev.filter(m => m.id !== deleted.id));
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`typing-${applicationId}`, {
        config: { presence: { key: currentUserId } }
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
          await typingChannel.track({ typing: false, name: currentUserId });
        }
      });

    const onlineChannel = supabase
      .channel(`online-${applicationId}`, {
        config: { presence: { key: currentUserId } }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = onlineChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          onlineChannelRef.current = onlineChannel;
          await onlineChannel.track({ online_at: new Date().toISOString() });
          setChannelsReady(true);
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
      if (onlineChannelRef.current) supabase.removeChannel(onlineChannelRef.current);
    };
  }, [applicationId, currentUserId, supabase, playNotificationSound]);

  // ===== NOTIFY PARENT: TYPING STATE =====
  useEffect(() => {
    onTypingChange?.(typingUsers.length > 0);
  }, [typingUsers, onTypingChange]);

  // ===== AUTO-MARK READ =====
  useEffect(() => {
    const markUnreadAsRead = async () => {
      const unreadIds = messages
        .filter(m => m.user_id !== currentUserId && !m.is_read)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('application_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }
    };

    markUnreadAsRead();
  }, [messages, currentUserId, supabase]);

  // ===== HELPER FUNCTIONS =====
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
      await typingChannelRef.current.track({ typing: isTyping, name: currentUserId });
    } catch (error) {
      console.error("Typing indicator error:", error);
    }
  };

  // ===== MESSAGE ACTIONS =====
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Unlock audio on user interaction
    unlockNotificationAudio();
    
    const text = newMessage.trim();
    if (!text && !selectedFile) return;

    setSending(true);

    try {
      let attachmentUrl = null;
      let attachmentType = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${currentUserId}.${fileExt}`;
        const filePath = `${applicationId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Gagal upload file: " + uploadError.message);
        }

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
      .eq('user_id', currentUserId);

    if (error) {
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
      .eq('user_id', currentUserId);

    if (error) {
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
      .eq('user_id', currentUserId);

    if (error) {
      toast.error("Gagal hapus semua pesan");
    } else {
      setShowDeleteAllDialog(false);
      toast.success("Semua pesan Anda dihapus");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File maksimal 10MB");
        return;
      }
      setSelectedFile(file);
      toast.success("File siap dikirim");
    }
  };

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

  const getDisplayName = () => {
    // Use custom title if provided
    if (title) return title;
    
    // Otherwise use profile-based logic
    if (currentUserProfile?.role === 'admin') {
      return otherUserProfile?.full_name || "Klien";
    } else {
      return otherUserProfile?.full_name || "Admin Support";
    }
  };

  const getDisplaySubtitle = () => {
    // Saat ada yang mengetik, subtitle berubah otomatis
    if (typingUsers.length > 0) return "sedang mengetik...";
    // Default: subtitle kustom (e.g. "Komunikasi resmi dengan klien") atau status online
    if (subtitle !== undefined) return subtitle;
    return onlineUsers.length > 1 ? "● Online" : "○ Offline";
  };

  // ===== RENDER =====
  return (
    <>
      <Card className={cn(
        "flex flex-col flex-1 min-h-0 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden",
        "min-h-[320px] sm:min-h-[420px] max-h-[calc(100vh-10rem)]",
        "w-full",
        className
      )}>
        
        {/* ===== HEADER ===== */}
        <CardHeader className="p-4 border-b bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {getDisplayName().substring(0, 2).toUpperCase()}
              </div>
              {onlineUsers.length > 1 && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{getDisplayName()}</h3>
              <p className={cn(
                "text-xs",
                typingUsers.length > 0 ? "text-primary font-medium animate-pulse" : "text-slate-500"
              )}>
                {getDisplaySubtitle()}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white dark:hover:bg-slate-800">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => setShowDeleteAllDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua Pesan Saya
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* ===== MESSAGES AREA (SCROLLABLE, auto-scroll on new message) ===== */}
        <CardContent 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/30 scroll-smooth" 
          ref={scrollRef}
          onClick={unlockNotificationAudio}
          role="presentation"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Smile className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-bold">Belum ada pesan</p>
              <p className="text-xs">Mulai percakapan!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            const canEdit = isMe && 
              (new Date().getTime() - new Date(msg.created_at).getTime()) < 15 * 60 * 1000;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                  
                  {/* Reply Preview */}
                  {msg.reply_to && (
                    <div className={`mb-1 p-2 rounded-lg border-l-4 text-xs ${
                      isMe 
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' 
                        : 'bg-slate-100 border-slate-400 dark:bg-slate-800'
                    }`}>
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        {msg.reply_to.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-slate-500 truncate">{msg.reply_to.message}</p>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`relative p-3 rounded-2xl shadow-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}>

                    {msg.attachment_url && (
                      <div className="mb-2">
                        {msg.attachment_type === 'image' && (
                          <img 
                            src={msg.attachment_url} 
                            alt="Attachment" 
                            className="rounded-lg max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.attachment_url, '_blank')}
                          />
                        )}
                        {msg.attachment_type === 'document' && (
                          <a 
                            href={msg.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                              isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium">Dokumen terlampir</span>
                          </a>
                        )}
                      </div>
                    )}

                    {editingMessageId === msg.id ? (
                      <div className="flex gap-2">
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
                          className="text-sm flex-1"
                          autoFocus
                        />
                        <Button size="icon" onClick={handleEditMessage} className="h-8 w-8">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                          setEditingMessageId(null);
                          setEditingText("");
                        }} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                    )}

                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-white/70' : 'text-slate-500'
                    }`}>
                      {msg.is_edited && <span className="italic">edited</span>}
                      <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                      {getStatusIcon(msg)}
                    </div>
                  </div>

                  {/* Message Actions */}
                  <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isMe ? 'justify-end' : 'justify-start'
                  }`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isMe ? "end" : "start"}>
                        <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                          <Reply className="h-4 w-4 mr-2" />
                          Balas
                        </DropdownMenuItem>
                        
                        {canEdit && (
                          <DropdownMenuItem onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditingText(msg.message);
                          }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(msg.message);
                          toast.success("Disalin");
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Salin
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {isMe && (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm("Hapus pesan ini?")) {
                                handleDeleteMessage(msg.id);
                              }
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* ===== FOOTER AREA ===== */}
        <div className="border-t bg-white dark:bg-slate-900">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Reply className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Membalas {replyingTo.profiles?.full_name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 truncate">{replyingTo.message}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <Paperclip className="h-4 w-4 text-green-600" />
                )}
                <div>
                  <span className="text-sm font-medium text-green-900 dark:text-green-300 truncate max-w-[200px] block">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-green-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 flex items-end gap-2">
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
              className="shrink-0 rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <Textarea 
              value={newMessage}
              onFocus={unlockNotificationAudio}
              onChange={(e) => {
                setNewMessage(e.target.value);
                sendTypingIndicator(e.target.value.length > 0);
              }}
              placeholder="Ketik pesan..." 
              className="min-h-[40px] max-h-[100px] resize-none rounded-2xl border-2 focus-visible:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />

            <Button 
              type="submit"
              size="icon" 
              disabled={sending || (!newMessage.trim() && !selectedFile)}
              className="rounded-full shrink-0 h-10 w-10 shadow-lg shadow-primary/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* ===== DELETE DIALOG ===== */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Hapus Semua Pesan Anda?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus semua pesan yang Anda kirim di chat ini. Pesan tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllMessages}>
              Ya, Hapus Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}