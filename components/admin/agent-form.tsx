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
import { createAgent } from "@/actions/admin/agent-actions";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddAgentForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const result = await createAgent(data);
    if (result.success) {
      setOpen(false);
      toast.success("Agen berhasil ditambahkan");
    } else {
      toast.error("Gagal menambahkan agen");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Tambah Agen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Agen Lapangan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input name="name" required placeholder="Contoh: Budi Santoso" />
          </div>
          <div className="space-y-2">
            <Label>Instansi / Wilayah Dinas</Label>
            <Input name="agency_name" required placeholder="Contoh: PUPR Jakarta Selatan" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="budi@bandarin.id" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input name="phone" placeholder="0812..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Spesialisasi</Label>
            <Input name="specialization" placeholder="Contoh: Pengurusan KRK & PBG" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? "Menyimpan..." : "Simpan Agen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
