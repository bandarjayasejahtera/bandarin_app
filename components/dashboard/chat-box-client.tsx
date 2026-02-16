// components/dashboard/chat-box-client.tsx
"use client";

import { ChatBoxCore } from "@/components/dashboard/chat-box-core";

const CLIENT_NOTIFICATION_SOUND = "/sounds/chat-notification.wav";

export interface ChatBoxProps {
  applicationId: string;
  initialMessages: import("@/components/dashboard/chat-box-core").ChatMessage[];
  currentUserId: string;
}

/**
 * Chat box untuk portal klien (dashboard aplikasi).
 * Menggunakan suara notifikasi client.
 */
export function ChatBox(props: ChatBoxProps) {
  return (
    <ChatBoxCore
      {...props}
      notificationSoundUrl={CLIENT_NOTIFICATION_SOUND}
    />
  );
}
