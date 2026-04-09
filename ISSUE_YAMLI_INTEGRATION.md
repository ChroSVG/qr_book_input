# ✨ Feature: Integrate Yamli Arabic Transliteration API

## 📋 Issue Type
- [ ] Bug Fix
- [x] Feature Request
- [ ] Documentation
- [ ] Other

---

## 🎯 Problem

Currently, the QR Inventory Management app only supports direct text input for item names and descriptions. For users who work with **Arabic text**, typing Arabic characters can be difficult if they:
- Don't have Arabic keyboard layout installed
- Are used to typing in **Arabizi/Franco-Arabic** (Latin + numbers)
- Need quick Arabic text input without switching keyboard layouts

---

## 💡 Proposed Solution

Integrate **Yamli API** (يملي) into the frontend to enable:
- ✅ **Arabizi to Arabic** transliteration (e.g., `marhaban` → `مرحبا`)
- ✅ **Smart Arabic input** without keyboard layout switching
- ✅ **Auto-detect** when user wants Arabic transliteration
- ✅ **Toggle on/off** Yamli feature per input field

---

## 📝 Use Cases

| Input (Latin/Arabizi) | Output (Arabic) | Notes |
|----------------------|-----------------|-------|
| `marhaban` | مرحبا | Basic greeting |
| `kayf 7alak?` | كيف حالك؟ | Mixed Latin + numbers |
| `maktba` | مكتبة | Common word |
| `kitab` | كتاب | Simple word |
| `al-maktaba` | المكتب | With prefix |

---

## 🔧 Technical Implementation

### **Option 1: Yamli JavaScript SDK (Recommended)**

```javascript
// Import Yamli SDK
import { Yamli } from '@yamli/sdk';

// Setup on input field
const yamli = new Yamli('input-element-id', {
  engine: 'smart',
  autoArabic: true,
  onTransliterate: (text) => console.log(text)
});
```

### **Option 2: REST API Integration**

```javascript
// Call Yamli API
const response = await fetch(
  `https://www.yamli.com/api/transliterate?text=${encodeURIComponent(text)}`
);
const arabicText = await response.json();
```

### **Option 3: Custom Implementation**

Build custom transliteration logic using mapping tables.

---

## 📦 Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add Yamli dependency |
| `src/components/ArabicInput.jsx` | New component with Yamli integration |
| `src/pages/ScanPage.jsx` | Add Arabic input support |
| `src/ui/index.js` | Export ArabicInput component |
| `README.md` | Document Yamli feature |

---

## 🎨 UI/UX Design

### **Input Field with Yamli Toggle**

```
┌─────────────────────────────────┐
│ Item Name              [🔤 AR] │  ← Toggle button
├─────────────────────────────────┤
│ مرحبا                           │  ← Arabic output
└─────────────────────────────────┘
   ↑ Type in Latin: "marhaban"
```

**Features:**
- [ ] Toggle button to enable/disable Yamli
- [ ] Visual indicator when Yamli is active
- [ ] Real-time transliteration preview
- [ ] Support for mixed Arabic/Latin text

---

## 🧪 Testing Requirements

- [ ] Test transliteration accuracy
- [ ] Test with various Arabizi formats (numbers, mixed case)
- [ ] Test toggle functionality
- [ ] Test form submission with Arabic text
- [ ] Test database storage of Arabic characters (UTF-8)
- [ ] Test display in item list and QR codes

---

## 🚀 Implementation Plan

1. **Phase 1: Setup**
   - [ ] Install Yamli SDK or setup API integration
   - [ ] Create `ArabicInput` component
   - [ ] Add toggle UI

2. **Phase 2: Integration**
   - [ ] Integrate into ScanPage form
   - [ ] Integrate into TablePage editing
   - [ ] Test real-time transliteration

3. **Phase 3: Testing**
   - [ ] Manual testing with Arabic text
   - [ ] Test database storage
   - [ ] Test QR code generation with Arabic
   - [ ] Cross-browser testing

4. **Phase 4: Documentation**
   - [ ] Update README with Arabic support
   - [ ] Add usage examples
   - [ ] Document toggle feature

---

## 📚 Resources

- **Yamli Official Docs**: https://www.yamli.com/api/docs/
- **Yamli React Wrapper**: https://github.com/adhambadr/react-yamli
- **Arabizi Reference**: https://en.wikipedia.org/wiki/Arabic_chat_alphabet

---

## 💬 Additional Notes

### **Considerations**

1. **Database Support**: SQLite already supports UTF-8, so Arabic text storage should work without changes
2. **QR Code Generation**: Need to test if QR code library handles Arabic characters correctly
3. **Backend API**: No changes needed - FastAPI already handles Unicode/UTF-8
4. **Export Features**: CSV/Excel export should preserve Arabic encoding

### **Potential Challenges**

- Yamli API may require API key or have rate limits
- Real-time transliteration might cause input lag
- Mixed Arabic/Latin text cursor behavior
- RTL (Right-to-Left) text display in input fields

---

## ✅ Acceptance Criteria

- [ ] User can toggle Yamli Arabic input on/off
- [ ] Arabizi text is converted to Arabic in real-time
- [ ] Arabic text saves correctly to database
- [ ] Arabic text displays correctly in item list
- [ ] QR codes work with Arabic text
- [ ] Export features preserve Arabic text
- [ ] No breaking changes to existing functionality
- [ ] All existing tests still pass

---

**Priority:** Medium  
**Estimated Effort:** 2-3 hours  
**Labels:** `enhancement` `frontend` `i18n` `arabic-support` `yamli`
