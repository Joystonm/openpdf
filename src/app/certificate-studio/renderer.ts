import type { CertField, TextEffect } from "./types";

const CANVAS_W = 1000;
const CANVAS_H = 700;

function applyEffect(
  ctx: CanvasRenderingContext2D,
  effect: TextEffect,
  color: string
) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  switch (effect) {
    case "glow":
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      break;
    case "shadow":
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      break;
    case "neon":
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      break;
    default:
      break;
  }
}

function getFillStyle(
  ctx: CanvasRenderingContext2D,
  effect: TextEffect,
  color: string,
  x: number,
  y: number,
  w: number
): string | CanvasGradient {
  switch (effect) {
    case "gold":
    case "metallic": {
      const g = ctx.createLinearGradient(x, y - 20, x, y + 20);
      g.addColorStop(0, "#f59e0b");
      g.addColorStop(0.4, "#fde68a");
      g.addColorStop(0.6, "#d97706");
      g.addColorStop(1, "#92400e");
      return g;
    }
    case "silver": {
      const g = ctx.createLinearGradient(x, y - 20, x, y + 20);
      g.addColorStop(0, "#94a3b8");
      g.addColorStop(0.4, "#e2e8f0");
      g.addColorStop(0.6, "#64748b");
      g.addColorStop(1, "#334155");
      return g;
    }
    case "gradient": {
      const g = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
      g.addColorStop(0, "#7c3aed");
      g.addColorStop(1, "#ec4899");
      return g;
    }
    default:
      return color;
  }
}

export function drawField(
  ctx: CanvasRenderingContext2D,
  field: CertField,
  value: string,
  selected: boolean
) {
  const x = field.x * CANVAS_W;
  const y = field.y * CANVAS_H;
  const w = field.width * CANVAS_W;
  const h = field.height * CANVAS_H;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (field.rotation) ctx.rotate((field.rotation * Math.PI) / 180);

  // Selection highlight
  if (selected) {
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
    ctx.setLineDash([]);

    // Resize handle
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(w / 2 - 5, h / 2 - 5, 10, 10);
  }

  if (field.type === "qr_code") {
    // QR placeholder
    ctx.fillStyle = selected ? "rgba(124,58,237,0.15)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = selected ? "#7c3aed" : "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#64748b";
    ctx.font = `${Math.min(w, h) * 0.12}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QR Code", 0, 0);
    ctx.restore();
    return;
  }

  if (field.type === "signature") {
    ctx.fillStyle = selected ? "rgba(124,58,237,0.1)" : "rgba(0,0,0,0.03)";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = selected ? "#7c3aed" : "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `italic ${Math.min(w * 0.08, 16)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Signature", 0, 0);
    ctx.restore();
    return;
  }

  // Text field
  let displayText = value || `[ ${field.label} ]`;
  let fs = field.fontSize;

  if (field.autoFit) {
    ctx.font = `${field.fontWeight} ${fs}px "${field.fontFamily}", sans-serif`;
    while (ctx.measureText(displayText).width > w - 8 && fs > 8) {
      fs -= 1;
      ctx.font = `${field.fontWeight} ${fs}px "${field.fontFamily}", sans-serif`;
    }
  } else {
    ctx.font = `${field.fontWeight} ${fs}px "${field.fontFamily}", sans-serif`;
  }

  ctx.textAlign = field.align;
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${field.letterSpacing}px`;

  const textX =
    field.align === "left" ? -w / 2 + 4 : field.align === "right" ? w / 2 - 4 : 0;

  applyEffect(ctx, field.effect, field.color);

  if (field.effect === "outline") {
    ctx.strokeStyle = field.color;
    ctx.lineWidth = 2;
    ctx.strokeText(displayText, textX, 0);
    ctx.fillStyle = "transparent";
  } else if (field.effect === "glass") {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = getFillStyle(ctx, field.effect, field.color, 0, 0, w);
    ctx.fillText(displayText, textX, 0);
  } else {
    ctx.fillStyle = getFillStyle(ctx, field.effect, field.color, 0, 0, w);
    ctx.fillText(displayText, textX, 0);
  }

  ctx.restore();
}

export { CANVAS_W, CANVAS_H };
