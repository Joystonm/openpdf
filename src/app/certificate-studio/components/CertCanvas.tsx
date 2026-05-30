"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { CertField, BuiltInTemplate } from "../types";
import { CANVAS_W, CANVAS_H } from "../renderer";
import { BUILT_IN_TEMPLATES } from "../templates";

interface Props {
  background: string | null;
  builtIn: BuiltInTemplate | null;
  fields: CertField[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

const FIELD_ICONS: Record<string, string> = {
  recipient_name: "👤", course_name: "📚", date: "📅", organization: "🏢",
  award_title: "🎖", certificate_id: "🆔", signature: "✍️", qr_code: "🔳", custom: "📝",
};

export default function CertCanvas({
  background, builtIn, fields, selected, onSelect, onMove, onResize,
}: Props) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgLoaded, setBgLoaded] = useState(0);
  const [zoom, setZoom] = useState(1);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Draw background only
  const drawBg = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (bgImgRef.current) {
      ctx.drawImage(bgImgRef.current, 0, 0, CANVAS_W, CANVAS_H);
    } else if (builtIn) {
      const tpl = BUILT_IN_TEMPLATES.find((t) => t.id === builtIn);
      tpl?.draw(ctx, CANVAS_W, CANVAS_H);
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Upload a certificate image to get started", CANVAS_W / 2, CANVAS_H / 2);
    }
  }, [builtIn, bgLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!background) { bgImgRef.current = null; setBgLoaded((n) => n + 1); return; }
    const img = new Image();
    img.onload = () => { bgImgRef.current = img; setBgLoaded((n) => n + 1); };
    img.src = background;
  }, [background]);

  useEffect(() => { drawBg(); }, [drawBg]);

  // Drag field
  const dragRef = useRef<{ id: string; startMouseX: number; startMouseY: number; origX: number; origY: number } | null>(null);
  // Resize field
  const resizeRef = useRef<{ id: string; startMouseX: number; startMouseY: number; origW: number; origH: number } | null>(null);

  const onFieldMouseDown = useCallback((e: React.MouseEvent, field: CertField) => {
    e.stopPropagation();
    onSelect(field.id);
    dragRef.current = {
      id: field.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origX: field.x,
      origY: field.y,
    };
  }, [onSelect]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent, field: CertField) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
      id: field.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origW: field.width,
      origH: field.height,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const scale = zoom; // canvas is scaled, so mouse delta needs inverse scale
    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.startMouseX) / (CANVAS_W * scale);
      const dy = (e.clientY - dragRef.current.startMouseY) / (CANVAS_H * scale);
      onMove(dragRef.current.id,
        Math.max(0, Math.min(0.98, dragRef.current.origX + dx)),
        Math.max(0, Math.min(0.98, dragRef.current.origY + dy)),
      );
    }
    if (resizeRef.current) {
      const dx = (e.clientX - resizeRef.current.startMouseX) / (CANVAS_W * scale);
      const dy = (e.clientY - resizeRef.current.startMouseY) / (CANVAS_H * scale);
      onResize(resizeRef.current.id,
        Math.max(0.05, resizeRef.current.origW + dx),
        Math.max(0.03, resizeRef.current.origH + dy),
      );
    }
  }, [zoom, onMove, onResize]);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))}
          className="w-8 h-8 rounded-lg bg-warm-700 text-cream-200 hover:bg-warm-600 transition-colors font-bold flex items-center justify-center">−</button>
        <span className="text-xs text-warm-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}
          className="w-8 h-8 rounded-lg bg-warm-700 text-cream-200 hover:bg-warm-600 transition-colors font-bold flex items-center justify-center">+</button>
        <button onClick={() => setZoom(1)}
          className="px-3 h-8 rounded-lg bg-warm-700 text-xs text-warm-400 hover:text-cream-200 hover:bg-warm-600 transition-colors">Fit</button>
        <span className="text-xs text-warm-500 ml-2">Drag fields · Drag corner to resize · Click to select</span>
      </div>

      {/* Canvas + overlay container */}
      <div className="overflow-auto rounded-2xl border border-white/10"
        style={{ background: "repeating-conic-gradient(#2a2520 0% 25%, #1a1714 0% 50%) 0 0 / 20px 20px" }}>
        <div
          ref={containerRef}
          className="relative select-none"
          style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onMouseDown={() => onSelect(null)}
        >
          {/* Background canvas */}
          <canvas
            ref={bgCanvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom, display: "block" }}
          />

          {/* HTML field overlays */}
          {fields.map((field) => {
            const isSelected = field.id === selected;
            const left = field.x * CANVAS_W * zoom;
            const top = field.y * CANVAS_H * zoom;
            const width = field.width * CANVAS_W * zoom;
            const height = field.height * CANVAS_H * zoom;
            const isQr = field.type === "qr_code";
            const isSig = field.type === "signature";

            return (
              <div
                key={field.id}
                onMouseDown={(e) => onFieldMouseDown(e, field)}
                style={{
                  position: "absolute",
                  left, top, width, height,
                  transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
                  cursor: "move",
                  boxSizing: "border-box",
                  border: isSelected ? "2px solid #7c3aed" : "1.5px dashed rgba(124,58,237,0.45)",
                  borderRadius: 4,
                  background: isSelected
                    ? "rgba(124,58,237,0.10)"
                    : isQr || isSig
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: field.align === "left" ? "flex-start" : field.align === "right" ? "flex-end" : "center",
                  padding: "0 6px",
                  overflow: "hidden",
                  userSelect: "none",
                }}
              >
                {/* Label text */}
                <span style={{
                  fontFamily: `"${field.fontFamily}", sans-serif`,
                  fontSize: Math.max(10, field.fontSize * zoom),
                  fontWeight: field.fontWeight,
                  color: field.color,
                  letterSpacing: field.letterSpacing,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  pointerEvents: "none",
                  textShadow: field.effect === "glow" || field.effect === "neon"
                    ? `0 0 12px ${field.color}`
                    : field.effect === "shadow"
                    ? "2px 3px 6px rgba(0,0,0,0.5)"
                    : undefined,
                }}>
                  {isQr ? "🔳 QR Code" : isSig ? "✍️ Signature" : `[ ${field.label} ]`}
                </span>

                {/* Resize handle */}
                <div
                  onMouseDown={(e) => onResizeMouseDown(e, field)}
                  style={{
                    position: "absolute",
                    right: 0, bottom: 0,
                    width: 14, height: 14,
                    background: isSelected ? "#7c3aed" : "rgba(124,58,237,0.5)",
                    borderRadius: "3px 0 3px 0",
                    cursor: "se-resize",
                  }}
                />

                {/* Field type badge */}
                {isSelected && (
                  <div style={{
                    position: "absolute",
                    top: -22, left: 0,
                    background: "#7c3aed",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: "4px 4px 0 0",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}>
                    {FIELD_ICONS[field.type]} {field.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
