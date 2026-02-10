"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

export function ServiceFormClient() {
  const router = useRouter(); 
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // State Layanan Utama dengan penambahan kolom 'price'
  const [serviceData, setServiceData] = useState({ 
    name: "", 
    code: "", 
    price: "", // Ditambahkan untuk menangani not-null constraint
    description: "" 
  });
  
  // State Field Dinamis untuk formulir user
  const [fields, setFields] = useState([
    { label: "", field_name: "", field_type: "text", is_required: false, placeholder: "" }
  ]);

  const addField = () => {
    setFields([...fields, { label: "", field_name: "", field_type: "text", is_required: false, placeholder: "" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    (newFields[index] as any)[key] = value;
    setFields(newFields);
  };

  const handleSave = async () => {
    // Validasi dasar
    if (!serviceData.name || !serviceData.code || !serviceData.price) {
      alert("Nama, Kode, dan Harga Layanan wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      // 1. Simpan ke tabel 'services' dengan menyertakan price
      const { data: service, error: sError } = await supabase
        .from('services')
        .insert({
          name: serviceData.name,
          code: serviceData.code,
          price: Number(serviceData.price), // Pastikan diconvert ke number
          description: serviceData.description
        })
        .select()
        .single();

      if (sError) throw sError;

      // 2. Simpan Field Form Dinamis ke tabel 'service_fields'
      if (fields.length > 0) {
        const fieldsToSave = fields.map((f, index) => ({
          service_id: service.id,
          label: f.label,
          field_name: f.field_name,
          field_type: f.field_type,
          is_required: f.is_required,
          placeholder: f.placeholder,
          sort_order: index
        }));

        const { error: fError } = await supabase
          .from('service_fields')
          .insert(fieldsToSave);

        if (fError) throw fError;
      }

      alert("Layanan berhasil dipublikasikan!");
      router.push('/admin/services');
      router.refresh();
    } catch (error: any) {
      console.error("Error saving service:", error);
      alert("Gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dasar Layanan */}
      <Card className="border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Nama Layanan</Label>
              <Input 
                placeholder="Contoh: Pendirian PT" 
                value={serviceData.name}
                onChange={(e) => setServiceData({...serviceData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Kode Unik</Label>
              <Input 
                placeholder="PT_BARU" 
                value={serviceData.code}
                onChange={(e) => setServiceData({...serviceData, code: e.target.value.toUpperCase().replace(/\s+/g, '_')})}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Harga Dasar (Rp)</Label>
              <Input 
                type="number"
                placeholder="0" 
                value={serviceData.price}
                onChange={(e) => setServiceData({...serviceData, price: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Deskripsi</Label>
            <textarea 
              className="w-full p-3 border rounded-xl bg-background min-h-[100px] text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="Jelaskan detail layanan..."
              value={serviceData.description}
              onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Editor Dinamis */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-black tracking-tight">Kebutuhan Data User</h2>
          <Button onClick={addField} variant="outline" size="sm" className="gap-2 font-bold border-2 border-dashed">
            <Plus size={16} /> Tambah Input
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={index} className="border-slate-200 group hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Label UI</Label>
                  <Input 
                    placeholder="Nama Direktur" 
                    value={field.label}
                    onChange={(e) => updateField(index, 'label', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Key Database</Label>
                  <Input 
                    placeholder="director_name" 
                    value={field.field_name}
                    onChange={(e) => updateField(index, 'field_name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Tipe</Label>
                  <select 
                    className="w-full p-2 border rounded-md text-sm bg-background h-10"
                    value={field.field_type}
                    onChange={(e) => updateField(index, 'field_type', e.target.value)}
                  >
                    <option value="text">Teks</option>
                    <option value="textarea">Paragraf</option>
                    <option value="file">Dokumen</option>
                    <option value="number">Angka</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pb-3">
                  <input 
                    type="checkbox" 
                    checked={field.is_required}
                    onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label className="text-xs font-bold">Wajib</Label>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-300 hover:text-red-500 mb-0.5"
                onClick={() => removeField(index)}
              >
                <Trash2 size={20} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full h-14 gap-2 font-black text-lg rounded-2xl shadow-xl hover:scale-[1.01] transition-transform" 
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
        {loading ? "Menyimpan..." : "Simpan & Publikasikan"}
      </Button>
    </div>
  );
}