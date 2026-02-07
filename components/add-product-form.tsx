'use client'

import { useActionState } from "react";
import { createProduct } from "@/actions/product"; // <--- Import dari ACTIONS

export function AddProductForm() {
  const [state, action, isPending] = useActionState(createProduct, null);

  return (
    <form action={action} className="flex flex-col gap-4 border p-4 rounded-lg">
      
      {/* Input Nama */}
      <div>
        <label>Nama Produk</label>
        <input name="name" className="border p-2 w-full" />
        {/* Tampilkan Error dari Zod */}
        {state?.errors?.name && (
          <p className="text-red-500 text-sm">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Input Harga */}
      <div>
        <label>Harga</label>
        <input name="price" type="number" className="border p-2 w-full" />
        {state?.errors?.price && (
          <p className="text-red-500 text-sm">{state.errors.price[0]}</p>
        )}
      </div>

      {/* Tombol Submit dengan Loading State otomatis */}
      <button 
        type="submit" 
        disabled={isPending}
        className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
      >
        {isPending ? "Menyimpan..." : "Simpan Produk"}
      </button>

      {/* Pesan Sukses/Gagal Global */}
      {state?.message && (
        <p className={state.success ? "text-green-500" : "text-red-500"}>
          {state.message}
        </p>
      )}
    </form>
  );
}