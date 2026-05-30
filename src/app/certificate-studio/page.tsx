"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { CertField, CertTemplate, FieldType } from "./types";
import { BUILT_IN_TEMPLATES } from "./templates";
import { CANVAS_W, CANVAS_H, drawField } from "./renderer";
import TemplateSource from "./components/TemplateSource";
import CertCanvas from "./components/CertCanvas";
import FieldPalette from "./components/FieldPalette";
import FieldProperties from "./components/FieldProperties";
import BatchGenerator from "./components/BatchGenerator";

type Tab = "editor" | "batch";

const FIELD_DEFAULTS: Record<FieldType, Partial<CertField>> = {
  recipient_name: { fontSize: 48, fontWeight: "700", color: "#1a1714", label: "Recipient Name" },
  course_name:    { fontSize: 28, fontWeight: "600", color: "#374151", label: "Course Name" },
  date:           { fontSize: 20, fontWeight: "400", color: "#6b7280", label: "Date" },
  organization:   { fontSize: 18, fontWeight: "500", color: "#374151", label: "Organization" },
  award_title:    { fontSize: 32, fontWeight: "700", color: "#1a1714", label: "Award Title" },
  certificate_id: { fontSize: 14, fontWeight: "400", color: "#9ca3af", label: "Certificate ID" },
  signature:      { fontSize: 20, fontWeight: "400", color: "#1a1714", label: "Signature" },
  qr_code:        { fontSize: 14, fontWeight: "400", color: "#1a1714", label: "QR Code" },
  custom:         { fontSize: 20, fontWeight: "400", color: "#1a1714", label: "Custom" },
};

function makeField(type: FieldType): CertField {
  const defaults = FIELD_DEFAULTS[type];
  const isQr = type === "qr_code";
  const isSig = type === "signature";
  return {
    id: `${type}_${Date.now()}`,
    type,
    label: defaults.label ?? type,
    x: 0.3,
    y: 0.4,
    width: isQr ? 0.12 : isSig ? 0.2 : 0.4,
    height: isQr ? 0.17 : isSig ? 0.1 : 0.08,
    rotation: 0,
    fontFamily: "Inter",
    fontSize: defaults.fontSize ?? 24,
    fontWeight: defaults.fontWeight ?? "400",
    letterSpacing: 0,
    lineHeight: 1.4,
    color: defaults.color ?? "#1a1714",
    align: "center",
    effect: "none",
    autoFit: type === "recipient_name",
  };
}

async function exportSingle(template: CertTemplate, format: "png" | "jpg" | "pdf") {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;

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

  template.fields.forEach((f) => drawField(ctx, f, f.label, false));

  if (format === "pdf") {
    // Simple PDF with embedded image via pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([CANVAS_W, CANVAS_H]);
    const pngBytes = await fetch(canvas.toDataURL("image/png")).then((r) => r.arrayBuffer());
    const img = await pdfDoc.embedPng(pngBytes);
    page.drawImage(img, { x: 0, y: 0, width: CANVAS_W, height: CANVAS_H });
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "certificate.pdf" }).click();
    URL.revokeObjectURL(url);
  } else {
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const url = canvas.toDataURL(mime, 0.95);
    Object.assign(document.createElement("a"), { href: url, download: `certificate.${format}` }).click();
  }
}

