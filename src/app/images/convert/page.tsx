"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type Format = "image/jpeg" | "image/png" | "image/webp";
type State = "idle" | "ready" | "done";

const formats: { value: Format; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/png",  label: "PNG", ext: "png" },
  { value: "image/webp", label: "WebP", ext: "webp" },
];

export default function ConvertImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<Format>("image/webp");
  const [status, setStatus] = useState<State>("idle");
  const [results, setResults] = useState<{ name: string; url: string; size: number }[]>([]);

  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((p) => [...p, ...newFiles.filter((f) => f.type.startsWith("image/"))]);
    setStatus("ready");
  }, []);

  const convert = useCallback(async () => {
    const ext = formats.find((f) => f.value === targetFormat)!.ext;
    const out: { name: string; url: string; size: number }[] = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res) => { img.onload = () => res(); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), targetFormat, 0.92));
      URL.revokeObjectURL(url);
      out.push({ name: file.name.replace(/\.[^.]+$/, `.${ext}`), url: URL.createObjectURL(blob), size: blob.size });
    }

    setResults(out);
    setStatus("done");
  }, [files, targetFormat]);

  const reset = () => { results.forEach((r) => URL.revokeObjectURL(r.url)); setFiles([]); setResults([]); setStatus("idle"); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 shadow-warm mb-5">
            <span className="text-2xl">🔄</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Convert Format</h1>
          <p className="text-warm-500 text-lg">Convert images between JPG, PNG, and WebP. Batch supported.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={addFiles} accept="image/*" multiple className="min-h-[220px]" label="Drop images here" sublabel="JPG, PNG, WebP · multiple files" />
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <DropZone onFiles={addFiles} accept="image/*" multiple className="min-h-[80px]" label="Add more images" sublabel={`${files.length} file${files.length > 1 ? "s" : ""} ready`} />

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm">
                <p className="text-sm font-medium text-warm-700 mb-3">Convert to</p>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((f) => (
                    <button key={f.value} onClick={() => setTargetFormat(f.value)}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${targetFormat === f.value ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-cream-50 text-warm-600 hover:border-coral-200"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={convert} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                Convert {files.length} image{files.length > 1 ? "s" : ""} to {formats.find((f) => f.value === targetFormat)?.label}
              </button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">{results.length} image{results.length > 1 ? "s" : ""} converted</span>
              </div>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="bg-white border border-warm rounded-xl p-3 flex items-center gap-3 shadow-warm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.name} className="w-10 h-10 object-cover rounded-lg border border-warm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{r.name}</p>
                      <p className="text-xs text-warm-400">{formatBytes(r.size)}</p>
                    </div>
                    <a href={r.url} download={r.name} className="text-xs text-coral-500 hover:text-coral-700 font-medium">Download</a>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                {results.length > 1 && (
                  <button onClick={() => results.forEach(({ name, url }) => { const a = document.createElement("a"); a.href = url; a.download = name; a.click(); })}
                    className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                    Download all
                  </button>
                )}
                <button onClick={reset} className="flex-1 px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New images
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Processed locally in your browser. Never uploaded.
        </p>
      </div>
    </main>
  );
}
