# Base NextJS Project

A modular, feature-based Next.js application template with comprehensive project organization.

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📂 Project Structure

### `/public`

Static assets accessible directly by the browser:
- Images, icons, and other media files
- Favicons and app icons
- SVG files for common UI elements

### `/src`

Source code for the application, organized into following directories:

#### `/src/modules`

Feature-based code organization where each module is a self-contained feature:

```
modules/
├─ personalisasi/         # Example module for personalization features
│  ├─ components/         # UI components specific to this module
│  ├─ lib/                # Core infrastructure code
│  ├─ utils/              # Helper functions and custom hooks
│  ├─ services/           # API/service integrations
│  ├─ providers/          # Context providers for state management
│  ├─ types/              # TypeScript type definitions
│  ├─ validator/          # Form validation schemas
│  ├─ data/               # Static data and constants
│  ├─ lang/               # Localization files
│  └─ ... 
├─ otherFeature/          # Another feature module
└─ ...
```

#### `/src/components`

Shared UI components used across multiple modules:
- Atomic design organization (atoms, molecules, organisms)
- Common UI elements reused throughout the application

#### `/src/theme`

UI theming and design system configuration:
- Component style overrides
- Color definitions and palettes
- Typography settings
- Global style configurations

#### `/src/providers`

Global context providers:
- Authentication state management
- Application settings
- Global UI state
- Modal management

#### `/src/services`

Application-wide service integrations:
- Authentication services
- API client configurations
- External service integrations

#### `/src/utils`

Shared utilities used across the application:
- Common helper functions
- Shared hooks
- Utility functions for date formatting, validation, etc.

#### `/src/types`

Global TypeScript type definitions:
- Common interfaces and types
- Type extensions and declarations

#### `/src/lang`

Global language and internationalization files:
- Translation keys and values
- Import module-specific translations

#### `/src/pages`

Next.js page definitions:
- Route definitions following Next.js conventions
- Page components that compose modules and features

## 🌐 Environment Variables

The project uses the following environment variables:

- `NEXT_PUBLIC_API_URL`: API endpoint URL
- `NEXT_PUBLIC_APP_ENV`: Application environment (development/production)

Create a `.env.local` file in the root directory with these variables for local development.

---

# Base NextJS Project (Bahasa Indonesia)

Template aplikasi Next.js yang modular dan berbasis fitur dengan organisasi proyek yang komprehensif.

## 🚀 Memulai

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

## 📂 Struktur Proyek

### `/public`

Aset statis yang dapat diakses langsung oleh browser:
- File gambar, ikon, dan media lainnya
- Favicon dan ikon aplikasi
- File SVG untuk elemen UI umum

### `/src`

Kode sumber aplikasi, diorganisir ke dalam direktori berikut:

#### `/src/modules`

Organisasi kode berbasis fitur di mana setiap modul adalah fitur mandiri:

```
modules/
├─ personalisasi/         # Contoh modul untuk fitur personalisasi
│  ├─ components/         # Komponen UI khusus untuk modul ini
│  ├─ lib/                # Kode infrastruktur inti
│  ├─ utils/              # Fungsi pembantu dan custom hooks
│  ├─ services/           # Integrasi API/layanan
│  ├─ providers/          # Provider konteks untuk manajemen state
│  ├─ types/              # Definisi tipe TypeScript
│  ├─ validator/          # Skema validasi formulir
│  ├─ data/               # Data statis dan konstanta
│  ├─ lang/               # File lokalisasi
│  └─ ... 
├─ fiturLain/             # Modul fitur lain
└─ ...
```

#### `/src/components`

Komponen UI bersama yang digunakan di beberapa modul:
- Organisasi desain atomik (atoms, molecules, organisms)
- Elemen UI umum yang digunakan di seluruh aplikasi

#### `/src/theme`

Konfigurasi tema UI dan sistem desain:
- Override gaya komponen
- Definisi warna dan palet
- Pengaturan tipografi
- Konfigurasi gaya global

#### `/src/providers`

Provider konteks global:
- Manajemen status autentikasi
- Pengaturan aplikasi
- Status UI global
- Manajemen modal

#### `/src/services`

Integrasi layanan seluruh aplikasi:
- Layanan autentikasi
- Konfigurasi klien API
- Integrasi layanan eksternal

#### `/src/utils`

Utilitas bersama yang digunakan di seluruh aplikasi:
- Fungsi pembantu umum
- Hooks bersama
- Fungsi utilitas untuk pemformatan tanggal, validasi, dll.

#### `/src/types`

Definisi tipe TypeScript global:
- Interface dan tipe umum
- Ekstensi dan deklarasi tipe

#### `/src/lang`

File bahasa dan internasionalisasi global:
- Kunci dan nilai terjemahan
- Impor terjemahan spesifik modul

#### `/src/pages`

Definisi halaman Next.js:
- Definisi rute mengikuti konvensi Next.js
- Komponen halaman yang menyusun modul dan fitur

## 🌐 Variabel Lingkungan

Proyek ini menggunakan variabel lingkungan berikut:

- `NEXT_PUBLIC_API_URL`: URL endpoint API
- `NEXT_PUBLIC_APP_ENV`: Lingkungan aplikasi (development/production)

Buat file `.env.local` di direktori root dengan variabel-variabel ini untuk pengembangan lokal.
