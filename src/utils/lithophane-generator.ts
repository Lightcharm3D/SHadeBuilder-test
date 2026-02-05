import * as THREE from 'three';

export type LithophaneType = 'flat' | 'circle' | 'heart' | 'badge' | 'curved' | 'cylinder';

export interface LithophaneParams {
  type: LithophaneType;
  width: number; // in cm
  height: number; // in cm
  minThickness: number; // in mm (Brightest pixels)
  maxThickness: number; // in mm (Darkest pixels)
  baseThickness: number; // in mm
  curveRadius: number;
  resolution: number;
  inverted: boolean;
  brightness: number;
  contrast: number;
  smoothing: number;
  hasHole: boolean;
  holeSize: number;
  hasBorder: boolean;
  borderThickness: number;
  borderHeight: number;
  buildPlateSize: number; // in mm
  // Text Personalization
  text?: string;
  textSize?: number;
  textY?: number;
}

export function generateLithophaneGeometry(
  imageData: ImageData,
  params: LithophaneParams
): THREE.BufferGeometry {
  const { 
    width, height, minThickness, maxThickness, 
    resolution, type, inverted,
    brightness, contrast, smoothing, hasHole, holeSize,
    hasBorder, borderThickness, borderHeight, curveRadius,
    text, textSize = 40, textY = 0.8
  } = params;
  
  const widthMm = width * 10;
  const heightMm = height * 10;
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  let finalImageData = imageData;
  if (text && text.trim().length > 0) {
    finalImageData = applyTextOverlay(imageData, text, textSize, textY);
  }

  const vertices: number[] = [];
  const indices: number[] = [];
  const validPoints: boolean[] = [];

  const processedData = smoothing > 0 ? applySmoothing(finalImageData, smoothing) : finalImageData.data;

  const isInside = (u: number, v: number) => {
    const x = u - 0.5;
    const y = v - 0.5;
    if (hasHole) {
      const holeX = 0;
      const holeY = 0.4; 
      const distToHole = Math.sqrt(Math.pow(x - holeX, 2) + Math.pow(y - holeY, 2));
      if (distToHole < (holeSize / 100)) return false; 
    }
    switch (type) {
      case 'circle': return (x * x + y * y) <= 0.25;
      case 'heart':
        const hX = x * 2.2;
        const hY = y * 2.2 + 0.2;
        return Math.pow(hX * hX + hY * hY - 1, 3) - hX * hX * Math.pow(hY, 3) <= 0;
      case 'badge': return Math.abs(x) <= 0.4 && (y <= 0.4 && y >= -0.5 + Math.abs(x));
      default: return true;
    }
  };

  const isInBorder = (u: number, v: number) => {
    if (!hasBorder) return false;
    const x = u - 0.5;
    const y = v - 0.5;
    const outerLimit = 0.5;
    const innerLimit = 0.5 - (borderThickness / Math.max(widthMm, heightMm));
    switch (type) {
      case 'circle':
        const dist = Math.sqrt(x * x + y * y);
        return dist <= 0.5 && dist >= (0.5 - (borderThickness / Math.max(widthMm, heightMm)));
      default:
        return (Math.abs(x) <= outerLimit && Math.abs(y) <= outerLimit) && 
               !(Math.abs(x) <= innerLimit && Math.abs(y) <= innerLimit);
    }
  };

  const getInterpolatedVal = (u: number, v: number) => {
    const x = u * (finalImageData.width - 1);
    const y = (1 - v) * (finalImageData.height - 1);
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, finalImageData.width - 1);
    const y2 = Math.min(y1 + 1, finalImageData.height - 1);
    const dx = x - x1;
    const dy = y - y1;
    const getPixelGray = (px: number, py: number) => {
      const idx = (py * finalImageData.width + px) * 4;
      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const process = (val: number) => Math.min(255, Math.max(0, cFactor * (val + brightness - 128) + 128));
      const gray = (process(processedData[idx]) * 0.299 + process(processedData[idx+1]) * 0.587 + process(processedData[idx+2]) * 0.114) / 255;
      return inverted ? gray : 1 - gray;
    };
    return (getPixelGray(x1, y1) * (1 - dx) * (1 - dy)) +
           (getPixelGray(x2, y1) * dx * (1 - dy)) +
           (getPixelGray(x1, y2) * (1 - dx) * dy) +
           (getPixelGray(x2, y2) * dx * dy);
  };

  const getPosition = (u: number, v: number, thickness: number) => {
    const x = (u - 0.5) * widthMm;
    const y = (v - 0.5) * heightMm;
    if (type === 'curved') {
      const radius = curveRadius * 10;
      const angle = x / radius;
      const px = Math.sin(angle) * (radius + thickness);
      const pz = Math.cos(angle) * (radius + thickness) - radius;
      return { x: px, y, z: pz };
    } else if (type === 'cylinder') {
      const radius = widthMm / (2 * Math.PI);
      const angle = u * Math.PI * 2;
      const px = Math.sin(angle) * (radius + thickness);
      const pz = Math.cos(angle) * (radius + thickness);
      return { x: px, y, z: pz };
    }
    return { x, y, z: thickness };
  };

  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      const inside = isInside(u, v);
      const inBorder = isInBorder(u, v);
      validPoints.push(inside || inBorder);
      let thickness = 0;
      if (inside) {
        const bVal = getInterpolatedVal(u, v);
        thickness = minThickness + bVal * (maxThickness - minThickness);
      } else if (inBorder) {
        thickness = borderHeight;
      }
      const pos = getPosition(u, v, thickness);
      vertices.push(pos.x, pos.y, pos.z);
    }
  }

  const backOffset = vertices.length / 3;
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      const pos = getPosition(u, v, 0);
      vertices.push(pos.x, pos.y, pos.z);
    }
  }

  for (let j = 0; j < gridY - 1; j++) {
    for (let i = 0; i < gridX; i++) {
      const nextI = (i + 1) % gridX;
      // If not a cylinder, don't wrap the last column
      if (type !== 'cylinder' && i === gridX - 1) continue;

      const a = j * gridX + i;
      const b = j * gridX + nextI;
      const c = (j + 1) * gridX + i;
      const d = (j + 1) * gridX + nextI;
      
      if (validPoints[a] && validPoints[b] && validPoints[c] && validPoints[d]) {
        indices.push(a, c, b); indices.push(b, c, d);
        indices.push(a + backOffset, b + backOffset, c + backOffset);
        indices.push(b + backOffset, d + backOffset, c + backOffset);
      }
    }
  }

  // Side walls
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const idx = j * gridX + i;
      if (!validPoints[idx]) continue;
      
      const nextI = (i + 1) % gridX;
      const nextJ = (j + 1) % gridY;

      // Left/Right edges (only if not cylinder)
      if (type !== 'cylinder') {
        if (i === 0 || !validPoints[idx - 1]) {
          if (j < gridY - 1 && validPoints[(j + 1) * gridX + i]) {
            const a = idx, b = idx + backOffset, c = (j + 1) * gridX + i, d = (j + 1) * gridX + i + backOffset;
            indices.push(a, b, c); indices.push(b, d, c);
          }
        }
        if (i === gridX - 1 || !validPoints[idx + 1]) {
          if (j < gridY - 1 && validPoints[(j + 1) * gridX + i]) {
            const a = idx, b = idx + backOffset, c = (j + 1) * gridX + i, d = (j + 1) * gridX + i + backOffset;
            indices.push(a, c, b); indices.push(b, c, d);
          }
        }
      }

      // Top/Bottom edges
      if (j === 0 || !validPoints[idx - gridX]) {
        if (i < gridX - 1 && validPoints[j * gridX + i + 1]) {
          const a = idx, b = idx + backOffset, c = j * gridX + i + 1, d = j * gridX + i + 1 + backOffset;
          indices.push(a, c, b); indices.push(b, c, d);
        }
      }
      if (j === gridY - 1 || !validPoints[idx + gridX]) {
        if (i < gridX - 1 && validPoints[j * gridX + i + 1]) {
          const a = idx, b = idx + backOffset, c = j * gridX + i + 1, d = j * gridX + i + 1 + backOffset;
          indices.push(a, b, c); indices.push(b, d, c);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function applyTextOverlay(imageData: ImageData, text: string, size: number, yPos: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageData;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  tempCanvas.getContext('2d')?.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, 0, 0);

  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = 'black'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height * yPos);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function applySmoothing(imageData: ImageData, radius: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  const r = Math.floor(radius);
  if (r <= 0) return data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let ky = -r; ky <= r; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky));
        for (let kx = -r; kx <= r; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const idx = (py * width + px) * 4;
          rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2];
          count++;
        }
      }
      const outIdx = (y * width + x) * 4;
      data[outIdx] = rSum / count; data[outIdx + 1] = gSum / count; data[outIdx + 2] = bSum / count;
    }
  }
  return data;
}