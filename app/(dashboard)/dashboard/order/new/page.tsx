import { getServices, createApplication } from "@/actions/order";
import { SubmitButton } from "@/components/submit-button"; // Kita buat komponen kecil ini nanti biar rapi
import { Building2, FileText, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Komponen Client-Side kecil untuk interaksi form
import { OrderFormClient } from "./form-client"; 

export default async function NewOrderPage() {
  // Ambil data layanan dari Server Action
  const services = await getServices();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Back */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Pengajuan</h1>
          <p className="text-sm text-gray-500">Pilih layanan legalitas yang Anda butuhkan</p>
        </div>
      </div>

      {/* Panggil Form Client Component */}
      <OrderFormClient services={services} createApplicationAction={createApplication} />
    </div>
  );
}