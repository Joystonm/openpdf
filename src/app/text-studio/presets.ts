// Text Studio — preset style definitions
// Each preset returns a function that draws styled text onto a canvas context

export interface StylePreset {
  id: string;
  label: string;
  emoji: string;
  category: string;
  animated?: boolean;
  draw: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, font: string, frame: number) => void;
}

const px = (n: number) => n;

export const PRESETS: StylePreset[] = [
  {
    id: "clean",
    label: "Clean",
    emoji: "✨",
    category: "Basic",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1a1714";
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "neon",
    label: "Neon",
    emoji: "💜",
    category: "Glow",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const pulse = 0.7 + 0.3 * Math.sin(frame * 0.08);
      ctx.shadowColor = `rgba(180,0,255,${pulse})`;
      ctx.shadowBlur = 30 * pulse;
      ctx.fillStyle = "#e879f9";
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 60 * pulse;
      ctx.fillStyle = "rgba(232,121,249,0.4)";
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "flame",
    label: "Flame",
    emoji: "🔥",
    category: "Glow",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const grad = ctx.createLinearGradient(x - fontSize * 3, y + fontSize * 0.5, x + fontSize * 3, y - fontSize * 0.5);
      const t = (Math.sin(frame * 0.05) + 1) / 2;
      grad.addColorStop(0, `hsl(${20 + t * 10},100%,50%)`);
      grad.addColorStop(0.4, `hsl(${35 + t * 5},100%,55%)`);
      grad.addColorStop(0.7, `hsl(${50},100%,60%)`);
      grad.addColorStop(1, `hsl(${15 + t * 10},100%,45%)`);
      ctx.shadowColor = `rgba(255,100,0,${0.6 + 0.4 * Math.sin(frame * 0.1)})`;
      ctx.shadowBlur = 20;
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    },
  },
  {
    id: "chrome",
    label: "Chrome",
    emoji: "🪞",
    category: "Metal",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const grad = ctx.createLinearGradient(x, y - fontSize * 0.6, x, y + fontSize * 0.6);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.2, "#c8c8c8");
      grad.addColorStop(0.5, "#888");
      grad.addColorStop(0.8, "#d0d0d0");
      grad.addColorStop(1, "#555");
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeText(text, x, y);
    },
  },
  {
    id: "gold",
    label: "Gold",
    emoji: "✨",
    category: "Metal",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const grad = ctx.createLinearGradient(x, y - fontSize * 0.6, x, y + fontSize * 0.6);
      grad.addColorStop(0, "#fff7a0");
      grad.addColorStop(0.25, "#f5c518");
      grad.addColorStop(0.5, "#b8860b");
      grad.addColorStop(0.75, "#f5c518");
      grad.addColorStop(1, "#8b6914");
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.strokeStyle = "#7a5c00";
      ctx.lineWidth = 1;
      ctx.strokeText(text, x, y);
    },
  },
  {
    id: "glass",
    label: "Glass",
    emoji: "🔷",
    category: "Modern",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = fontSize * 0.04;
      ctx.strokeText(text, x, y);
      const grad = ctx.createLinearGradient(x, y - fontSize * 0.6, x, y + fontSize * 0.6);
      grad.addColorStop(0, "rgba(255,255,255,0.85)");
      grad.addColorStop(0.4, "rgba(180,220,255,0.6)");
      grad.addColorStop(1, "rgba(100,180,255,0.3)");
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "rainbow",
    label: "Rainbow",
    emoji: "🌈",
    category: "Gradient",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const metrics = ctx.measureText(text);
      const w = metrics.width;
      const grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
      const offset = (frame * 0.01) % 1;
      for (let i = 0; i <= 6; i++) {
        grad.addColorStop(Math.min(1, ((i / 6) + offset) % 1), `hsl(${i * 60},100%,55%)`);
      }
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    emoji: "🌌",
    category: "Gradient",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const metrics = ctx.measureText(text);
      const w = metrics.width;
      const t = frame * 0.02;
      const grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
      grad.addColorStop(0, `hsl(${160 + Math.sin(t) * 30},80%,60%)`);
      grad.addColorStop(0.33, `hsl(${200 + Math.sin(t + 1) * 30},90%,65%)`);
      grad.addColorStop(0.66, `hsl(${260 + Math.sin(t + 2) * 30},80%,70%)`);
      grad.addColorStop(1, `hsl(${300 + Math.sin(t + 3) * 20},70%,65%)`);
      ctx.shadowColor = `hsl(${200 + Math.sin(t) * 40},80%,60%)`;
      ctx.shadowBlur = 20;
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    },
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    emoji: "⚡",
    category: "Retro",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Glitch offset
      const glitch = Math.random() > 0.92 ? (Math.random() - 0.5) * 6 : 0;
      ctx.fillStyle = "rgba(255,0,80,0.7)";
      ctx.fillText(text, x + 3 + glitch, y);
      ctx.fillStyle = "rgba(0,255,255,0.7)";
      ctx.fillText(text, x - 3 - glitch, y);
      ctx.shadowColor = "#ff0050";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    },
  },
  {
    id: "retro",
    label: "Retro Arcade",
    emoji: "🕹️",
    category: "Retro",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // 3D block shadow
      for (let i = 6; i > 0; i--) {
        ctx.fillStyle = `hsl(${270 - i * 5},60%,${20 + i * 3}%)`;
        ctx.fillText(text, x + i, y + i);
      }
      const grad = ctx.createLinearGradient(x, y - fontSize * 0.5, x, y + fontSize * 0.5);
      grad.addColorStop(0, "#ff6bff");
      grad.addColorStop(0.5, "#ff00cc");
      grad.addColorStop(1, "#9900ff");
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "vaporwave",
    label: "Vaporwave",
    emoji: "🌸",
    category: "Retro",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const grad = ctx.createLinearGradient(x, y - fontSize * 0.5, x, y + fontSize * 0.5);
      grad.addColorStop(0, "#ff71ce");
      grad.addColorStop(0.5, "#b967ff");
      grad.addColorStop(1, "#01cdfe");
      ctx.shadowColor = "#ff71ce";
      ctx.shadowBlur = 15;
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeText(text, x, y);
    },
  },
  {
    id: "embossed",
    label: "Embossed",
    emoji: "🗿",
    category: "3D",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(text, x - 2, y - 2);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillText(text, x + 2, y + 2);
      ctx.fillStyle = "#c8b89a";
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "3d",
    label: "3D Block",
    emoji: "📦",
    category: "3D",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 8; i > 0; i--) {
        ctx.fillStyle = `hsl(210,60%,${15 + i * 3}%)`;
        ctx.fillText(text, x + i, y + i);
      }
      const grad = ctx.createLinearGradient(x, y - fontSize * 0.5, x, y + fontSize * 0.5);
      grad.addColorStop(0, "#60a5fa");
      grad.addColorStop(1, "#2563eb");
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
    },
  },
  {
    id: "glow",
    label: "Glow",
    emoji: "🌟",
    category: "Glow",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const pulse = 0.6 + 0.4 * Math.sin(frame * 0.06);
      ctx.shadowColor = `rgba(250,204,21,${pulse})`;
      ctx.shadowBlur = 40 * pulse;
      ctx.fillStyle = "#fde047";
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.9;
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    },
  },
  {
    id: "outline",
    label: "Outline",
    emoji: "⬜",
    category: "Basic",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "#1a1714";
      ctx.lineWidth = fontSize * 0.06;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
      ctx.fillStyle = "transparent";
    },
  },
  {
    id: "shadow",
    label: "Deep Shadow",
    emoji: "🌑",
    category: "Basic",
    draw(ctx, text, x, y, fontSize, font) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#1a1714";
      ctx.fillText(text, x, y);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    },
  },
  {
    id: "holographic",
    label: "Holographic",
    emoji: "💿",
    category: "Modern",
    animated: true,
    draw(ctx, text, x, y, fontSize, font, frame) {
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const metrics = ctx.measureText(text);
      const w = metrics.width;
      const t = frame * 0.03;
      const grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
      grad.addColorStop(0, `hsl(${(t * 60) % 360},100%,70%)`);
      grad.addColorStop(0.25, `hsl(${(t * 60 + 90) % 360},100%,75%)`);
      grad.addColorStop(0.5, `hsl(${(t * 60 + 180) % 360},100%,70%)`);
      grad.addColorStop(0.75, `hsl(${(t * 60 + 270) % 360},100%,75%)`);
      grad.addColorStop(1, `hsl(${(t * 60 + 360) % 360},100%,70%)`);
      ctx.shadowColor = `hsl(${(t * 60) % 360},100%,60%)`;
      ctx.shadowBlur = 15;
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    },
  },
];

export const CATEGORIES = [...new Set(PRESETS.map((p) => p.category))];

export const GOOGLE_FONTS = [
  { label: "Inter", value: "Inter" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Bebas Neue", value: "Bebas Neue" },
  { label: "Oswald", value: "Oswald" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Roboto Slab", value: "Roboto Slab" },
  { label: "Abril Fatface", value: "Abril Fatface" },
  { label: "Righteous", value: "Righteous" },
  { label: "Bungee", value: "Bungee" },
  { label: "Permanent Marker", value: "Permanent Marker" },
  { label: "Pacifico", value: "Pacifico" },
  { label: "Press Start 2P", value: "Press Start 2P" },
  { label: "Orbitron", value: "Orbitron" },
  { label: "Exo 2", value: "Exo 2" },
  { label: "Rajdhani", value: "Rajdhani" },
];
