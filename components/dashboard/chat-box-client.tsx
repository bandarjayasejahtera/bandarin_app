// components/dashboard/chat-box-client.tsx
"use client";

import { ChatBoxCore, type ChatMessage } from "@/components/dashboard/chat-box-core";

const CLIENT_NOTIFICATION_SOUND = "/sounds/chat-notification.wav";

export interface ChatBoxClientProps {
  applicationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
}

/**
 * Chat box untuk portal klien (dashboard aplikasi).
 * Menggunakan suara notifikasi client.
 */
export function ChatBoxClient(props: ChatBoxClientProps) {
  return (
    <ChatBoxCore
      {...props}
      notificationSoundUrl={CLIENT_NOTIFICATION_SOUND}
    />
  );
}