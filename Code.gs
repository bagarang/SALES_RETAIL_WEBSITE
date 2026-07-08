/**
 * ============================================================================
 *  RETAIL SUPPORT CRM - CLOUD DATABASE (Google Sheets + Apps Script)
 * ============================================================================
 *  File ini dipasang di Apps Script (script.google.com), TERIKAT ke Google
 *  Sheet yang menjadi pusat database CRM (menggantikan localStorage).
 *
 *  Skema kolom di bawah ini SENGAJA dibuat identik dengan nama field yang
 *  sudah dipakai di db_toko.js / db_plan.js / db_aktifitas.js / db_intel.js /
 *  db_setup.js, supaya kode utama.html tidak perlu diubah selain bagian
 *  pengambilan & penyimpanan data (getDB/setDB).
 *
 *  CARA PAKAI (lihat juga PANDUAN_SETUP.md):
 *   1. Buat Google Sheet baru -> Extensions > Apps Script
 *   2. Hapus isi default, tempel seluruh isi file ini
 *   3. Jalankan fungsi `setupDatabase` sekali (lewat menu Run) untuk membuat
 *      sheet Setup/Toko/Plan/Aktifitas/Intel + mengisi data awal (seed)
 *   4. Deploy > New deployment > Web app
 *        - Execute as: Me
 *        - Who has access: Anyone (atau "Anyone with Google account" bila
 *          ingin dibatasi ke akun tim)
 *   5. Salin URL Web App yang dihasilkan, tempel ke API_URL di db-cloud.js
 *
 *  =========================================================================
 *  CATATAN UPDATE (PIC di kolom Aktifitas):
 *  =========================================================================
 *  Sebelumnya kolom "pic" TIDAK ada di HEADERS.aktifitas, sehingga nilai PIC
 *  yang dikirim dari form "Lapor Aktifitas Visit" di web selalu dibuang saat
 *  disimpan ke Sheet. Sekarang "pic" sudah ditambahkan ke HEADERS.aktifitas
 *  supaya tersimpan permanen.
 *
 *  Kalau Sheet Aktifitas kamu SUDAH ADA dan sudah berisi data lama (dari
 *  sebelum update ini), lakukan LANGKAH SATU KALI berikut supaya data lama
 *  ikut terisi PIC-nya:
 *    1. Buka Apps Script editor -> tempel/replace seluruh isi file ini
 *    2. Di dropdown pemilihan fungsi (atas), pilih "migrateAddPicToAktifitas"
 *    3. Klik Run (izinkan akses bila diminta)
 *    4. Cek sheet "Aktifitas" -> kolom "pic" di paling kanan sudah terisi
 *  Fungsi ini aman dijalankan berkali-kali (hanya mengisi baris yang PIC-nya
 *  masih kosong, tidak menimpa yang sudah terisi).
 * ============================================================================
 */

// ---- Nama tab sheet di spreadsheet ----------------------------------------
const SHEET_NAMES = {
  setup: 'Setup',
  toko: 'Toko',
  plan: 'Plan',
  aktifitas: 'Aktifitas',
  intel: 'Intel'
};

// ---- Urutan kolom (header) per sheet, harus sama persis dgn field JS -------
// PENTING: 'pic' ditambahkan di AKHIR array aktifitas (bukan di tengah),
// supaya kalau sheet Aktifitas kamu sudah ada, kolom baru "pic" cukup
// ditambahkan sebagai kolom PALING KANAN (setelah 'linkTersedia'), tidak
// menggeser/merusak kolom-kolom yang sudah ada.
const HEADERS = {
  toko: ['contactId','namaToko','contactPerson','jobTitle','phone','location','orderKe','status','jenisKunjungan','pic','mapsLink','targetKunjungan','lastVisit','kodeKontak'],
  plan: ['id','kontakToko','namaToko','tujuanKunjungan','pic','planDate','actualDate','priority','status','keterangan','daysUntilDue'],
  aktifitas: ['id','visitId','kontakToko','namaToko','tanggalKunjungan','orderKe','jenisKunjungan','aktifitas','kategoriSampling','sampleDescription','size','keluhanFeedback','linkFoto','keterangan','status','linkTersedia','pic'],
  intel: ['id','date','kontakToko','namaToko','kompetitor','aktivitasKompetitor','keteranganDetail','pic']
};

