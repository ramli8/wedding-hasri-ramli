# Language Directory

This directory contains module-specific language/translation files that are imported by the global language files.

## Structure

- Language files are organized by language code:
  - `en.ts` - English translations
  - `id.ts` - Indonesian translations
  - Other supported languages as needed

## Purpose

This organization makes it easy to:

- Modularize translations by feature/module
- Import module translations into global language files
- Maintain clean separation between feature-specific text
- Add or modify translations without affecting other modules

## Example

```
lang/
├─ en.ts       # English translations for this module
├─ id.ts       # Indonesian translations for this module
├─ ...
```

## Usage

These module language files are imported into the global language files:

```typescript
// In src/lang/en.ts
import personalisasiLangEn from "@/modules/personalisasi/lang/en";

const langEn = {
  // Other global translations...
  Personalisasi: personalisasiLangEn,
};
```
