# Issue: Migrate Inventory Data Table to Shadcn UI + TanStack Table

## Deskripsi Tugas
Saat ini, tabel inventaris di `frontend/src/components/DataTable.jsx` dibangun secara kustom. Kita ingin memigrasikannya menggunakan kombinasi **Shadcn UI** (untuk tampilan yang konsisten dan modern) dan **TanStack Table v8** (untuk logika pengelolaan tabel yang solid).

## Tujuan
Membuat tabel inventaris yang terlihat "Clean & Cohesive" dengan sistem desain aplikasi, serta mempertahankan dan meningkatkan fitur edit sel (inline editing).

## Langkah-langkah Implementasi

### 1. Instalasi Library
Masuk ke direktori `frontend` dan instal library yang dibutuhkan:
```bash
cd frontend
npm install @tanstack/react-table
```

### 2. Buat Komponen Primitives Table (Shadcn UI style)
Buat file baru di `frontend/src/ui/Table.jsx` yang berisi struktur dasar tabel berbasis Tailwind CSS. Komponen ini harus mengekspor elemen-elemen seperti `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, dan `TableCell`. Anda dapat mengambil referensi dari kode sumber standar Shadcn UI untuk komponen `Table`.

### 3. Implementasi Editable Cell Terintegrasi
Modifikasi atau buat komponen sel kustom (bisa menggunakan logika dari `frontend/src/components/EditableCell.jsx` yang sudah ada) agar dapat berjalan mulus di dalam `cell` renderer milik TanStack Table.
- Sel harus masuk ke mode edit ketika di-klik ganda.
- Mendukung navigasi keyboard dasar (Enter untuk menyimpan, Escape untuk membatalkan).

### 4. Refactor `DataTable.jsx`
Ubah `frontend/src/components/DataTable.jsx` agar menggunakan hooks `useReactTable` dari `@tanstack/react-table`.
- Definisikan kolom (columns) menggunakan format standar TanStack Table.
- Konfigurasikan tabel untuk merender data `items` yang diberikan dari `TablePage.jsx`.
- Pastikan interaksi seperti "Update" (saat sel diedit) dan tombol "Delete" di kolom Actions tetap berfungsi dan memanggil fungsi `onUpdate` dan `onDelete` yang berasal dari props.

### 5. Pengujian
- Pastikan tabel menampilkan semua kolom inventaris dengan benar dan rapi.
- Lakukan uji coba edit sel (double click, ubah nilai, tekan Enter). Pastikan state di UI langsung berubah (optimistic update) dan pemanggilan update ke backend berjalan tanpa memunculkan error.
- Pastikan tampilan tidak rusak (layout shift) pada saat sel berganti dari mode *display* ke mode *edit*.

## Catatan Tambahan
- **JANGAN** menggunakan AG Grid atau library tabel berat lainnya. Fokus murni pada kombinasi komponen visual Shadcn dan pengelola state TanStack Table.
- Perhatikan konsistensi warna (seperti *ring* biru atau hover *state*) agar selaras dengan komponen lain yang sudah ada di direktori `frontend/src/ui/`.
- Desain akhirnya harus terasa sangat responsif dan ringan (SPA feel).
