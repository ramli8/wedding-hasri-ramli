# Types Directory

This directory contains TypeScript type definitions specific to the personalisasi module.

## Structure

- Type files are organized by domain or feature:
  - `feature.types.ts` - Types for specific features
  - `api.types.ts` - Types for API responses and requests
  - `model.types.ts` - Types for data models

## Purpose

This organization makes it easy to:
- Define module-specific TypeScript interfaces and types
- Maintain type safety within the module
- Reuse common types across components and services
- Keep type definitions separate from implementation

## Example

```
types/
├─ bahasa.types.ts       # Types for language settings
├─ tampilan.types.ts     # Types for display settings
├─ personalisasi.types.ts # Common types for personalization
├─ ...
```

## Usage

These types can be imported and used throughout the module:

```typescript
import { BahasaSettings } from "@/modules/personalisasi/types/bahasa.types";

// Using the type
const bahasaSettings: BahasaSettings = {
  preferred: 'id',
  available: ['id', 'en']
};
``` 