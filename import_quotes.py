# import_quotes.py
from supabase import create_client, Client

url: str = "https://ipvookfvxbalfxusomuc.supabase.co"
key: str = "sb_secret_0Ch9zNGXH6j9VaFX5z-qLw_uiYwJork"
supabase: Client = create_client(url, key)

# Anda bisa memuat data dari file CSV menggunakan pandas
# import pandas as pd
# df = pd.read_csv('quotes.csv')
# quotes_data = df.to_dict('records')

quotes_data = [
    {"category": "pagi", "quote": "Hari baru, semangat baru untuk Bandarin!"},
    {"category": "siang", "quote": "Fokus adalah kunci efisiensi."},
    # ... ribuan data lainnya
]

def chunk_list(data, size):
    for i in range(0, len(data), size):
        yield data[i:i + size]

def bulk_import():
    print(f"Mengimpor {len(quotes_data)} data...")
    
    # Batch insert 500 baris per request
    for chunk in chunk_list(quotes_data, 500):
        try:
            response = supabase.table("motivational_quotes").insert(chunk).execute()
            print(f"Batch berhasil diimpor.")
        except Exception as e:
            print(f"Terjadi kesalahan: {e}")

if __name__ == "__main__":
    bulk_import()