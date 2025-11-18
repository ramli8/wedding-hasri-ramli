# Data Directory

This directory contains static data files used throughout the personalisasi module.

## Structure

- Data files can be organized in various formats:
  - JSON files (`.json`)
  - JavaScript/TypeScript constants (`.ts`, `.js`)
  - Other structured data formats

## Purpose

This organization makes it easy to:

- Centralize all static data in one location
- Access common data elements across components
- Maintain configuration separate from component logic
- Update static content without modifying component code

## Example

```
data/
├─ days.json
├─ constants.ts
├─ mock/
│  └─ sample-responses.json
├─ ...
```
