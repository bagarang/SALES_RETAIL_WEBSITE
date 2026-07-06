// File: db_toko.js
// FIXED: 
//   - targetKunjungan sekarang string sesuai Excel ('1 x Sebulan', '2 x Sebulan')
//   - location sesuai data asli Excel (alamat lengkap)
//   - mapsLink sesuai URL asli dari Excel
const INIT_TOKO = [
  { 
    contactId: 'CRT00401', 
    namaToko: 'Aneka Parfume Luzi Indonesia', 
    contactPerson: 'Susgiharti', 
    jobTitle: 'Owner', 
    phone: '0857 7625 2898', 
    location: 'Jalan Kayu Manis Rt002/Rw005 No 05a Condet Balekambang Daerah Khusus Ibukota Jakarta ID 13530', 
    orderKe: 'Kantor', 
    status: 'Active', 
    jenisKunjungan: 'Kunjungan Fisik', 
    pic: 'Ali', 
    mapsLink: 'https://maps.app.goo.gl/o3i8jSvfaoYgjLkq5', 
    targetKunjungan: '1 x Sebulan', 
    lastVisit: '2026-05-25', 
    kodeKontak: '[CRT00401] Susgiharti' 
  },
  { 
    contactId: 'CRT00398', 
    namaToko: 'Aliyah Parfume', 
    contactPerson: 'Khoironi', 
    jobTitle: 'Owner', 
    phone: '0877 3141 9132', 
    location: 'Puri Delta Asri 6 Blok C2 No 14 Rt002/Rw012 Kel. Magelung Kec. Kaliwungu Selatan Kendal Jawa Tengah', 
    orderKe: 'Kantor', 
    status: 'Active', 
    jenisKunjungan: 'Remote Coverage (Call/WA)', 
    pic: 'Ali', 
    mapsLink: 'https://maps.app.goo.gl/TC8MyY3AWXAm3kvn9', 
    targetKunjungan: '1 x Sebulan', 
    lastVisit: '2026-05-25', 
    kodeKontak: '[CRT00398] Khoironi' 
  }
];
