import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-space-blue-50 to-white">
      {/* Navbar Simple */}
      <header className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-tuscan-sun-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-deep-space-blue-950">Bandarin</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-cool-steel-600">
          <Link href="#features" className="hover:text-deep-space-blue-600">Fitur</Link>
          <Link href="#pricing" className="hover:text-deep-space-blue-600">Harga</Link>
          <Link href="#contact" className="hover:text-deep-space-blue-600">Hubungi Kami</Link>
        </nav>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-deep-space-blue-200 text-deep-space-blue-700 hover:bg-deep-space-blue-50">
              Masuk
            </Button>
          </Link>
          <Link href="/login?tab=register">
            <Button className="bg-deep-space-blue-600 hover:bg-deep-space-blue-700 text-white">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-deep-space-blue-200 bg-deep-space-blue-50 px-3 py-1 text-sm text-deep-space-blue-800">
            <span className="flex h-2 w-2 rounded-full bg-tuscan-sun-500 mr-2"></span>
            Platform Legalitas Terpercaya #1
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-deep-space-blue-950 sm:text-6xl">
            Urus Izin Usaha <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tuscan-sun-500 to-amber-600">
              Semudah Klik.
            </span>
          </h1>
          
          <p className="text-lg text-cool-steel-500 leading-relaxed mx-auto max-w-2xl">
            Kami membantu ribuan pemilik bisnis mendapatkan legalitas resmi (NIB, PT, CV) tanpa ribet, tanpa antri, dan 100% transparan.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base bg-deep-space-blue-600 hover:bg-deep-space-blue-700 shadow-lg shadow-deep-space-blue-200">
                Mulai Konsultasi <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Pelajari Cara Kerja
            </Button>
          </div>

          <div className="pt-12 flex items-center justify-center gap-8 text-cool-steel-400 grayscale opacity-70">
            {/* Logo placeholder untuk klien/partner */}
            <div className="h-8 w-24 bg-current opacity-20 rounded"></div>
            <div className="h-8 w-24 bg-current opacity-20 rounded"></div>
            <div className="h-8 w-24 bg-current opacity-20 rounded"></div>
            <div className="h-8 w-24 bg-current opacity-20 rounded hidden sm:block"></div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
            {[
                { title: "Proses Cepat", desc: "Dokumen terbit dalam hitungan hari kerja, bukan bulan." },
                { title: "Transparan", desc: "Tracking real-time status pengajuan anda di dashboard." },
                { title: "Terjamin", desc: "Garansi uang kembali jika dokumen legalitas ditolak." }
            ].map((f, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-cool-steel-100 hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 bg-tuscan-sun-100 rounded-lg flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-tuscan-sun-600 h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-deep-space-blue-950 mb-2">{f.title}</h3>
                    <p className="text-cool-steel-500">{f.desc}</p>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}