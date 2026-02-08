'use client'

import { useActionState } from "react";
import { Send, User, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

export function ChatBox({ applicationId, messages, sendMessageAction, currentUserId }: any) {
  const [state, action, isPending] = useActionState(sendMessageAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Reset form jika sukses
    if (state?.message === 'success' && formRef.current) {
        formRef.current.reset();
    }
  }, [messages, state]);

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header Chat */}
      <div className="bg-white p-4 border-b flex items-center gap-2 shadow-sm z-10">
        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Tim Legal Bandarin</h4>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </p>
        </div>
      </div>

      {/* List Pesan */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  <p>{msg.message}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <p>Belum ada percakapan.</p>
            <p className="text-xs">Mulai konsultasi dengan admin sekarang.</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t">
        <form ref={formRef} action={action} className="flex gap-2">
          <input type="hidden" name="application_id" value={applicationId} />
          <input 
            type="text" 
            name="message" 
            placeholder="Ketik pesan konsultasi..." 
            className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-900 text-white h-11 w-11 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}