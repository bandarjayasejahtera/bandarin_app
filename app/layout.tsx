//app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GreetingPopup } from "@/components/ui/greeting-popup";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bandarin | Jasa Legalitas & Perizinan",
  description: "Solusi perizinan usaha cepat dan terpercaya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={inter.className}>
        <ThemeProvider>
          {/* Greeting Popup muncul global di semua halaman */}
          <GreetingPopup />
          
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}