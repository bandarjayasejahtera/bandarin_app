import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, ArrowRight, Building2, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select(`*, services ( name )`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
        <Link href="/dashboard/orders/new">
          <Button className="bg-blue-900 hover:bg-blue-800 gap-2"><Plus className="w-4 h-4"/> Baru</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <Link href={`/dashboard/orders/${app.id}`} key={app.id} className="block group">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                       <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{app.services?.name}</h3>
                      <p className="text-sm text-gray-500">{app.company_name}</p>
                    </div>
                  </div>
                  <Badge variant={app.status === 'done' ? 'default' : 'secondary'}>{app.status}</Badge>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                   <div className="flex items-center gap-2 text-xs text-gray-400">
                     <Clock className="h-3 w-3" /> {new Date(app.updated_at).toLocaleDateString()}
                   </div>
                   <div className="text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                     Detail <ArrowRight className="h-4 w-4" />
                   </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold">Belum ada pesanan</h3>
            <Link href="/dashboard/orders/new" className="mt-4 inline-block">
              <Button>Buat Pengajuan</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}