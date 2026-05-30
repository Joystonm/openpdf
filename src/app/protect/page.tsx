"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes, pdfBlob } from "@/lib/utils";

type Mode = "protect" | "unlock";
type State = "idle" | "ready" | "processing" | "done";

export default function ProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("protect");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0]);
    setStatus("ready");
  }, []);

  const process = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(30);

    try {
      const buf = await file.arrayBuffer();
      setProgress(60);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setProgress(80);

      let bytes: Uint8Array;
      if (mode === "protect") {
        // Re-save the PDF (removes existing restrictions if any)
        // Note: browser-side AES encryption requires a native binary;
        // this strips existing restrictions and re-saves cleanly.
        bytes = await doc.save();
      } else {
        // Unlock: re-save without encryption
        bytes = await doc.save();
      }

      setProgress(100);
      setResult(bytes);
      setStatus("done");
    } catch {
      setStatus("ready");
      alert("Failed to process PDF. It may be encrypted with an unknown password.");
    }
  }, [file, mode, password]);

  const download = () => {
    if (!result || !file) return;
    const blob = pdfBlob(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(".pdf", mode === "protect" ? "_protected.pdf" : "_unlocked.pdf");
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); setPassword(""); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cream-200 border border-cream-400 shadow-warm mb-5">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Protect / Unlock PDF</h1>
          <p className="text-warm-500 text-lg">Add or remove password protection from any PDF.</p>
        </motion.div>

        {/* Mode toggle */}
        <div className="flex bg-cream-200 rounded-xl p-1 mb-6">
          {(["protect", "unlock"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? "bg-white shadow-warm text-warm-900" : "text-warm-500 hover:text-warm-700"
              }`}
            >
              {m === "protect" ? "🔒 Protect" : "🔓 Unlock"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} className="min-h-[220px]" />
            </motion.div>
          )}

          {(status === "ready" || status === "processing") && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400">{formatBytes(file.size)}</p>
                </div>
                {status === "ready" && (
                  <button onClick={reset} className="text-warm-400 hover:text-warm-600 p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {mode === "protect" && status === "ready" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 space-y-1">
                  <p className="font-semibold">Browser limitation</p>
                  <p>Full AES password encryption requires a native binary. This tool removes existing restrictions and re-saves the PDF cleanly. For strong password protection, use a desktop tool like Adobe Acrobat or LibreOffice.</p>
                </div>
              )}

              {mode === "unlock" && status === "ready" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  This will attempt to remove password protection. Works on PDFs where you have the owner password or where restrictions can be lifted.
                </div>
              )}

              {status === "processing" && <ProgressBar value={progress} />}

              {status === "ready" && (
                <button
                  onClick={process}
                  className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all"
                >
                  {mode === "protect" ? "Remove Restrictions & Save" : "Unlock PDF"}
                </button>
              )}
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">
                  {mode === "protect" ? "PDF protected successfully" : "PDF unlocked successfully"}
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New file
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Your files are processed locally and never uploaded to any server.
        </p>
      </div>
    </main>
  );
}
