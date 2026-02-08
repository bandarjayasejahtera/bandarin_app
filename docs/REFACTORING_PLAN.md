# Refactoring Plan: Admin vs User Zones

**Role:** Senior Next.js Software Architect  
**Objective:** Restructure app for clear Admin vs User separation, modular validators, and role-based route protection.

---

## 1. New File Tree (After Refactoring)

```
app/
├── (admin)/
│   ├── admin/
│   │   ├── page.tsx                    # Admin Dashboard overview
│   │   ├── products/
│   │   │   ├── page.tsx                # Product Management (list)
│   │   │   └── new/
│   │   │       └── page.tsx            # Create Product (optional)
│   │   └── orders/
│   │       └── page.tsx                # All Orders (admin view)
│   └── layout.tsx                      # Admin layout + sidebar
│
├── (user)/
│   ├── dashboard/
│   │   ├── page.tsx                    # User Dashboard overview
│   │   ├── orders/
│   │   │   ├── page.tsx                # My Orders (history)
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── form-client.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Order detail + chat
│   │   ├── chat/
│   │   │   └── page.tsx                 # (optional) Konsultasi
│   │   └── profile/
│   │       └── page.tsx                # Akun
│   └── layout.tsx                      # User layout + sidebar
│
├── login/
│   └── page.tsx
├── layout.tsx
├── page.tsx
├── globals.css
└── favicon.ico

components/
├── admin/                              # Admin-only components
│   ├── admin-sidebar.tsx
│   ├── product-form.tsx
│   └── orders-table.tsx
├── user/                               # User dashboard components
│   ├── user-sidebar.tsx
│   ├── user-bottom-nav.tsx
│   └── chat-box.tsx
├── shared/                             # Used by both (or rename: keep ui/ as shared)
│   ├── submit-button.tsx
│   └── (optional: move ui/* here or keep as components/ui)
├── ui/                                 # shadcn / primitives (shared)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── auth/
│   └── auth-form.tsx
└── providers/
    └── theme-provider.tsx

lib/
├── validators/
│   ├── auth.ts                         # loginSchema, LoginInput
│   ├── product.ts                      # productSchema, ProductInput
│   └── order.ts                        # orderSchema / applicationSchema
├── utils.ts
└── (remove schemas.ts after migration)

types/
├── auth.ts                             # User, Session, etc.
├── product.ts
├── order.ts                            # Order, Application, Service
└── index.ts                            # Re-export all (optional)

actions/
├── auth/
│   └── auth-actions.ts
├── admin/
│   ├── product-actions.ts
│   └── order-actions.ts                # Admin: list all orders, update status
└── user/
    └── order-actions.ts                # User: getServices, createApplication, getOrderDetails, sendMessage

utils/
└── supabase/
    ├── server.ts
    ├── client.ts
    └── middleware.ts
```

**URL mapping:**

| Current (before)           | New (after)                |
|---------------------------|----------------------------|
| `/dashboard`              | `/dashboard` (user)         |
| `/dashboard/orders`       | `/dashboard/orders`        |
| `/dashboard/orders/new`  | `/dashboard/orders/new`    |
| `/dashboard/orders/[id]`  | `/dashboard/orders/[id]`   |
| *(none)*                  | `/admin` (admin dashboard) |
| *(none)*                  | `/admin/products`         |
| *(none)*                  | `/admin/orders`            |

---

## 2. Example Layouts: Admin vs User

### `app/(admin)/layout.tsx` — Admin zone

```tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  FileText,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // TODO: Fetch role from profiles or auth metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) redirect("/dashboard"); // Bukan admin -> ke user dashboard

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Admin
          </Link>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Package className="h-5 w-5" /> Produk
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            <FileText className="h-5 w-5" /> Semua Pesanan
          </Link>
        </nav>
        <div className="p-4 border-t">
          <form action={signOut}>
            <Button variant="ghost" className="w-full justify-start text-red-600">
              <LogOut className="h-4 w-4 mr-2" /> Keluar
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 lg:pl-64">
        <div className="border-b bg-white px-6 h-16 flex items-center">
          <span className="text-sm text-slate-500">Admin Panel</span>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

### `app/(user)/layout.tsx` — User zone (dashboard)

```tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  FileText,
  MessageSquare,
  User,
  LogOut,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  const DesktopSidebar = () => (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white h-screen fixed left-0 top-0 z-50">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-blue-900">
          <ShieldCheck className="h-8 w-8 rounded-lg bg-blue-900 text-white flex items-center justify-center" />
          Bandarin
        </Link>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-900 font-medium">
          <Home className="h-5 w-5" /> Dashboard
        </Link>
        <Link href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
          <FileText className="h-5 w-5" /> Pesanan Saya
        </Link>
        <Link href="/dashboard/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
          <MessageSquare className="h-5 w-5" /> Konsultasi
        </Link>
        <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
          <User className="h-5 w-5" /> Akun
        </Link>
      </div>
      <div className="p-4 border-t">
        <form action={signOut}>
          <button className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg w-full font-medium">
            <LogOut className="h-5 w-5" /> Keluar
          </button>
        </form>
      </div>
    </aside>
  );

  const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 flex items-center justify-around z-50">
      <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-900">
        <Home className="h-6 w-6" /><span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link href="/dashboard/orders" className="flex flex-col items-center gap-1 text-gray-400">
        <FileText className="h-6 w-6" /><span className="text-[10px] font-medium">Pesanan</span>
      </Link>
      <Link href="/dashboard/chat" className="flex flex-col items-center gap-1 text-gray-400">
        <MessageSquare className="h-6 w-6" /><span className="text-[10px] font-medium">Chat</span>
      </Link>
      <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-gray-400">
        <User className="h-6 w-6" /><span className="text-[10px] font-medium">Akun</span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DesktopSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b px-6 flex items-center justify-between">
          <div className="lg:hidden flex items-center gap-2 font-bold text-lg text-blue-900">
            <ShieldCheck className="h-6 w-6" /> Bandarin
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Pengaturan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <button type="submit" className="w-full text-left px-2 py-1.5 text-sm text-red-600">Keluar</button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
```

**Perbedaan singkat:**

- **Admin:** Sidebar “Admin Panel”, link ke `/admin`, `/admin/products`, `/admin/orders`, dan cek `role === 'admin'` (redirect ke `/dashboard` jika bukan admin).
- **User:** Sidebar “Bandarin” (user), link ke `/dashboard`, `/dashboard/orders`, `/dashboard/chat`, `/dashboard/profile`, plus bottom nav di mobile; hanya cek user login.

---

## 3. Memecah `lib/schemas.ts` → `lib/validators/`

### `lib/validators/auth.ts`

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid." }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### `lib/validators/product.ts`

```ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 huruf"),
  price: z.coerce.number().min(1000, "Harga minimal 1000"),
});

export type ProductInput = z.infer<typeof productSchema>;
```

### `lib/validators/order.ts`

```ts
import { z } from "zod";

