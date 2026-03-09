// app/admin/profiles/page.tsx
import { getProfiles } from "@/actions/admin/profiles";
import ProfilesClient from "@/app/admin/profiles/profiles-client";
import { Users } from "lucide-react";

export const metadata = {
  title: "Database Pengguna | Admin Panel",
};

export default async function ProfilesPage() {
  const profiles = await getProfiles();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-sky-600" />
          Database Pengguna
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola profil pengguna, klien, dan tentukan Role akses (Admin, Client, Agent, Outsrc).
        </p>
      </div>

      <ProfilesClient initialProfiles={profiles} />
    </div>
  );
}