'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Ambil data dari form
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Proses Login ke Supabase
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // [!code warning] Ubah redirect error ke root '/'
    return redirect('/?message=Gagal login: ' + error.message)
  }

  // Jika sukses, refresh data dan pindah ke dashboard
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Ambil data form
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Proses Daftar ke Supabase
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    // [!code warning] Ubah redirect error ke root '/'
    return redirect('/?message=Gagal daftar: ' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}