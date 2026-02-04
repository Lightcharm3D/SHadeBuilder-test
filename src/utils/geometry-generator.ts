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

export type SilhouetteType = 'straight' | 'hourglass' | 'bell' | 'convex' | 'concave';
export type FitterType = 'none' | 'spider' | 'uno';

export interface LampshadeParams {
  type: LampshadeType;
  silhouette: SilhouetteType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  seed: number;
  
  // Structure
  internalRibs: number;
  ribThickness: number;
  
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

function pseudoNoise(x: number, y: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, silhouette, height, topRadius, bottomRadius, segments, seed, thickness } = params;
  
  const getProfilePoints = (steps = 60) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let r = topRadius + (bottomRadius - topRadius) * t;
      const y = -height / 2 + height * t;
      
      switch (silhouette) {
        case 'hourglass':
          r *= 1 + Math.pow(Math.sin(t * Math.PI), 2) * -0.3;
          break;
        case 'bell':
          r *= 1 + Math.pow(1 - t, 2) * 0.4;
          break;
        case 'convex':
          r *= 1 + Math.sin(t * Math.PI) * 0.2;
          break;
        case 'concave':
          r *= 1 + Math.sin(t * Math.PI) * -0.2;
          break;
      }
      points.push(new THREE.Vector2(r, y));
    }
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const profile = getProfilePoints();

  switch (type) {
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 0.8;
      // Use a high-segment lathe but modify vertices to create sharp folds
      geometry = new THREE.LatheGeometry(profile, folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const r = Math.sqrt(px * px + pz * pz);
        const angle = Math.atan2(pz, px);
        
        // Every second segment is pushed inward
        const segmentIndex = Math.round((angle / (Math.PI * 2)) * (folds * 2));
        const isInner = segmentIndex % 2 !== 0;
        const factor = isInner ? (r - depth) / r : 1;
        
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'slotted': {
      const count = params.slotCount || 16;
      const width = params.slotWidth || 0.2;
      const geoms: THREE.BufferGeometry[] = [];
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const finGeom = new THREE.PlaneGeometry(1, height, 1, 20);
        const pos = finGeom.attributes.position;
        
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const normY = (py + height / 2) / height;
          const r = topRadius + (bottomRadius - topRadius) * normY;
          const px = pos.getX(j);
          if (px > 0) pos.setX(j, r);
          else pos.setX(j, r - 2); 
        }
        
        finGeom.rotateY(angle);
        geoms.push(finGeom);
      }
      
      const ringTop = new THREE.TorusGeometry(topRadius, width, 8, segments);
      ringTop.rotateX(Math.PI / 2);
      ringTop.translate(0, height / 2, 0);
      geoms.push(ringTop);
      
      const ringBottom = new THREE.TorusGeometry(bottomRadius, width, 8, segments);
      ringBottom.rotateX(Math.PI / 2);
      ringBottom.translate(0, -height / 2, 0);
      geoms.push(ringBottom);
      
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'voronoi': {
      const cells = params.cellCount || 12;
      geometry = new THREE.LatheGeometry(profile, segments);
      const pos = geometry.attributes.position;
      const points: THREE.Vector3[] = [];
      
      for (let i = 0; i < cells; i++) {
        const angle = pseudoNoise(i, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(0, i, seed) - 0.5) * height;
        const r = topRadius + (bottomRadius - topRadius) * ((h + height / 2) / height);
        points.push(new THREE.Vector3(Math.cos(angle) * r, h, Math.sin(angle) * r));
      }

      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        let minDist = Infinity;
        points.forEach(p => {
          const d = v.distanceTo(p);
          if (d < minDist) minDist = d;
        });
        
        const factor = 1 - Math.exp(-minDist * 0.5) * 0.2;
        pos.setX(i, v.x * factor);
        pos.setZ(i, v.z * factor);
      }
      break;
    }

    case 'wave_shell': {
      const amp = params.amplitude || 0.5;
      const freq = params.frequency || 8;
      geometry = new THREE.LatheGeometry(profile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const normY = (py + height / 2) / height;
        const wave = Math.sin(angle * freq + normY * Math.PI * 2) * amp;
        const r = Math.sqrt(px * px + pz * pz);
        const factor = (r + wave) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'perlin_noise': {
      const strength = params.noiseStrength || 0.4;
      const scale = params.noiseScale || 2.0;
      geometry = new THREE.LatheGeometry(profile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const normY = (py + height / 2) / height;
        const noise = (
          pseudoNoise(angle * scale, normY * scale, seed) * 1.0 +
          pseudoNoise(angle * scale * 2, normY * scale * 2, seed) * 0.5
        ) * strength;
        const r = Math.sqrt(px * px + pz * pz);
        const factor = (r + noise) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'ribbed_drum': {
      const count = params.ribCount || 20;
      const depth = params.ribDepth || 0.5;
      geometry = new THREE.LatheGeometry(profile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const r = Math.sqrt(px * px + pz * pz);
        const rib = 1 + Math.sin(angle * count) * (depth / r);
        pos.setX(i, px * rib);
        pos.setZ(i, pz * rib);
      }
      break;
    }
    
    case 'spiral_twist': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(profile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const py = pos.getY(i);
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const normY = (py + height / 2) / height;
        const angle = normY * twist;
        const newX = px * Math.cos(angle) - pz * Math.sin(angle);
        const newZ = px * Math.sin(angle) + pz * Math.cos(angle);
        pos.setXYZ(i, newX, py, newZ);
      }
      break;
    }

    case 'geometric_poly': {
      const sides = params.sides || 6;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, true);
      break;
    }

    case 'lattice': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      for (let i = 0; i < density; i++) {
        const angle = (i / density) * Math.PI * 2;
        const strut = new THREE.CylinderGeometry(thickness, thickness, height, 6);
        const midR = (topRadius + bottomRadius) / 2;
        strut.rotateX(Math.atan2(bottomRadius - topRadius, height));
        strut.translate(midR * Math.cos(angle), 0, midR * Math.sin(angle));
        strut.rotateY(angle);
        geoms.push(strut);
      }
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
    
    default:
      geometry = new THREE.LatheGeometry(profile, segments);
  }

  if (params.internalRibs > 0) {
    const ribGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < params.internalRibs; i++) {
      const angle = (i / params.internalRibs) * Math.PI * 2;
      const ribWidth = params.ribThickness || 0.2;
      const ribDepth = 0.5;
      const rib = new THREE.BoxGeometry(ribWidth, height, ribDepth);
      const midR = (topRadius + bottomRadius) / 2 - ribDepth / 2;
      rib.translate(0, 0, midR);
      rib.rotateY(angle);
      ribGeoms.push(rib);
    }
    const ribsMerged = BufferGeometryUtils.mergeGeometries(ribGeoms);
    geometry = BufferGeometryUtils.mergeGeometries([geometry, ribsMerged]);
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