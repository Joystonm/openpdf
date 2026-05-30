"use client";

import { useState } from "react";
import type { CertField, FieldType } from "../types";

export const FIELD_DEFS: { type: FieldType; label: string; icon: string }[] = [
  { type: "recipient_name", label: "Text",        icon: "T"  },
  { type: "date",           label: "Date",        icon: "📅" },
  { type: "custom",         label: "Custom Text", icon: "✏️" },
];

interface Props {
  fields: CertField[];
  selected: string | null;
  onAdd: (type: FieldType, label: string) => void;
  onSelect: (id: string) => void;
}

export default function FieldPalette({ fields, selected, onAdd, onSelect }: Props) {
  const [pending, setPending] = useState<FieldType | null>(null);
  const [name, setName] = useState("");

  const handleAdd = (type: FieldType) => {
    setPending(type);
    setName("");
  };

  const confirm = () => {
    if (!pending) return;
    const label = name.trim() || FIELD_DEFS.find((d) => d.type === pending)!.label;
    onAdd(pending, label);
    setPending(null);
    setName("");
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest mb-3">
        Dynamic Fields
      </p>

      {FIELD_DEFS.map((d) => (
        <button
          key={d.type}
          onClick={() => handleAdd(d.type)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-warm-800/60 border border-white/10 hover:border-purple-500/60 hover:bg-purple-500/10 text-left transition-all group"
        >
          <span className="text-base font-bold text-warm-400 w-5 text-center">{d.icon}</span>
          <span className="text-sm text-cream-200 group-hover:text-purple-300 transition-colors">{d.label}</span>
          <span className="ml-auto text-warm-600 group-hover:text-purple-400 text-lg leading-none">+</span>
        </button>
      ))}

      {/* Name prompt modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-warm-800 border border-white/10 rounded-2xl p-6 w-80 shadow-2xl space-y-4">
            <p className="text-cream-100 font-semibold">Name this field</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") setPending(null); }}
              placeholder={`e.g. ${pending === "date" ? "Issue Date" : "Recipient Name"}`}
              className="w-full bg-warm-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500"
            />
            <div className="flex gap-2">
              <button onClick={confirm}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors">
                Add Field
              </button>
              <button onClick={() => setPending(null)}
                className="px-4 py-2 rounded-xl bg-warm-700 hover:bg-warm-600 text-warm-300 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="pt-4">
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest mb-2">Placed Fields</p>
          <div className="space-y-1">
            {fields.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelect(f.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                  selected === f.id
                    ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                    : "bg-warm-800/40 border border-transparent text-warm-400 hover:text-cream-200 hover:bg-warm-700/40"
                }`}
              >
                <span>{FIELD_DEFS.find((d) => d.type === f.type)?.icon ?? "T"}</span>
                <span className="truncate">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
