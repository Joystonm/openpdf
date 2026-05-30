# Dependencies

## Install All

```bash
npm install
```

---

## Runtime Dependencies

### Core Framework

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `next` | 16.2.6 | App framework (App Router + Turbopack) | Entire app |
| `react` | 19.2.4 | UI library | Entire app |
| `react-dom` | 19.2.4 | DOM renderer | Entire app |

### UI & Styling

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `framer-motion` | ^12.40.0 | Animations and transitions | All pages |
| `lucide-react` | ^1.17.0 | Icon set | Available for use |
| `clsx` | ^2.1.1 | Conditional class names | `src/lib/utils.ts` |
| `tailwind-merge` | ^3.6.0 | Merge Tailwind classes safely | `src/lib/utils.ts` |

### PDF Processing

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `pdf-lib` | ^1.17.1 | Create/edit PDFs client-side | merge, split, compress, watermark, protect, rotate, crop, flatten, page-numbers, pdf-metadata, repair, certificate-studio |
| `@pdf-lib/fontkit` | ^1.1.1 | Custom font embedding in pdf-lib | watermark, page-numbers |
| `pdfjs-dist` | ^5.7.284 | Render/parse PDFs in browser | pdf-to-image, pdf-to-text, pdf-to-word, pdf-word-count, organize |

> **Note:** `public/pdf.worker.min.mjs` is the vendored pdfjs worker — must be in `/public` for browser access.

### Document Conversion

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `mammoth` | ^1.8.0 | Convert .docx → HTML/text | word-to-pdf |
| `docx` | ^8.5.0 | Generate .docx files | pdf-to-word |

### Image Processing

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `@imgly/background-removal` | ^1.7.0 | AI background removal (WASM, runs in browser) | images/remove-bg |
| `@huggingface/transformers` | ^4.2.0 | ML models in browser | images/upscale |

### QR Code

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `qrcode` | 1.5.4 | Generate QR codes | qr-studio |
| `@types/qrcode` | 1.5.5 | TypeScript types for qrcode | qr-studio |

### Utilities

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `jszip` | ^3.10.1 | Create ZIP archives | certificate-studio (batch export) |
| `@next/font` | ^14.2.15 | Legacy font package (superseded by `next/font`) | Not actively used |
| `cloudinary-core` | ^2.14.1 | Cloudinary SDK | Not actively used |
| `next-cloudinary` | ^6.17.5 | Next.js Cloudinary integration | Not actively used |

---

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | TypeScript compiler |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM type definitions |
| `tailwindcss` | ^4 | CSS utility framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin for Tailwind v4 |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.2.6 | Next.js ESLint rules |

---

## Public Assets

| File | Purpose |
|------|---------|
| `public/pdf.worker.min.mjs` | pdfjs-dist web worker (vendored, ~1.2 MB) |
| `src/app/favicon.ico` | App favicon (4 sizes: 16×16, 32×32) |
