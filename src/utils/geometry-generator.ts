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

export interface LampshadeParams {
  type: LampshadeType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  seed: number;
  
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

// Simple deterministic pseudo-random generator based on seed
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, seed } = params;
  let geometry: THREE.BufferGeometry;

  // Base profile for Lathe-based shapes
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
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const rib = 1 + Math.sin(angle * count) * (depth / (topRadius + bottomRadius));
        pos.setX(i, x * rib);
        pos.setZ(i, z * rib);
      }
      break;
    }

    case 'spiral_twist': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(getProfile(), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const normY = (y + height / 2) / height;
        const angle = normY * twist;
        const newX = x * Math.cos(angle) - z * Math.sin(angle);
        const newZ = x * Math.sin(angle) + z * Math.cos(angle);
        pos.setXYZ(i, newX, y, newZ);
      }
      break;
    }

    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 1;
      // Use higher segments for origami to capture the sharp folds
      geometry = new THREE.LatheGeometry(getProfile(20), folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        // Determine if we are at a peak or valley of the fold
        const foldStep = (angle / (Math.PI * 2)) * folds * 2;
        const isPeak = Math.round(foldStep) % 2 === 0;
        const offset = isPeak ? depth : -depth;
        const r = Math.sqrt(x * x + z * z) + offset;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'geometric_poly': {
      const sides = params.sides || 6;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, false);
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

    case 'perlin_noise': {
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, Math.floor(segments/2), false);
      const pos = geometry.attributes.position;
      const strength = params.noiseStrength || 1;
      const scale = params.noiseScale || 0.5;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        // Deterministic noise approximation using multiple sines
        const noise = (
          Math.sin(angle * 7 * scale + seed) * 0.5 + 
          Math.cos(y * 3 * scale - seed) * 0.5 +
          Math.sin((angle + y) * 5 * scale) * 0.2
        ) * strength;
        const r = Math.sqrt(x * x + z * z) + noise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'voronoi': {
      const cells = params.cellCount || 12;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, Math.floor(segments/2), false);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        // Cellular noise approximation
        const v = Math.abs(Math.sin(angle * cells + seed) * Math.cos(y * (cells/2) - seed));
        const cellNoise = Math.pow(v, 0.5) * 0.8;
        const r = Math.sqrt(x * x + z * z) + cellNoise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'lattice': {
      const density = params.gridDensity || 10;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, Math.floor(segments/2), false);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const lattice = (Math.sin(angle * density) * Math.sin(y * density + seed)) * 0.3;
        const r = Math.sqrt(x * x + z * z) + lattice;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'double_wall': {
      const gap = params.gapDistance || 1;
      const outer = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, false);
      const inner = new THREE.CylinderGeometry(topRadius - gap, bottomRadius - gap, height, segments, 1, false);
      geometry = BufferGeometryUtils.mergeGeometries([outer, inner]);
      break;
    }

    default:
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, false);
  }

  geometry.computeVertexNormals();
  return geometry;
}