# Bolt Setup Guide

Get this project running in [Bolt.new](https://bolt.new) with zero manual investigation.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Build for production

```bash
npm run build
npm run start
```

---

## Environment Variables

This project has **no required environment variables**. All processing runs client-side in the browser.

Optional (not currently wired up):

```env
# Only needed if you add Cloudinary image hosting
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

### `ReferenceError: __dirname is not defined in ES module scope`

**Cause:** `next.config.ts` used `__dirname` which is not available in ESM.  
**Fix:** Already resolved — `next.config.ts` no longer uses `__dirname`.

### Turbopack workspace root warning

```
Warning: Next.js inferred your workspace root, but it may not be correct.
```

**Cause:** Multiple `package-lock.json` files detected in parent directories.  
**Fix:** This is a non-fatal warning. To silence it, delete any `package-lock.json` in parent directories that don't belong to this project.

### `pdf.worker.min.mjs` not found at runtime

**Cause:** The pdfjs worker file must be in `/public`.  
**Fix:** The file is already at `public/pdf.worker.min.mjs`. If missing, copy it from `node_modules/pdfjs-dist/build/`:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
```

### Background removal model fails to load

**Cause:** `@imgly/background-removal` downloads ~40 MB WASM model on first use.  
**Fix:** Requires internet access on first run. Model is cached in browser after that. Uses `isnet_fp16` model.

### `npm install` fails on `@huggingface/transformers`

This package is large (~500 MB with models). If install times out:

```bash
npm install --prefer-offline
# or increase timeout:
npm install --fetch-timeout=300000
```

### TypeScript errors after pulling updates

```bash
npm run build
```

The build runs `tsc` — all errors will be shown with file and line numbers.

---

## Architecture Notes

- **All processing is client-side** — no server routes, no API keys needed for core features.
- **App Router** — all pages are in `src/app/`. Each tool is a separate route.
- **Tailwind v4** — uses `@import "tailwindcss"` syntax, not `@tailwind` directives.
- **Custom theme** — coral, cream, and warm color palettes defined in `src/app/globals.css`.
- **pdfjs worker** — loaded from `/public/pdf.worker.min.mjs` via `GlobalWorkerOptions.workerSrc`.
