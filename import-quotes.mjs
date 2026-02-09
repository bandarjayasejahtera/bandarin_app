// import-quotes.mjs
import 'dotenv/config'; // Secara otomatis memuat .env jika ada file .env
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mengatur path untuk .env.local secara manual di ESM
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Kredensial tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function bulkImport() {
  try {
    const rawData = fs.readFileSync('quotes.json', 'utf8');
    const quotesData = JSON.parse(rawData);

    console.log(`🚀 Memulai impor ${quotesData.length} data via ESM...`);

    const chunkSize = 500;
    for (let i = 0; i < quotesData.length; i += chunkSize) {
      const chunk = quotesData.slice(i, i + chunkSize);
      
      const { error } = await supabase
        .from('motivational_quotes')
        .insert(chunk);

      if (error) {
        console.error(`❌ Gagal pada batch ke-${i}:`, error.message);
      } else {
        console.log(`✅ Berhasil memasukkan ${i + chunk.length} data...`);
      }
    }

    console.log('\n✨ Selesai! Data motivasi kini sinkron di Supabase.');
  } catch (err) {
    console.error('❌ Kesalahan fatal:', err.message);
  }
}

bulkImport();