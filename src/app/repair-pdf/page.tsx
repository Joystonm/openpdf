"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import { formatBytes, pdfBlob } from "@/lib/utils";

type State = "idle" | "processing" | "done" | "error";

export default function RepairPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [info, setInfo] = useState("");

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("idle"); setResult(null); setInfo("");
  }, []);

  const repair = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    try {
      const buf = await file.arrayBuffer();
      // pdf-lib with ignoreEncryption + updateMetadata false to recover as much as possible
      const doc = await PDFDocument.load(buf, {
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false,
      } as Parameters<typeof PDFDocument.load>[1]);

      const pageCount = doc.getPageCount();
      // Re-save — pdf-lib rewrites the cross-reference table which fixes most structural issues
      const fixed = await doc.save({ useObjectStreams: false });
      setResult(fixed);
      setInfo(`Recovered ${pageCount} page${pageCount !== 1 ? "s" : ""}. Original: ${formatBytes(file.size)} → Repaired: ${formatBytes(fixed.byteLength)}`);
      setStatus("done");
    } catch (e) {
      setInfo("Could not repair this file. It may be too severely corrupted or use unsupported encryption.");
      setStatus("error");
    }
  }, [file]);

  const download = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(pdfBlob(result));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(".pdf", "_repaired.pdf") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); setInfo(""); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warm-100 border border-warm shadow-warm mb-5">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Repair PDF</h1>
          <p className="text-warm-500 text-lg">Attempt to fix corrupted or malformed PDF files.</p>
        </motion.div>

        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-sm text-amber-800">
            This tool rewrites the PDF structure using pdf-lib. It can fix cross-reference errors and structural issues, but cannot recover files with missing or encrypted content.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "idle" && !file && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} className="min-h-[220px]" />
            </motion.div>
          )}

          {file && status !== "done" && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>

              {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{info}</div>
              )}

              <button onClick={repair} disabled={status === "processing"}
                className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:scale-100">
                {status === "processing" ? "Repairing…" : "Repair PDF"}
              </button>
              <button onClick={reset} className="w-full py-3 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors text-sm">
                Choose different file
              </button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Repair successful</span>
              </div>
              <p className="text-sm text-warm-600 text-center">{info}</p>
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all">
                  Download Repaired PDF
                </button>
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
