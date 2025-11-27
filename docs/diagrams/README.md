# Dokumentasi Diagram DFD - Sistem Reservasi PAL

## Deskripsi Sistem

Sistem Reservasi Pengelolaan Air Limbah (PAL) UPTD Kota Bogor adalah aplikasi berbasis web yang memungkinkan pelanggan untuk melakukan reservasi layanan pengolahan air limbah secara online. Sistem ini mengintegrasikan proses registrasi, pemesanan layanan, pembayaran digital, dan penugasan staff lapangan.

## File Diagram

### 1. DFD Level 0 (Diagram Konteks)
**File:** `dfd-context-level0.drawio.xml`

Diagram konteks menunjukkan sistem PAL-Reservasi sebagai satu kesatuan dan interaksinya dengan entitas eksternal:

#### Entitas Eksternal:
| Entitas | Deskripsi |
|---------|-----------|
| **Pelanggan** | Pengguna yang melakukan registrasi, login, dan membuat reservasi layanan |
| **Admin** | Pengelola sistem yang memantau reservasi dan menugaskan staff |
| **Staff Lapangan** | Petugas yang ditugaskan untuk melakukan layanan di lokasi pelanggan |
| **Midtrans** | Payment gateway untuk proses pembayaran online |
| **WhatsApp API** | Layanan eksternal untuk pengiriman OTP dan notifikasi |

#### Aliran Data Utama:
- **Pelanggan → Sistem:** Data registrasi, login, lokasi, reservasi
- **Sistem → Pelanggan:** Konfirmasi, status reservasi, info pembayaran, info staff
- **Admin → Sistem:** Login admin, data penugasan, manajemen user
- **Sistem → Admin:** Daftar reservasi, statistik, daftar staff
- **Staff → Sistem:** Login staff
- **Sistem → Staff:** Info penugasan, detail reservasi, lokasi
- **Sistem ↔ Midtrans:** Request/callback pembayaran
- **Sistem ↔ WhatsApp:** Request/status OTP dan notifikasi

---

### 2. DFD Level 1
**File:** `dfd-level1.drawio.xml`

Diagram ini menjabarkan proses-proses detail dalam sistem:

#### Proses-Proses:
| No | Proses | Deskripsi |
|----|--------|-----------|
| 1.0 | Autentikasi & Registrasi | Mengelola login, registrasi, dan verifikasi OTP |
| 2.0 | Kelola Profil & Lokasi | Mengelola data profil dan lokasi alamat pelanggan |
| 3.0 | Kelola Reservasi | Membuat dan mengelola reservasi layanan |
| 4.0 | Proses Pembayaran | Mengelola transaksi pembayaran via Midtrans |
| 5.0 | Manajemen Admin | Dashboard admin untuk monitoring reservasi |
| 6.0 | Penugasan Staff | Menugaskan staff untuk reservasi yang sudah dibayar |
| 7.0 | Kirim Notifikasi | Mengirim OTP dan notifikasi via WhatsApp |
| 8.0 | Lihat Riwayat | Menampilkan riwayat reservasi pelanggan |

#### Data Store:
| Kode | Nama | Deskripsi |
|------|------|-----------|
| D1 | USERS | Menyimpan data pengguna (pelanggan, admin, staff) |
| D2 | USER_LOCATIONS | Menyimpan lokasi/alamat pelanggan |
| D3 | SERVICES | Menyimpan jenis layanan dan harga |
| D4 | RESERVATIONS | Menyimpan data reservasi |
| D5 | PAYMENTS | Menyimpan data pembayaran |
| D6 | ASSIGNMENTS | Menyimpan data penugasan staff |
| D7 | SCHEDULE_SLOTS | Menyimpan slot waktu layanan tersedia |

---

## Cara Membuka File

### Menggunakan draw.io Online:
1. Buka https://app.diagrams.net/
2. Pilih **File** → **Open from** → **Device**
3. Pilih file `.drawio.xml` yang ingin dibuka
4. Diagram akan terbuka dan dapat diedit

### Menggunakan draw.io Desktop:
1. Download draw.io desktop dari https://www.diagrams.net/
2. Buka aplikasi dan pilih **File** → **Open**
3. Pilih file `.drawio.xml`

### Export ke Format Lain:
- **PDF:** File → Export as → PDF
- **PNG:** File → Export as → PNG
- **SVG:** File → Export as → SVG

---

## Alur Sistem Lengkap

### Alur Registrasi:
1. Pelanggan mengisi form registrasi (nama, no. HP, password)
2. Sistem mengirim OTP ke WhatsApp
3. Pelanggan verifikasi OTP
4. Data user disimpan ke database

### Alur Reservasi:
1. Pelanggan login ke sistem
2. Pelanggan menambah lokasi (jika belum ada)
3. Pelanggan memilih layanan, tanggal, slot waktu, dan volume
4. Sistem membuat reservasi dan redirect ke pembayaran
5. Pelanggan melakukan pembayaran via Midtrans
6. Sistem update status reservasi

### Alur Admin:
1. Admin login ke dashboard
2. Admin melihat daftar reservasi yang sudah dibayar
3. Admin menugaskan staff untuk reservasi
4. Sistem mengirim notifikasi ke pelanggan dan staff

---

## Teknologi yang Digunakan

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js (Express)
- **Database:** Supabase (PostgreSQL)
- **Payment Gateway:** Midtrans
- **Notifikasi:** WhatsApp API (via Fonnte)

---

## Catatan untuk Laporan Praktik Lapang

Diagram ini dapat digunakan untuk:
1. **BAB Perancangan Sistem** - Menjelaskan aliran data sistem
2. **BAB Implementasi** - Referensi untuk menjelaskan implementasi
3. **Lampiran** - Dokumentasi teknis sistem

---

*Dibuat untuk keperluan dokumentasi Praktik Lapang*
*Sistem Reservasi PAL - UPTD Kota Bogor*
