import { type CardTheme } from "@/lib/data";
import { CARD_THEMES } from "@/components/VIPCard";

/** Canvas API does not accept 8-digit hex (#rrggbbaa). Strip to 6-digit. */
function hex6(color: string): string {
  if (color.startsWith("#") && color.length === 9) return color.slice(0, 7);
  return color;
}

/** Convert 8-digit hex to rgba() string for Canvas transparency support. */
function hexToRgba(color: string, alpha?: number): string {
  let c = color;
  let a = alpha ?? 1;
  if (c.startsWith("#")) {
    if (c.length === 9) {
      a = parseInt(c.slice(7, 9), 16) / 255;
      c = c.slice(0, 7);
    }
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }
  return c;
}

interface CardData {
  memberName: string;
  email: string;
  memberNumber: string;
  tier: string;
  issueDate: string;
  expiresDate: string;
  status: string;
  qrDataUrl: string;
  initials: string;
}

const W = 856;
const H = 540;
const R = 24;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

export async function downloadCardCanvas(
  data: CardData,
  theme: CardTheme,
  format: "png" | "pdf"
): Promise<void> {
  const t = CARD_THEMES[theme];

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, hexToRgba(t.bg1));
  grad.addColorStop(0.45, hexToRgba(t.bg2));
  grad.addColorStop(1, hexToRgba(t.bg3));

  roundRect(ctx, 0, 0, W, H, R);
  ctx.fillStyle = grad;
  ctx.fill();

  // ── Shine overlay ──
  const shine = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.55);
  shine.addColorStop(0, "rgba(255,255,255,0.06)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  roundRect(ctx, 0, 0, W, H, R);
  ctx.fillStyle = shine;
  ctx.fill();

  // ── Border ──
  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, R);
  ctx.strokeStyle = hexToRgba(t.border);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const PAD = 44;

  // ── Top: brand ──
  ctx.fillStyle = hexToRgba(t.muted);
  ctx.font = "500 13px sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("ROBERT PLANT", PAD, PAD + 14);

  ctx.fillStyle = hexToRgba(t.text);
  ctx.font = "bold 26px Georgia, serif";
  ctx.letterSpacing = "0px";
  ctx.fillText("VIP Membership", PAD, PAD + 44);

  // ── Tier badge ──
  const tierText = data.tier.toUpperCase();
  ctx.font = "bold 11px sans-serif";
  const tw = ctx.measureText(tierText).width;
  const bx = W - PAD - tw - 24;
  const by = PAD - 2;
  ctx.strokeStyle = hexToRgba(t.border);
  ctx.lineWidth = 1;
  ctx.fillStyle = hexToRgba(t.accent, 0.12);
  roundRect(ctx, bx, by, tw + 24, 26, 13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hexToRgba(t.accent);
  ctx.fillText(tierText, bx + 12, by + 17);

  // ── EMV chip ──
  const chipX = PAD;
  const chipY = PAD + 60;
  const chipW = 48;
  const chipH = 36;
  const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
  chipGrad.addColorStop(0, hexToRgba(t.chipBg, 0.67));
  chipGrad.addColorStop(0.5, hexToRgba(t.accent, 0.8));
  chipGrad.addColorStop(1, hexToRgba(t.chipBg, 0.67));
  roundRect(ctx, chipX, chipY, chipW, chipH, 6);
  ctx.fillStyle = chipGrad;
  ctx.fill();
  // chip grid
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const gx = chipX + 8 + col * 13;
      const gy = chipY + 8 + row * 13;
      ctx.fillStyle = hexToRgba(t.accent, 0.38);
      roundRect(ctx, gx, gy, 9, 9, 1);
      ctx.fill();
    }
  }

  // ── Name + email ──
  ctx.fillStyle = hexToRgba(t.text);
  ctx.font = "bold 30px Georgia, serif";
  ctx.fillText(data.memberName, PAD + 66, chipY + 24);
  ctx.fillStyle = hexToRgba(t.muted);
  ctx.font = "13px sans-serif";
  ctx.fillText(data.email, PAD + 66, chipY + 42);

  // ── Initials avatar ──
  const avR = 28;
  const avX = W - PAD - avR;
  const avY = chipY + chipH / 2;
  ctx.beginPath();
  ctx.arc(avX, avY, avR, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(t.accent, 0.13);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(t.border);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = hexToRgba(t.text);
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.initials, avX, avY);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // ── Divider ──
  const divY = H / 2 + 10;
  ctx.strokeStyle = hexToRgba(t.border);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, divY);
  ctx.lineTo(W - PAD, divY);
  ctx.stroke();

  // ── Member number ──
  ctx.fillStyle = hexToRgba(t.muted);
  ctx.font = "500 11px sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("MEMBER NUMBER", PAD, divY + 28);
  ctx.fillStyle = hexToRgba(t.text);
  ctx.font = "bold 18px monospace";
  ctx.letterSpacing = "2px";
  ctx.fillText(data.memberNumber, PAD, divY + 52);

  // ── Dates ──
  ctx.fillStyle = hexToRgba(t.muted);
  ctx.font = "500 11px sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("ISSUE DATE", PAD, divY + 84);
  ctx.fillStyle = hexToRgba(t.text);
  ctx.font = "13px monospace";
  ctx.letterSpacing = "1px";
  ctx.fillText(data.issueDate, PAD, divY + 102);

  ctx.fillStyle = hexToRgba(t.muted);
  ctx.font = "500 11px sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("EXPIRES", PAD + 160, divY + 84);
  ctx.fillStyle = hexToRgba(t.text);
  ctx.font = "13px monospace";
  ctx.letterSpacing = "1px";
  ctx.fillText(data.expiresDate, PAD + 160, divY + 102);

  // ── Verified ──
  ctx.fillStyle = hexToRgba(t.muted);
  ctx.font = "500 10px sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(`✓ VERIFIED MEMBER · ${data.status.toUpperCase()}`, PAD, H - PAD);

  // ── QR Code ──
  if (data.qrDataUrl) {
    try {
      const qrImg = new Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
        qrImg.src = data.qrDataUrl;
      });
      const qrSize = 90;
      const qrX = W - PAD - qrSize;
      const qrY = divY + 22;
      ctx.fillStyle = hexToRgba(t.qrBg);
      roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 6);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(t.border);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch {
      // QR failed silently
    }
  }

  // ── Export ──
  if (format === "png") {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `vip-card-${theme}.png`;
    a.click();
  } else {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [W, H] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, W, H);
    pdf.save(`vip-card-${theme}.pdf`);
  }
}
