"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "processing" | "done" | "error";

export default function RemoveBgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setStatus("ready");
  }, [preview]);

  const process = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    setStatusMsg("Loading AI model (first run downloads ~40 MB)…");

    try {
      // @imgly/background-removal — use 'small' model for speed (~5 MB vs 40 MB)
      const { removeBackground } = await import("@imgly/background-removal");

      setStatusMsg("Removing background…");
      const blob = await removeBackground(file, { model: "isnet_fp16" });
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, [file]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Remove Background</h1>
          <p className="text-warm-500 text-lg">AI-powered background removal — runs entirely in your browser.</p>
          <div className="inline-flex items-center gap-1.5 mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            100% local · No uploads · No API keys
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG or PNG recommended" />
            </motion.div>
          )}

          {status === "ready" && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-12 h-12 object-cover rounded-xl border border-warm flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400">{formatBytes(file.size)}</p>
                </div>
                <button onClick={reset} className="text-warm-400 hover:text-warm-600 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚡ Uses the <strong>isnet_fp16</strong> model (~40 MB, first run downloads and caches it).
              </div>
              <button onClick={process} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                Remove Background
              </button>
            </motion.div>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-coral-200 border-t-coral-500 mx-auto"
              />
              <p className="text-sm font-medium text-warm-700">{statusMsg}</p>
              <p className="text-xs text-warm-400">Processing entirely in your browser</p>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Background removed</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-warm-400 text-center">Original</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="original" className="w-full rounded-xl border border-warm object-contain max-h-52" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-warm-400 text-center">Result</p>
                  <div className="w-full rounded-xl border border-warm overflow-hidden max-h-52"
                    style={{ background: "repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 0 0 / 16px 16px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="result" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <a href={resultUrl} download={file?.name.replace(/\.[^.]+$/, "_no_bg.png")}
                  className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all text-center text-sm">
                  Download PNG
                </a>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New image
                </button>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                Processing failed. Try a smaller image or a different format.
              </div>
              <button onClick={() => setStatus("ready")} className="w-full px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Runs entirely in your browser using WASM. Nothing is uploaded.
        </p>
      </div>
    </main>
  );
}
