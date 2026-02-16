export const dynamic = "force-dynamic";

import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Pengaturan CRM
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Halaman ini sedang dalam pengembangan.
        </p>
      </div>
      <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
            <Settings className="h-12 w-12 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-center">
            Pengaturan CRM akan tersedia di sini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