// Setup sheet disimpan sebagai pasangan KEY | VALUE (satu baris per opsi),
// supaya menambah/menghapus opsi dropdown bisa langsung lewat spreadsheet.
const SETUP_HEADERS = ['key', 'value'];

// =============================================================================
// ENTRY POINTS (dipanggil oleh front-end via fetch)
// =============================================================================

function doGet(e) {
  try {
    const action = (e.parameter.action || 'getAll');
    if (action === 'getAll') {
      return jsonResponse(getAllData());
    }
    return jsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheetKey = body.sheet; // 'setup' | 'toko' | 'plan' | 'aktifitas' | 'intel'
    const data = body.data;

    if (!SHEET_NAMES[sheetKey]) {
      return jsonResponse({ ok: false, error: 'Sheet tidak dikenal: ' + sheetKey });
    }

    if (sheetKey === 'setup') {
      writeSetupSheet(data);
    } else {
      writeObjectSheet(sheetKey, data);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// =============================================================================
// READ HELPERS
// =============================================================================

function getAllData() {
  return {
    setup: readSetupSheet(),
    toko: readObjectSheet('toko'),
    plan: readObjectSheet('plan'),
    aktifitas: readObjectSheet('aktifitas'),
    intel: readObjectSheet('intel')
  };
}

// Generic reader: baris 1 = header, baris berikutnya = data -> array of object
function readObjectSheet(sheetKey) {
  const sheet = getSheet(sheetKey);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = formatCell(row[i]);
      });
      return obj;
    });
}

// Setup sheet -> dikelompokkan kembali jadi { STATUS_TOKO: [...], PIC: [...] , ... }
function readSetupSheet() {
  const sheet = getSheet('setup');
  const values = sheet.getDataRange().getValues();
  const result = {};
  if (values.length < 2) return result;

  values.slice(1).forEach(row => {
    const key = row[0];
    const value = row[1];
    if (!key) return;
    if (!result[key]) result[key] = [];
    if (value !== '' && value !== null && value !== undefined) {
      result[key].push(value);
    }
  });
  return result;
}

function formatCell(value) {
  // Tanggal di Google Sheets otomatis jadi objek Date -> ubah ke 'YYYY-MM-DD'
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value;
}

// =============================================================================
// WRITE HELPERS (full-replace: seluruh isi tabel ditulis ulang setiap save)
// =============================================================================

