"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";

const FONTS = ["Impact", "Arial Black", "Comic Sans MS", "Georgia", "Courier New"];

export default function MemeGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Impact");
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setStatus("ready");
  }, [preview]);

  const drawMeme = useCallback(async (top: string, bottom: string) => {
    if (!file || !preview) return;
    const img = imgRef.current ?? new Image();
    if (!imgRef.current) {
      await new Promise<void>((res) => { img.onload = () => res(); img.src = preview; });
      imgRef.current = img;
    }
    const { naturalWidth: w, naturalHeight: h } = img;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const fs = Math.round((fontSize / 100) * Math.min(w, h));
    ctx.font = `bold ${fs}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = fs / 12;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";

    if (top) {
      ctx.strokeText(top.toUpperCase(), w / 2, fs + 10);
      ctx.fillText(top.toUpperCase(), w / 2, fs + 10);
    }
    if (bottom) {
      ctx.strokeText(bottom.toUpperCase(), w / 2, h - 15);
      ctx.fillText(bottom.toUpperCase(), w / 2, h - 15);
    }

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const url = URL.createObjectURL(blob);
    setResultUrl(url);
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, fontSize, fontFamily, textColor, strokeColor, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    imgRef.current = null;
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
    setTopText(""); setBottomText("");
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-coral-50 border border-coral-200 shadow-warm mb-5">
            <span className="text-2xl">😂</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Meme Generator</h1>
          <p className="text-warm-500 text-lg">Add top and bottom text to any image.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG, PNG, WebP supported" />
            </motion.div>
          )}

          {(status === "ready" || status === "done") && file && (
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center min-h-48 rounded-2xl overflow-hidden border border-warm bg-[#e5e5e5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={status === "done" ? resultUrl : preview} alt="preview" className="block max-h-64 max-w-full object-contain" />
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Top text</label>
                    <input value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="TOP TEXT"
                      className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Bottom text</label>
                    <input value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="BOTTOM TEXT"
                      className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-warm-600 block mb-1">Font</label>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400 bg-white">
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-warm-600">Font size</label>
                    <span className="text-xs text-warm-400">{fontSize}%</span>
                  </div>
                  <input type="range" min={20} max={80} step={2} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-coral-500" />
                </div>

                <div className="flex gap-4">
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Text color</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg border border-warm cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1">Stroke color</label>
                    <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-10 h-10 rounded-lg border border-warm cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => drawMeme(topText, bottomText)} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Generate
                </button>
                {status === "done" && (
                  <a href={resultUrl} download={file.name.replace(/\.[^.]+$/, "_meme.jpg")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all text-center text-sm flex items-center justify-center">
                    Download
                  </a>
                )}
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
              {status === "done" && <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>}
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
