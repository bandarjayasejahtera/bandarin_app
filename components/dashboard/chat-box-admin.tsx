// components/dashboard/chat-box-admin.tsx
"use client";

import { ChatBoxCore, type ChatMessage } from "@/components/dashboard/chat-box-core";

const ADMIN_NOTIFICATION_SOUND = "/sounds/admin-notification.wav";

export interface ChatBoxAdminProps {
  applicationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  className?: string;
  title?: string;
  subtitle?: string;
  /** Called when the other user (client) is typing */
  onTypingChange?: (isTyping: boolean) => void;
}

/**
 * Chat box untuk admin (halaman detail order).
 * Menggunakan suara notifikasi admin + mendukung embed (className, title, subtitle).
 */
export function ChatBoxAdmin(props: ChatBoxAdminProps) {
  return (
    <ChatBoxCore
      applicationId={props.applicationId}
      initialMessages={props.initialMessages}
      currentUserId={props.currentUserId}
      notificationSoundUrl={ADMIN_NOTIFICATION_SOUND}
      className={props.className}
      title={props.title}
      subtitle={props.subtitle}
      onTypingChange={props.onTypingChange}
    />
  );
}