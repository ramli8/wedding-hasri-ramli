# Services Directory

This directory contains service modules for external API calls and database interactions specific to the personalisasi module.

## Structure

- Service files are organized by external system or functionality:
  - `getFeature.service.ts` - Service calls for specific features
  - `updateFeature.service.ts` - Update operations for features
  - Other external system integrations

## Purpose

This organization makes it easy to:
- Centralize API/external service calls in one location
- Abstract complex API interactions away from components
- Create consistent interfaces for external systems
- Manage authentication and error handling for external services

## Example

```
services/
├─ getBahasa.service.ts       # Fetch language settings
├─ updateBahasa.service.ts    # Update language settings
├─ getTampilan.service.ts     # Fetch display settings 
├─ updateTampilan.service.ts  # Update display settings
├─ ...
```

## Usage

These services can be imported and used within components or other modules:

```typescript
import { updateBahasa } from "@/modules/personalisasi/services/updateBahasa.service";

// Using the service
async function saveBahasaSettings(data) {
  try {
    const result = await updateBahasa(data);
    // Handle success
  } catch (error) {
    // Handle error
  }
}
``` 