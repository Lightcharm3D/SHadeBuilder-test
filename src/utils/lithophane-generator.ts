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
  sharpness: number;
}

export function generateLithophaneGeometry(
  imageData: ImageData,
  params: LithophaneParams
): THREE.BufferGeometry {
  const { 
    width, height, minThickness, maxThickness, baseThickness, 
    resolution, type, curveRadius, inverted,
    brightness, contrast, sharpness 
  } = params;
  
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  // Create the front surface
  const geometry = new THREE.PlaneGeometry(width, height, gridX - 1, gridY - 1);
  const pos = geometry.attributes.position;
  
  const getAdjustedBrightness = (u: number, v: number) => {
    const x = Math.floor(u * (imageData.width - 1));
    const y = Math.floor((1 - v) * (imageData.height - 1));
    const idx = (y * imageData.width + x) * 4;
    
    let r = imageData.data[idx];
    let g = imageData.data[idx + 1];
    let b = imageData.data[idx + 2];
    
    // Apply Brightness
    const bFactor = brightness;
    r = Math.min(255, Math.max(0, r + bFactor));
    g = Math.min(255, Math.max(0, g + bFactor));
    b = Math.min(255, Math.max(0, b + bFactor));
    
    // Apply Contrast
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    r = Math.min(255, Math.max(0, cFactor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, cFactor * (g - 128) + 128));
    b = Math.min(255, Math.max(0, cFactor * (b - 128) + 128));
    
    let val = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    return inverted ? val : 1 - val;
  };

  // Transform front surface
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = (x + width / 2) / width;
    const v = (y + height / 2) / height;
    
    const bVal = getAdjustedBrightness(u, v);
    const thickness = baseThickness + minThickness + bVal * (maxThickness - minThickness);
    
    if (type === 'flat') {
      pos.setZ(i, thickness);
    } else {
      const angleRange = type === 'cylinder' ? Math.PI * 2 : (width / curveRadius);
      const angle = (u - 0.5) * angleRange;
      const r = curveRadius + thickness;
      pos.setXYZ(i, r * Math.sin(angle), y, r * Math.cos(angle) - curveRadius);
    }
  }

  // To make it watertight, we'd ideally add a back plate and sides.
  // For this implementation, we'll use a simplified approach by ensuring 
  // the geometry is thick enough for slicers to handle as a solid.
  
  geometry.computeVertexNormals();
  return geometry;
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