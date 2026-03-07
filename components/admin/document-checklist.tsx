"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  getChecklist, 
  addChecklistItem, 
  updateChecklistItemStatus, 
  deleteChecklistItem,
  type ChecklistItem 
} from "@/actions/admin/checklist-actions";

export function DocumentChecklist({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, [applicationId]);

  const loadChecklist = async () => {
    setLoading(true);
    const data = await getChecklist(applicationId);
    setItems(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    setIsAdding(true);
    const res = await addChecklistItem(applicationId, newItemName);
    if (res.success) {
      toast.success("Dokumen ditambahkan");
      setNewItemName("");
      loadChecklist();
    } else {
      toast.error("Gagal menambah dokumen");
    }
    setIsAdding(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: status as any } : i));
    
    const res = await updateChecklistItemStatus(id, status, applicationId);
    if (!res.success) {
      toast.error("Gagal update status");
      loadChecklist(); // Revert
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus item ini?")) return;
    const res = await deleteChecklistItem(id, applicationId);
    if (res.success) {
      toast.success("Item dihapus");
      loadChecklist();
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Requirement Checklist
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-2">
              <Plus className="h-3.5 w-3.5" /> Tambah Dokumen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Persyaratan Dokumen</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Input 
                placeholder="Nama Dokumen (misal: KTP Direktur)" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Button onClick={handleAdd} disabled={isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-slate-400 text-xs">Memuat checklist...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            Belum ada persyaratan dokumen.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 group">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.document_name}</span>
                
                <div className="flex items-center gap-2">
                  {item.status === 'verified' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Verified</Badge>}
                  {item.status === 'rejected' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Rejected</Badge>}
                  {item.status === 'pending' && <Badge variant="outline" className="text-slate-500">Pending</Badge>}

                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleStatusChange(item.id, 'verified')}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(item.id, 'rejected')}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
