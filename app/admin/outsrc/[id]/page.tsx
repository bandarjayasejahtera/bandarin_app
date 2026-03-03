//app/admin/outsrc/[id]/page.tsx
// app/admin/outsrc/[id]/page.tsx

import { getOutsrcById, getApplicationsByOutsrc } from "@/actions/admin/outsrc-actions";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, Briefcase, Calendar, MapPin, CheckCircle2, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Import komponen Chat
import { ChatBoxCore } from "@/components/dashboard/chat-box-core";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OutsrcDetailPage({ params }: PageProps) {
  const { id } = await params;
  const person = await getOutsrcById(id);
  const applications = await getApplicationsByOutsrc(id);

  if (!person) {
    return <div className="p-6 text-center text-slate-500">Data tenaga ahli tidak ditemukan.</div>;
  }

  // Ambil sesi user yang sedang login (Admin)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Ambil riwayat pesan dengan ID Tenaga Ahli sebagai ID "Room"
  const { data: initialMessages } = await supabase
    .from('application_messages')
    .select(`
      *,
      profiles:user_id(full_name, role)
    `)
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'busy': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin/outsrc">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Detail Tenaga Ahli</h1>
          <p className="text-sm text-slate-500">Informasi profil dan riwayat pengerjaan teknis.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kolom Kiri: Profil Tenaga Ahli */}
        <Card className="md:col-span-1 h-fit border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-5">
            <div className="flex justify-between items-start">
              <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shadow-inner">
                {person.name.charAt(0)}
              </div>
              <Badge variant="outline" className="flex items-center gap-1.5 bg-white shadow-sm capitalize px-3 py-1">
                {getStatusIcon(person.status)} {person.status}
              </Badge>
            </div>
            <CardTitle className="mt-5 text-xl font-bold text-slate-900">{person.name}</CardTitle>
            <p className="text-sm font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-md mt-1">
              {person.expertise_field}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                  <Phone className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                </div>
                <span className="text-slate-700 font-medium">{person.phone || "Tidak ada nomor"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                  <Mail className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                </div>
                <span className="text-slate-700 font-medium truncate">{person.email || "Tidak ada email"}</span>
              </div>
            </div>
            
            <div className="pt-5 border-t border-slate-100">
              <div className="flex justify-between items-end mb-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Proyek</span>
                  <div className="text-2xl font-black text-slate-900">{applications.length}</div>
                </div>
                <Briefcase className="h-8 w-8 text-slate-200 mb-1" />
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(applications.length * 10, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kolom Kanan: Tabs untuk Daftar Pekerjaan dan Chat */}
        <div className="md:col-span-2">
          <Tabs defaultValue="workload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="workload" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                <Briefcase className="h-4 w-4" /> Daftar Tugas
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4" /> Chat Internal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workload" className="m-0">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Riwayat Pekerjaan Teknis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-bold py-4 pl-6">Layanan</TableHead>
                        <TableHead className="font-bold">Klien</TableHead>
                        <TableHead className="font-bold">Tanggal Masuk</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="text-right font-bold pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 bg-slate-50 rounded-full">
                                <Briefcase className="h-8 w-8 text-slate-300" />
                              </div>
                              <p className="text-sm font-medium">Belum ada proyek yang ditugaskan ke tenaga ahli ini.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        applications.map((app: any) => (
                          <TableRow key={app.id} className="group hover:bg-indigo-50/30 transition-colors">
                            <TableCell className="font-bold text-slate-800 py-4 pl-6">
                              {app.services?.name}
                            </TableCell>
                            <TableCell className="text-slate-600 font-medium">
                              {app.profiles?.full_name}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {format(new Date(app.created_at), "dd MMM yyyy", { locale: idLocale })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize font-bold bg-slate-100 text-slate-700">
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Link href={`/admin/services/orders/${app.id}`}>
                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200">
                                  Lihat Berkas
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="m-0">
              <ChatBoxCore 
                applicationId={id} 
                initialMessages={initialMessages || []}
                currentUserId={user?.id || ""}
                notificationSoundUrl="/sounds/chat-notification.wav"
                title={`Kordinasi Internal: Tim & ${person.name}`}
                className="min-h-[500px] border-slate-200 shadow-sm"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}