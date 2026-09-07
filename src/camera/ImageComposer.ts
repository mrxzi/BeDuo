// ============================================================
// ImageComposer — Canvas composition of rear + front frames
// ============================================================
// Produces a single 1080×1920 image with rear as background
// and front as a rounded PiP overlay.

import type { CapturedFrame, CompositionConfig, CompositionResult } from './types';

/**
 * Compose rear + front frames into a single image.
 * Rear fills the canvas (cover-fit), front is overlaid as a PiP.
 */
export async function composeImage(
  rearFrame: CapturedFrame,
  frontFrame: CapturedFrame,
  config: CompositionConfig
): Promise<CompositionResult> {
  const { outputWidth, outputHeight } = config;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Cannot get 2D canvas context for composition');
  }

  // --- Draw rear image (cover-fit) ---
  const rearImg = await loadImageFromBlob(rearFrame.blob);
  drawCoverFit(ctx, rearImg, 0, 0, outputWidth, outputHeight);

  // --- Draw front image (PiP overlay) ---
  const frontImg = await loadImageFromBlob(frontFrame.blob);
  drawFrontOverlay(ctx, frontImg, config);

  // --- Export ---
  const blob = await canvasToBlob(canvas, config.format, config.quality);

  const objectUrl = URL.createObjectURL(blob);

  return {
    blob,
    objectUrl,
    width: outputWidth,
    height: outputHeight,
    format: config.format,
    sizeBytes: blob.size,
  };
}

/**
 * Compose a single frame (rear-only mode).
 */
export async function composeSingleImage(
  frame: CapturedFrame,
  config: CompositionConfig
): Promise<CompositionResult> {
  const { outputWidth, outputHeight } = config;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Cannot get 2D canvas context for composition');
  }

  const img = await loadImageFromBlob(frame.blob);
  drawCoverFit(ctx, img, 0, 0, outputWidth, outputHeight);

  const blob = await canvasToBlob(canvas, config.format, config.quality);
  const objectUrl = URL.createObjectURL(blob);

  return {
    blob,
    objectUrl,
    width: outputWidth,
    height: outputHeight,
    format: config.format,
    sizeBytes: blob.size,
  };
}

/**
 * Draw an image to fill the target area using cover-fit (crop, no stretch).
 */
function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetWidth: number,
  targetHeight: number
): void {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (imgRatio > targetRatio) {
    // Image is wider — crop sides
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // Image is taller — crop top/bottom
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, targetWidth, targetHeight);
}

/**
 * Draw the front camera image as a rounded PiP overlay.
 */
function drawFrontOverlay(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  config: CompositionConfig
): void {
  const {
    outputWidth,
    outputHeight,
    frontOverlayPosition,
    frontOverlaySizeRatio,
    frontOverlayMargin,
    frontOverlayBorderRadius,
    frontOverlayBorderWidth,
    frontOverlayBorderColor,
  } = config;

  // Calculate overlay dimensions (portrait aspect ratio for selfie)
  const overlayWidth = Math.round(outputWidth * frontOverlaySizeRatio);
  const overlayHeight = Math.round(overlayWidth * (4 / 3)); // 3:4 portrait ratio

  // Calculate position
  const { x, y } = calculateOverlayPosition(
    frontOverlayPosition,
    outputWidth,
    outputHeight,
    overlayWidth,
    overlayHeight,
    frontOverlayMargin
  );

  // Draw shadow & black backdrop
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  drawRoundedRect(ctx, x, y, overlayWidth, overlayHeight, frontOverlayBorderRadius);
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Clip & Draw front image
  ctx.save();
  drawRoundedRect(ctx, x, y, overlayWidth, overlayHeight, frontOverlayBorderRadius);
  ctx.clip();
  drawCoverFit(ctx, img, x, y, overlayWidth, overlayHeight);
  ctx.restore();

  // Draw smooth outer stroke border
  if (frontOverlayBorderWidth > 0) {
    drawRoundedRect(ctx, x, y, overlayWidth, overlayHeight, frontOverlayBorderRadius);
    ctx.lineWidth = frontOverlayBorderWidth * 2;
    ctx.strokeStyle = frontOverlayBorderColor || '#000000';
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Calculate overlay position based on config.
 */
function calculateOverlayPosition(
  position: string,
  canvasWidth: number,
  canvasHeight: number,
  overlayWidth: number,
  overlayHeight: number,
  margin: number
): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: canvasWidth - overlayWidth - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: canvasHeight - overlayHeight - margin };
    case 'bottom-right':
    default:
      return {
        x: canvasWidth - overlayWidth - margin,
        y: canvasHeight - overlayHeight - margin,
      };
  }
}

/**
 * Draw a rounded rectangle path.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Load an image from a Blob.
 */
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob'));
    };

    img.src = url;
  });
}

/**
 * Convert canvas to Blob with format fallback.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const tryFormat = (fmt: string) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else if (fmt === 'image/webp') {
            // WebP not supported — fallback to JPEG
            tryFormat('image/jpeg');
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        fmt,
        quality
      );
    };

    tryFormat(format);
  });
}


