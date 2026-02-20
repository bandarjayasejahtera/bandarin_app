//actions/ai/legal-assistant.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const AI_BOT_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function processAIResponse(applicationId: string, userMessage: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Cek apakah AI sedang di-pause (Mode Arin sedang aktif)
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('ai_paused_until')
      .eq('id', applicationId)
      .single();

    if (app?.ai_paused_until && new Date(app.ai_paused_until) > new Date()) {
      return { success: false, status: "ai_paused" };
    }

    // 2. Cek apakah ini percakapan pertama untuk pesan privasi?
    const { count } = await supabaseAdmin
      .from('application_messages')
      .select('*', { count: 'exact', head: true })
      .eq('application_id', applicationId);

    // Hitung apakah sudah ada pesan dari bot sebelumnya
    const { count: botMessageCount } = await supabaseAdmin
      .from('application_messages')
      .select('*', { count: 'exact', head: true })
      .eq('application_id', applicationId)
      .eq('user_id', AI_BOT_USER_ID);

    const isFirstTimeAIResponds = botMessageCount === 0;

    // 3. Deteksi Kata Kunci Handover ke Arin
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes("admin") || lowerMsg.includes("manusia") || lowerMsg.includes("staf") || lowerMsg.includes("pakar")) {
      const pauseUntil = new Date();
      pauseUntil.setSeconds(pauseUntil.getSeconds() + 300); // Jeda 5 menit

      await supabaseAdmin.from('applications').update({ ai_paused_until: pauseUntil.toISOString() }).eq('id', applicationId);
      await supabaseAdmin.from("application_messages").insert({
        application_id: applicationId,
        user_id: AI_BOT_USER_ID,
        message: "Baik, saya mengerti kebutuhan konsultasi mendalam Anda. Saya alihkan percakapan ini kepada Arin (Admin Support) kami. Mohon tunggu sebentar.",
        is_delivered: true,
      });
      return { success: true, status: "handover" };
    }

    // 4. Inisialisasi Google Gemini 2.5 Flash
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `
        Kamu Andar, Pakar Regulasi & Konsultan Investasi Senior Bandarin. 
        Wewenang: Penjelasan teknis BKPM (Investasi & Hilirisasi), OSS RBA, legalitas (PT/CV/Yayasan/Halal/HAKI), UU Cipta Kerja, PP, & Permen.
        Kantor Kami: Jl. Lintas Gunungtua - Portibi, Lantosan I, Kecamatan Portibi, Kabupaten Padang Lawas Utara, Sumatera Utara.
        
        Aturan:
        1. Jawaban solutif, bijaksana, & taktis. Max 3 paragraf.
        2. Akhiri dengan tawaran bantuan spesifik atau arahkan ke 'Admin'.
        ${isFirstTimeAIResponds ? "3. WAJIB sampaikan di akhir: Untuk privasi Anda, pesan ini akan dihapus secara otomatis dalam 7 hari." : ""}
      `,
      prompt: userMessage,
    });

    // 5. Simpan Pesan AI ke Database
    await supabaseAdmin.from("application_messages").insert({
      application_id: applicationId,
      user_id: AI_BOT_USER_ID,
      message: text,
      is_delivered: true,
    });

    return { success: true };
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return { success: false };
  }
}