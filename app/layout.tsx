// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Pastikan font sesuai dengan project Anda
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bandarin - Jasa Perizinan OSS",
  description: "Solusi perizinan usaha cepat dan mudah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning penting untuk menghindari warning mismatch saat manipulasi tema
    <html lang="id" suppressHydrationWarning> 
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}