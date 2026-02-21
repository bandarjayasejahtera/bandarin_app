# 🚀 XENDIT PAYMENT SETUP GUIDE
## Bandarin — Sistem Payment Gateway Lengkap

---

## 1. DATABASE MIGRATION (Jalankan di Supabase SQL Editor)

```sql
-- ✅ Tambah kolom payment ke tabel applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed')),
  ADD COLUMN IF NOT EXISTS payment_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_paid_at TIMESTAMPTZ;

-- ✅ Buat tabel application_logs (untuk timeline audit trail)
CREATE TABLE IF NOT EXISTS application_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status_title  TEXT NOT NULL,
  description   TEXT,
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_app_logs_application_id 
  ON application_logs(application_id);

CREATE INDEX IF NOT EXISTS idx_applications_invoice_id 
  ON applications(payment_invoice_id);

-- RLS: Klien hanya bisa baca log miliknya sendiri
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Klien baca log sendiri" ON application_logs
  FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin bisa baca semua log" ON application_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service Role bisa insert log (untuk webhook)
CREATE POLICY "Service role insert log" ON application_logs
  FOR INSERT
  WITH CHECK (true);
```

---

## 2. ENVIRONMENT VARIABLES (.env.local)

```env
# Supabase (sudah ada)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # WAJIB untuk webhook!

# Xendit
XENDIT_SECRET_KEY=xnd_production_xxxx   # atau xnd_development_xxxx untuk testing
XENDIT_WEBHOOK_TOKEN=token-rahasia-xendit-anda-buat-sendiri

# URL Aplikasi (untuk redirect setelah bayar)
NEXT_PUBLIC_APP_URL=https://bandarin.vercel.app  # atau http://localhost:3000
```

---

## 3. FILE YANG PERLU DISALIN KE PROYEK

```
COPY ke proyek Anda:
├── app/api/webhooks/xendit/route.ts          ← NEW (ganti ruote.ts lama!)
├── actions/payment.ts                         ← UPDATED
├── components/payment/
│   ├── payment-button.tsx                     ← UPDATED
│   ├── payment-status-banner.tsx              ← NEW
│   └── payment-success-toast.tsx             ← NEW
└── app/client/applications/[id]/page.tsx     ← UPDATED
```

### ⚠️ HAPUS file lama:
```bash
rm app/api/webhooks/xendit/ruote.ts   # Typo — harus dihapus!
```

---

## 4. KONFIGURASI WEBHOOK DI XENDIT DASHBOARD

1. Login ke **https://dashboard.xendit.co**
2. Buka **Settings → Webhooks**
3. Tambah URL webhook:
   - **Production:** `https://bandarin.vercel.app/api/webhooks/xendit`
   - **Development:** Gunakan ngrok (lihat bagian 5)
4. Centang event: `Invoice Paid`, `Invoice Expired`, `Invoice Failed`
5. Copy **Webhook Verification Token** → paste ke `.env.local` sebagai `XENDIT_WEBHOOK_TOKEN`

---

## 5. TESTING LOKAL DENGAN NGROK

```bash
# Install ngrok
npm install -g ngrok

# Jalankan Next.js dev server
npm run dev

# Di terminal lain, expose localhost
ngrok http 3000

# Salin URL ngrok (contoh: https://abc123.ngrok.io)
# Set di Xendit Dashboard: https://abc123.ngrok.io/api/webhooks/xendit
```

### Test manual webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: YOUR_WEBHOOK_TOKEN" \
  -d '{
    "external_id": "ORDER-XXXXXXXX-1234567890",
    "status": "PAID",
    "paid_at": "2024-01-01T10:00:00Z",
    "amount": 1500000
  }'
```

---

## 6. ALUR PEMBAYARAN LENGKAP

```
1. Admin set quoted_price → status='quoted'
2. Klien lihat PaymentStatusBanner → klik "BAYAR SEKARANG"
3. createPaymentToken() → Xendit invoice dibuat (24 jam)
4. Klien diarahkan ke halaman Xendit
5. Klien bayar via Bank/E-wallet/QRIS
6. Xendit kirim webhook → /api/webhooks/xendit
7. Webhook update: payment_status='paid', status='process'
8. Notifikasi otomatis ke klien + admin
9. Klien redirect ke /client/applications/[id]?payment=success
10. Toast konfirmasi + banner hijau tampil
```

---

## 7. STATUS PAYMENT YANG DIDUKUNG

| `payment_status` | Arti | Tampilan di UI |
|---|---|---|
| `pending` | Belum bayar / invoice belum dibuat | — |
| `paid` | Pembayaran dikonfirmasi | Banner hijau ✅ |
| `expired` | Invoice kadaluarsa (>24 jam) | Banner kuning ⏰ |
| `failed` | Pembayaran gagal | — |

---

## 8. CHECKLIST DEPLOYMENT

- [ ] Jalankan SQL migration di Supabase
- [ ] Set semua environment variables di Vercel/server
- [ ] Hapus file `ruote.ts` yang lama
- [ ] Salin semua file baru ke proyek
- [ ] Konfigurasi webhook URL di Xendit Dashboard
- [ ] Test dengan Xendit sandbox (mode development)
- [ ] Test end-to-end: buat order → set harga → bayar → konfirmasi webhook
- [ ] Switch ke production key Xendit saat siap live
