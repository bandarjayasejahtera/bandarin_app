1. Dinamisasi Statistik Dashboard
Saat ini, angka pada statistik (Belum Lunas, Proses, Selesai) masih berupa data statis (hardcoded). Kita bisa membuat fungsi untuk mengambil data riil dari tabel applications atau orders di Supabase.

Rencana: Membuat Server Action atau query langsung di dashboard untuk menghitung jumlah pengajuan berdasarkan statusnya.

Manfaat: Pengguna akan melihat progres asli dari pengajuan legalitas mereka secara real-time.

2. Implementasi Pengaturan Profil (Handedness Toggle)
Kita sudah menyiapkan logika tampilan untuk pengguna kidal di layout.tsx, namun pengguna belum memiliki cara untuk mengubah preferensi tersebut sendiri.

Rencana: Mengembangkan halaman app/(user)/dashboard/profile/page.tsx dengan form sederhana untuk memperbarui kolom handedness di tabel profiles.

Manfaat: Fitur aksesibilitas yang kita bangun benar-benar bisa digunakan oleh pengguna.

3. Integrasi sun-calc yang Lebih Akurat
Di file utils/sun-calc.ts, Anda sudah menyiapkan fungsi untuk menghitung waktu matahari terbit dan terbenam. Namun, di dashboard kita masih menggunakan jam sistem sederhana (new Date().getHours()).

Rencana: Mengintegrasikan getSunTimes ke dalam useEffect di dashboard agar penentuan kategori "Pagi", "Siang", atau "Malam" lebih presisi (misalnya menyesuaikan waktu maghrib yang berubah-ubah).

4. Fungsionalitas "Mulai Pengajuan Baru"
Tombol "Mulai Pengajuan Baru" sudah tersedia di UI dashboard.

Rencana: Menghubungkan tombol tersebut ke rute /dashboard/applications/new dan mulai membangun form pengajuan yang menggunakan schema yang sudah ada di lib/applicationSchema/schemas.ts.