export default function CertificateStudioPage() {
  const [step, setStep] = useState<"source" | "editor">("source");
  const [tab, setTab] = useState<Tab>("editor");
  const [template, setTemplate] = useState<CertTemplate>({
    id: "new",
    name: "My Certificate",
    background: null,
    fields: [],
    builtIn: undefined,
  });
  const [selected, setSelected] = useState<string | null>(null);

  const initTemplate = useCallback((patch: Partial<CertTemplate>) => {
    setTemplate((t) => ({ ...t, ...patch }));
    setStep("editor");
  }, []);

  const addField = useCallback((type: FieldType, label: string) => {
    const f = { ...makeField(type), label };
    setTemplate((t) => ({ ...t, fields: [...t.fields, f] }));
    setSelected(f.id);
  }, []);

  const updateField = useCallback((id: string, patch: Partial<CertField>) => {
    setTemplate((t) => ({
      ...t,
      fields: t.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }, []);

  const deleteField = useCallback((id: string) => {
    setTemplate((t) => ({ ...t, fields: t.fields.filter((f) => f.id !== id) }));
    setSelected(null);
  }, []);

  const duplicateField = useCallback((id: string) => {
    setTemplate((t) => {
      const orig = t.fields.find((f) => f.id === id);
      if (!orig) return t;
      const copy = { ...orig, id: `${orig.type}_${Date.now()}`, x: orig.x + 0.02, y: orig.y + 0.02 };
      return { ...t, fields: [...t.fields, copy] };
    });
  }, []);

  const moveField = useCallback((id: string, x: number, y: number) => {
    setTemplate((t) => ({
      ...t,
      fields: t.fields.map((f) => (f.id === id ? { ...f, x: Math.max(0, Math.min(0.95, x)), y: Math.max(0, Math.min(0.95, y)) } : f)),
    }));
  }, []);

  const resizeField = useCallback((id: string, w: number, h: number) => {
    setTemplate((t) => ({
      ...t,
      fields: t.fields.map((f) => (f.id === id ? { ...f, width: w, height: h } : f)),
    }));
  }, []);

  return (
    <main className="min-h-screen pt-14 bg-warm-900">
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Link href="/design-studio" className="inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-cream-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Design Studio
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg text-xl">
              🏆
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-cream-100">Certificate Studio</h1>
              <p className="text-xs text-warm-400">Design, customize, and generate professional certificates in seconds.</p>
            </div>
          </div>

          {/* Marketing badge */}
          <div className="ml-auto hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
            ✨ Generate 1 or 10,000 certificates — completely free
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "source" ? (
            <motion.div key="source" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Marketing banner */}
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/60 to-pink-900/40 border border-purple-500/20">
                <p className="text-lg font-bold text-cream-100 mb-3">
                  🎓 Professional Certificate Generator — 100% Free
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Unlimited Certificates","No Watermarks","CSV/XLSX Support","QR Verification","Professional Templates","High Resolution Export","Free Forever"].map((f) => (
                    <span key={f} className="flex items-center gap-1.5 text-sm text-emerald-400">
                      <span className="text-emerald-500">✅</span> {f}
                    </span>
                  ))}
                </div>
              </div>

              <TemplateSource
                onUpload={(dataUrl) => initTemplate({ background: dataUrl, builtIn: undefined })}
              />
            </motion.div>
          ) : (
            <motion.div key="editor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Tab bar */}
              <div className="flex items-center gap-1 mb-6 bg-warm-800/60 rounded-xl p-1 w-fit">
                {([["editor","🎨 Canvas Editor"],["batch","📊 Batch Generator"]] as [Tab, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      tab === t ? "bg-purple-600 text-white shadow" : "text-warm-400 hover:text-cream-200"
                    }`}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setStep("source")}
                  className="ml-4 px-4 py-2 rounded-lg text-sm text-warm-400 hover:text-cream-200 transition-colors border border-white/10 hover:border-white/20">
                  ← Change Template
                </button>
              </div>

              {tab === "editor" ? (
                <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_280px] gap-4">
                  {/* Left sidebar — field palette */}
                  <div className="bg-warm-800/40 rounded-2xl border border-white/10 p-4 overflow-y-auto max-h-[80vh]">
                    <FieldPalette
                      fields={template.fields}
                      selected={selected}
                      onAdd={addField}
                      onSelect={setSelected}
                    />
                  </div>

                  {/* Center — canvas */}
                  <div className="space-y-4">
                    <CertCanvas
                      background={template.background}
                      builtIn={template.builtIn ?? null}
                      fields={template.fields}
                      selected={selected}
                      onSelect={setSelected}
                      onMove={moveField}
                      onResize={resizeField}
                    />

                    {/* Export bar */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-warm-800/40 border border-white/10">
                      <span className="text-sm text-warm-400 font-semibold">Export:</span>
                      {(["png","jpg","pdf"] as const).map((fmt) => (
                        <button key={fmt} onClick={() => exportSingle(template, fmt)}
                          className="px-4 py-2 rounded-xl bg-warm-700 hover:bg-warm-600 text-cream-200 text-sm font-semibold uppercase transition-colors">
                          {fmt}
                        </button>
                      ))}
                      <span className="ml-auto text-xs text-warm-500">High resolution · No watermarks</span>
                    </div>
                  </div>

                  {/* Right sidebar — properties */}
                  <div className="bg-warm-800/40 rounded-2xl border border-white/10 p-4 overflow-y-auto max-h-[80vh]">
                    {selected && template.fields.find((f) => f.id === selected) ? (
                      <FieldProperties
                        field={template.fields.find((f) => f.id === selected)!}
                        onUpdate={(patch) => updateField(selected, patch)}
                        onDelete={() => deleteField(selected)}
                        onDuplicate={() => duplicateField(selected)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                        <div className="text-4xl">👆</div>
                        <p className="text-warm-400 text-sm">Click a field on the canvas to edit its properties</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-warm-800/40 rounded-2xl border border-white/10 p-6">
                  <BatchGenerator template={template} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
