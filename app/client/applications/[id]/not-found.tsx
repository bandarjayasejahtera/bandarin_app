// app/client/applications/[id]/not-found.tsx
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplicationNotFound() {
  return (
    <div className="max-w-lg mx-auto text-center py-20 px-4 animate-in fade-in duration-300">
      <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
        <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        Pengajuan Tidak Ditemukan
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
        Halaman pengajuan tidak ada, telah dihapus, atau Anda tidak memiliki akses ke pengajuan ini.
      </p>
      <Link href="/client/applications" className="inline-block mt-8">
        <Button variant="outline" className="rounded-xl font-bold gap-2 h-12 px-6">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Riwayat Pengajuan
        </Button>
      </Link>
    </div>
  );
}
