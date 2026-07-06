// =============================================================================
// db-cloud.js
// Lapisan sinkronisasi ke Google Sheet (via Google Apps Script Web App).
// Menggantikan localStorage sebagai "database" CRM, TANPA mengubah cara
// utama.html memanggil setDB(key, data) di seluruh kode (save/delete/edit).
// =============================================================================

// >>> GANTI dengan URL Web App hasil Deploy dari Code.gs <<<
const API_URL = 'https://script.google.com/macros/s/AKfycbxXwrRNlkJC68_cgnzizHTXGl-iW_7jL5h8rWTbsbAr8SjS1dRX2rCHS0ZIpJgq0gCF_Q/exec';

// Pemetaan key lama (localStorage) -> nama sheet di Code.gs
const KEY_TO_SHEET = {
  db_setup: 'setup',
  db_toko: 'toko',
  db_plan: 'plan',
  db_aktifitas: 'aktifitas',
  db_intel: 'intel'
};

// ---- Ambil seluruh data dari Google Sheet (dipanggil sekali saat load) ----
async function cloudGetAll() {
  if (!API_URL || API_URL.indexOf('PASTE_URL') === 0) {
    console.warn('API_URL belum diisi di db-cloud.js — memakai data offline (db_*.js).');
    return null;
  }
  const res = await fetch(API_URL + '?action=getAll');
  if (!res.ok) throw new Error('Gagal fetch data: HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ---- setDB: dipanggil di semua tempat di utama.html setelah data berubah --
// Dibuat "fire-and-forget" (tidak perlu di-await oleh pemanggil) supaya alur
// render tetap sama seperti versi localStorage: UI langsung update dari `db`
// yang ada di memori, lalu perubahan dikirim ke Google Sheet di belakang layar.
function setDB(key, data) {
  const sheetKey = KEY_TO_SHEET[key];
  if (!sheetKey) {
    console.error('Key tidak dikenal untuk sinkronisasi cloud:', key);
    return;
  }
  if (!API_URL || API_URL.indexOf('PASTE_URL') === 0) {
    return; // mode offline, tidak ada tempat untuk menyimpan
  }

  showCloudStatus('💾 Menyimpan ke Google Sheet...');

  fetch(API_URL, {
    method: 'POST',
    // text/plain dipakai supaya browser TIDAK mengirim preflight OPTIONS,
    // karena Apps Script Web App tidak menangani preflight CORS dengan baik.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ sheet: sheetKey, data: data })
  })
    .then(res => res.json())
    .then(result => {
      if (result.ok) {
        hideCloudStatus();
      } else {
        showCloudStatus('⚠️ Gagal menyimpan: ' + (result.error || 'unknown error'), true);
      }
    })
    .catch(err => {
      console.error('Sync error:', err);
      showCloudStatus('⚠️ Gagal menyimpan ke Google Sheet (cek koneksi internet).', true);
    });
}

// ---- Indikator kecil di pojok kanan bawah ---------------------------------
let cloudStatusTimer = null;
function showCloudStatus(message, isError) {
  const bar = document.getElementById('cloudStatusBar');
  if (!bar) return;
  bar.textContent = message;
  bar.style.display = 'block';
  bar.style.background = isError ? '#ef4444' : '#2a2438';
  bar.style.color = '#ffffff';
  bar.style.border = isError ? '1px solid #7f1d1d' : '1px solid #443c5a';

  clearTimeout(cloudStatusTimer);
  if (!isError) {
    cloudStatusTimer = setTimeout(hideCloudStatus, 2000);
  }
}
function hideCloudStatus() {
  const bar = document.getElementById('cloudStatusBar');
  if (bar) bar.style.display = 'none';
}
