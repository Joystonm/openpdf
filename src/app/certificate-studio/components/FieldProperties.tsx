"use client";

import type { CertField, TextEffect } from "../types";

const EFFECTS: { value: TextEffect; label: string }[] = [
  { value: "none",     label: "None"     },
  { value: "gradient", label: "Gradient" },
  { value: "glow",     label: "Glow"     },
  { value: "shadow",   label: "Shadow"   },
  { value: "outline",  label: "Outline"  },
  { value: "metallic", label: "Metallic" },
  { value: "gold",     label: "Gold"     },
  { value: "silver",   label: "Silver"   },
  { value: "glass",    label: "Glass"    },
  { value: "neon",     label: "Neon"     },
];

const FONTS = [
  "Inter", "Georgia", "Playfair Display", "Montserrat", "Lato",
  "Raleway", "Cinzel", "Cormorant Garamond", "EB Garamond", "Libre Baskerville",
];

interface Props {
  field: CertField;
  onUpdate: (patch: Partial<CertField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function FieldProperties({ field, onUpdate, onDelete, onDuplicate }: Props) {
  const isQr  = field.type === "qr_code";
  const isSig = field.type === "signature";

  return (
    <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest">Properties</p>
        <div className="flex gap-1.5">
          <button onClick={onDuplicate}
            className="px-2.5 py-1 rounded-lg bg-warm-700 text-xs text-cream-200 hover:bg-warm-600 transition-colors">
            Duplicate
          </button>
          <button onClick={onDelete}
            className="px-2.5 py-1 rounded-lg bg-red-500/20 text-xs text-red-400 hover:bg-red-500/30 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {field.type === "custom" && (
        <Row label="Label">
          <input
            value={field.customLabel ?? ""}
            onChange={(e) => onUpdate({ customLabel: e.target.value, label: e.target.value || "Custom" })}
            className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500"
            placeholder="Field label…"
          />
        </Row>
      )}

      {!isQr && !isSig && (
        <>
          <Row label="Font Family">
            <select value={field.fontFamily} onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500">
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Row>

          <div className="grid grid-cols-2 gap-3">
            <Row label={`Size — ${field.fontSize}px`}>
              <input type="range" min={8} max={120} value={field.fontSize}
                onChange={(e) => onUpdate({ fontSize: +e.target.value })}
                className="w-full accent-purple-500 mt-1" />
            </Row>
            <Row label="Weight">
              <select value={field.fontWeight} onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500">
                {["300","400","500","600","700","800","900"].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </Row>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Row label={`Spacing — ${field.letterSpacing}px`}>
              <input type="range" min={-2} max={20} value={field.letterSpacing}
                onChange={(e) => onUpdate({ letterSpacing: +e.target.value })}
                className="w-full accent-purple-500 mt-1" />
            </Row>
            <Row label="Align">
              <div className="flex gap-1 mt-1">
                {(["left","center","right"] as const).map((a) => (
                  <button key={a} onClick={() => onUpdate({ align: a })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      field.align === a ? "bg-purple-600 text-white" : "bg-warm-700 text-warm-400 hover:text-cream-200"
                    }`}>
                    {a[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </Row>
          </div>

          <Row label="Color">
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={field.color} onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
              <span className="text-sm text-warm-400 font-mono">{field.color}</span>
            </div>
          </Row>

          <Row label="Text Effect">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {EFFECTS.map((ef) => (
                <button key={ef.value} onClick={() => onUpdate({ effect: ef.value })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    field.effect === ef.value
                      ? "bg-purple-600 text-white"
                      : "bg-warm-700 text-warm-400 hover:text-cream-200 border border-white/10"
                  }`}>
                  {ef.label}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Auto Fit Text">
            <div className="flex items-center gap-2 mt-1 cursor-pointer" onClick={() => onUpdate({ autoFit: !field.autoFit })}>
              <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${field.autoFit ? "bg-purple-600" : "bg-warm-700"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${field.autoFit ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-warm-400">{field.autoFit ? "On" : "Off"}</span>
            </div>
          </Row>
        </>
      )}

      <Row label={`Rotation — ${field.rotation}°`}>
        <input type="range" min={-180} max={180} value={field.rotation}
          onChange={(e) => onUpdate({ rotation: +e.target.value })}
          className="w-full accent-purple-500 mt-1" />
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-warm-400 block">{label}</label>
      {children}
    </div>
  );
}
