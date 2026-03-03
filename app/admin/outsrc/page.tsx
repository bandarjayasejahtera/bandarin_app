//app/admin/outsrc/page.tsx
export const dynamic = "force-dynamic";
import { getOutsrc } from "@/actions/admin/outsrc-actions";
import { AddOutsrcForm } from "@/components/admin/outsrc-form";
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
import { Users, Briefcase, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default async function OutsrcPage() {
  const outsrcList = await getOutsrc();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" /> Manajemen Outsourcing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola mitra eksternal dan penyedia jasa pihak ketiga.
          </p>
        </div>
        <AddOutsrcForm />
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Daftar Mitra Aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Nama Mitra</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Keahlian</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Kontak</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Alamat</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outsrcList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 opacity-20" />
                      <p>Belum ada mitra outsourcing yang terdaftar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                outsrcList?.map((item: any) => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      {item.name}
                      <div className="text-[10px] text-slate-400 font-normal">{item.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-600 border-slate-200">
                        {item.expertise_field}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {item.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600 max-w-[200px] truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {/* Alamat tidak ada di tabel baru, jadi kita tampilkan placeholder atau hapus */}
                        -
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "available" ? "default" : "destructive"} className="capitalize">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/outsrc/${item.id}`}
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
