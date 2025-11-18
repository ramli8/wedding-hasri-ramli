# Utils Directory

This directory contains helper utilities, formatters, and small utility functions specific to the personalisasi module.

## Structure

- Utility files are organized by functionality:
  - Custom React hooks (useSomething.tsx)
  - Formatter utilities
  - Helper functions
  - Subdirectories for organizing related utilities

## Purpose

This organization makes it easy to:
- Centralize helper functions and small utilities
- Create custom hooks for reusable logic
- Separate concerns between different types of utilities
- Keep UI components clean by moving utility logic here

## Example

```
utils/
├─ hooks/
│  ├─ useBahasa.tsx         # Hook for language management
│  ├─ useTampilan.tsx       # Hook for display settings
│  └─ usePersonalisasi.tsx  # Hook for personalization features
├─ formatters/
│  └─ formatTampilan.ts     # Display formatter utilities
├─ bahasaHelpers.ts         # Language helper functions
├─ ...
```

## Usage

These utilities can be imported and used throughout the module:

```typescript
import { useBahasa } from "@/modules/personalisasi/utils/hooks/useBahasa";

// Using the custom hook
function BahasaComponent() {
  const { language, setLanguage } = useBahasa();
  
  return (
    <div>Current language: {language}</div>
  );
}
``` 