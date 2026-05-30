"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import DropZone from "@/components/DropZone";
import { formatBytes, pdfBlob } from "@/lib/utils";

type State = "idle" | "ready" | "processing" | "done";

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("ready"); setResult(null);
  }, []);

  const convert = useCallback(async () => {
    if (!file) return;
    setStatus("processing");

    try {
      const mammoth = await import("mammoth");
      const buf = await file.arrayBuffer();

      // Extract plain text with mammoth
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });

      // Parse HTML to plain text lines
      const div = document.createElement("div");
      div.innerHTML = html;

      // Walk nodes to extract text with paragraph breaks
      const lines: { text: string; bold: boolean; heading: boolean }[] = [];
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text) {
            const parent = node.parentElement;
            const tag = parent?.tagName.toLowerCase() ?? "";
            const heading = /^h[1-6]$/.test(tag);
            const bold = heading || tag === "strong" || tag === "b" ||
              !!parent?.closest("strong, b, h1, h2, h3, h4, h5, h6");
            lines.push({ text, bold, heading });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName.toLowerCase();
          if (tag === "br") { lines.push({ text: "", bold: false, heading: false }); return; }
          node.childNodes.forEach(walk);
          if (["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr"].includes(tag)) {
            lines.push({ text: "", bold: false, heading: false });
          }
        }
      };
      div.childNodes.forEach(walk);

      // Build PDF
      const doc = await PDFDocument.create();
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

      const pageW = 595, pageH = 842; // A4 points
      const marginX = 60, marginTop = 60, marginBottom = 60;
      const lineHeight = 16, headingSize = 14, bodySize = 11;
      const maxWidth = pageW - marginX * 2;

      let page = doc.addPage([pageW, pageH]);
      let y = pageH - marginTop;
      let pages = 1;

      const newPage = () => {
        page = doc.addPage([pageW, pageH]);
        y = pageH - marginTop;
        pages++;
      };

      const wrapText = (text: string, font: typeof regularFont, size: number): string[] => {
        const words = text.split(" ");
        const result: string[] = [];
        let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, size) > maxWidth) {
            if (current) result.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) result.push(current);
        return result.length ? result : [""];
      };

      for (const { text, bold, heading } of lines) {
        const size = heading ? headingSize : bodySize;
        const font = bold ? boldFont : regularFont;
        const lh = heading ? lineHeight * 1.4 : lineHeight;

        if (!text) { y -= lh * 0.6; continue; }

        const wrapped = wrapText(text, font, size);
        for (const line of wrapped) {
          if (y < marginBottom + lh) newPage();
          page.drawText(line, { x: marginX, y, size, font, color: rgb(0.1, 0.1, 0.1) });
          y -= lh;
        }
      }

      setResult(await doc.save());
      setPageCount(pages);
      setStatus("done");
    } catch (e) {
      console.error(e);
      alert("Could not convert this file. Make sure it is a valid .docx file.");
      setStatus("ready");
    }
  }, [file]);

  const download = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(pdfBlob(result));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(/\.docx?$/i, ".pdf") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">📝→📄</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Word to PDF</h1>
          <p className="text-warm-500 text-lg">Convert a .docx Word document into a PDF file.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} accept=".docx,.doc" className="min-h-[220px]" label="Drop a Word document here" sublabel=".docx supported" />
            </motion.div>
          )}

          {(status === "ready" || status === "processing") && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>

              {status === "processing" && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-coral-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-warm-500">Converting…</p>
                </div>
              )}

              {status === "ready" && (
                <button onClick={convert}
                  className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Convert to PDF
                </button>
              )}
              <button onClick={reset} className="w-full py-3 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors text-sm">
                Choose different file
              </button>
            </motion.div>
          )}

          {status === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">{pageCount} page PDF — {formatBytes(result.byteLength)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={download}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all">
                  Download PDF
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
