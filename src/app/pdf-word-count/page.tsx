"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "processing" | "done";

interface Stats {
  pages: number;
  words: number;
  chars: number;
  charsNoSpaces: number;
  lines: number;
  perPage: { page: number; words: number; chars: number }[];
}

export default function PdfWordCountPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [stats, setStats] = useState<Stats | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("idle"); setStats(null);
  }, []);

  const analyze = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let totalWords = 0, totalChars = 0, totalCharsNoSpaces = 0, totalLines = 0;
      const perPage: Stats["perPage"] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item): item is { str: string } => "str" in item)
          .map((item) => item.str)
          .join(" ");
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, "").length;
        const lines = text.split(/\n/).length;
        totalWords += words;
        totalChars += chars;
        totalCharsNoSpaces += charsNoSpaces;
        totalLines += lines;
        perPage.push({ page: i, words, chars });
      }

      setStats({ pages: pdf.numPages, words: totalWords, chars: totalChars, charsNoSpaces: totalCharsNoSpaces, lines: totalLines, perPage });
      setStatus("done");
    } catch {
      alert("Could not analyze this PDF. It may be scanned or encrypted.");
      setStatus("idle");
    }
  }, [file]);

  const reset = () => { setFile(null); setStatus("idle"); setStats(null); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-warm mb-5">
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">PDF Word Count</h1>
          <p className="text-warm-500 text-lg">Count words, characters, and lines across all pages.</p>
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
              <button onClick={analyze} disabled={status === "processing"}
                className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:scale-100">
                {status === "processing" ? "Analyzing…" : "Analyze PDF"}
              </button>
            </motion.div>
          )}

          {status === "done" && stats && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Pages",      value: stats.pages.toLocaleString() },
                  { label: "Words",      value: stats.words.toLocaleString() },
                  { label: "Characters", value: stats.chars.toLocaleString() },
                  { label: "No spaces",  value: stats.charsNoSpaces.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-warm rounded-2xl p-4 text-center shadow-warm">
                    <p className="text-2xl font-bold text-warm-900">{value}</p>
                    <p className="text-xs text-warm-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Per-page breakdown */}
              <div className="bg-white border border-warm rounded-2xl shadow-warm overflow-hidden">
                <div className="px-5 py-3 border-b border-warm bg-cream-50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-warm-400">Per page</p>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-warm">
                  {stats.perPage.map(({ page, words, chars }) => (
                    <div key={page} className="flex items-center px-5 py-2.5 gap-4">
                      <span className="text-xs font-semibold text-warm-400 w-16">Page {page}</span>
                      <span className="text-sm text-warm-800 flex-1">{words.toLocaleString()} words</span>
                      <span className="text-xs text-warm-400">{chars.toLocaleString()} chars</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={reset} className="w-full py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                Analyze Another
              </button>
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
