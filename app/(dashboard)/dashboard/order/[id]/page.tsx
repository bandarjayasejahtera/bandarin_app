import { getOrderDetails, sendMessage } from "@/actions/order";
import { ChatBox } from "@/components/dashboard/chat-box";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, FileText, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const order = await getOrderDetails(resolvedParams.id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!order || !user) redirect("/dashboard/orders");

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{order.services?.name}</h1>
            <Badge className={`${order.status === 'process' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'} border-0`}>
                {order.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">ID: {order.id.substring(0, 8)}...</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" /> Riwayat Status
                </h3>
                <div className="space-y-6 relative pl-2">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                    {order.application_logs && order.application_logs.length > 0 ? (
                        order.application_logs.map((log: any, idx: number) => (
                            <div key={idx} className="relative flex gap-4">
                                <div className={`z-10 mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-white 
                                    ${idx === 0 ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-300'}`}>
                                    {idx === 0 ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${idx === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {log.status_title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">{log.description}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {new Date(log.timestamp).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="relative flex gap-4">
                            <div className="z-10 mt-1 h-5 w-5 rounded-full border-2 border-blue-600 bg-white"></div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Pengajuan Dibuat</h4>
                                <p className="text-xs text-gray-500">Menunggu verifikasi admin.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" /> Data Perusahaan
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-500 uppercase font-bold">Nama Perusahaan</span>
                        <p className="font-semibold text-gray-900 mt-1">{order.company_name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-500 uppercase font-bold">Paket Layanan</span>
                        <p className="font-semibold text-gray-900 mt-1">{order.services?.name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                        <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Alamat
                        </span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                            {order.company_address || "-"}
                        </p>
                    </div>
                    {order.notes && (
                        <div className="p-4 bg-yellow-50 rounded-xl md:col-span-2 border border-yellow-100">
                            <span className="text-xs text-yellow-700 uppercase font-bold">Catatan Anda</span>
                            <p className="text-sm text-yellow-900 mt-1">{order.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1">
            <div className="sticky top-24">
                <h3 className="font-bold text-gray-900 mb-3 md:hidden">Diskusi & Revisi</h3>
                <ChatBox 
                    applicationId={order.id} 
                    messages={order.application_messages} 
                    sendMessageAction={sendMessage}
                    currentUserId={user.id}
                />
            </div>
        </div>
      </div>
    </div>
  );
}