# Solusi Yamli Arabic Transliteration

## Masalah

Yamli API hanya merespon **keyboard input fisik** dari user. Input secara programmatic (seperti `el.value = text + ' '`) tidak memicu konversi Latin → Arab untuk kata terakhir yang belum diakhiri spasi.

Saat user keluar dari field (blur/focusout) tanpa menekan Space terlebih dahulu:
1. Yamli **me-revert** kata terakhir yang belum dikonversi kembali ke Latin
2. React state membaca nilai setelah revert → **Latin tersimpan**, bukan Arab

## Solusi: Intercept + execCommand + Delayed Read

### Alur Kerja

```
User mengetik: "alkul" → Yamli convert per-kata saat ada spasi
User tekan Tab/Enter/Klik field lain
  ↓
[1] INTERCEPT handler menangkap event SEBELUM focusout
    - Tab, Enter, atau click di luar field
    ↓
[2] execCommand('insertText', false, ' ')
    - Menambahkan spasi secara programmatic
    - Yamli merespon execCommand dan mengkonversi kata terakhir → Arab
    ↓
[3] setTimeout 80ms
    - Memberi waktu Yamli selesai konversi
    - Baca nilai Arab dari DOM → simpan ke convertedValuesRef
    ↓
[4] FOCUSOUT CAPTURE (fallback, 100ms delay)
    - Hanya save jika ref masih kosong (tidak di-overwrite)
    ↓
[5] handleFieldBlur (debug only)
    - Hanya log, TIDAK update ref
```

### Komponen Utama

#### 1. Intercept Handler (`handleKeyBeforeBlur`)
- Menangkap Tab dan Enter **sebelum** focusout terjadi
- `e.preventDefault()` untuk mencegah default behavior
- `el.focus()` untuk memastikan elemen tetap fokus
- `execCommand('insertText', ' ')` untuk memicu Yamli

#### 2. Delayed Read (80ms)
- `setTimeout(() => { ... }, 80)` menunggu Yamli selesai konversi
- Baca `el.value.trimEnd()` → simpan ke `convertedValuesRef.current[field]`
- Update React state untuk UI sync

#### 3. Focusout Capture (fallback, 100ms)
- Hanya menyimpan jika ref masih kosong
- Mencegah overwrite dari intercept handler
- Delay lebih lama (100ms) untuk memastikan konversi selesai

#### 4. handleFieldBlur (debug only)
- Hanya logging, **tidak** update ref
- Mencegah race condition dengan intercept handler

### Kode Inti

```javascript
// Intercept Tab dan Enter
const handleKeyBeforeBlur = (e) => {
  if ((e.key === 'Tab' || e.key === 'Enter') && document.activeElement === el) {
    e.preventDefault();
    const currentVal = el.value;
    if (currentVal && !currentVal.endsWith(' ')) {
      el.focus();
      const worked = document.execCommand('insertText', false, ' ');
      // Delayed read
      setTimeout(() => {
        const convertedVal = el.value.trimEnd();
        const field = id.replace('yamli-item-', '');
        convertedValuesRef.current[field] = convertedVal;
        setForm(prev => ({ ...prev, [field]: convertedVal }));
      }, 80);
    }
  }
};
```

### Catatan Penting

1. **`document.execCommand('insertText')`** — satu-satunya cara reliable untuk memicu Yamli secara programmatic. `el.value + ' '` dan `dispatchEvent(new Event('input'))` tidak bekerja.

2. **Delay timing** — 80ms cukup untuk Yamli convert. Terlalu singkat (< 50ms) = baca sebelum convert selesai. Terlalu lama (> 150ms) = Yamli sudah revert.

3. **Ref pattern** — `convertedValuesRef` menyimpan nilai Arab terpisah dari React state. Save dan Restore selalu membaca dari ref, bukan state.

4. **Debug logs** — semua log prefix `[Yamli ...]`. Untuk disable: `window.__yamliDebugIntervals?.forEach(clearInterval)`.

### Files

| File | Deskripsi |
|------|-----------|
| `frontend/src/pages/ScanPage.jsx` | Main page: intercept handlers, convertedValuesRef, save/restore logic |
| `frontend/src/components/HistoryInput.jsx` | Reusable input component with history dropdown |
| `frontend/src/components/TextAreaWithHistory.jsx` | Reusable textarea with history dropdown |
| `frontend/src/hooks/useFieldHistory.js` | Custom hook for per-field history management |

### Testing Checklist

- [ ] Ketik Latin → Tab → ref menyimpan Arab ✅
- [ ] Ketik Latin → Enter → ref menyimpan Arab ✅
- [ ] Ketik Latin → Klik field lain → ref menyimpan Arab ✅
- [ ] Ketik Latin + Space manual → ref menyimpan Arab ✅
- [ ] Save → database menyimpan Arab ✅
- [ ] Restore → form menampilkan Arab ✅
