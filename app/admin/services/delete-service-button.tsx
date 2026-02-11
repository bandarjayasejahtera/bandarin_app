"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { deleteServiceAction } from "@/actions/admin/service-actions";

export function DeleteServiceButton({ serviceId, serviceName }: { serviceId: string, serviceName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Hapus layanan "${serviceName}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    setIsDeleting(true);
    const result = await deleteServiceAction(serviceId);

    if (result?.error) {
      alert(`Gagal: ${result.error}`);
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-slate-400 hover:text-red-600 h-8 w-8"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
    </Button>
  );
}