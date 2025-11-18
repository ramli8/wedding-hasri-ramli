# Components Directory

This directory contains UI components organized by page/feature.

## Structure

- Components are grouped by page or feature in dedicated folders (e.g., `PersonalisasiPage`)
- Within each page folder, individual components are prefixed with the feature name:
  - `BahasaCard.tsx`
  - `BahasaToast.tsx`

## Purpose

This organization makes it easy to:

- Find related components for a specific page
- Maintain clear boundaries between features
- Promote reusability within feature contexts
- Keep components scoped to their parent feature

## Example

```
components/
├─ PersonalisasiPage/
│  ├─ BahasaCard.tsx
│  ├─ BahasaToast.tsx
│  └─ OtherRelatedComponent.tsx
├─ AnotherPage/
│  └─ ...
```
