"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, degrees } from "pdf-lib";
import DropZone from "@/components/DropZone";
import { formatBytes, pdfBlob } from "@/lib/utils";

type State = "idle" | "ready" | "done";
type RotateTarget = "all" | "even" | "odd";

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [target, setTarget] = useState<RotateTarget>("all");
  const [status, setStatus] = useState<State>("idle");
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("ready"); setResult(null);
  }, []);

  const apply = useCallback(async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    const pages = doc.getPages();
    pages.forEach((p, i) => {
      const idx = i + 1;
      if (target === "all" || (target === "even" && idx % 2 === 0) || (target === "odd" && idx % 2 !== 0)) {
        p.setRotation(degrees((p.getRotation().angle + angle) % 360));
      }
    });
    setResult(await doc.save());
    setStatus("done");
  }, [file, angle, target]);

  const download = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(pdfBlob(result));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(".pdf", "_rotated.pdf") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">🔃</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Rotate PDF</h1>
          <p className="text-warm-500 text-lg">Rotate all or specific pages of a PDF.</p>
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
                  <p className="text-xs font-medium text-warm-600 mb-2">Rotation angle</p>
                  <div className="flex gap-2">
                    {([90, 180, 270] as const).map((a) => (
                      <button key={a} onClick={() => setAngle(a)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${angle === a ? "border-coral-500 bg-coral-50 text-coral-700" : "border-warm text-warm-600"}`}>
                        {a}°
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-warm-600 mb-2">Apply to</p>
                  <div className="flex gap-2">
                    {(["all", "odd", "even"] as RotateTarget[]).map((t) => (
                      <button key={t} onClick={() => setTarget(t)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${target === t ? "border-coral-500 bg-coral-50 text-coral-700" : "border-warm text-warm-600"}`}>
                        {t === "all" ? "All pages" : `${t} pages`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Rotate PDF
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
