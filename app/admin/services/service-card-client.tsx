"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Layers,
  Settings2,
  MoreVertical,
  FileText,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteServiceAction, getServiceUsageAction } from "@/actions/admin/service-actions";

type Service = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  service_fields: { count: number }[];
};

export function ServiceCardClient({ service }: { service: Service }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const fieldCount = service.service_fields?.[0]?.count ?? 0;

  useEffect(() => {
    if (!deleteDialogOpen || !service.id) return;
    setUsageLoading(true);
    getServiceUsageAction(service.id)
      .then(({ count }) => setUsageCount(count))
      .catch(() => setUsageCount(0))
      .finally(() => setUsageLoading(false));
  }, [deleteDialogOpen, service.id]);

  const openDeleteDialog = () => {
    setDropdownOpen(false);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setUsageCount(null);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteServiceAction(service.id);
    setIsDeleting(false);

    if (result?.error) {
      toast.error("Gagal menghapus layanan", {
        description: result.error,
      });
      return;
    }

    toast.success("Layanan berhasil dihapus", {
      description: `"${service.name}" telah dihapus dari katalog.`,
    });
    closeDeleteDialog();
    router.refresh();
  };

  return (
    <>
      <Card className="group relative border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 dark:bg-blue-600/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />

        <CardContent className="p-8 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-500/30 group-hover:-translate-y-1">
              <Layers size={28} className="stroke-[2.5]" />
            </div>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <MoreVertical className="h-5 w-5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/admin/services/${service.id}/fields`}
                    className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl font-bold text-sm"
                  >
                    <Settings2 className="h-4 w-4 text-blue-500" /> Konfigurasi Form
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    openDeleteDialog();
                  }}
                  className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl font-bold text-sm text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50"
                >
                  <Trash2 className="h-4 w-4" /> Hapus Layanan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1 mb-4">
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-[0.2em] border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 py-0.5 rounded-lg mb-2"
            >
              {service.code}
            </Badge>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
              {service.name}
            </h3>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 min-h-[40px] leading-relaxed font-medium">
            {service.description ||
              "Deskripsi layanan belum dikonfigurasi oleh administrator."}
          </p>

          <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
              <FileText size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                {fieldCount} Pertanyaan
              </span>
            </div>

            <Link href={`/admin/services/${service.id}/fields`}>
              <Button
                variant="link"
                className="p-0 h-auto font-black text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-slate-900 dark:hover:text-white transition-all group/btn"
              >
                Atur Struktur{" "}
                <Plus className="h-3 w-3 ml-1 transition-transform group-hover/btn:rotate-90" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="rounded-[2rem] max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-600 p-8 text-white relative">
            <DialogHeader>
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white leading-tight">
                Hapus Layanan?
              </DialogTitle>
              <DialogDescription className="text-red-100 font-medium pt-2">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait layanan ini akan terpengaruh.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Layanan yang akan dihapus
              </p>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {service.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kode: {service.code}
              </p>
            </div>

            {usageLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memeriksa penggunaan…
              </div>
            ) : usageCount !== null && usageCount > 0 ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    Layanan ini digunakan oleh {usageCount} pesanan.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                    Penghapusan mungkin ditolak sistem jika masih ada pesanan aktif. Pastikan tidak ada ketergantungan data.
                  </p>
                </div>
              </div>
            ) : null}

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-2xl font-bold border-2"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-[2] h-12 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Layanan
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
