// app/admin/agents/[id]/page.tsx

import { getAgentById, getApplicationsByAgent } from "@/actions/admin/agent-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, Building2, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const agent = await getAgentById(id);
  const applications = await getApplicationsByAgent(id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin/agents">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Detail Agen</h1>
          <p className="text-sm text-slate-500">Informasi profil dan beban kerja agen.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kolom Profil Agen */}
        <Card className="md:col-span-1 h-fit border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                {agent.name.charAt(0)}
              </div>
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>{agent.status}</Badge>
            </div>
            <CardTitle className="mt-4 text-xl">{agent.name}</CardTitle>
            <p className="text-sm text-slate-500 font-medium">{agent.specialization || "Generalist"}</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{agent.agency_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 truncate">{agent.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{agent.phone || "-"}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Berkas</span>
                <span className="text-lg font-black text-slate-900">{applications.length}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(applications.length * 10, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kolom Daftar Pekerjaan/Applications */}
        <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Berkas Sedang Dikawal
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Layanan</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Tanggal Masuk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-8 w-8 opacity-20" />
                        <p>Agen ini belum ditugaskan untuk aplikasi apapun.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app: any) => (
                    <TableRow key={app.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableCell className="font-bold text-slate-700 dark:text-slate-200">
                        {app.services?.name}
                      </TableCell>
                      <TableCell className="text-slate-600">{app.profiles?.full_name}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(app.created_at), "dd MMM yyyy", { locale: idLocale })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-bold">
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/services/orders/${app.id}`}>
                          <Button size="sm" variant="secondary" className="h-8 text-xs font-bold">
                            Lihat Detail
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
      </div>
    </div>
  );
}
