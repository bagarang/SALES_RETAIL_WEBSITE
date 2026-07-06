# Panduan: Menyambungkan Dummy-CRM-V2 ke Google Sheets (DB Terpusat)

Sebelumnya CRM ini menyimpan data di `localStorage` browser (artinya data
hanya ada di 1 device/browser). Sekarang datanya dipindah ke **1 Google
Sheet**, jadi semua orang (Manager, Ali, Thia) melihat & mengubah data yang
sama secara real-time, seperti Excel/Google Sheet biasa — hanya saja aksesnya
lewat tampilan web CRM ini.

## Bagaimana cara kerjanya
```
Browser (utama.html) --fetch--> Apps Script Web App (Code.gs) --> Google Sheet
```
- `Code.gs` adalah "jembatan" yang membaca & menulis ke Google Sheet, dan
  menyediakannya sebagai JSON API.
- `db-cloud.js` di sisi web menggantikan fungsi `getDB`/`setDB` yang tadinya
  memakai `localStorage`, sekarang memanggil jembatan tadi.
- Semua fungsi lain di `utama.html` (render dashboard, tambah/edit/hapus
  toko, visit plan, aktifitas, intel, dsb) **tidak diubah sama sekali** —
  logikanya tetap identik dengan versi awal.

## Langkah Setup (± 10 menit)

### 1. Buat Google Sheet
1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru.
2. Beri nama misalnya **"Retail Support CRM - DATABASE"**.

### 2. Pasang Apps Script
1. Di spreadsheet tadi: menu **Extensions > Apps Script**.
2. Hapus semua kode default di `Code.gs`.
3. Salin **seluruh isi file `Code.gs`** (di paket ini) ke sana.
4. Simpan (ikon disket / Ctrl+S).

### 3. Jalankan setup sekali
1. Di toolbar Apps Script, pilih fungsi **`setupDatabase`** dari dropdown run.
2. Klik **Run**. Saat diminta izin, klik **Review permissions** → pilih akun
   Google-mu → **Advanced** → **Go to (nama project) (unsafe)** → **Allow**.
   (Ini normal untuk script buatan sendiri, bukan tanda bahaya.)
3. Setelah selesai akan muncul alert "Setup selesai!" dan spreadsheet akan
   otomatis terisi 5 sheet: `Setup`, `Toko`, `Plan`, `Aktifitas`, `Intel` —
   lengkap dengan data contoh yang sama seperti di web CRM sekarang.

### 4. Deploy sebagai Web App
1. Klik tombol **Deploy > New deployment**.
2. Klik ikon gear ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Execute as**: `Me (emailmu)`
   - **Who has access**: `Anyone` (paling mudah untuk tim internal; kalau
     ingin dibatasi hanya yang login akun Google, pilih
     `Anyone with a Google account`)
4. Klik **Deploy**, lalu **Authorize access** kalau diminta lagi.
5. Salin **Web app URL** yang muncul (bentuknya seperti
   `https://script.google.com/macros/s/XXXXXXXX/exec`).

> ⚠️ Simpan URL ini baik-baik — inilah "alamat API" database kamu.
> Setiap kali kamu mengedit `Code.gs` lagi, buat **New deployment** baru
> (atau Manage deployments > Edit > New version) supaya perubahan aktif.

### 5. Sambungkan ke web CRM
1. Buka file **`db-cloud.js`** (di paket ini) dengan text editor.
2. Ganti baris:
   ```js
   const API_URL = 'PASTE_URL_WEB_APP_APPS_SCRIPT_DISINI';
   ```
   dengan URL yang kamu salin tadi, contoh:
   ```js
   const API_URL = 'https://script.google.com/macros/s/AKfyc.../exec';
   ```
3. Simpan.

### 6. Upload ke hosting
Upload semua file (`index.html`, `utama.html`, `db-cloud.js`, `db_*.js`) ke
hosting kamu (GitHub Pages, Netlify, dsb) seperti biasa — strukturnya sama
persis, cuma nambah 1 file (`db-cloud.js`).

## Testing
1. Buka web CRM, login seperti biasa.
2. Perhatikan pojok kanan bawah: sesaat akan muncul notifikasi
   "⏳ Memuat data dari Google Sheet..." lalu hilang jika berhasil.
3. Coba tambah 1 data toko/aktifitas → cek langsung di Google Sheet, baris
   baru harus muncul di sheet `Toko`/`Aktifitas`.
4. Buka CRM dari browser/device lain (atau incognito) → data yang baru
   ditambahkan tadi harus ikut muncul. Ini artinya sudah tersentralisasi.

## Catatan penting

- **Mode offline/fallback**: kalau `API_URL` belum diisi atau Google Sheet
  sedang tidak bisa diakses, CRM akan tetap jalan memakai data contoh di
  `db_*.js`, tapi perubahan **tidak akan tersimpan** (akan muncul peringatan
  merah di pojok kanan bawah). Ini supaya aplikasi tidak "putih" total saat
  ada gangguan koneksi.
- **Tulis-ulang penuh, bukan per-baris**: setiap kali kamu simpan (tambah/
  edit/hapus 1 data), seluruh tabel terkait (mis. semua data Toko) dikirim
  ulang dan menimpa isi sheet tersebut. Ini sesuai dengan cara kerja app yang
  sudah ada (`setDB(key, seluruh_array)`), dan aman untuk pemakaian oleh
  beberapa admin sekaligus (Manager, Ali, Thia) selama mereka tidak menyimpan
  pada detik yang sama persis pada tabel yang sama. Kalau ke depannya tim
  bertambah besar dan butuh multi-user simpan bersamaan tanpa risiko
  tertimpa, kita bisa upgrade ke endpoint tambah/edit per-baris.
- **Kolom Setup**: sheet `Setup` disimpan sebagai 2 kolom (`key`, `value`) —
  satu baris per opsi dropdown (mis. baris `STATUS_TOKO | Prospect`,
  `STATUS_TOKO | Cold Lead`, dst). Kamu bisa menambah/menghapus opsi
  dropdown langsung dari spreadsheet ini kalau mau, tanpa lewat aplikasi.
- **Rumus Excel (COUNTIFS, dsb.)**: rumus-rumus itu di Excel/Google Sheet
  aslinya dipakai untuk menghitung ringkasan Dashboard. Di web CRM,
  perhitungan yang setara sudah dihitung ulang di JavaScript (fungsi
  `renderDashboard`) berdasarkan data yang sama — jadi hasilnya konsisten
  tanpa perlu menaruh rumus di sheet. Google Sheet di sini berfungsi murni
  sebagai penyimpanan data (database), bukan lembar kerja berumus.