export const applicationSchema = z.object({
  service_id: z.string().uuid(),
  company_name: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  company_address: z.string().optional(),
  notes: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
```

**Update import di actions:**

- `actions/auth-actions.ts`: `import { loginSchema } from "@/lib/validators/auth"`
- `actions/product.ts` (atau `actions/admin/product-actions.ts`): `import { productSchema } from "@/lib/validators/product"`
- `actions/order.ts` (user): gunakan `applicationSchema` dari `@/lib/validators/order` jika validasi form dipakai di server action.

Setelah semua pindah, hapus `lib/schemas.ts`.

---

## 4. Middleware & Auth (Route Protection)

Contoh penyesuaian di root `middleware.ts` (atau di `utils/supabase/middleware.ts` lalu dipanggil dari root):

```ts
// middleware.ts (root)
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const res = await updateSession(request);

  // Optional: tambah pengecekan role untuk /admin di sini
  // jika role disimpan di JWT claims atau cookie
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Di `utils/supabase/middleware.ts` (update `updateSession`):

- `/dashboard/*` → hanya jika `user` ada; jika tidak, redirect ke `/login`.
- `/admin/*` → bisa:
  - Cek di layout admin (seperti contoh layout admin di atas: ambil `profiles.role`, redirect ke `/dashboard` jika bukan admin), atau
  - Di middleware: setelah `getUser()`, fetch role (atau dari JWT) dan redirect `/admin/*` ke `/dashboard` jika bukan admin (opsional, tergantung apakah role ada di JWT/cookie).

Rekomendasi: **proteksi admin di layout** (`app/(admin)/layout.tsx`) dengan `profiles.role === 'admin'` seperti contoh di atas; middleware hanya memastikan user sudah login untuk `/dashboard` dan `/admin`.

---

## 5. Checklist: Memindahkan & Menyesuaikan Actions

- [ ] **1. Buat folder baru**
  - [ ] `actions/auth/` (boleh tetap satu file: `auth-actions.ts`)
  - [ ] `actions/admin/` → `product-actions.ts`, `order-actions.ts` (admin: list all orders, update status)
  - [ ] `actions/user/` → `order-actions.ts` (getServices, createApplication, getOrderDetails, sendMessage)

- [ ] **2. Pindah file**
  - [ ] `actions/auth-actions.ts` → `actions/auth/auth-actions.ts` (atau tetap di root, sesuaikan konvensi)
  - [ ] `actions/product.ts` → `actions/admin/product-actions.ts`; update import schema ke `@/lib/validators/product`
  - [ ] `actions/order.ts` → pecah:
    - [ ] Fungsi admin (list all orders, update status) → `actions/admin/order-actions.ts`
    - [ ] Fungsi user (getServices, createApplication, getOrderDetails, sendMessage) → `actions/user/order-actions.ts`

- [ ] **3. Update import di halaman & komponen**
  - [ ] Cari semua `from "@/actions/order"` → ganti ke `from "@/actions/user/order-actions"` untuk halaman user (dashboard, order detail, form order).
  - [ ] Cari semua `from "@/actions/product"` → ganti ke `from "@/actions/admin/product-actions"` untuk halaman admin produk.
  - [ ] Cari semua `from "@/actions/auth-actions"` → ganti ke `from "@/actions/auth/auth-actions"` jika path berubah.

- [ ] **4. Validators**
  - [ ] Semua action yang pakai `loginSchema` → import dari `@/lib/validators/auth`
  - [ ] Semua action yang pakai `productSchema` → import dari `@/lib/validators/product`
  - [ ] Jika ada validasi form order/application → pakai `@/lib/validators/order`

- [ ] **5. Types**
  - [ ] Pindah / duplikasi `types/order.ts` ke `types/order.ts` (tetap) atau pecah ke `types/order.ts`, `types/product.ts`, `types/auth.ts` sesuai kebutuhan.
  - [ ] Pastikan action dan komponen yang pakai `Order`, `OrderStatus` tetap meng-import dari `@/types/order` (atau path baru jika diubah).

- [ ] **6. Tes**
  - [ ] Login → akses `/dashboard` dan `/dashboard/orders`, buat pesanan, buka detail + chat.
  - [ ] Login sebagai admin → akses `/admin`, `/admin/products`, `/admin/orders`.
  - [ ] User akses `/admin` → redirect ke `/dashboard`.
  - [ ] Logout → akses `/dashboard` atau `/admin` → redirect ke `/login`.

---

## 6. Urutan Eksekusi Refactoring (Rekomendasi)

1. Buat `lib/validators/auth.ts`, `product.ts`, `order.ts` dan pindahkan isi dari `lib/schemas.ts`; update import di actions; hapus `lib/schemas.ts`.
2. Buat struktur folder `app/(admin)/admin` dan `app/(user)/dashboard`; pindahkan isi dari `app/(dashboard)/dashboard/*` ke `app/(user)/dashboard/*`; hapus `app/(dashboard)`.
3. Tambah `app/(admin)/layout.tsx` dan `app/(user)/layout.tsx` (pakai contoh di atas); sesuaikan link navigasi.
4. Pindahkan komponen ke `components/admin/*`, `components/user/*`, dan sisanya ke `components/shared` atau tetap di `components/ui`.
5. Pecah dan pindah actions sesuai checklist; update semua import.
6. Update middleware (dan optional role check untuk `/admin`); tes proteksi route.
7. Buat halaman admin (dashboard, products, orders) jika belum ada; sambungkan ke `actions/admin/*`.

Setelah ini, struktur routing, layout, validators, dan actions akan mengikuti pemisahan Admin vs User dan siap dikembangkan lebih lanjut.
