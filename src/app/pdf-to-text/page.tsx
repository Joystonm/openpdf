"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "processing" | "done";

export default function PdfToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [text, setText] = useState("");

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("idle"); setText("");
  }, []);

  const extract = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
<<<<<<< HEAD
          .filter((item) => "str" in item)
          .map((item) => {
            const t = item as { str: string; hasEOL: boolean };
            return t.str + (t.hasEOL ? "\n" : " ");
=======
          .filter((item) => "str" in item && typeof item.str === "string")
          .map((item) => {
            const textItem = item as { str: string; hasEOL?: boolean };
            return textItem.str + (textItem.hasEOL ? "\n" : " ");
>>>>>>> 6467687782bec0aafac354d37def3215e9df780e
          })
          .join("");
        parts.push(`--- Page ${i} ---\n${pageText}`);
      }
      setText(parts.join("\n\n"));
      setStatus("done");
    } catch {
      alert("Could not extract text. The PDF may be scanned or encrypted.");
      setStatus("idle");
    }
  }, [file]);

  const download = () => {
    if (!text || !file) return;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(".pdf", ".txt") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setText(""); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-warm mb-5">
            <span className="text-2xl">📝</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">PDF to Text</h1>
          <p className="text-warm-500 text-lg">Extract all text content from a PDF file.</p>
        </motion.div>

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
              <button onClick={extract} disabled={status === "processing"}
                className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:scale-100">
                {status === "processing" ? "Extracting…" : "Extract Text"}
              </button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <textarea
                readOnly
                value={text}
                className="w-full h-80 border border-warm rounded-2xl p-4 text-sm text-warm-800 font-mono resize-none focus:outline-none bg-cream-50"
              />
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all">
                  Download .txt
                </button>
                <button onClick={() => navigator.clipboard.writeText(text)}
                  className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors text-sm">
                  Copy
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
              <p className="text-center text-xs text-warm-400">{text.length.toLocaleString()} characters extracted</p>
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
