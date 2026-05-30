"use client";

import type { CertField, FieldType, TextEffect } from "../types";

const FIELD_DEFS: { type: FieldType; label: string; icon: string }[] = [
  { type: "recipient_name", label: "Recipient Name", icon: "👤" },
  { type: "course_name", label: "Course Name", icon: "📚" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "organization", label: "Organization", icon: "🏢" },
  { type: "award_title", label: "Award Title", icon: "🎖" },
  { type: "certificate_id", label: "Certificate ID", icon: "🆔" },
  { type: "signature", label: "Signature", icon: "✍️" },
  { type: "qr_code", label: "QR Code", icon: "🔳" },
  { type: "custom", label: "Custom Field", icon: "📝" },
];

const EFFECTS: { value: TextEffect; label: string }[] = [
  { value: "none", label: "None" },
  { value: "gradient", label: "Gradient" },
  { value: "glow", label: "Glow" },
  { value: "shadow", label: "Shadow" },
  { value: "outline", label: "Outline" },
  { value: "metallic", label: "Metallic" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "glass", label: "Glass" },
  { value: "neon", label: "Neon" },
];

const FONTS = [
  "Inter", "Georgia", "Playfair Display", "Montserrat", "Lato",
  "Raleway", "Cinzel", "Cormorant Garamond", "EB Garamond", "Libre Baskerville",
];

interface Props {
  fields: CertField[];
  selected: string | null;
  onAdd: (type: FieldType) => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<CertField>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function FieldSidebars({
  fields, selected, onAdd, onSelect, onUpdate, onDelete, onDuplicate,
}: Props) {
  const sel = fields.find((f) => f.id === selected);

  return (
    <div className="flex gap-4 h-full">
      {/* Left: field palette */}
      <div className="w-52 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest mb-3">
          Dynamic Fields
        </p>
        {FIELD_DEFS.map((d) => (
          <button
            key={d.type}
            onClick={() => onAdd(d.type)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-warm-800/60 border border-white/10 hover:border-purple-500/50 hover:bg-warm-700/60 text-left transition-all group"
          >
            <span className="text-lg">{d.icon}</span>
            <span className="text-sm text-cream-200 group-hover:text-purple-300 transition-colors">
              {d.label}
            </span>
          </button>
        ))}

        {/* Field list */}
        {fields.length > 0 && (
          <div className="pt-4">
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest mb-2">
              Placed Fields
            </p>
            <div className="space-y-1">
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onSelect(f.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                    selected === f.id
                      ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                      : "bg-warm-800/40 border border-transparent text-warm-400 hover:text-cream-200"
                  }`}
                >
                  <span>{FIELD_DEFS.find((d) => d.type === f.type)?.icon ?? "📝"}</span>
                  <span className="truncate">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: properties panel */}
      {sel && (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest">
              Field Properties
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => onDuplicate(sel.id)}
                className="px-2.5 py-1 rounded-lg bg-warm-700 text-xs text-cream-200 hover:bg-warm-600 transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={() => onDelete(sel.id)}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 text-xs text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {sel.type === "custom" && (
            <div>
              <label className="text-xs text-warm-400 block mb-1">Label</label>
              <input
                value={sel.customLabel ?? ""}
                onChange={(e) => onUpdate(sel.id, { customLabel: e.target.value, label: e.target.value || "Custom" })}
                className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500"
                placeholder="Field label…"
              />
            </div>
          )}

          {sel.type !== "qr_code" && sel.type !== "signature" && (
            <>
              <Row label="Font Family">
                <select
                  value={sel.fontFamily}
                  onChange={(e) => onUpdate(sel.id, { fontFamily: e.target.value })}
                  className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500"
                >
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Row>

              <div className="grid grid-cols-2 gap-3">
                <Row label={`Size — ${sel.fontSize}px`}>
                  <input type="range" min={8} max={120} value={sel.fontSize}
                    onChange={(e) => onUpdate(sel.id, { fontSize: +e.target.value })}
                    className="w-full accent-purple-500" />
                </Row>
                <Row label="Weight">
                  <select value={sel.fontWeight}
                    onChange={(e) => onUpdate(sel.id, { fontWeight: e.target.value })}
                    className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500">
                    {["300","400","500","600","700","800","900"].map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </Row>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Row label={`Spacing — ${sel.letterSpacing}px`}>
                  <input type="range" min={-2} max={20} value={sel.letterSpacing}
                    onChange={(e) => onUpdate(sel.id, { letterSpacing: +e.target.value })}
                    className="w-full accent-purple-500" />
                </Row>
                <Row label="Align">
                  <div className="flex gap-1">
                    {(["left","center","right"] as const).map((a) => (
                      <button key={a} onClick={() => onUpdate(sel.id, { align: a })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          sel.align === a ? "bg-purple-600 text-white" : "bg-warm-700 text-warm-400 hover:text-cream-200"
                        }`}>
                        {a[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </Row>
              </div>

              <Row label="Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={sel.color}
                    onChange={(e) => onUpdate(sel.id, { color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                  <span className="text-sm text-warm-400">{sel.color}</span>
                </div>
              </Row>

              <Row label="Text Effect">
                <div className="flex flex-wrap gap-1.5">
                  {EFFECTS.map((ef) => (
                    <button key={ef.value} onClick={() => onUpdate(sel.id, { effect: ef.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        sel.effect === ef.value
                          ? "bg-purple-600 text-white"
                          : "bg-warm-700 text-warm-400 hover:text-cream-200 border border-white/10"
                      }`}>
                      {ef.label}
                    </button>
                  ))}
                </div>
              </Row>

              <Row label="Auto Fit Text">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => onUpdate(sel.id, { autoFit: !sel.autoFit })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${sel.autoFit ? "bg-purple-600" : "bg-warm-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sel.autoFit ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-warm-400">{sel.autoFit ? "On" : "Off"}</span>
                </label>
              </Row>
            </>
          )}

          <Row label={`Rotation — ${sel.rotation}°`}>
            <input type="range" min={-180} max={180} value={sel.rotation}
              onChange={(e) => onUpdate(sel.id, { rotation: +e.target.value })}
              className="w-full accent-purple-500" />
          </Row>
        </div>
      )}

      {!sel && fields.length > 0 && (
        <div className="flex-1 flex items-center justify-center text-warm-500 text-sm">
          Click a field on the canvas to edit its properties
        </div>
      )}

      {fields.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="text-4xl">👈</div>
          <p className="text-warm-400 text-sm">Click a field type to add it to your certificate</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-warm-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}
