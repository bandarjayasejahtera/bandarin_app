import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link"; // [!code ++] Tambahan import Link

export default async function DashboardPage() {
  // 1. Koneksi ke Database
  const supabase = await createClient();

  // 2. Cek User Login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jika belum login, redirect ke halaman login
  if (!user) {
    return redirect("/login");
  }

  // 3. Ambil Data Pesanan dari Supabase
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  // 4. Hitung Statistik (Manual sederhana)
  const stats = {
    total: orders?.length || 0,
    process: orders?.filter((o) => o.status === "process").length || 0,
    done: orders?.filter((o) => o.status === "done").length || 0,
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header Dashboard */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Selamat datang kembali, {user.email}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* [!code ++] Update: Bungkus Button dengan Link */}
          <Link href="/dashboard/orders/new">
            <Button>+ Buat Pengajuan</Button>
          </Link>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Kartu Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Semua riwayat</p>
          </CardContent>
        </Card>

        {/* Kartu Proses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.process}</div>
            <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
          </CardContent>
        </Card>

        {/* Kartu Selesai */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
            <p className="text-xs text-muted-foreground">Dokumen terbit</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Riwayat */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.service_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={order.status === "done" ? "default" : "secondary"}
                        className={
                          order.status === "done"
                            ? "bg-green-600 hover:bg-green-700"
                            : order.status === "process"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : ""
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {order.amount?.toLocaleString("id-ID") || "0"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Belum ada data. Mulai buat pengajuan baru!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}