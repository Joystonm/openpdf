"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CertField, CertTemplate, CsvRow } from "../types";
import { CANVAS_W, CANVAS_H } from "../renderer";
import { BUILT_IN_TEMPLATES } from "../templates";
import { drawField } from "../renderer";
import JSZip from "jszip";

interface Props {
  template: CertTemplate;
}

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function buildFieldValues(fields: CertField[], row: CsvRow, mapping: Record<string, string>) {
  const vals: Record<string, string> = {};
  fields.forEach((f) => {
    const col = mapping[f.id];
    if (col && row[col]) vals[f.id] = row[col];
  });
  return vals;
}

async function renderCertificate(
  template: CertTemplate,
  fieldValues: Record<string, string>
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;

  // Background
  if (template.background) {
    await new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H); res(); };
      img.src = template.background!;
    });
  } else if (template.builtIn) {
    const tpl = BUILT_IN_TEMPLATES.find((t) => t.id === template.builtIn);
    tpl?.draw(ctx, CANVAS_W, CANVAS_H);
  }

  // Fields
  template.fields.forEach((f) => {
    drawField(ctx, f, fieldValues[f.id] ?? "", false);
  });

  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
}

export default function BatchGenerator({ template }: Props) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewIdx, setPreviewIdx] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers: h, rows: r } = parseCsv(ev.target!.result as string);
      setHeaders(h);
      setRows(r);
      // Auto-map by label match
      const autoMap: Record<string, string> = {};
      template.fields.forEach((f) => {
        const match = h.find((col) =>
          col.toLowerCase().includes(f.label.toLowerCase().split(" ")[0])
        );
        if (match) autoMap[f.id] = match;
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  // Live preview
  const updatePreview = async (idx: number) => {
    if (!rows[idx] || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (template.background) {
      await new Promise<void>((res) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H); res(); };
        img.src = template.background!;
      });
    } else if (template.builtIn) {
      const tpl = BUILT_IN_TEMPLATES.find((t) => t.id === template.builtIn);
      tpl?.draw(ctx, CANVAS_W, CANVAS_H);
    }

    const vals = buildFieldValues(template.fields, rows[idx], mapping);
    template.fields.forEach((f) => {
      drawField(ctx, f, vals[f.id] ?? "", false);
    });
  };

  const generate = async () => {
    if (!rows.length) return;
    setDone(false);
    setProgress({ done: 0, total: rows.length });
    const zip = new JSZip();

    for (let i = 0; i < rows.length; i++) {
      const vals = buildFieldValues(template.fields, rows[i], mapping);
      const blob = await renderCertificate(template, vals);
      const name = Object.values(vals)[0] || `certificate_${i + 1}`;
      zip.file(`${name.replace(/[^a-z0-9]/gi, "_")}.png`, blob);
      setProgress({ done: i + 1, total: rows.length });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    Object.assign(document.createElement("a"), { href: url, download: "certificates.zip" }).click();
    URL.revokeObjectURL(url);
    setProgress(null);
    setDone(true);
  };

  return (
    <div className="space-y-6">
      {/* Upload CSV */}
      <div>
        <h3 className="text-sm font-semibold text-warm-400 uppercase tracking-widest mb-3">
          Upload CSV / XLSX
        </h3>
        <label className="group flex items-center gap-4 border-2 border-dashed border-white/10 hover:border-purple-500/60 rounded-2xl p-6 cursor-pointer transition-all bg-warm-800/40 hover:bg-purple-500/5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📊
          </div>
          <div>
            <p className="text-cream-200 font-semibold">Upload your data file</p>
            <p className="text-warm-400 text-sm mt-0.5">CSV format — Name, Course, Date columns</p>
          </div>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {rows.length > 0 && (
        <>
          {/* Stats */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-emerald-400 font-semibold">{rows.length} rows detected</p>
              <p className="text-warm-400 text-sm">Columns: {headers.join(", ")}</p>
            </div>
          </div>

          {/* Column mapping */}
          <div>
            <h3 className="text-sm font-semibold text-warm-400 uppercase tracking-widest mb-3">
              Map Columns to Fields
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {template.fields.filter((f) => f.type !== "qr_code" && f.type !== "signature").map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="text-sm text-cream-200 w-36 flex-shrink-0">{f.label}</span>
                  <select
                    value={mapping[f.id] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.id]: e.target.value }))}
                    className="flex-1 bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">— skip —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-warm-400 uppercase tracking-widest">
                Live Preview
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { const i = Math.max(0, previewIdx - 1); setPreviewIdx(i); updatePreview(i); }}
                  className="w-7 h-7 rounded-lg bg-warm-700 text-cream-200 hover:bg-warm-600 transition-colors text-sm flex items-center justify-center">
                  ‹
                </button>
                <span className="text-xs text-warm-400">Row {previewIdx + 1} / {rows.length}</span>
                <button onClick={() => { const i = Math.min(rows.length - 1, previewIdx + 1); setPreviewIdx(i); updatePreview(i); }}
                  className="w-7 h-7 rounded-lg bg-warm-700 text-cream-200 hover:bg-warm-600 transition-colors text-sm flex items-center justify-center">
                  ›
                </button>
                <button onClick={() => updatePreview(previewIdx)}
                  className="px-3 h-7 rounded-lg bg-warm-700 text-xs text-warm-400 hover:text-cream-200 transition-colors">
                  Refresh
                </button>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <canvas ref={previewCanvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full" />
            </div>
          </div>

          {/* Generate button */}
          <AnimatePresence mode="wait">
            {progress ? (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream-200 font-semibold">Generating certificates…</span>
                  <span className="text-warm-400">{progress.done} / {progress.total}</span>
                </div>
                <div className="h-3 rounded-full bg-warm-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    animate={{ width: `${(progress.done / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ) : done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-emerald-400 font-semibold">{rows.length} Certificates Generated!</p>
                  <p className="text-warm-400 text-sm">Downloaded as certificates.zip</p>
                </div>
              </motion.div>
            ) : (
              <motion.button key="btn" onClick={generate}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5">
                🚀 Generate {rows.length} Certificates
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center py-12 text-warm-500">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-semibold text-cream-400">Upload a CSV to get started</p>
          <p className="text-sm mt-1">Example: Name, Course, Date columns</p>
        </div>
      )}
    </div>
  );
}
