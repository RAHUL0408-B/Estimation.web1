# Project Technical Overview

## 1. Executive Summary
This project is a **Multi-Tenant Interior Design Platform** built with **Next.js 15** and **Firebase**. It allows interior designers (tenants) to:
- Create and customize their own portfolio websites.
- Manage inquiries and project estimates.
- Showcase their services, testimonials, and team.

The platform automatically generates a unique storefront for each designer based on their configuration (e.g., `your-platform.com/designer-name`).

---

## 2. Technology Stack

### Core Framework
- **Next.js 15 (App Router)**: The React framework handling routing, server-side rendering (SSR), and static generation.
- **TypeScript**: Ensures type safety across the entire application.
- **React 19**: The core UI library.

### Styling & UI
- **Tailwind CSS v4**: Utility-first CSS framework for styling.
- **Radix UI**: Accessible, unstyled components (Dialogs, Tabs, Toasts, etc.) powered by `@radix-ui/react-*` packages.
- **Lucide React**: Modern, clean icon set.
- **Framer Motion**: Powerful animation library for smooth transitions (hero sliders, scroll effects).
- **class-variance-authority (CVA)**: For creating reusable component variants (e.g., button styles).

### Backend & Data (Firebase)
- **Firebase Authentication**: Handles user sign-up/login for admins and tenants.
- **Cloud Firestore**: NoSQL database for storing tenant data, website configurations, and estimates.
- **Firebase Storage**: Stores uploaded images (hero banners, portfolio photos).
- **Firebase Analytics**: Tracks usage data.

### Utilities
- **jsPDF & jspdf-autotable**: For generating downloadable PDF estimates for clients.
- **clsx & tailwind-merge**: For conditional class merging string utilities.

---

## 3. Architecture & Project Structure

The project follows the **Next.js App Router** convention with Route Groups `(...)` to separate different layouts.

```
src/
├── app/
│   ├── (storefront)/        # PUBLIC-FACING WEBSITES
│   │   └── [tenantId]/      # Dynamic route for each designer's site
│   │       ├── layout.tsx   # Applies the designer's unique theme/brand
│   │       ├── page.tsx     # The main landing page (Hero, Services, etc.)
│   │       └── ...          # Sub-pages (about, contact, portfolio)
│   │
│   ├── (tenant-admin)/      # DESIGNER DASHBOARD (Protected)
│   │   └── dashboard/
│   │       ├── website-setup/ # Fix: Where Hero Slider/Brand config lives
│   │       ├── orders/        # Manage estimates/inquiries
│   │       └── ...
│   │
│   ├── (super-admin)/       # PLATFORM ADMIN (Protected)
│   │
│   ├── api/                 # Server-side API endpoints (if any)
│   └── layout.tsx           # Root layout
│
├── components/
│   ├── storefront/          # Components used on public sites (HeroSlider, etc.)
│   ├── dashboard/           # Components for the admin panel
│   └── ui/                  # Reusable base components (Button, Input, Card)
│
├── lib/                     # Core logic & Configuration
│   ├── firebase.ts          # Firebase initialization
│   ├── firestoreHelpers.ts  # Database CRUD operations
│   └── ...
│
├── hooks/                   # Custom React Hooks
│   ├── useTenantAuth.ts     # Handles admin authentication state
│   ├── useWebsiteConfig.ts  # Fetches website data for the storefront
│   └── ...
└── types/                   # TypeScript interfaces (Shared data models)
```

---

## 4. Key Workflows

### A. Tenant Onboarding (Sign Up)
1.  A designer signs up via the `(tenant-admin)/signup` page.
2.  A new document is created in the `tenants` Firestore collection.
3.  Default configuration (theme, brand settings) is initialized.

### B. Website Building (The "Admin" Side)
1.  Designer logs in to `(tenant-admin)/dashboard/website-setup`.
2.  They configure:
    -   **Brand**: Logo, name, contact info.
    -   **Theme**: Colors, fonts, button styles.
    -   **Pages**: Content for Home (Hero Slider), About, etc.
3.  **Data Flow**: Changes are saved to Firestore under `tenants/{tenantId}/pages/...`.
4.  **Hero Slider**:
    -   Admin uploads an image to Firebase Storage.
    -   Admin adds text and links.
    -   Data is saved to the `heroSlides` array in the `home` document.

### C. Public Storefront (The "User" Side)
1.  A visitor navigates to `your-site.com/[tenantId]`.
2.  `useWebsiteConfig` hook fetches the specific tenant's data from Firestore.
3.  `StorefrontLayout` applies the tenant's **Brand** (logo) and **Theme** (colors/fonts) using CSS variables.
4.  `StorefrontPage` renders the content (Hero Slider, Services, etc.) using the fetched data.

---

## 5. Technical Highlights

### Dynamic Theming
The project uses CSS variables injected at runtime to allow each tenant to have a unique look structure.
-   **Admin**: Selects a "Primary Color" (e.g., `#FF5733`).
-   **Frontend**: `layout.tsx` injects `<style>:root { --primary: #FF5733; }</style>`.
-   **Tailwind**: Configured to use `var(--primary)` so all utility classes update automatically.

### Multi-Tenancy
Single codebase serving multiple websites. The `[tenantId]` dynamic route parameter is the key that isolates data between different designers.

### Estimate Generation
The `generateEstimatePdf.ts` utility facilitates client-side PDF generation, allowing designers to instantly create professional quotes for their clients without server processing overhead.
