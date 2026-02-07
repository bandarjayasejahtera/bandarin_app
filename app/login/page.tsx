"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Handler sederhana untuk loading state
  const handleSubmit = () => setIsLoading(true);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      
      {/* KIRI: Visual & Branding Area (Animated) */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-deep-space-blue-950 text-white overflow-hidden">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-[20%] -right-[20%] w-[800px] h-[800px] rounded-full bg-deep-space-blue-500 blur-3xl mix-blend-screen animate-pulse" />
            <div className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-tuscan-sun-500 blur-[120px] mix-blend-overlay" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8 w-8 bg-tuscan-sun-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-deep-space-blue-950 h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">LegalFast</span>
        </div>

        {/* Animated Greeting Text */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-extrabold leading-tight">
                {activeTab === "login" ? (
                  <>
                    Selamat Datang <br />
                    <span className="text-tuscan-sun-500">Kembali!</span>
                  </>
                ) : (
                  <>
                    Mulai Perjalanan <br />
                    <span className="text-deep-space-blue-500 text-transparent bg-clip-text bg-gradient-to-r from-tuscan-sun-500 to-amber-400">
                        Bisnis Anda.
                    </span>
                  </>
                )}
              </h1>
            </motion.div>
          </AnimatePresence>
          
          <p className="text-cool-steel-500 text-lg">
            Platform manajemen legalitas #1 di Indonesia. Cepat, transparan, dan terpercaya.
          </p>

          {/* Social Proof / Features */}
          <div className="space-y-3 pt-4">
            {["Verifikasi Otomatis", "Monitor Real-time", "Konsultasi Ahli"].map((item, i) => (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    key={item} 
                    className="flex items-center gap-3 text-cool-steel-50"
                >
                    <CheckCircle2 className="h-5 w-5 text-tuscan-sun-500" />
                    <span>{item}</span>
                </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Text */}
        <div className="relative z-10 text-sm text-cool-steel-500">
          © 2026 PT Legal Fast Indonesia. All rights reserved.
        </div>
      </div>

      {/* KANAN: Form Area */}
      <div className="flex items-center justify-center p-6 bg-cool-steel-50">
        <div className="w-full max-w-md space-y-8">
            
            {/* Mobile Logo (Only visible on small screens) */}
            <div className="lg:hidden flex justify-center mb-8">
                <div className="h-10 w-10 bg-deep-space-blue-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="text-white h-6 w-6" />
                </div>
            </div>

            <Tabs defaultValue="login" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-cool-steel-200/50 p-1">
                    <TabsTrigger value="login" className="text-base data-[state=active]:bg-white data-[state=active]:text-deep-space-blue-900 data-[state=active]:shadow-sm transition-all duration-300">Masuk</TabsTrigger>
                    <TabsTrigger value="register" className="text-base data-[state=active]:bg-white data-[state=active]:text-deep-space-blue-900 data-[state=active]:shadow-sm transition-all duration-300">Daftar</TabsTrigger>
                </TabsList>

                {/* LOGIN FORM */}
                <TabsContent value="login">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 bg-white p-8 rounded-2xl shadow-xl shadow-cool-steel-200/50 border border-white"
                    >
                        <div className="space-y-1 text-center">
                            <h2 className="text-2xl font-bold text-deep-space-blue-950">Login Akun</h2>
                            <p className="text-cool-steel-500 text-sm">Masukkan kredensial Anda untuk akses dashboard.</p>
                        </div>
                        
                        <form action={login} onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Bisnis</Label>
                                <Input id="email" name="email" type="email" placeholder="nama@perusahaan.com" className="h-11 bg-cool-steel-50 border-cool-steel-200 focus-visible:ring-deep-space-blue-500" required />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <a href="#" className="text-xs text-deep-space-blue-600 hover:underline">Lupa password?</a>
                                </div>
                                <Input id="password" name="password" type="password" className="h-11 bg-cool-steel-50 border-cool-steel-200 focus-visible:ring-deep-space-blue-500" required />
                            </div>
                            <Button className="w-full h-11 bg-deep-space-blue-600 hover:bg-deep-space-blue-700 text-white font-medium transition-all" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Masuk Sekarang"}
                            </Button>
                        </form>
                    </motion.div>
                </TabsContent>

                {/* REGISTER FORM */}
                <TabsContent value="register">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 bg-white p-8 rounded-2xl shadow-xl shadow-cool-steel-200/50 border border-white"
                    >
                        <div className="space-y-1 text-center">
                            <h2 className="text-2xl font-bold text-deep-space-blue-950">Buat Akun Baru</h2>
                            <p className="text-cool-steel-500 text-sm">Gratis konsultasi pertama untuk pendaftar baru.</p>
                        </div>

                        <form action={signup} onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-email">Email Bisnis</Label>
                                <Input id="reg-email" name="email" type="email" placeholder="nama@perusahaan.com" className="h-11 bg-cool-steel-50 border-cool-steel-200 focus-visible:ring-deep-space-blue-500" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-password">Password</Label>
                                <Input id="reg-password" name="password" type="password" placeholder="Minimal 6 karakter" className="h-11 bg-cool-steel-50 border-cool-steel-200 focus-visible:ring-deep-space-blue-500" required />
                            </div>
                            <div className="grid gap-2">
                                <Button className="w-full h-11 bg-deep-space-blue-600 hover:bg-deep-space-blue-700 text-white font-medium transition-all" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                                        <span className="flex items-center">
                                            Daftar Akun <ArrowRight className="ml-2 h-4 w-4" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                         <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">
                                Atau lanjut dengan
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full h-11 border-cool-steel-200 hover:bg-cool-steel-50 text-deep-space-blue-900">
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </Button>
                    </motion.div>
                </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-cool-steel-500 px-8">
                Dengan melanjutkan, Anda menyetujui <a href="#" className="underline hover:text-deep-space-blue-600">Syarat Layanan</a> dan <a href="#" className="underline hover:text-deep-space-blue-600">Kebijakan Privasi</a> kami.
            </p>
        </div>
      </div>
    </div>
  );
}