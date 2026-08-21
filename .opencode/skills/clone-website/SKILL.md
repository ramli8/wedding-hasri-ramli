---
name: clone-website
description: Reverse-engineer and clone one or more websites — extracts assets, CSS, and content section-by-section and dispatches parallel builder agents as it goes. Use when the user wants to clone, replicate, rebuild, reverse-engineer, or copy any website. Also triggers on "make a copy of this site", "rebuild this page", "pixel-perfect clone". Provide one or more target URLs as arguments.
---

# Clone Website

You are about to reverse-engineer and rebuild the target URL(s) as pixel-perfect clones into this project.

When multiple URLs are provided, preserve every pathname as a distinct route and isolate each target's research, screenshots, components, and assets. Parallelize page work only after the shared foundation and output plan are fixed so concurrent builders cannot overwrite one another.

This is not a two-phase process (inspect then build). You are a **foreman walking the job site** — as you inspect each section of the page, you write a detailed specification to a file, then hand that file to a specialist builder agent with everything they need. Extraction and construction happen in parallel, but extraction is meticulous and produces auditable artifacts.

## Scope Defaults

The target is whatever page the user's URL resolves to. Clone exactly what's visible at that URL. Unless the user specifies otherwise, use these defaults:

- **Fidelity level:** Pixel-perfect — exact match in colors, spacing, typography, animations
- **In scope:** Visual layout and styling, component structure and interactions, responsive design, mock data for demo purposes
- **Out of scope:** Real backend / database, authentication, real-time features, SEO optimization, accessibility audit
- **Customization:** None — pure emulation

## Tech Stack

The clone output targets this project's existing stack:

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with `@import "tailwindcss"` (no tailwind.config.js)
- **CSS custom properties** for design tokens in `app/globals.css`

## Output Structure

Every clone target produces this layout:

```
frontend/
  app/
    <route>/page.tsx          # Next.js route pages
  src/
    components/
      ui/                     # shadcn/ui primitives (if needed)
    lib/
      utils.ts                # cn() utility (already exists)
  public/
    images/                   # Downloaded images from target site
    videos/                   # Downloaded videos from target site
  docs/
    research/
      <target-domain>/
        DESIGN_TOKENS.md      # Extracted colors, typography, spacing
        COMPONENT_INVENTORY.md # Every component with structure notes
        LAYOUT_ARCHITECTURE.md # Page layouts, grid system, responsive
        INTERACTION_PATTERNS.md # Animations, transitions, hover states
        spec-<section>.md     # Per-section builder specs
```

## Workflow

### Step 1: Plan & Research (Foreman)

1. Visit the target URL(s) with WebFetch to get the HTML structure
2. Take mental snapshots of each section — hero, nav, content blocks, footer
3. Write an output plan listing every section and its route

### Step 2: Extract Per-Section

For each section, create a detailed spec file (`docs/research/<target>/spec-<section>.md`) containing:

- **Visual description** — what the section looks like
- **Exact CSS values** — colors (hex/rgb), font sizes, padding, margins, border-radius
- **Layout** — grid/flex structure, column counts, gap sizes
- **Responsive behavior** — how it changes at mobile/tablet/desktop
- **Content** — real text, image URLs, icon names
- **Interactions** — hover states, animations, scroll effects
- **Component structure** — proposed React component hierarchy

### Step 3: Dispatch Builder Agents

For each section spec, launch a builder agent (using `task` tool with `general` subagent) that:
1. Reads the spec file
2. Creates the React component(s)
3. Adds CSS/Tailwind styles
4. Downloads and places assets in `public/images/`
5. Verifies with `npm run lint` and `npm run typecheck`

### Step 4: Assemble Routes

Wire section components into page routes under `app/`.

### Step 5: Verify

Run `rtk npm run build` and do a visual QA pass.

## Inspection Checklist

When examining a target website, capture:

### Design Tokens
- [ ] **Colors** — background, text (primary/secondary/muted), accent, border, hover, error, success
- [ ] **Typography** — font family, sizes (h1-h6, body, caption), weights, line heights, letter spacing
- [ ] **Spacing** — padding/margin patterns (4px, 8px, 12px, 16px, 24px, 32px scale)
- [ ] **Border radius** — buttons, cards, avatars, inputs
- [ ] **Shadows/elevation** — card shadows, dropdown shadows, modal overlay
- [ ] **Breakpoints** — when does the layout shift?

### Components
- [ ] Navigation (top bar, sidebar, bottom bar)
- [ ] Cards / list items
- [ ] Buttons and links (all variants)
- [ ] Forms and inputs
- [ ] Modals, dialogs, dropdowns
- [ ] Tabs, segmented controls
- [ ] Loading states, skeletons
- [ ] Empty states, error states

### Layout
- [ ] Grid system — CSS Grid? Flexbox? Fixed widths?
- [ ] Column count at each breakpoint
- [ ] Max-width of main content area
- [ ] Sticky elements (header, sidebar, floating buttons)
- [ ] Z-index layers
- [ ] Scroll behavior

### Technical
- [ ] Framework detection (`__NEXT_DATA__`, `__NUXT__`, etc.)
- [ ] CSS approach (Tailwind, CSS Modules, Styled Components)
- [ ] Animation library (Framer Motion, GSAP, CSS only)
- [ ] Font loading strategy
- [ ] Image strategy (CDN, lazy loading, srcset, formats)

## Extraction Rules

- **Don't approximate CSS classes.** "It looks like `text-lg`" is wrong if the computed value is `18px` and `text-lg` is `18px/28px` but the actual line-height is `24px`. Extract exact values.
- **Don't skip asset extraction.** Without real images, videos, and fonts, the clone will always look fake.
- **Don't give a builder agent too much scope.** If a section is complex, break it into smaller tasks.
- **Don't bundle unrelated sections into one agent.** A hero and a footer are different components.
- **Don't skip responsive extraction.** Test at 1440, 768, and 390 during extraction.
- **Every builder must receive everything** — screenshot, exact CSS values, downloaded assets with local paths, real text content. If a builder has to guess anything, extraction has failed.

## Completion Report

When done, report:
- Source URL to destination-route mapping
- Total sections built
- Total components created
- Total spec files written
- Total assets downloaded (images, videos, SVGs, fonts)
- Build status (`npm run build` result)
- Visual QA results
- Any known gaps or limitations
