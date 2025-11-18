# Validator Directory

This directory contains validation schemas and rules specific to the personalisasi module.

## Structure

- Validation files are organized by feature or form:
  - `formName.validator.ts` - Validation schemas for specific forms
  - Common validation rules shared across forms

## Purpose

This organization makes it easy to:
- Centralize form validation logic
- Reuse validation rules across components
- Keep validation separate from UI components
- Maintain consistent validation patterns

## Example

```
validator/
├─ profile.validator.ts     # Validation schemas for profile forms
├─ settings.validator.ts    # Validation schemas for settings forms
├─ common.validator.ts      # Shared validation rules
├─ ...
```

## Usage

These validation schemas can be imported into form components:

```typescript
import { profileSchema } from "@/modules/personalisasi/validator/profile.validator";

// Use the validation schema
const form = useForm({
  resolver: yupResolver(profileSchema)
});
```
