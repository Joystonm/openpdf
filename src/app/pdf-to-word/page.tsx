"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "processing" | "done";

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("ready"); setResultUrl(""); setProgress(0);
  }, []);

  const convert = useCallback(async () => {
    if (!file) return;
    setStatus("processing"); setProgress(10);

    try {
      const [pdfjsLib, { Document, Paragraph, TextRun, HeadingLevel, Packer }] = await Promise.all([
        import("pdfjs-dist"),
        import("docx"),
      ]);
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const totalPages = pdf.numPages;
      const docChildren: InstanceType<typeof Paragraph>[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group items into lines by y-position
        const lines: Map<number, string[]> = new Map();
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const y = Math.round((item as { transform: number[] }).transform[5]);
          if (!lines.has(y)) lines.set(y, []);
          lines.get(y)!.push((item as { str: string }).str);
        }

        // Sort lines top-to-bottom (descending y in PDF space)
        const sortedLines = [...lines.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, words]) => words.join(" ").trim())
          .filter(Boolean);

        if (i > 1) {
          docChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        }

        for (const line of sortedLines) {
          docChildren.push(new Paragraph({ children: [new TextRun(line)] }));
        }

        setProgress(10 + Math.round((i / totalPages) * 80));
      }

      const doc = new Document({ sections: [{ children: docChildren }] });
      const blob = await Packer.toBlob(doc);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setProgress(100);
      setStatus("done");
    } catch (e) {
      console.error(e);
      alert("Could not convert this PDF. It may be scanned or encrypted.");
      setStatus("ready");
    }
  }, [file, resultUrl]);

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setStatus("idle"); setResultUrl(""); setProgress(0);
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">📄→📝</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">PDF to Word</h1>
          <p className="text-warm-500 text-lg">Convert a PDF into an editable .docx Word document.</p>
        </motion.div>

        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-lg mt-0.5">ℹ️</span>
          <p className="text-sm text-amber-800">
            Text-based PDFs convert well. Scanned PDFs (images) will produce an empty document — use a PDF with selectable text.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} className="min-h-[220px]" />
            </motion.div>
          )}

          {(status === "ready" || status === "processing") && file && (
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

              {status === "processing" && (
                <div className="space-y-2">
                  <ProgressBar value={progress} />
                  <p className="text-xs text-warm-400 text-center">Extracting text and building document…</p>
                </div>
              )}

              {status === "ready" && (
                <button onClick={convert}
                  className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Convert to Word
                </button>
              )}
              <button onClick={reset} className="w-full py-3 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors text-sm">
                Choose different file
              </button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Conversion complete — {formatBytes(resultSize)}</span>
              </div>
              <div className="flex gap-3">
                <a href={resultUrl} download={file!.name.replace(/\.pdf$/i, ".docx")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all text-center flex items-center justify-center">
                  Download .docx
                </a>
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
