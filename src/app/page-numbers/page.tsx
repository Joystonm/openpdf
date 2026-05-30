"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import DropZone from "@/components/DropZone";
import { formatBytes, pdfBlob } from "@/lib/utils";

type State = "idle" | "ready" | "done";
type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "top-left",      label: "Top Left" },
  { value: "top-center",    label: "Top Center" },
  { value: "top-right",     label: "Top Right" },
  { value: "bottom-left",   label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right",  label: "Bottom Right" },
];

export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [prefix, setPrefix] = useState("");
  const [status, setStatus] = useState<State>("idle");
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("ready"); setResult(null);
  }, []);

  const apply = useCallback(async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const margin = 36;

    pages.forEach((page, i) => {
      const text = prefix ? `${prefix} ${startFrom + i}` : String(startFrom + i);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Use the raw media box — drawText coords are always in unrotated space
      const mediaBox = page.getMediaBox();
      const w = mediaBox.width;
      const h = mediaBox.height;

      let x: number;

      if (position.includes("center")) {
        x = (w - textWidth) / 2;
      } else if (position.includes("right")) {
        x = w - textWidth - margin;
      } else {
        x = margin;
      }

      const y = position.startsWith("top") ? h - margin - textHeight : margin;

      page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.25, 0.25, 0.25) });
    });

    setResult(await doc.save());
    setStatus("done");
  }, [file, position, startFrom, fontSize, prefix]);

  const download = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(pdfBlob(result));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(".pdf", "_numbered.pdf") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 shadow-warm mb-5">
            <span className="text-2xl">🔢</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Add Page Numbers</h1>
          <p className="text-warm-500 text-lg">Stamp page numbers onto every page of your PDF.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} className="min-h-[220px]" />
            </motion.div>
          )}

          {(status === "ready" || status === "done") && file && (
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                <div>
                  <p className="text-xs font-medium text-warm-600 mb-2">Position</p>
                  <div className="grid grid-cols-3 gap-2">
                    {POSITIONS.map(({ value, label }) => (
                      <button key={value} onClick={() => setPosition(value)}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${position === value ? "border-coral-500 bg-coral-50 text-coral-700" : "border-warm text-warm-600 hover:bg-cream-50"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Start from</label>
                    <input type="number" min={1} value={startFrom} onChange={(e) => setStartFrom(Math.max(1, +e.target.value))}
                      className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Font size</label>
                    <input type="number" min={8} max={24} value={fontSize} onChange={(e) => setFontSize(Math.min(24, Math.max(8, +e.target.value)))}
                      className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Prefix</label>
                    <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. Page"
                      className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400" />
                  </div>
                </div>

                <p className="text-xs text-warm-400">
                  Preview: <span className="font-mono text-warm-700">{prefix ? `${prefix} ${startFrom}` : String(startFrom)}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Add Numbers
                </button>
                {status === "done" && (
                  <button onClick={download} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all">
                    Download
                  </button>
                )}
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
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
