import * as THREE from 'three';

export type LithophaneType = 'flat' | 'curved' | 'cylinder' | 'arc';

export interface LithophaneParams {
  type: LithophaneType;
  width: number;
  height: number;
  minThickness: number;
  maxThickness: number;
  curveRadius: number;
  resolution: number;
  inverted: boolean;
}

export function generateLithophaneGeometry(
  imageData: ImageData,
  params: LithophaneParams
): THREE.BufferGeometry {
  const { width, height, minThickness, maxThickness, resolution, type, curveRadius, inverted } = params;
  
  // Calculate grid dimensions based on resolution
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  const geometry = new THREE.PlaneGeometry(width, height, gridX - 1, gridY - 1);
  const pos = geometry.attributes.position;
  
  // Helper to get pixel brightness (0-1)
  const getBrightness = (u: number, v: number) => {
    const x = Math.floor(u * (imageData.width - 1));
    const y = Math.floor((1 - v) * (imageData.height - 1));
    const idx = (y * imageData.width + x) * 4;
    const r = imageData.data[idx];
    const g = imageData.data[idx + 1];
    const b = imageData.data[idx + 2];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    return inverted ? brightness : 1 - brightness;
  };

  // Apply height map and shape transformation
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    
    // Normalized coordinates (0 to 1)
    const u = (x + width / 2) / width;
    const v = (y + height / 2) / height;
    
    const brightness = getBrightness(u, v);
    const thickness = minThickness + brightness * (maxThickness - minThickness);
    
    if (type === 'flat') {
      pos.setZ(i, thickness);
    } else if (type === 'curved' || type === 'arc' || type === 'cylinder') {
      const angleRange = type === 'cylinder' ? Math.PI * 2 : (width / curveRadius);
      const angle = (u - 0.5) * angleRange;
      const r = curveRadius + thickness;
      
      const newX = r * Math.sin(angle);
      const newZ = r * Math.cos(angle) - curveRadius;
      const newY = y;
      
      pos.setXYZ(i, newX, newY, newZ);
    }
  }

  // Create back plate and sides for a watertight model
  // For simplicity in this implementation, we'll use a thickened plane approach
  // In a production environment, we'd merge with a back-face geometry
  
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