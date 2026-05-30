import type { BuiltInTemplate } from "./types";

export interface BuiltInDef {
  id: BuiltInTemplate;
  name: string;
  emoji: string;
  accent: string;
  gradient: string;
  description: string;
  /** Draw the certificate background onto a canvas context */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const BUILT_IN_TEMPLATES: BuiltInDef[] = [
  {
    id: "modern_startup",
    name: "Modern Startup",
    emoji: "🚀",
    accent: "from-violet-500 to-indigo-600",
    gradient: "linear-gradient(135deg,#6d28d9,#4f46e5)",
    description: "Clean, minimal dark certificate for tech companies",
    draw(ctx, w, h) {
      // Dark background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0f0c29");
      bg.addColorStop(0.5, "#302b63");
      bg.addColorStop(1, "#24243e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Accent border
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 6;
      roundRect(ctx, 20, 20, w - 40, h - 40, 16);
      ctx.stroke();

      // Inner glow line
      ctx.strokeStyle = "rgba(124,58,237,0.3)";
      ctx.lineWidth = 1;
      roundRect(ctx, 30, 30, w - 60, h - 60, 12);
      ctx.stroke();

      // Top accent bar
      const bar = ctx.createLinearGradient(0, 0, w, 0);
      bar.addColorStop(0, "#7c3aed");
      bar.addColorStop(1, "#4f46e5");
      ctx.fillStyle = bar;
      ctx.fillRect(20, 20, w - 40, 6);

      // Decorative dots
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(60 + i * 30, h - 50, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124,58,237,${0.3 + i * 0.1})`;
        ctx.fill();
      }
    },
  },
  {
    id: "academic_excellence",
    name: "Academic Excellence",
    emoji: "🎓",
    accent: "from-blue-600 to-cyan-500",
    gradient: "linear-gradient(135deg,#1e40af,#0891b2)",
    description: "Traditional academic certificate with elegant borders",
    draw(ctx, w, h) {
      // Cream background
      ctx.fillStyle = "#fdfaf3";
      ctx.fillRect(0, 0, w, h);

      // Outer border
      ctx.strokeStyle = "#1e40af";
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      // Inner border
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 28, w - 56, h - 56);

      // Corner ornaments
      const corners = [
        [40, 40],
        [w - 40, 40],
        [40, h - 40],
        [w - 40, h - 40],
      ];
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#1e40af";
        ctx.fill();
      });

      // Top decorative line
      ctx.strokeStyle = "#1e40af";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 120, 60);
      ctx.lineTo(w / 2 + 120, 60);
      ctx.stroke();
    },
  },
  {
    id: "course_completion",
    name: "Course Completion",
    emoji: "📚",
    accent: "from-emerald-500 to-teal-600",
    gradient: "linear-gradient(135deg,#059669,#0d9488)",
    description: "Fresh, modern certificate for online courses",
    draw(ctx, w, h) {
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Left accent strip
      const strip = ctx.createLinearGradient(0, 0, 0, h);
      strip.addColorStop(0, "#059669");
      strip.addColorStop(1, "#0d9488");
      ctx.fillStyle = strip;
      ctx.fillRect(0, 0, 12, h);

      // Top bar
      ctx.fillStyle = strip;
      ctx.fillRect(0, 0, w, 8);

      // Subtle grid pattern
      ctx.strokeStyle = "rgba(5,150,105,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Border
      ctx.strokeStyle = "#d1fae5";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, w - 40, h - 40);
    },
  },
  {
    id: "employee_recognition",
    name: "Employee Recognition",
    emoji: "🏢",
    accent: "from-slate-600 to-slate-800",
    gradient: "linear-gradient(135deg,#475569,#1e293b)",
    description: "Professional corporate recognition certificate",
    draw(ctx, w, h) {
      // Dark slate background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#1e293b");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Gold border
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, w - 36, h - 36);

      // Inner subtle border
      ctx.strokeStyle = "rgba(245,158,11,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 26, w - 52, h - 52);

      // Corner stars
      const drawStar = (cx: number, cy: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = i === 0 ? 8 : 8;
          if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawStar(40, 40);
      drawStar(w - 40, 40);
      drawStar(40, h - 40);
      drawStar(w - 40, h - 40);
    },
  },
  {
    id: "hackathon_winner",
    name: "Hackathon Winner",
    emoji: "⚡",
    accent: "from-yellow-400 to-orange-500",
    gradient: "linear-gradient(135deg,#f59e0b,#f97316)",
    description: "Bold, energetic certificate for hackathon winners",
    draw(ctx, w, h) {
      // Dark background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);

      // Neon gradient border
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#f59e0b");
      grad.addColorStop(0.5, "#f97316");
      grad.addColorStop(1, "#ef4444");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      roundRect(ctx, 16, 16, w - 32, h - 32, 12);
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "rgba(245,158,11,0.4)";
      ctx.lineWidth = 1;
      roundRect(ctx, 24, 24, w - 48, h - 48, 8);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Lightning bolt decoration
      ctx.fillStyle = "rgba(245,158,11,0.08)";
      ctx.font = "bold 200px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚡", w / 2, h / 2 + 80);
    },
  },
  {
    id: "luxury_gold",
    name: "Luxury Gold",
    emoji: "✨",
    accent: "from-yellow-500 to-amber-600",
    gradient: "linear-gradient(135deg,#d97706,#b45309)",
    description: "Opulent gold certificate for premium recognition",
    draw(ctx, w, h) {
      // Rich cream background
      ctx.fillStyle = "#fffbeb";
      ctx.fillRect(0, 0, w, h);

      // Gold gradient overlay
      const overlay = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      overlay.addColorStop(0, "rgba(253,230,138,0.3)");
      overlay.addColorStop(1, "rgba(217,119,6,0.1)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);

      // Outer gold border
      const goldGrad = ctx.createLinearGradient(0, 0, w, h);
      goldGrad.addColorStop(0, "#d97706");
      goldGrad.addColorStop(0.3, "#f59e0b");
      goldGrad.addColorStop(0.7, "#d97706");
      goldGrad.addColorStop(1, "#b45309");
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Inner border
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      // Ornamental corners
      const drawCorner = (x: number, y: number, sx: number, sy: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sx, sy);
        ctx.strokeStyle = goldGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.lineTo(0, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#d97706";
        ctx.fill();
        ctx.restore();
      };
      drawCorner(36, 36, 1, 1);
      drawCorner(w - 36, 36, -1, 1);
      drawCorner(36, h - 36, 1, -1);
      drawCorner(w - 36, h - 36, -1, -1);
    },
  },
];
