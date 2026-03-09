// app/admin/profiles/profiles-client.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Search, ShieldAlert, User, Briefcase, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfileRole } from "@/actions/admin/profiles";
import { cn } from "@/lib/applicationSchema/utils";

// Helper untuk visual Role
const roleConfig: Record<string, { icon: any, color: string, bg: string }> = {
  admin: { icon: ShieldAlert, color: "text-red-700", bg: "bg-red-50 border-red-200" },
  client: { icon: User, color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  agent: { icon: Briefcase, color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
  outsrc: { icon: Truck, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
};

export default function ProfilesClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter Data Client-side
  const filteredProfiles = profiles.filter((p) => {
    const term = searchQuery.toLowerCase();
    return (
      (p.full_name?.toLowerCase().includes(term)) ||
      (p.email?.toLowerCase().includes(term)) ||
      (p.phone?.toLowerCase().includes(term))
    );
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await updateProfileRole(userId, newRole);
      if (res.success) {
        toast.success(`Role berhasil diubah menjadi ${newRole.toUpperCase()}`);
        // Update state lokal agar UI langsung berubah tanpa perlu refresh full page
        setProfiles((prev) => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      } else {
        toast.error(res.error || "Gagal mengubah role");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama, email, atau no HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200 bg-white"
          />
        </div>
        <div className="text-sm font-bold text-slate-500">
          Total: {filteredProfiles.length} Pengguna
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead className="pl-6">Pengguna</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Terdaftar Sejak</TableHead>
                <TableHead className="w-[200px]">Akses Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                    Tidak ada pengguna yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => {
                  const role = profile.role || 'client';
                  const RoleIcon = roleConfig[role]?.icon || User;
                  
                  return (
                    <TableRow key={profile.id} className="hover:bg-slate-50/50">
                      {/* Kolom Nama */}
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                            {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{profile.full_name || "Tanpa Nama"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn("text-[9px] uppercase font-bold tracking-widest px-1.5", roleConfig[role]?.bg, roleConfig[role]?.color)}>
                                {role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Kolom Kontak */}
                      <TableCell>
                        <p className="text-sm text-slate-600">{profile.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{profile.phone || "No Phone"}</p>
                      </TableCell>

                      {/* Kolom Tanggal */}
                      <TableCell className="text-sm text-slate-500">
                        {profile.created_at ? format(new Date(profile.created_at), "dd MMM yyyy", { locale: idLocale }) : "-"}
                      </TableCell>

                      {/* Kolom Ganti Role */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={role} 
                            onValueChange={(val) => handleRoleChange(profile.id, val)}
                            disabled={updatingId === profile.id}
                          >
                            <SelectTrigger className="h-9 w-[140px] rounded-lg border-slate-200 font-semibold text-xs">
                              {updatingId === profile.id ? (
                                <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-3 w-3 animate-spin"/> Loading...</div>
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="client"><div className="flex items-center gap-2"><User className="h-3 w-3"/> Client</div></SelectItem>
                              <SelectItem value="agent"><div className="flex items-center gap-2"><Briefcase className="h-3 w-3 text-sky-600"/> Agent</div></SelectItem>
                              <SelectItem value="outsrc"><div className="flex items-center gap-2"><Truck className="h-3 w-3 text-amber-600"/> Outsrc</div></SelectItem>
                              <SelectItem value="admin"><div className="flex items-center gap-2"><ShieldAlert className="h-3 w-3 text-red-600"/> Admin</div></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}