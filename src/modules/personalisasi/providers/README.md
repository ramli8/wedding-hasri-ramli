# Providers Directory

This directory contains React context providers specific to the personalisasi module.

## Structure

- Provider files are organized by feature or functionality:
  - `FeatureProvider.tsx` - Context providers for specific features
  - Reusable context providers within the module

## Purpose

This organization makes it easy to:
- Encapsulate module-specific state management
- Share state across components within the module
- Isolate module state from global application state
- Create nested context hierarchies when needed

## Example

```
providers/
├─ BahasaProvider.tsx       # Provider for language settings
├─ TampilanProvider.tsx     # Provider for display settings
├─ PersonalisasiProvider.tsx # Provider for all personalization settings
├─ ...
```

## Usage

These providers can be used to wrap components within the module:

```typescript
import { BahasaProvider } from "@/modules/personalisasi/providers/BahasaProvider";

function PersonalisasiPage() {
  return (
    <BahasaProvider>
      <BahasaCard />
      <BahasaToast />
    </BahasaProvider>
  );
}
``` 