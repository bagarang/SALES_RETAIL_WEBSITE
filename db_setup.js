// File: db_setup.js
// FIXED: Disesuaikan dengan data Setup sheet di Excel
const INIT_SETUP = {
  STATUS_TOKO: [
    'Prospect',
    'Cold Lead',
    'Warm Lead',
    'Active',
    'Inactive',
    'Onboarding',
    'Non Aktif (Nomer Tidak dapat dihubungi)'
  ],
  JENIS_KUNJUNGAN: [
    'Kunjungan Fisik',
    'Remote Coverage (Call/WA)',
    'Canvasing',
    'Event ICI'
  ],
  ORDER_KE: [
    'Mustika Aroma',
    'Harum Wangi',
    'Kantor',
    'ParfuMart Bandung',
    'ParfuMart Denpasar',
    'ParfuMart Jogja',
    'ParfuMart Makasar',
    'Sumber Wangi Surabaya',
    'Sub Agen'
  ],
  KATEGORI_SAMPLING: [
    'Fast Moving',
    'Slow Moving',
    'Materi Edukasi',
    'Tidak sampling (Fokus Edukasi)'
  ],
  TASK_CATEGORIES: [
    'Follow Up',
    'Sample',
    'Meeting',
    'Canvasing',
    'Support (Call/WA)'
  ],
  KOMPETITOR: [
    'Iberchem',
    'Macbrame',
    'Parfarome'
  ],
  JENIS_AKTIVITAS_KOMPETITOR: [
    'Banting Harga',
    'Promo Bundling',
    'Launch Produk Baru',
    'Materi Promosi',
    'Lain-lain'
  ],
  KELUHAN_FEEDBACK: [
    'Kualitas Produk',
    'Logistik',
    'Harga Pasar',
    'Layanan Agen',
    'Tidak ada keluhan'
  ],
  ARAH_PESANAN: [
    'Admin Kantor',
    'dibantu Retail Support',
    'diarahkan ke Agen',
    'support edukasi'
  ],
  PIC: [
    'Ali',
    'Thia'
  ],
  TARGET_KUNJUNGAN_OPTIONS: [
    '1 x Sebulan',
    '2 x Sebulan'
  ],
  AKTIFITAS: [
    'Observasi Pasar',
    'Penanganan Keluhan (Issue)',
    'Pengecekan Rutin/Maintenance',
    'Edukasi Produk',
    'Monitoring Order',
    'Follow Up Leads',
    'Permintaan Sample Customer',
    'Follow up'
  ],
  STATUS_AKTIFITAS: [
    'Active',
    'Pending',
    'In Progress',
    'Cancelled'
  ]
};
