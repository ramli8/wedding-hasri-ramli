# Library Directory

This directory contains core infrastructure code specific to the personalisasi module. Unlike other directories:
- Unlike `utils` (which has small helpers and hooks)
- Unlike `services` (which has API endpoint implementations)
- Unlike `providers` (which has React context providers)

The `lib` directory focuses on foundational code that other parts of the module build upon.

## Structure

- Core infrastructure files organized by functionality:
  - `fetcher.ts` - Core API fetching utilities
  - `constants.ts` - Important module constants
  - `config.ts` - Configuration settings

## Purpose

This organization makes it easy to:
- Centralize infrastructure code
- Provide a foundation for other module components
- Separate core functionality from implementation details
- Create consistent patterns for module development

## Example

```
lib/
├─ fetcher.ts          # Core API fetching utilities
├─ personalisasiLib.ts # Core module functionality 
├─ constants.ts        # Module-specific constants
├─ config.ts           # Module configuration
```

## Usage

These core utility functions can be imported throughout the module:

```typescript
import { fetcherGetBackend } from "@/modules/personalisasi/lib/fetcher";

// Using the fetcher utility
const fetchBahasaSettings = async () => {
  return await fetcherGetBackend("bahasa/settings");
};
```
