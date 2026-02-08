'use client'

import { useActionState, useEffect, useRef } from "react";
import { Send, ShieldCheck, Loader2 } from "lucide-react";
import { SubmitButton } from "@/components/submit-button"; 

export function ChatBox({ applicationId, messages, sendMessageAction, currentUserId }: any) {
  const [state, action, isPending] = useActionState(sendMessageAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (state?.message === 'success' && formRef.current) {
        formRef.current.reset();
    }
  }, [messages, state]);

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-white p-4 border-b flex items-center gap-3 shadow-sm z-10">
        <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Konsultasi Admin</h4>
          <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  <p className="leading-relaxed">{msg.message}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <p>Mulai diskusi dengan tim kami.</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t">
        <form ref={formRef} action={action} className="flex gap-2">
          <input type="hidden" name="application_id" value={applicationId} />
          <input 
            type="text" 
            name="message" 
            placeholder="Tulis pesan..." 
            className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            autoComplete="off"
          />
          <SubmitButton isLoading={isPending} className="rounded-full w-12 h-12 p-0 bg-blue-900 hover:bg-blue-800">
             {!isPending && <Send className="h-5 w-5 ml-0.5" />}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}