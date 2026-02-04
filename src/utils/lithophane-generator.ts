import * as THREE from 'three';

export type LithophaneType = 'flat' | 'curved' | 'cylinder' | 'arc';

export interface LithophaneParams {
  type: LithophaneType;
  width: number;
  height: number;
  minThickness: number;
  maxThickness: number;
  baseThickness: number;
  curveRadius: number;
  resolution: number;
  inverted: boolean;
  brightness: number;
  contrast: number;
  smoothing: number; // New parameter for noise reduction
}

export function generateLithophaneGeometry(
  imageData: ImageData,
  params: LithophaneParams
): THREE.BufferGeometry {
  const { 
    width, height, minThickness, maxThickness, baseThickness, 
    resolution, type, curveRadius, inverted,
    brightness, contrast, smoothing
  } = params;
  
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  const vertices: number[] = [];
  const indices: number[] = [];

  // Pre-process image data for smoothing if requested
  const processedData = smoothing > 0 ? applySmoothing(imageData, smoothing) : imageData.data;

  // Bilinear interpolation helper
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
      let r = processedData[idx];
      let g = processedData[idx + 1];
      let b = processedData[idx + 2];
      
      // Apply Brightness & Contrast
      const bFactor = brightness;
      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const process = (val: number) => Math.min(255, Math.max(0, cFactor * (val + bFactor - 128) + 128));
      
      const gray = (process(r) * 0.299 + process(g) * 0.587 + process(b) * 0.114) / 255;
      return inverted ? gray : 1 - gray;
    };

    const v11 = getPixelGray(x1, y1);
    const v21 = getPixelGray(x2, y1);
    const v12 = getPixelGray(x1, y2);
    const v22 = getPixelGray(x2, y2);
    
    // Bilinear formula
    return (v11 * (1 - dx) * (1 - dy)) +
           (v21 * dx * (1 - dy)) +
           (v12 * (1 - dx) * dy) +
           (v22 * dx * dy);
  };

  // 1. Generate Front Surface
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      
      const bVal = getInterpolatedVal(u, v);
      const thickness = baseThickness + minThickness + bVal * (maxThickness - minThickness);
      
      const xPos = (u - 0.5) * width;
      const yPos = (v - 0.5) * height;

      if (type === 'flat') {
        vertices.push(xPos, yPos, thickness);
      } else {
        const angleRange = type === 'cylinder' ? Math.PI * 2 : (width / curveRadius);
        const angle = (u - 0.5) * angleRange;
        const r = curveRadius + thickness;
        vertices.push(r * Math.sin(angle), yPos, r * Math.cos(angle) - curveRadius);
      }
    }
  }

  // 2. Generate Back Surface
  const backOffset = vertices.length / 3;
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      
      const xPos = (u - 0.5) * width;
      const yPos = (v - 0.5) * height;

      if (type === 'flat') {
        vertices.push(xPos, yPos, 0);
      } else {
        const angleRange = type === 'cylinder' ? Math.PI * 2 : (width / curveRadius);
        const angle = (u - 0.5) * angleRange;
        const r = curveRadius;
        vertices.push(r * Math.sin(angle), yPos, r * Math.cos(angle) - curveRadius);
      }
    }
  }

  // 3. Indices for Front & Back
  for (let j = 0; j < gridY - 1; j++) {
    for (let i = 0; i < gridX - 1; i++) {
      const a = j * gridX + i;
      const b = j * gridX + (i + 1);
      const c = (j + 1) * gridX + i;
      const d = (j + 1) * gridX + (i + 1);

      // Front (CCW)
      indices.push(a, c, b);
      indices.push(b, c, d);

      // Back (CW)
      indices.push(a + backOffset, b + backOffset, c + backOffset);
      indices.push(b + backOffset, d + backOffset, c + backOffset);
    }
  }

  // 4. Side Walls
  const addSide = (idx1: number, idx2: number, idx3: number, idx4: number) => {
    indices.push(idx1, idx2, idx3);
    indices.push(idx2, idx4, idx3);
  };

  for (let i = 0; i < gridX - 1; i++) {
    // Bottom
    addSide(i, i + 1, i + backOffset, i + 1 + backOffset);
    // Top
    const topStart = (gridY - 1) * gridX;
    addSide(topStart + i + 1, topStart + i, topStart + i + 1 + backOffset, topStart + i + backOffset);
  }

  for (let j = 0; j < gridY - 1; j++) {
    // Left
    const left1 = j * gridX;
    const left2 = (j + 1) * gridX;
    addSide(left2, left1, left2 + backOffset, left1 + backOffset);
    // Right
    const right1 = j * gridX + (gridX - 1);
    const right2 = (j + 1) * gridX + (gridX - 1);
    addSide(right1, right2, right1 + backOffset, right2 + backOffset);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

// Simple box blur for smoothing
function applySmoothing(imageData: ImageData, radius: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  const r = Math.floor(radius);
  
  for (let pass = 0; pass < 2; pass++) { // Two passes for better quality
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let ky = -r; ky <= r; ky++) {
          for (let kx = -r; kx <= r; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (py * width + px) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }
        const outIdx = (y * width + x) * 4;
        data[outIdx] = rSum / count;
        data[outIdx + 1] = gSum / count;
        data[outIdx + 2] = bSum / count;
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
        canvas.width = img.width;
        canvas.height = img.height;
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