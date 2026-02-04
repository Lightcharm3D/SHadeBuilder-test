import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type LampshadeType = 
  | 'ribbed_drum' 
  | 'spiral_twist' 
  | 'voronoi' 
  | 'wave_shell' 
  | 'geometric_poly' 
  | 'lattice' 
  | 'origami' 
  | 'perlin_noise' 
  | 'slotted' 
  | 'double_wall';

export type FitterType = 'none' | 'spider' | 'uno';

export interface LampshadeParams {
  type: LampshadeType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  seed: number;
  
  // Fitter params
  fitterType: FitterType;
  fitterDiameter: number;
  fitterHeight: number;
  
  // Type-specific params
  ribCount?: number;
  ribDepth?: number;
  twistAngle?: number;
  cellCount?: number;
  amplitude?: number;
  frequency?: number;
  sides?: number;
  gridDensity?: number;
  foldCount?: number;
  foldDepth?: number;
  noiseScale?: number;
  noiseStrength?: number;
  slotCount?: number;
  slotWidth?: number;
  gapDistance?: number;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, seed, thickness } = params;
  let geometry: THREE.BufferGeometry;

  const getProfile = (steps = 50) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = topRadius + (bottomRadius - topRadius) * t;
      const y = -height / 2 + height * t;
      points.push(new THREE.Vector2(r, y));
    }
    return points;
  };

  switch (type) {
    case 'ribbed_drum': {
      const count = params.ribCount || 20;
      const depth = params.ribDepth || 0.5;
      geometry = new THREE.LatheGeometry(getProfile(), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const posX = pos.getX(i);
        const posZ = pos.getZ(i);
        const angle = Math.atan2(posZ, posX);
        const rib = 1 + Math.sin(angle * count) * (depth / (topRadius + bottomRadius));
        pos.setX(i, posX * rib);
        pos.setZ(i, posZ * rib);
      }
      break;
    }
    
    case 'spiral_twist': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(getProfile(), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const posY = pos.getY(i);
        const posX = pos.getX(i);
        const posZ = pos.getZ(i);
        const normY = (posY + height / 2) / height;
        const angle = normY * twist;
        const newX = posX * Math.cos(angle) - posZ * Math.sin(angle);
        const newZ = posX * Math.sin(angle) + posZ * Math.cos(angle);
        pos.setXYZ(i, newX, posY, newZ);
      }
      break;
    }

    case 'voronoi': {
      const cells = params.cellCount || 12;
      geometry = new THREE.LatheGeometry(getProfile(), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const normY = (py + height / 2) / height;
        
        // Pseudo-voronoi using multiple sine waves
        const noise = Math.sin(angle * cells) * Math.cos(normY * cells * 0.5) + 
                      Math.sin(angle * cells * 0.5 + seed) * Math.cos(normY * cells);
        const offset = 1 + (noise * 0.1);
        pos.setX(i, px * offset);
        pos.setZ(i, pz * offset);
      }
      break;
    }

    case 'lattice': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      
      // Vertical struts
      for (let i = 0; i < density; i++) {
        const angle = (i / density) * Math.PI * 2;
        const strut = new THREE.CylinderGeometry(thickness, thickness, height, 6);
        const midR = (topRadius + bottomRadius) / 2;
        strut.rotateX(Math.atan2(bottomRadius - topRadius, height));
        strut.translate(midR * Math.cos(angle), 0, midR * Math.sin(angle));
        strut.rotateY(angle);
        geoms.push(strut);
      }
      
      // Horizontal rings
      const ringCount = Math.floor(height / 2);
      for (let i = 0; i <= ringCount; i++) {
        const t = i / ringCount;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        const ring = new THREE.TorusGeometry(r, thickness, 6, segments);
        ring.rotateX(Math.PI / 2);
        ring.translate(0, y, 0);
        geoms.push(ring);
      }
      
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'perlin_noise': {
      const scale = params.noiseScale || 0.5;
      const strength = params.noiseStrength || 0.5;
      geometry = new THREE.LatheGeometry(getProfile(60), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const normY = (py + height / 2) / height;
        
        // Procedural noise displacement
        const noise = Math.sin(angle * 10 * scale + seed) * Math.cos(normY * 8 * scale) + 
                      Math.sin(normY * 15 * scale + seed * 0.5) * 0.5;
        const offset = 1 + (noise * strength * 0.2);
        pos.setX(i, px * offset);
        pos.setZ(i, pz * offset);
      }
      break;
    }
    
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 1;
      geometry = new THREE.LatheGeometry(getProfile(20), folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const posX = pos.getX(i);
        const posZ = pos.getZ(i);
        const angle = Math.atan2(posZ, posX);
        const foldStep = (angle / (Math.PI * 2)) * folds * 2;
        const isPeak = Math.round(foldStep) % 2 === 0;
        const offset = isPeak ? depth : -depth;
        const r = Math.sqrt(posX * posX + posZ * posZ) + offset;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }
    
    case 'geometric_poly': {
      const sides = params.sides || 6;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, true);
      break;
    }
    
    case 'wave_shell': {
      const amp = params.amplitude || 1;
      const freq = params.frequency || 5;
      const points = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const rBase = topRadius + (bottomRadius - topRadius) * t;
        const wave = Math.sin(t * Math.PI * freq + seed) * amp;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(rBase + wave, y));
      }
      geometry = new THREE.LatheGeometry(points, segments);
      break;
    }
    
    case 'slotted': {
      const slots = params.slotCount || 16;
      const sWidth = params.slotWidth || 0.4;
      const geoms: THREE.BufferGeometry[] = [];
      
      for (let i = 0; i < slots; i++) {
        const angle = (i / slots) * Math.PI * 2;
        const slat = new THREE.BoxGeometry(sWidth, height, thickness * 5);
        const midRadius = (topRadius + bottomRadius) / 2;
        slat.rotateY(angle);
        slat.translate(midRadius * Math.cos(angle), 0, midRadius * Math.sin(angle));
        geoms.push(slat);
      }
      
      const topRing = new THREE.TorusGeometry(topRadius, thickness, 8, segments);
      topRing.rotateX(Math.PI / 2);
      topRing.translate(0, height / 2, 0);
      geoms.push(topRing);
      
      const bottomRing = new THREE.TorusGeometry(bottomRadius, thickness, 8, segments);
      bottomRing.rotateX(Math.PI / 2);
      bottomRing.translate(0, -height / 2, 0);
      geoms.push(bottomRing);
      
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }
    
    case 'double_wall': {
      const gap = params.gapDistance || 1;
      const outer = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      const inner = new THREE.CylinderGeometry(topRadius - gap, bottomRadius - gap, height, segments, 1, true);
      
      const ribGeoms: THREE.BufferGeometry[] = [];
      const ribCount = 8;
      for (let i = 0; i < ribCount; i++) {
        const angle = (i / ribCount) * Math.PI * 2;
        const rib = new THREE.BoxGeometry(0.2, height, gap);
        const midR = (topRadius + bottomRadius) / 2 - gap / 2;
        rib.translate(0, 0, midR);
        rib.rotateY(angle);
        ribGeoms.push(rib);
      }
      
      geometry = BufferGeometryUtils.mergeGeometries([outer, inner, ...ribGeoms]);
      break;
    }
    
    default:
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
  }

  if (params.fitterType !== 'none') {
    const fitterGeom = generateFitterGeometry(params);
    geometry = BufferGeometryUtils.mergeGeometries([geometry, fitterGeom]);
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

function generateFitterGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { fitterType, fitterDiameter, fitterHeight, topRadius, height } = params;
  const geoms: THREE.BufferGeometry[] = [];
  const fitterRadius = fitterDiameter / 20; 
  const yPos = height / 2 - fitterHeight;
  
  const ring = new THREE.TorusGeometry(fitterRadius, 0.15, 8, 32);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, yPos, 0);
  geoms.push(ring);
  
  const spokeCount = fitterType === 'spider' ? 3 : 4;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spokeLength = topRadius - fitterRadius;
    const spoke = new THREE.BoxGeometry(spokeLength, 0.15, 0.3);
    spoke.translate(fitterRadius + spokeLength / 2, yPos, 0);
    spoke.rotateY(angle);
    geoms.push(spoke);
  }
  
  return BufferGeometryUtils.mergeGeometries(geoms);
}