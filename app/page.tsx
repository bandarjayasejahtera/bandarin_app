"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  FileText,
  Users,
  Building2,
  Scale,
  MessageSquare,
  Menu,
  X,
  Clock,
  Star,
  MapPin
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle"; 
import { GreetingPopup } from "@/components/ui/greeting-popup"; 

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans selection:bg-tuscan-sun-500 selection:text-deep-space-blue-950">
      
      <GreetingPopup />

      {/* --- NAVBAR (GLASS EFFECT) --- */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300 
        bg-white/90 dark:bg-deep-space-blue-950/90 backdrop-blur-lg 
        border-b border-cool-steel-100 dark:border-deep-space-blue-800 shadow-sm">
        
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg 
              bg-gradient-to-br from-deep-space-blue-600 to-deep-space-blue-900 
              dark:from-tuscan-sun-400 dark:to-tuscan-sun-600 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-6 w-6 text-white dark:text-deep-space-blue-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight leading-none text-deep-space-blue-950 dark:text-white">
                BANDARIN
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-tuscan-sun-600 dark:text-tuscan-sun-400">
                Jasa Legalitas Terpercaya
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-cool-steel-600 dark:text-cool-steel-300">
            <Link href="#layanan" className="hover:text-deep-space-blue-700 dark:hover:text-tuscan-sun-400 transition-colors">Layanan</Link>
            <Link href="#keunggulan" className="hover:text-deep-space-blue-700 dark:hover:text-tuscan-sun-400 transition-colors">Keunggulan</Link>
            <Link href="#cara-kerja" className="hover:text-deep-space-blue-700 dark:hover:text-tuscan-sun-400 transition-colors">Cara Kerja</Link>
          </nav>

          {/* CTA Buttons & Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-px bg-cool-steel-200 dark:bg-deep-space-blue-800 mx-2"></div>
            
            <Link href="/login">
              <Button variant="ghost" className="font-bold text-deep-space-blue-800 dark:text-white hover:bg-deep-space-blue-50 dark:hover:bg-deep-space-blue-900">
                Masuk
              </Button>
            </Link>
            <Link href="/login?tab=register">
              <Button className="font-bold shadow-lg hover:shadow-xl transition-all 
                bg-gradient-to-r from-tuscan-sun-500 to-tuscan-sun-600 text-white 
                dark:text-deep-space-blue-950 dark:from-tuscan-sun-400 dark:to-tuscan-sun-500 
                hover:brightness-110 border-0">
                Konsultasi Gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                {isMobileMenuOpen ? 
                    <X className="text-deep-space-blue-900 dark:text-white h-6 w-6" /> : 
                    <Menu className="text-deep-space-blue-900 dark:text-white h-6 w-6" />
                }
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-deep-space-blue-950 border-b border-cool-steel-200 dark:border-deep-space-blue-800 p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-5 z-40">
            <Link href="#layanan" className="text-base font-semibold py-2 text-deep-space-blue-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Layanan</Link>
            <Link href="#keunggulan" className="text-base font-semibold py-2 text-deep-space-blue-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Keunggulan</Link>
             <div className="h-px bg-cool-steel-100 dark:bg-deep-space-blue-800 my-2"></div>
             <Link href="/login">
               <Button variant="outline" className="w-full justify-center border-cool-steel-300 dark:border-deep-space-blue-700">Masuk</Button>
             </Link>
             <Link href="/login?tab=register">
               <Button className="w-full justify-center bg-tuscan-sun-500 text-deep-space-blue-950 font-bold">Daftar Sekarang</Button>
             </Link>
          </div>
        )}
      </header>

      {/* --- HERO SECTION (IMPACTFUL & TRUSTWORTHY) --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradient - Khas Corporate */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-deep-space-blue-50 to-white dark:from-deep-space-blue-950 dark:to-deep-space-blue-900" />
        
        {/* Accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-tuscan-sun-200/20 dark:bg-tuscan-sun-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Badge Trust */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm 
              bg-white border border-cool-steel-200 text-deep-space-blue-800
              dark:bg-deep-space-blue-900 dark:border-deep-space-blue-700 dark:text-tuscan-sun-300">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Resmi & Terdaftar Kemenkumham
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-deep-space-blue-950 dark:text-white">
              Urus Izin Usaha <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-deep-space-blue-600 to-deep-space-blue-800 dark:from-tuscan-sun-300 dark:to-tuscan-sun-500">
                Tanpa Ribet.
              </span>
            </h1>
            
            <p className="text-lg leading-relaxed text-cool-steel-600 dark:text-cool-steel-300 max-w-lg">
              Mitra terbaik pengurusan <strong>PT, CV, NIB, & HAKI</strong>. Kami menjamin legalitas bisnis Anda 100% sah, transparan, dan selesai tepat waktu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/login?tab=register">
                <Button size="lg" className="h-14 px-8 text-base font-bold shadow-xl 
                  bg-deep-space-blue-900 text-white hover:bg-deep-space-blue-800 
                  dark:bg-tuscan-sun-500 dark:text-deep-space-blue-950 dark:hover:bg-tuscan-sun-400">
                  Mulai Pengurusan
                </Button>
              </Link>
              <Link href="#cara-kerja">
                <Button variant="outline" size="lg" className="h-14 px-8 text-base font-bold border-2 
                  border-cool-steel-300 text-cool-steel-700 hover:bg-white hover:border-deep-space-blue-500
                  dark:border-deep-space-blue-700 dark:text-cool-steel-300 dark:hover:bg-deep-space-blue-800">
                  Lihat Paket Harga
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4 border-t border-cool-steel-200 dark:border-deep-space-blue-800">
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-deep-space-blue-900 dark:text-white">2.500+</span>
                    <span className="text-sm text-cool-steel-500 dark:text-cool-steel-400">Badan Usaha Berdiri</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-deep-space-blue-900 dark:text-white">99%</span>
                    <span className="text-sm text-cool-steel-500 dark:text-cool-steel-400">Tingkat Keberhasilan</span>
                </div>
            </div>
          </motion.div>

          {/* Hero Visual (Card Stack) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Decorative background shape */}
            <div className="absolute inset-0 bg-gradient-to-tr from-tuscan-sun-500 to-amber-honey-500 rounded-[2rem] rotate-3 opacity-20 dark:opacity-30 blur-sm transform translate-y-4"></div>
            
            {/* Main Interface Preview */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-deep-space-blue-700 bg-white dark:bg-deep-space-blue-900">
               <div className="p-8 space-y-6">
                  {/* Mockup Header */}
                  <div className="flex justify-between items-center">
                      <div className="space-y-1">
                          <div className="h-2 w-20 bg-tuscan-sun-500 rounded-full"></div>
                          <h3 className="font-bold text-xl text-deep-space-blue-900 dark:text-white">Dashboard Client</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-cool-steel-100 dark:bg-deep-space-blue-800"></div>
                  </div>

                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-deep-space-blue-50 dark:bg-deep-space-blue-950 border border-deep-space-blue-100 dark:border-deep-space-blue-800">
                          <FileText className="h-6 w-6 text-deep-space-blue-600 dark:text-tuscan-sun-500 mb-2" />
                          <div className="text-2xl font-bold text-deep-space-blue-900 dark:text-white">3</div>
                          <div className="text-xs text-cool-steel-500">Dokumen Diproses</div>
                      </div>
                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                          <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
                          <div className="text-2xl font-bold text-deep-space-blue-900 dark:text-white">12</div>
                          <div className="text-xs text-cool-steel-500">Izin Terbit</div>
                      </div>
                  </div>

                  {/* Timeline Mockup */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-4">
                          <div className="h-4 w-4 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900"></div>
                          <div className="flex-1 p-3 rounded-lg bg-cool-steel-50 dark:bg-deep-space-blue-800">
                              <div className="h-2 w-32 bg-cool-steel-300 dark:bg-deep-space-blue-600 rounded mb-1"></div>
                              <div className="h-2 w-20 bg-cool-steel-200 dark:bg-deep-space-blue-700 rounded"></div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="h-4 w-4 rounded-full bg-tuscan-sun-500 ring-4 ring-tuscan-sun-100 dark:ring-tuscan-sun-900/30 animate-pulse"></div>
                          <div className="flex-1 p-3 rounded-lg bg-cool-steel-50 dark:bg-deep-space-blue-800 border border-tuscan-sun-200 dark:border-tuscan-sun-800">
                              <div className="h-2 w-40 bg-cool-steel-300 dark:bg-deep-space-blue-600 rounded mb-1"></div>
                              <div className="h-2 w-24 bg-cool-steel-200 dark:bg-deep-space-blue-700 rounded"></div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- LAYANAN SECTION (CLEAN & ORGANIZED) --- */}
      <section id="layanan" className="py-24 bg-white dark:bg-deep-space-blue-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-deep-space-blue-950 dark:text-white">
              Solusi Legalitas <span className="text-tuscan-sun-500">Terlengkap</span>
            </h2>
            <p className="text-lg text-cool-steel-600 dark:text-cool-steel-300">
              Fokus kembangkan bisnis Anda, biarkan tim ahli kami yang mengurus segala kerumitan birokrasi.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Building2, 
                title: "Pendirian PT", 
                desc: "Paket lengkap Akta Notaris, SK Kemenkumham, NPWP Badan, hingga pembukaan rekening bank." 
              },
              { 
                icon: FileText, 
                title: "Pendirian CV", 
                desc: "Solusi badan usaha yang lebih terjangkau dan fleksibel untuk UMKM." 
              },
              { 
                icon: Scale, 
                title: "NIB (OSS RBA)", 
                desc: "Nomor Induk Berusaha terbit cepat hitungan jam. Resmi dan terdaftar di sistem OSS." 
              },
              { 
                icon: Users, 
                title: "Virtual Office", 
                desc: "Sewa alamat kantor bergengsi di Jakarta untuk domisili usaha dan branding." 
              },
              { 
                icon: MessageSquare, 
                title: "Konsultan Pajak", 
                desc: "Jasa pelaporan SPT Bulanan & Tahunan. Hindari denda pajak yang tidak perlu." 
              },
              { 
                icon: ShieldCheck, 
                title: "Pendaftaran Merek", 
                desc: "Lindungi nama brand dan logo bisnis Anda dari pembajakan kompetitor." 
              },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="group p-8 rounded-2xl border border-cool-steel-100 dark:border-deep-space-blue-800 
                  bg-cool-steel-50/50 dark:bg-deep-space-blue-950 hover:bg-white dark:hover:bg-deep-space-blue-800 
                  hover:shadow-xl hover:border-tuscan-sun-300 transition-all duration-300 cursor-pointer"
              >
                <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 
                  bg-white dark:bg-deep-space-blue-800 shadow-sm group-hover:bg-tuscan-sun-500 transition-colors">
                  <item.icon className="h-7 w-7 text-deep-space-blue-600 dark:text-tuscan-sun-400 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-deep-space-blue-950 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-cool-steel-600 dark:text-cool-steel-300 group-hover:text-cool-steel-500 dark:group-hover:text-cool-steel-200">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- WHY US (DARK BLUE SECTION FOR TRUST) --- */}
      <section id="keunggulan" className="py-24 bg-deep-space-blue-950 dark:bg-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
                        Mengapa Harus <span className="text-tuscan-sun-500">Bandarin?</span>
                    </h2>
                    <p className="text-lg text-cool-steel-300">
                        Di dunia legalitas yang penuh ketidakpastian, kami menawarkan kepastian harga, waktu, dan keabsahan dokumen.
                    </p>

                    <div className="space-y-6">
                        {[
                            { title: "Transparan & Jujur", desc: "Harga All-in di awal. Tidak ada biaya siluman di tengah jalan." },
                            { title: "Tracking Real-time", desc: "Pantau dokumen Anda layaknya memantau paket belanja online." },
                            { title: "Konsultasi Gratis", desc: "Tanya sepuasnya dengan konsultan hukum kami sebelum deal." }
                        ].map((feat, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-tuscan-sun-500 text-deep-space-blue-950 shadow-lg shadow-tuscan-sun-500/20">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-1">{feat.title}</h4>
                                    <p className="text-sm text-cool-steel-400">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust Card Visual */}
                <div className="relative">
                    <div className="absolute inset-0 bg-tuscan-sun-500 blur-[100px] opacity-20"></div>
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md p-10 text-center">
                        <ShieldCheck className="h-24 w-24 mx-auto mb-6 text-tuscan-sun-500" />
                        <h3 className="text-3xl font-bold text-white mb-2">100% Money Back</h3>
                        <div className="h-1 w-20 bg-tuscan-sun-500 mx-auto my-4 rounded-full"></div>
                        <p className="text-cool-steel-300 mb-8">
                            Garansi uang kembali sepenuhnya jika dokumen legalitas Anda ditolak atau tidak terbit sesuai perjanjian.
                        </p>
                        <Button className="w-full bg-white text-deep-space-blue-950 hover:bg-cool-steel-100 font-bold">
                            Hubungi Kami Sekarang
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- CTA SECTION (GOLDEN TOUCH) --- */}
      <section className="py-20 px-6 bg-white dark:bg-deep-space-blue-900">
        <div className="max-w-5xl mx-auto rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden 
          bg-gradient-to-br from-tuscan-sun-500 to-amber-honey-600">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 space-y-6">
                <h2 className="text-3xl md:text-5xl font-extrabold text-deep-space-blue-950">
                    Siap Legalkan Bisnis Anda?
                </h2>
                <p className="text-lg md:text-xl max-w-2xl mx-auto text-deep-space-blue-900/80 font-medium">
                    Jangan tunda lagi. Amankan nama brand dan izin usaha Anda sebelum diambil orang lain.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/login?tab=register">
                        <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl 
                          bg-deep-space-blue-950 text-white hover:bg-deep-space-blue-800 border-2 border-transparent">
                            Buat Akun Sekarang
                        </Button>
                    </Link>
                    <Link href="https://wa.me/" target="_blank">
                        <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-2 
                          bg-transparent text-deep-space-blue-950 border-deep-space-blue-950 hover:bg-deep-space-blue-950 hover:text-white">
                            Chat WhatsApp
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="pt-16 pb-8 border-t border-cool-steel-100 dark:border-deep-space-blue-800 
        bg-cool-steel-50 dark:bg-deep-space-blue-950">
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded flex items-center justify-center bg-deep-space-blue-900 dark:bg-white text-white dark:text-deep-space-blue-900">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-deep-space-blue-900 dark:text-white">Bandarin</span>
                </div>
                <p className="text-sm leading-relaxed text-cool-steel-600 dark:text-cool-steel-400">
                    Partner legalitas bisnis terpercaya di Indonesia. Melayani pendirian PT, CV, dan izin usaha dengan proses cepat dan transparan.
                </p>
                <div className="flex gap-4 text-cool-steel-500">
                   {/* Social Icons placeholder */}
                   <div className="h-8 w-8 bg-cool-steel-200 dark:bg-deep-space-blue-800 rounded-full"></div>
                   <div className="h-8 w-8 bg-cool-steel-200 dark:bg-deep-space-blue-800 rounded-full"></div>
                   <div className="h-8 w-8 bg-cool-steel-200 dark:bg-deep-space-blue-800 rounded-full"></div>
                </div>
            </div>
            
            <div>
                <h4 className="font-bold mb-4 text-deep-space-blue-900 dark:text-white">Layanan Utama</h4>
                <ul className="space-y-2 text-sm text-cool-steel-600 dark:text-cool-steel-400">
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Pendirian PT</Link></li>
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Pendirian CV</Link></li>
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Virtual Office</Link></li>
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Izin Usaha (NIB)</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold mb-4 text-deep-space-blue-900 dark:text-white">Perusahaan</h4>
                <ul className="space-y-2 text-sm text-cool-steel-600 dark:text-cool-steel-400">
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Tentang Kami</Link></li>
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Karir</Link></li>
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Kebijakan Privasi</Link></li>
                    <li><Link href="#" className="hover:text-tuscan-sun-500 transition-colors">Syarat & Ketentuan</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold mb-4 text-deep-space-blue-900 dark:text-white">Kantor Pusat</h4>
                <ul className="space-y-3 text-sm text-cool-steel-600 dark:text-cool-steel-400">
                    <li className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-tuscan-sun-500 shrink-0" />
                      <span>Jl. Lintas Gunungtua - Portibi Padang Lawas Utara Sumatera Utara, Indonesia</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-tuscan-sun-500 shrink-0" /> 
                      <span>Senin - Jumat (09:00 - 17:00)</span>
                    </li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-cool-steel-200 dark:border-deep-space-blue-800 text-center text-sm text-cool-steel-500 dark:text-cool-steel-400">
            &copy; {new Date().getFullYear()} PT Bandar Jaya Sejahtera. All rights reserved.
        </div>
      </footer>
    </div>
  );
}