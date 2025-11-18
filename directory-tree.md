# Project Directory Structure

```
base-nextjs/
├── public/
│   ├── images/
│   │   ├── app/
│   │   └── icon/
│   └── [various image and icon files]
│
├── src/
│   ├── components/
│   │   ├── atoms/
│   │   │   └── [various atom components]
│   │   ├── molecules/
│   │   │   └── [various molecule components]
│   │   ├── motion/
│   │   │   └── [various motion components]
│   │   ├── organisms/
│   │   │   └── [various organism components]
│   │   └── pages/
│   │
│   ├── config/
│   ├── data/
│   ├── hooks/
│   ├── lang/
│   │
│   ├── modules/
│   │   └── [various modules]
│   │       ├── components/
│   │       ├── data/
│   │       ├── lang/
│   │       ├── lib/
│   │       ├── providers/
│   │       ├── services/
│   │       ├── types/
│   │       ├── utils/
│   │       └── validator/
│   │
│   ├── pages/
│   │   └── [various page]
│   │
│   ├── providers/
│   ├── services/
│   ├── styles/
│   ├── theme/
│   ├── types/
│   └── utils/
│       ├── auth/
│       ├── common/
│       └── [up to developer]
│
├── README.md
├── next-env.d.ts
├── next.config.js
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Key Files and Directories

### Configuration Files
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.js` - PostCSS configuration

### Source Code Structure
- `src/components/` - UI components organized by atomic design principles
  - `atoms/` - Basic, smallest components
  - `molecules/` - Combinations of atoms
  - `organisms/` - More complex combinations of molecules
  - `pages/` - Full page components

- `src/modules/` - Feature-based modules
  - Each module contains its own components, data, services, etc.

- `src/pages/` - Next.js page routes

- `src/theme/` - Styling themes and configurations

- `src/utils/` - Utility functions and helpers

- `src/providers/` - React context providers

### Static Assets
- `public/` - Publicly accessible static files
  - `images/` - Image assets 