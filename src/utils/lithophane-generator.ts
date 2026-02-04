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
}

export function generateLithophaneGeometry(
  imageData: ImageData,
  params: LithophaneParams
): THREE.BufferGeometry {
  const { 
    width, height, minThickness, maxThickness, 
    resolution, type, inverted,
    brightness, contrast, smoothing, hasHole, holeSize,
    hasBorder, borderThickness, borderHeight
  } = params;
  
  // Convert cm to mm for internal calculations to ensure 1:1 scale for STL export
  const widthMm = width * 10;
  const heightMm = height * 10;
  
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const validPoints: boolean[] = [];

  const processedData = smoothing > 0 ? applySmoothing(imageData, smoothing) : imageData.data;

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
      case 'circle':
        return (x * x + y * y) <= 0.25;
      case 'heart':
        const hX = x * 2.2;
        const hY = y * 2.2 + 0.2;
        return Math.pow(hX * hX + hY * hY - 1, 3) - hX * hX * Math.pow(hY, 3) <= 0;
      case 'badge':
        return Math.abs(x) <= 0.4 && (y <= 0.4 && y >= -0.5 + Math.abs(x));
      default:
        return true;
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
    const x = u * (imageData.width - 1);
    const y = (1 - v) * (imageData.height - 1);
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, imageData.width - 1);
    const y2 = Math.min(y1 + 1, imageData.height - 1);
    const dx = x - x1;
    const dy = y - y1;
    
    const getPixelGray = (px: number, py: number) => {
      const idx = (py * imageData.width + px) * 4;
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

  // 1. Generate Vertices
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
      
      const xPos = (u - 0.5) * widthMm;
      const yPos = (v - 0.5) * heightMm;
      vertices.push(xPos, yPos, thickness);
    }
  }

  const backOffset = vertices.length / 3;
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      const xPos = (u - 0.5) * widthMm;
      const yPos = (v - 0.5) * heightMm;
      vertices.push(xPos, yPos, 0);
    }
  }

  // 2. Generate Indices
  for (let j = 0; j < gridY - 1; j++) {
    for (let i = 0; i < gridX - 1; i++) {
      const a = j * gridX + i;
      const b = j * gridX + (i + 1);
      const c = (j + 1) * gridX + i;
      const d = (j + 1) * gridX + (i + 1);

      if (validPoints[a] && validPoints[b] && validPoints[c] && validPoints[d]) {
        indices.push(a, c, b);
        indices.push(b, c, d);
        indices.push(a + backOffset, b + backOffset, c + backOffset);
        indices.push(b + backOffset, d + backOffset, c + backOffset);
      }
    }
  }

  // 3. Side Walls
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const idx = j * gridX + i;
      if (!validPoints[idx]) continue;
      
      if (i === 0 || !validPoints[idx - 1]) {
        const nextJ = (j === gridY - 1) ? j : j + 1;
        if (validPoints[nextJ * gridX + i]) {
          const a = idx, b = idx + backOffset, c = nextJ * gridX + i, d = nextJ * gridX + i + backOffset;
          indices.push(a, b, c); indices.push(b, d, c);
        }
      }
      if (i === gridX - 1 || !validPoints[idx + 1]) {
        const nextJ = (j === gridY - 1) ? j : j + 1;
        if (validPoints[nextJ * gridX + i]) {
          const a = idx, b = idx + backOffset, c = nextJ * gridX + i, d = nextJ * gridX + i + backOffset;
          indices.push(a, c, b); indices.push(b, c, d);
        }
      }
      if (j === 0 || !validPoints[idx - gridX]) {
        const nextI = (i === gridX - 1) ? i : i + 1;
        if (validPoints[j * gridX + nextI]) {
          const a = idx, b = idx + backOffset, c = j * gridX + nextI, d = j * gridX + nextI + backOffset;
          indices.push(a, c, b); indices.push(b, c, d);
        }
      }
      if (j === gridY - 1 || !validPoints[idx + gridX]) {
        const nextI = (i === gridX - 1) ? i : i + 1;
        if (validPoints[j * gridX + nextI]) {
          const a = idx, b = idx + backOffset, c = j * gridX + nextI, d = j * gridX + nextI + backOffset;
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

function applySmoothing(imageData: ImageData, radius: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  const r = Math.floor(radius);
  if (r <= 0) return data;

  for (let pass = 0; pass < 1; pass++) {
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
  }
  return data;
}

export function getImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}