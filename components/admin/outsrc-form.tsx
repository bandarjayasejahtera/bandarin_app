"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createOutsrc } from "@/actions/admin/outsrc-actions";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddOutsrcForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const result = await createOutsrc(data);
    if (result.success) {
      setOpen(false);
      toast.success("Mitra outsourcing berhasil ditambahkan");
    } else {
      toast.error("Gagal menambahkan mitra outsourcing");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Tambah Mitra
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Mitra Outsourcing Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nama Mitra / Perusahaan</Label>
            <Input name="name" required placeholder="Contoh: PT Jasa Legalitas" />
          </div>
          <div className="space-y-2">
            <Label>Keahlian (Expertise Field)</Label>
            <Input name="service_type" required placeholder="Contoh: Notaris, Konsultan Pajak" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="contact@mitra.com" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp / Telepon</Label>
              <Input name="phone" placeholder="0812..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alamat (Opsional)</Label>
            <Input name="address" placeholder="Alamat lengkap mitra" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? "Menyimpan..." : "Simpan Mitra"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
