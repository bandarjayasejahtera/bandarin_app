"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  FileText, 
  Users, 
  Settings,
  LucideIcon 
} from "lucide-react";

// Definisi struktur item navigasi
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Manajemen Layanan', href: '/admin/services', icon: Layers },
  { label: 'Daftar Pesanan', href: '/admin/services/orders', icon: FileText },
  { label: 'Database Klien', href: '/admin/clients', icon: Users },
  { label: 'Pengaturan CRM', href: '/admin/settings', icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-6 space-y-2">
      {navItems.map((item) => {
        // Logika Active State: 
        // 1. Pathname sama persis dengan href
        // 2. Untuk sub-halaman (kecuali root /admin), cek apakah pathname diawali dengan href tersebut
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group ${
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white"
            }`}
          >
            <item.icon className={`h-5 w-5 transition-colors duration-300 ${
              isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
            }`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}