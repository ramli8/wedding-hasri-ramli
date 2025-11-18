# Modules Directory

This directory contains feature-based modules that organize related code into self-contained units. Each module represents a distinct feature or domain of the application.

## Architecture Philosophy

The modular architecture follows these principles:

- **Feature-Based Organization**: Code is organized by feature rather than technical role
- **Self-Contained Modules**: Each module contains everything needed for a specific feature
- **Flexible Structure**: Folder structure within modules adapts to meet specific feature requirements
- **Separation of Concerns**: Clear boundaries between different aspects of the feature

## Common Module Structure

While module structure is flexible and can adapt to specific needs, a typical module may include:

```
module-name/
├─ components/       # UI components specific to this module
├─ lib/              # Core infrastructure and foundational code
├─ utils/            # Helper functions and custom hooks
├─ services/         # External API/service integrations
├─ providers/        # React context providers for state management
├─ types/            # TypeScript type definitions
├─ validator/        # Form validation schemas
├─ data/             # Static data and constants
├─ lang/             # Localization/translation files
```

## Directory Purpose Overview

| Directory | Purpose |
|-----------|---------|
| `components/` | UI components organized by page/feature |
| `lib/` | Core infrastructure code and foundational utilities |
| `utils/` | Helper functions, formatters, and custom hooks |
| `services/` | External API and service integrations |
| `providers/` | React context providers for state management |
| `types/` | TypeScript type definitions |
| `validator/` | Form validation schemas |
| `data/` | Static data and configuration |
| `lang/` | Localization/translation files |

## Important Considerations

- Not every module needs all these directories
- Create only the directories that are relevant to your feature
- Feel free to add other directories as needed for your specific requirements
- The structure should serve the feature, not constrain it
- Each directory should have its own README.md explaining its specific purpose

## Example Module: Personalisasi

The personalisasi module demonstrates this architecture and can serve as a reference implementation:

```
personalisasi/
├─ components/       # UI components like BahasaCard, etc.
├─ lib/              # Core utilities like fetcher.ts
├─ utils/            # Hooks like useBahasa.tsx, etc.
├─ services/         # Services like getBahasa.service.ts
├─ providers/        # Providers like BahasaProvider.tsx
├─ types/            # Types like bahasa.types.ts
├─ validator/        # Validation schemas
├─ data/             # Static data files
├─ lang/             # Language files (en.ts, id.ts)
``` 