// app/admin/agents/page.tsx
import { getAgents } from "@/actions/admin/agent-actions";
import { AddAgentForm } from "@/components/admin/agent-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Phone } from "lucide-react";
import Link from "next/link";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Manajemen Agen Lapangan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola tim field officer yang menangani proses di berbagai instansi pemerintah.
          </p>
        </div>
        <AddAgentForm />
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Daftar Agen Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Nama Agen</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Instansi / Wilayah</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Spesialisasi</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Kontak</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 opacity-20" />
                      <p>Belum ada agen yang terdaftar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                agents?.map((agent: any) => (
                  <TableRow key={agent.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      {agent.name}
                      <div className="text-[10px] text-slate-400 font-normal">{agent.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium">{agent.agency_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.specialization ? (
                        <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-600 border-slate-200">
                          {agent.specialization}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {agent.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.status === "active" ? "default" : "destructive"} className="capitalize">
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        href={`/admin/agents/${agent.id}`} 
                        className="text-blue-600 hover:text-blue-700 font-bold text-xs hover:underline"
                      >
                        Lihat Detail
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
  );
}
