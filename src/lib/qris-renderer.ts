import QRCode from "qrcode";
import { normalizeOrderBrand, type OrderBrandConfig } from "./topup.ts";

export function computeBadgeBox(size: number, showText: boolean) {
  const badgeW = Math.round(size * 0.22);
  const badgeH = showText ? Math.round(size * 0.24) : badgeW;
  const center = size / 2;
  return {
    badgeW,
    badgeH,
    badgeX: Math.round(center - badgeW / 2),
    badgeY: Math.round(center - badgeH / 2),
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo image failed to load"));
    img.src = src;
  });
}

export async function renderOrderQrisDataUrl(
  payload: string,
  brandInput?: Partial<OrderBrandConfig> | null
): Promise<string> {
  const brand = normalizeOrderBrand(brandInput);
  const size = 600;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const colorDark = brand.color_dark || "#0B2540";
  const colorLight = "#FFFFFF";
  const dotStyle = brand.dot_style || "square";
  const eyeStyle = brand.eye_style || "square";

  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const moduleCount = qr.modules.size;
  const margin = 3;
  const totalModules = moduleCount + margin * 2;
  const cellSize = size / totalModules;

  ctx.fillStyle = colorLight;
  ctx.fillRect(0, 0, size, size);

  const isFinder = (r: number, c: number): boolean => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= moduleCount - 7) return true;
    if (r >= moduleCount - 7 && c < 7) return true;
    return false;
  };

  ctx.fillStyle = colorDark;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (!qr.modules.get(r, c) || isFinder(r, c)) continue;

      const x = (c + margin) * cellSize;
      const y = (r + margin) * cellSize;

      if (dotStyle === "dots") {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * 0.92, 0, Math.PI * 2);
        ctx.fill();
      } else if (dotStyle === "rounded") {
        drawRoundedRect(ctx, x + 0.3, y + 0.3, cellSize - 0.6, cellSize - 0.6, cellSize * 0.35);
        ctx.fill();
      } else if (dotStyle === "diamond") {
        ctx.beginPath();
        ctx.moveTo(x + cellSize / 2, y + 0.3);
        ctx.lineTo(x + cellSize - 0.3, y + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, y + cellSize - 0.3);
        ctx.lineTo(x + 0.3, y + cellSize / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x, y, cellSize + 0.3, cellSize + 0.3);
      }
    }
  }

  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 },
  ];

  for (const pos of finderPositions) {
    const eyeX = (pos.c + margin) * cellSize;
    const eyeY = (pos.r + margin) * cellSize;
    const eyeW = 7 * cellSize;

    if (eyeStyle === "circle") {
      const cx = eyeX + eyeW / 2;
      const cy = eyeY + eyeW / 2;
      ctx.fillStyle = colorDark;
      ctx.beginPath();
      ctx.arc(cx, cy, eyeW / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colorLight;
      ctx.beginPath();
      ctx.arc(cx, cy, (eyeW / 2) * (5 / 7), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colorDark;
      ctx.beginPath();
      ctx.arc(cx, cy, (eyeW / 2) * (3 / 7), 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeStyle === "rounded") {
      ctx.fillStyle = colorDark;
      drawRoundedRect(ctx, eyeX, eyeY, eyeW, eyeW, cellSize * 2.2);
      ctx.fill();
      ctx.fillStyle = colorLight;
      drawRoundedRect(ctx, eyeX + cellSize, eyeY + cellSize, 5 * cellSize, 5 * cellSize, cellSize * 1.4);
      ctx.fill();
      ctx.fillStyle = colorDark;
      drawRoundedRect(ctx, eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 0.9);
      ctx.fill();
    } else {
      ctx.fillStyle = colorDark;
      ctx.fillRect(eyeX, eyeY, eyeW, eyeW);
      ctx.fillStyle = colorLight;
      ctx.fillRect(eyeX + cellSize, eyeY + cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = colorDark;
      ctx.fillRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }
  }

  if (brand.badge_style !== "clean" && brand.logo_url) {
    try {
      const img = await loadImage(brand.logo_url);
      const showText = Boolean(brand.badge_style === "capsule" && brand.store_name?.trim());
      const { badgeW, badgeH, badgeX, badgeY } = computeBadgeBox(size, showText);
      const radius = 16;

      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, radius);
      ctx.fill();

      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, radius);
      ctx.stroke();

      const pillH = showText ? 15 : 0;
      const pad = 8;
      const logoW = badgeW - pad * 2;
      const logoH = showText ? badgeH - pillH - 14 : badgeH - pad * 2;
      const logoX = badgeX + pad;
      const logoY = badgeY + pad;

      const aspect = img.width / img.height || 1;
      let drawW = logoW;
      let drawH = logoH;
      if (aspect > logoW / logoH) {
        drawH = logoW / aspect;
      } else {
        drawW = logoH * aspect;
      }
      ctx.drawImage(img, logoX + (logoW - drawW) / 2, logoY + (logoH - drawH) / 2, drawW, drawH);

      if (showText && brand.store_name) {
        const pillW = badgeW - 12;
        const pillX = badgeX + 6;
        const pillY = badgeY + badgeH - pillH - 5;

        ctx.fillStyle = "#F1F5F9";
        drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 7);
        ctx.fill();

        ctx.fillStyle = "#0B2540";
        ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let text = brand.store_name.trim();
        while (ctx.measureText(text).width > pillW - 6 && text.length > 3) {
          text = text.slice(0, -1);
        }
        if (text !== brand.store_name.trim()) text = text.slice(0, -1) + "...";

        ctx.fillText(text, pillX + pillW / 2, pillY + pillH / 2);
      }

      ctx.restore();
    } catch {
      // Non-fatal: Level H QR matrix remains 100% scannable even if cross-origin logo fails offline.
    }
  }

  return canvas.toDataURL("image/png");
}
