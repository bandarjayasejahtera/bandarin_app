// import-quotes.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// GANTI NILAI DI BAWAH INI DENGAN DATA DARI DASHBOARD SUPABASE ANDA
const SUPABASE_URL = 'https://ipvookfvxbalfxusomuc.supabase.co'; // Harus diawali https://
const SUPABASE_SERVICE_ROLE_KEY = 'sb_publishable_7pG1fGeeg0J7iGBDF_eO2w_Vrh5TLoF';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function bulkImport() {
  try {
    // Pastikan file quotes.json ada di folder yang sama
    const rawData = fs.readFileSync('quotes.json', 'utf8');
    const quotesData = JSON.parse(rawData);

    console.log(`🚀 Memulai impor ${quotesData.length} kata motivasi...`);

    const chunkSize = 500;
    for (let i = 0; i < quotesData.length; i += chunkSize) {
      const chunk = quotesData.slice(i, i + chunkSize);
      
      const { error } = await supabase
        .from('motivational_quotes')
        .insert(chunk);

      if (error) {
        console.error(`❌ Gagal pada baris ke-${i}:`, error.message);
      } else {
        console.log(`✅ Berhasil memasukkan ${i + chunk.length} data...`);
      }
    }

    console.log('\n✨ Semua data berhasil dimasukkan ke database!');
  } catch (err) {
    console.error('❌ Terjadi kesalahan script:', err.message);
  }
}

bulkImport();