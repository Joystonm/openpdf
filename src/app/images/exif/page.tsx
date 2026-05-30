"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";

type ExifData = Record<string, string | number>;

function readExif(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer;
      const view = new DataView(buf);
      const result: ExifData = {
        "File Name": file.name,
        "File Size": `${(file.size / 1024).toFixed(1)} KB`,
        "File Type": file.type || "unknown",
        "Last Modified": new Date(file.lastModified).toLocaleString(),
      };

      // Check for JPEG EXIF
      if (view.getUint16(0) !== 0xFFD8) { resolve(result); return; }
      let offset = 2;
      while (offset < view.byteLength - 2) {
        const marker = view.getUint16(offset);
        if (marker === 0xFFE1) {
          // APP1 — EXIF
          const exifHeader = String.fromCharCode(...new Uint8Array(buf, offset + 4, 4));
          if (exifHeader === "Exif") {
            const tiffOffset = offset + 10;
            const littleEndian = view.getUint16(tiffOffset) === 0x4949;
            const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
            const ifdStart = tiffOffset + ifdOffset;
            const entries = view.getUint16(ifdStart, littleEndian);

            const tagNames: Record<number, string> = {
              0x010F: "Make", 0x0110: "Model", 0x0112: "Orientation",
              0x011A: "XResolution", 0x011B: "YResolution", 0x0128: "ResolutionUnit",
              0x0132: "DateTime", 0x013B: "Artist", 0x8298: "Copyright",
              0x8769: "ExifIFD", 0x9003: "DateTimeOriginal", 0x9004: "DateTimeDigitized",
              0x9291: "SubSecTimeOriginal", 0xA002: "PixelXDimension", 0xA003: "PixelYDimension",
              0x920A: "FocalLength", 0x829A: "ExposureTime", 0x829D: "FNumber",
              0x8827: "ISOSpeedRatings", 0x9201: "ShutterSpeedValue",
            };

            for (let i = 0; i < entries; i++) {
              const entryOffset = ifdStart + 2 + i * 12;
              const tag = view.getUint16(entryOffset, littleEndian);
              const type = view.getUint16(entryOffset + 2, littleEndian);
              const count = view.getUint32(entryOffset + 4, littleEndian);
              const name = tagNames[tag];
              if (!name) continue;
              try {
                let val: string | number = "";
                if (type === 2) {
                  // ASCII
                  const strOffset = count > 4 ? tiffOffset + view.getUint32(entryOffset + 8, littleEndian) : entryOffset + 8;
                  val = new TextDecoder().decode(new Uint8Array(buf, strOffset, count - 1)).trim();
                } else if (type === 3) {
                  val = view.getUint16(entryOffset + 8, littleEndian);
                } else if (type === 4) {
                  val = view.getUint32(entryOffset + 8, littleEndian);
                } else if (type === 5) {
                  const ratOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                  const num = view.getUint32(ratOffset, littleEndian);
                  const den = view.getUint32(ratOffset + 4, littleEndian);
                  val = den ? `${num}/${den}` : num;
                }
                if (val !== "" && val !== 0) result[name] = val;
              } catch { /* skip malformed entry */ }
            }
          }
          break;
        }
        if ((marker & 0xFF00) !== 0xFF00) break;
        offset += 2 + view.getUint16(offset + 2);
      }
      resolve(result);
    };
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

export default function ExifViewerPage() {
  const [exif, setExif] = useState<ExifData | null>(null);
  const [preview, setPreview] = useState("");
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    const url = URL.createObjectURL(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    const data = await readExif(f);
    data["Dimensions"] = `${img.naturalWidth} × ${img.naturalHeight}`;
    setExif(data);
  }, [preview]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(""); setExif(null); setImgSize({ w: 0, h: 0 });
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">🔎</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">EXIF Viewer</h1>
          <p className="text-warm-500 text-lg">Read metadata embedded in your image files.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!exif && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPEG EXIF data supported" />
            </motion.div>
          )}

          {exif && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {preview && (
                <div className="flex items-center justify-center rounded-2xl overflow-hidden border border-warm bg-[#e5e5e5] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="preview" className="max-h-48 max-w-full object-contain rounded-xl" />
                </div>
              )}

              <div className="bg-white border border-warm rounded-2xl shadow-warm overflow-hidden">
                <div className="px-5 py-3 border-b border-warm bg-cream-50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-warm-400">Metadata</p>
                </div>
                <div className="divide-y divide-warm">
                  {Object.entries(exif).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-4 px-5 py-3">
                      <span className="text-xs font-semibold text-warm-500 w-40 shrink-0 pt-0.5">{k}</span>
                      <span className="text-sm text-warm-900 break-all">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={reset} className="w-full py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                Check Another Image
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
