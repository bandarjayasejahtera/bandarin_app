// app/admin/services/[id]/fields/field-editor-client.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  GripVertical, 
  Loader2, 
  Settings2,
  Sparkles,
  Type,
  AlignLeft,
  FileUp,
  Hash
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Tambahkan ini untuk notifikasi yang lebih cantik

export function FieldEditorClient({ 
  serviceId, 
  initialFields 
}: { 
  serviceId: string; 
  initialFields: any[] 
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // LOGIC FIX 1: Menyuntikkan _uid (Unique ID) yang stabil untuk DND
  const [fields, setFields] = useState(() => 
    initialFields.map(f => ({ ...f, _uid: crypto.randomUUID() }))
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFields(items);
  };

  const addField = () => {
    setFields([...fields, { 
      _uid: crypto.randomUUID(), // LOGIC FIX 2: Tambahkan _uid acak saat create baru
      label: "", 
      field_name: "", 
      field_type: "text", 
      is_required: false, 
      placeholder: "", 
      sort_order: fields.length 
    }]);
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
    // 1. VALIDASI: Cek field kosong
    const blankFields = fields.filter(f => !f.label.trim() || !f.field_name.trim());
    if (blankFields.length > 0) {
      toast.error("Terdapat kolom Label atau Key ID yang masih kosong. Mohon lengkapi semua data.");
      return;
    }

    // 2. VALIDASI: Cek duplikasi Key ID
    const fieldNames = fields.map(f => f.field_name);
    const hasDuplicates = fieldNames.some((val, i) => fieldNames.indexOf(val) !== i);
    if (hasDuplicates) {
      toast.error("Terdapat Key ID yang ganda. Setiap field harus memiliki Key ID unik.");
      return;
    }

    setLoading(true);
    try {
      // Hapus data lama untuk refresh arsitektur
      await supabase.from('service_fields').delete().eq('service_id', serviceId);
      
      if (fields.length > 0) {
        // LOGIC FIX 3: Bersihkan _uid sebelum dikirim ke Supabase
        const fieldsToSave = fields.map((f, index) => ({
          service_id: serviceId,
          label: f.label.trim(),
          field_name: f.field_name.trim(),
          field_type: f.field_type,
          is_required: f.is_required,
          placeholder: f.placeholder || "",
          sort_order: index
        }));

        const { error } = await supabase.from('service_fields').insert(fieldsToSave);
        if (error) throw error;
      }
      
      toast.success("Arsitektur formulir berhasil dipublikasikan!");
      router.refresh();
    } catch (error: any) {
      toast.error("Gagal Sinkronisasi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-10 pb-20 transition-all duration-500">
      
      {/* HEADER ACTION */}
      <div className="sticky top-24 z-30 flex items-center justify-between p-6 bg-card/80 dark:bg-[#0B1120]/90 backdrop-blur-xl rounded-[2.5rem] border border-border dark:border-blue-900/40 shadow-xl transition-colors duration-500">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground dark:text-white leading-none mb-1 tracking-tight uppercase">Struktur Input Klien</h2>
            <p className="text-[11px] font-bold text-muted-foreground italic">Drag dan drop handle di kiri untuk menyusun urutan.</p>
          </div>
        </div>
        
        <Button 
          onClick={addField} 
          variant="outline" 
          className="h-12 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-blue-800/60 hover:border-blue-500 hover:text-blue-500 bg-transparent transition-all font-black flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-5 w-5" /> Tambah Komponen
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="fields-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {fields.map((field, index) => (
                // LOGIC FIX 4: Gunakan _uid sebagai key dan draggableId, bukan index!
                <Draggable key={field._uid} draggableId={field._uid} index={index}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative border-border dark:border-blue-900/30 bg-card dark:bg-[#0B1120] rounded-[2rem] overflow-hidden transition-all duration-300 group ${
                        snapshot.isDragging ? "shadow-2xl ring-2 ring-blue-500 z-50 scale-[1.01]" : "hover:bg-slate-50 dark:hover:bg-[#0D1629] hover:border-blue-500/40"
                      }`}
                    >
                      <CardContent className="p-8 flex items-center gap-8">
                        
                        {/* HANDLE & NOMOR */}
                        <div {...provided.dragHandleProps} className="flex items-center gap-4 min-w-[80px]">
                          <div className="p-2 text-muted-foreground hover:text-blue-500 cursor-grab active:cursor-grabbing transition-colors">
                            <GripVertical size={24} />
                          </div>
                          <span className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border dark:border-blue-900/50">
                            {index + 1}
                          </span>
                        </div>

                        {/* AREA INPUT SEJAJAR */}
                        <div className="flex-1 flex flex-row items-end gap-6">
                          
                          {/* Label Pertanyaan */}
                          <div className="flex-1 space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 min-h-[16px]">
                              <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Label Pertanyaan
                            </Label>
                            <Input 
                              value={field.label}
                              onChange={(e) => updateField(index, 'label', e.target.value)}
                              placeholder="Nama Direktur / NIK"
                              className="h-14 rounded-xl border-border dark:border-blue-800/60 bg-slate-50 dark:bg-slate-900/50 text-foreground dark:text-white font-bold focus-visible:ring-blue-500/30 transition-all cursor-text shadow-inner"
                            />
                          </div>

                          {/* Key Database */}
                          <div className="flex-1 space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground min-h-[16px]">
                              Key ID (Database)
                            </Label>
                            <Input 
                              value={field.field_name}
                              // LOGIC FIX 5: Regex yang lebih ketat untuk ID DB, buang semua karakter non-alfanumerik
                              onChange={(e) => updateField(index, 'field_name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                              placeholder="nama_direktur"
                              className="h-14 rounded-xl border-border dark:border-blue-800/60 bg-slate-50 dark:bg-slate-900/50 text-blue-600 dark:text-blue-400 font-mono text-sm shadow-inner cursor-text"
                            />
                          </div>

                          {/* Format Input */}
                          <div className="w-[220px] space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground min-h-[16px]">
                              Format Input
                            </Label>
                            <div className="relative">
                              <select 
                                className="w-full h-14 pl-5 pr-12 rounded-xl border-2 border-border dark:border-blue-800/60 bg-slate-50 dark:bg-slate-900/50 text-foreground dark:text-white text-sm font-bold appearance-none focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner cursor-pointer"
                                value={field.field_type}
                                onChange={(e) => updateField(index, 'field_type', e.target.value)}
                              >
                                <option value="text">Teks Singkat</option>
                                <option value="textarea">Paragraf</option>
                                <option value="file">Dokumen / PDF</option>
                                <option value="number">Angka</option>
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                {field.field_type === 'text' && <Type size={18} />}
                                {field.field_type === 'textarea' && <AlignLeft size={18} />}
                                {field.field_type === 'file' && <FileUp size={18} />}
                                {field.field_type === 'number' && <Hash size={18} />}
                              </div>
                            </div>
                          </div>

                          {/* Status Wajib */}
                          <div className="w-[160px] space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-transparent min-h-[16px]">
                              .
                            </Label>
                            <div 
                              onClick={() => updateField(index, 'is_required', !field.is_required)}
                              className={`flex items-center justify-center gap-3 h-14 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${
                                field.is_required 
                                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                : "border-border dark:border-blue-900/40 text-muted-foreground bg-slate-50 dark:bg-[#0D1629]"
                              }`}
                            >
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                field.is_required ? "bg-blue-500 border-blue-500" : "border-slate-300 dark:border-slate-700"
                              }`}>
                                {field.is_required && <div className="h-2 w-2 bg-white rounded-full shadow-sm" />}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">Wajib</span>
                            </div>
                          </div>
                        </div>

                        {/* DELETE ACTION */}
                        <div className="min-w-[60px] pt-7 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/50 shadow-sm cursor-pointer"
                            onClick={() => removeField(index)}
                          >
                            <Trash2 size={28} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* FLOATING ACTION SAVE */}
      <div className="fixed bottom-10 right-10 z-40">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-[2.2rem] shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center gap-4 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
          Publikasikan Arsitektur
        </Button>
      </div>
    </div>
  );
}