"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Briefcase, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Plus,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  getAgents, 
  assignAgent, 
  addTrackingStep, 
  getTrackingHistory 
} from "@/actions/admin/agent-actions";

interface AgentControlPanelProps {
  applicationId: string;
  currentAgentId?: string | null;
}

export function AgentControlPanel({ applicationId, currentAgentId }: AgentControlPanelProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>(currentAgentId || "");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const [agentsData, logsData] = await Promise.all([
        getAgents(),
        getTrackingHistory(applicationId)
      ]);
      setAgents(agentsData);
      setLogs(logsData || []);
    };
    loadData();
  }, [applicationId]);

  // Handle Assign Agent
  const handleAssign = async (agentId: string) => {
    setLoading(true);
    const result = await assignAgent(applicationId, agentId);
    if (result.success) {
      setSelectedAgent(agentId);
      toast.success("Agen berhasil ditugaskan!");
    } else {
      toast.error("Gagal menugaskan agen.");
    }
    setLoading(false);
  };

  // Handle Add Log
  const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAgent) {
      toast.error("Pilih agen penanggung jawab terlebih dahulu.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      application_id: applicationId,
      agent_id: selectedAgent,
      agency_name: formData.get("agency_name") as string,
      step_name: formData.get("step_name") as string,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string,
    };

    const result = await addTrackingStep(data);
    if (result.success) {
      toast.success("Log tracking berhasil ditambahkan");
      setTrackingOpen(false);
      // Refresh logs
      const updatedLogs = await getTrackingHistory(applicationId);
      setLogs(updatedLogs || []);
    } else {
      toast.error("Gagal menambah log.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. ASSIGNMENT CARD */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Field Officer (Agen)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select 
              value={selectedAgent} 
              onValueChange={handleAssign} 
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Agen Penanggung Jawab" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} — {agent.agency_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedAgent && (
             <p className="text-xs text-slate-500 mt-2">
               Agen ini akan menerima notifikasi dan bertanggung jawab atas update status berkas di lapangan.
             </p>
          )}
        </CardContent>
      </Card>

      {/* 2. TRACKING LOGS */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Tracking Instansi
          </CardTitle>
          
          <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-2" disabled={!selectedAgent}>
                <Plus className="h-3.5 w-3.5" /> Update Posisi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Posisi Berkas</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLog} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Instansi / Lokasi</Label>
                  <Input name="agency_name" placeholder="Contoh: Loket PTSP Lantai 2" required />
                </div>
                <div className="space-y-2">
                  <Label>Tahapan / Proses</Label>
                  <Input name="step_name" placeholder="Contoh: Validasi Dokumen Teknis" required />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue="In Progress">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Progress">Sedang Proses</SelectItem>
                      <SelectItem value="Pending">Menunggu Kelengkapan</SelectItem>
                      <SelectItem value="Completed">Selesai / Terbit</SelectItem>
                      <SelectItem value="Rejected">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catatan Lapangan</Label>
                  <Textarea name="notes" placeholder="Catatan tambahan dari petugas..." />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Update"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
            {logs.length === 0 ? (
              <div className="text-sm text-slate-400 italic py-2">Belum ada riwayat tracking.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 dark:bg-slate-700" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {log.agency_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(log.created_at), "dd MMM HH:mm", { locale: idLocale })}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {log.step_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        log.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        log.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {log.agents?.name || "Unknown Agent"}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded mt-2">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