function writeObjectSheet(sheetKey, dataArray) {
  const sheet = getSheet(sheetKey);
  const headers = HEADERS[sheetKey];

  clearBelowHeader(sheet);

  if (!dataArray || dataArray.length === 0) return;

  const rows = dataArray.map(obj => headers.map(h => (obj[h] !== undefined ? obj[h] : '')));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function writeSetupSheet(setupObj) {
  const sheet = getSheet('setup');
  clearBelowHeader(sheet);

  const rows = [];
  Object.keys(setupObj || {}).forEach(key => {
    const arr = setupObj[key] || [];
    arr.forEach(value => rows.push([key, value]));
  });

  if (rows.length === 0) return;
  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function clearBelowHeader(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function getSheet(sheetKey) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = SHEET_NAMES[sheetKey];
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan setupDatabase() dulu.');
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// MIGRASI SATU-KALI: isi kolom "pic" di sheet Aktifitas yang sudah ada
// =============================================================================
// Jalankan fungsi ini SEKALI lewat menu Run di Apps Script editor kalau sheet
// Aktifitas kamu sudah berisi data lama sebelum kolom "pic" ditambahkan.
// - Kalau header "pic" belum ada di baris 1 sheet Aktifitas, akan otomatis
//   ditambahkan sebagai kolom paling kanan.
// - Untuk tiap baris yang kolom pic-nya masih kosong, dicari PIC dari sheet
//   Toko berdasarkan kecocokan kontakToko == kodeKontak (di-trim & disamakan
//   spasinya supaya lebih toleran terhadap data hasil import Excel).
function migrateAddPicToAktifitas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aktSheet = ss.getSheetByName(SHEET_NAMES.aktifitas);
  if (!aktSheet) throw new Error('Sheet Aktifitas tidak ditemukan.');

  const values = aktSheet.getDataRange().getValues();
  if (values.length < 2) {
    SpreadsheetApp.getUi().alert('Sheet Aktifitas masih kosong, tidak ada yang perlu dimigrasi.');
    return;
  }

  const headerRow = values[0];
  let picColIndex = headerRow.indexOf('pic'); // 0-based

  // Kalau kolom "pic" belum ada di sheet, tambahkan sebagai kolom paling kanan
  if (picColIndex === -1) {
    picColIndex = headerRow.length;
    aktSheet.getRange(1, picColIndex + 1).setValue('pic');
  }

  const kontakColIndex = headerRow.indexOf('kontakToko');
  if (kontakColIndex === -1) throw new Error('Kolom "kontakToko" tidak ditemukan di sheet Aktifitas.');

  // Bangun peta kodeKontak (di-normalisasi) -> pic dari sheet Toko
  const tokoMap = buildTokoPicMap();

  const dataRows = values.slice(1);
  let filledCount = 0;

  const updatedPicColumn = dataRows.map(row => {
    const existingPic = row[picColIndex];
    if (existingPic !== undefined && existingPic !== '' && existingPic !== null) {
      return [existingPic]; // sudah terisi, jangan ditimpa
    }
    const kontakToko = normalizeKontak(row[kontakColIndex]);
    const picFound = tokoMap[kontakToko] || '';
    if (picFound) filledCount++;
    return [picFound];
  });

  aktSheet.getRange(2, picColIndex + 1, updatedPicColumn.length, 1).setValues(updatedPicColumn);

  SpreadsheetApp.getUi().alert(
    'Migrasi selesai. ' + filledCount + ' dari ' + dataRows.length +
    ' baris Aktifitas berhasil diisi PIC-nya dari sheet Toko.\n' +
    'Baris yang tidak terisi berarti kontakToko-nya tidak ditemukan persis di sheet Toko ' +
    '(cek ejaan/format kodeKontak-nya).'
  );
}

// Peta kodeKontak (dinormalisasi) -> pic, dari sheet Toko
function buildTokoPicMap() {
  const tokoSheet = getSheet('toko');
  const values = tokoSheet.getDataRange().getValues();
  const map = {};
  if (values.length < 2) return map;

  const headers = values[0];
  const kodeIdx = headers.indexOf('kodeKontak');
  const picIdx = headers.indexOf('pic');
  if (kodeIdx === -1 || picIdx === -1) return map;

  values.slice(1).forEach(row => {
    const kode = normalizeKontak(row[kodeIdx]);
    if (kode) map[kode] = row[picIdx];
  });
  return map;
}

// Trim + rapikan spasi ganda, supaya "[RTL068]  Alkaff" == "[RTL068] Alkaff"
function normalizeKontak(val) {
  return String(val || '').trim().replace(/\s+/g, ' ');
}

// =============================================================================
// SETUP / SEED - jalankan SEKALI dari editor Apps Script (menu Run)
// =============================================================================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  createSheetWithHeader(ss, SHEET_NAMES.setup, SETUP_HEADERS);
  createSheetWithHeader(ss, SHEET_NAMES.toko, HEADERS.toko);
  createSheetWithHeader(ss, SHEET_NAMES.plan, HEADERS.plan);
  createSheetWithHeader(ss, SHEET_NAMES.aktifitas, HEADERS.aktifitas);
  createSheetWithHeader(ss, SHEET_NAMES.intel, HEADERS.intel);

  writeSetupSheet(SEED_SETUP);
  writeObjectSheet('toko', SEED_TOKO);
  writeObjectSheet('plan', SEED_PLAN);
  writeObjectSheet('aktifitas', SEED_AKTIFITAS);
  writeObjectSheet('intel', SEED_INTEL);

  // Hapus sheet default "Sheet1" kalau masih kosong & belum terpakai
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert('Setup selesai! 5 sheet dibuat & diisi data awal.');
}

function createSheetWithHeader(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

// ---- Data awal (seed), identik dengan isi db_*.js saat ini -----------------

const SEED_SETUP = {
  STATUS_TOKO: ['Prospect','Cold Lead','Warm Lead','Active','Inactive','Onboarding','Non Aktif (Nomer Tidak dapat dihubungi)'],
  JENIS_KUNJUNGAN: ['Kunjungan Fisik','Remote Coverage (Call/WA)','Canvasing','Event ICI'],
  ORDER_KE: ['Mustika Aroma','Harum Wangi','Kantor','ParfuMart Bandung','ParfuMart Denpasar','ParfuMart Jogja','ParfuMart Makasar','Sumber Wangi Surabaya','Sub Agen'],
  KATEGORI_SAMPLING: ['Fast Moving','Slow Moving','Materi Edukasi','Tidak sampling (Fokus Edukasi)'],
  TASK_CATEGORIES: ['Follow Up','Sample','Meeting','Canvasing','Support (Call/WA)'],
  KOMPETITOR: ['Iberchem','Macbrame','Parfarome'],
  JENIS_AKTIVITAS_KOMPETITOR: ['Banting Harga','Promo Bundling','Launch Produk Baru','Materi Promosi','Lain-lain'],
  KELUHAN_FEEDBACK: ['Kualitas Produk','Logistik','Harga Pasar','Layanan Agen','Tidak ada keluhan'],
  ARAH_PESANAN: ['Admin Kantor','dibantu Retail Support','diarahkan ke Agen','support edukasi'],
  PIC: ['Ali','Thia'],
  TARGET_KUNJUNGAN_OPTIONS: ['1 x Sebulan','2 x Sebulan'],
  AKTIFITAS: ['Observasi Pasar','Penanganan Keluhan (Issue)','Pengecekan Rutin/Maintenance','Edukasi Produk','Monitoring Order','Follow Up Leads','Permintaan Sample Customer','Follow up'],
  STATUS_AKTIFITAS: ['Active','Pending','In Progress','Cancelled']
};

const SEED_TOKO = [
  { contactId: 'CRT00401', namaToko: 'Aneka Parfume Luzi Indonesia', contactPerson: 'Susgiharti', jobTitle: 'Owner', phone: '0857 7625 2898', location: 'Jalan Kayu Manis Rt002/Rw005 No 05a Condet Balekambang Daerah Khusus Ibukota Jakarta ID 13530', orderKe: 'Kantor', status: 'Active', jenisKunjungan: 'Kunjungan Fisik', pic: 'Ali', mapsLink: 'https://maps.app.goo.gl/o3i8jSvfaoYgjLkq5', targetKunjungan: '1 x Sebulan', lastVisit: '2026-05-25', kodeKontak: '[CRT00401] Susgiharti' },
  { contactId: 'CRT00398', namaToko: 'Aliyah Parfume', contactPerson: 'Khoironi', jobTitle: 'Owner', phone: '0877 3141 9132', location: 'Puri Delta Asri 6 Blok C2 No 14 Rt002/Rw012 Kel. Magelung Kec. Kaliwungu Selatan Kendal Jawa Tengah', orderKe: 'Kantor', status: 'Active', jenisKunjungan: 'Remote Coverage (Call/WA)', pic: 'Ali', mapsLink: 'https://maps.app.goo.gl/TC8MyY3AWXAm3kvn9', targetKunjungan: '1 x Sebulan', lastVisit: '2026-05-25', kodeKontak: '[CRT00398] Khoironi' }
];

// Data awal Plan / Aktifitas / Intel (identik dengan db_plan.js, db_aktifitas.js, db_intel.js):
const SEED_PLAN = [];
const SEED_AKTIFITAS = [];
const SEED_INTEL = [];
