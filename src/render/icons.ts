import type { Action } from '../chart/types';

/**
 * Action icons as canvas paths (no font dependency), drawn centred at (cx, cy) inside a
 * square of half-size r. Shared by the 3D cue textures and the 2D HUD.
 *   block = shield · slash = crescent cut · stab = forward point · flourish = sparkle
 */
export function drawActionIcon(
  c: CanvasRenderingContext2D,
  action: Action,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  c.save();
  c.translate(cx, cy);
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  switch (action) {
    case 'block':
      c.moveTo(-0.72 * r, -0.78 * r);
      c.lineTo(0.72 * r, -0.78 * r);
      c.lineTo(0.72 * r, -0.05 * r);
      c.quadraticCurveTo(0.62 * r, 0.6 * r, 0, 0.92 * r);
      c.quadraticCurveTo(-0.62 * r, 0.6 * r, -0.72 * r, -0.05 * r);
      c.closePath();
      c.fill();
      break;
    case 'slash':
      // crescent: outer arc minus inner arc, from top-right sweeping to bottom-left
      c.arc(0.55 * r, 0.55 * r, 1.25 * r, Math.PI * 1.02, Math.PI * 1.48);
      c.arc(0.95 * r, 0.95 * r, 1.35 * r, Math.PI * 1.44, Math.PI * 1.06, true);
      c.closePath();
      c.fill();
      c.lineWidth = r * 0.12;
      c.beginPath();
      c.moveTo(-0.15 * r, 0.75 * r);
      c.lineTo(0.75 * r, -0.15 * r);
      c.stroke();
      break;
    case 'stab':
      c.moveTo(0, -0.95 * r);
      c.lineTo(0.42 * r, -0.3 * r);
      c.lineTo(0.14 * r, -0.3 * r);
      c.lineTo(0.14 * r, 0.62 * r);
      c.lineTo(0.38 * r, 0.62 * r);
      c.lineTo(0.38 * r, 0.76 * r);
      c.lineTo(0.12 * r, 0.76 * r);
      c.lineTo(0.12 * r, 0.95 * r);
      c.lineTo(-0.12 * r, 0.95 * r);
      c.lineTo(-0.12 * r, 0.76 * r);
      c.lineTo(-0.38 * r, 0.76 * r);
      c.lineTo(-0.38 * r, 0.62 * r);
      c.lineTo(-0.14 * r, 0.62 * r);
      c.lineTo(-0.14 * r, -0.3 * r);
      c.lineTo(-0.42 * r, -0.3 * r);
      c.closePath();
      c.fill();
      break;
    case 'flourish': {
      const k = 0.24;
      c.moveTo(0, -r);
      c.quadraticCurveTo(k * r, -k * r, r, 0);
      c.quadraticCurveTo(k * r, k * r, 0, r);
      c.quadraticCurveTo(-k * r, k * r, -r, 0);
      c.quadraticCurveTo(-k * r, -k * r, 0, -r);
      c.fill();
      c.lineWidth = r * 0.1;
      c.beginPath();
      c.arc(0, 0, 0.62 * r, -0.4, 0.9);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, 0.62 * r, Math.PI - 0.4, Math.PI + 0.9);
      c.stroke();
      break;
    }
  }
  c.restore();
}

export function hexA(hex: string, a: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, a))})`;
}
