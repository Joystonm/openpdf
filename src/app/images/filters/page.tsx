"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";

interface Filters {
  brightness: number; // 0-200 (100 = normal)
  contrast: number;
  saturation: number;
  blur: number; // 0-10px
  grayscale: number; // 0-100%
  sepia: number;
}

const DEFAULT: Filters = { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0 };

const PRESETS: { label: string; f: Partial<Filters> }[] = [
  { label: "Normal", f: DEFAULT },
  { label: "Grayscale", f: { grayscale: 100, saturation: 0 } },
  { label: "Sepia", f: { sepia: 80, saturation: 60 } },
  { label: "Vivid", f: { saturation: 160, contrast: 115 } },
  { label: "Matte", f: { contrast: 85, brightness: 108, saturation: 80 } },
  { label: "Cool", f: { brightness: 105, contrast: 105, saturation: 90 } },
];

function toCssFilter(f: Filters) {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%)`;
}

export default function FiltersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setFilters(DEFAULT);
    setStatus("ready");
  }, [preview]);

  const set = (key: keyof Filters, val: number) => setFilters((f) => ({ ...f, [key]: val }));

  const apply = useCallback(async () => {
    if (!file || !preview) return;
    const img = new Image();
    await new Promise<void>((res) => { img.onload = () => res(); img.src = preview; });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = toCssFilter(filters);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, filters, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl(""); setFilters(DEFAULT);
  };

  const sliders: { key: keyof Filters; label: string; min: number; max: number; unit: string }[] = [
    { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%" },
    { key: "contrast",   label: "Contrast",   min: 0, max: 200, unit: "%" },
    { key: "saturation", label: "Saturation", min: 0, max: 200, unit: "%" },
    { key: "grayscale",  label: "Grayscale",  min: 0, max: 100, unit: "%" },
    { key: "sepia",      label: "Sepia",      min: 0, max: 100, unit: "%" },
    { key: "blur",       label: "Blur",       min: 0, max: 10,  unit: "px" },
  ];

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 shadow-warm mb-5">
            <span className="text-2xl">🎨</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Filters</h1>
          <p className="text-warm-500 text-lg">Adjust brightness, contrast, saturation, blur and more.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG, PNG, WebP supported" />
            </motion.div>
          )}

          {(status === "ready" || status === "done") && file && (
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Live preview */}
              <div className="bg-cream-100 border border-warm rounded-2xl overflow-hidden flex items-center justify-center min-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="max-w-full max-h-64 object-contain"
                  style={{ filter: toCssFilter(filters) }} />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => setFilters({ ...DEFAULT, ...p.f })}
                    className="text-xs bg-white border border-warm text-warm-600 px-3 py-1.5 rounded-lg hover:border-coral-300 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-3">
                {sliders.map(({ key, label, min, max, unit }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-warm-600">{label}</label>
                      <span className="text-xs text-warm-400">{filters[key]}{unit}</span>
                    </div>
                    <input type="range" min={min} max={max} value={filters[key]}
                      onChange={(e) => set(key, +e.target.value)}
                      className="w-full accent-coral-500" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Apply Filters
                </button>
                {status === "done" && (
                  <a href={resultUrl} download={file.name.replace(/\.[^.]+$/, "_filtered.jpg")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all text-center text-sm flex items-center justify-center">
                    Download
                  </a>
                )}
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
              {status === "done" && <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Processed locally. Never uploaded.
        </p>
      </div>
    </main>
  );
}
