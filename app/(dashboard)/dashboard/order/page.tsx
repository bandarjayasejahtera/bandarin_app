import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, CheckCircle, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil Data Applications + Join Services
  // Supabase join syntax: services(name, code)
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      services ( name, code )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
        <Link href="/dashboard/orders/new">
          <button className="text-sm bg-blue-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800">
            + Baru
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <div key={app.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                     <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{app.services?.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {app.company_name}
                    </p>
                  </div>
                </div>
                <Badge className={`${
                  app.status === 'done' ? 'bg-green-100 text-green-700' : 
                  'bg-yellow-100 text-yellow-700'
                } border-0`}>
                  {app.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 bg-gray-50 p-2 rounded-lg">
                <Clock className="h-3 w-3" />
                Update: {new Date(app.updated_at).toLocaleDateString("id-ID", { 
                  weekday: 'long', day: 'numeric', month: 'long' 
                })}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-xs">
                  <span className="text-gray-400">Step Saat Ini:</span>
                  <p className="font-bold text-blue-900">{app.current_step}</p>
                </div>
                <button className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all">
                  Detail <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">Belum ada pesanan</h3>
            <p className="text-gray-500 mb-6">Mulai perjalanan bisnis Anda hari ini.</p>
            <Link href="/dashboard/orders/new">
              <button className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-800">
                Buat Pengajuan Sekarang
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}