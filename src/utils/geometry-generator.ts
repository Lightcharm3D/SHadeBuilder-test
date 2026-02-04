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
  | 'double_wall'
  | 'organic_cell';

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
  fitterHeight: number; // This is now the vertical offset from the top
  
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

function pseudoNoise(x: number, y: number, z: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function getRadiusAtHeight(y: number, params: LampshadeParams): number {
  const { height, topRadius, bottomRadius, silhouette } = params;
  // Normalize y from -height/2...height/2 to 0...1
  const t = (y + height / 2) / height;
  let r = topRadius + (bottomRadius - topRadius) * t;
  
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
  return r;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, silhouette, height, topRadius, bottomRadius, segments, seed, thickness } = params;
  
  // Create a closed profile loop: Outer wall (bottom to top) -> Inner wall (top to bottom)
  const getClosedProfilePoints = (steps = 60) => {
    const points = [];
    
    // Outer wall: bottom to top
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -height / 2 + height * t;
      const r = Math.max(0.1, getRadiusAtHeight(y, params));
      points.push(new THREE.Vector2(r, y));
    }
    
    // Inner wall: top to bottom
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const y = -height / 2 + height * t;
      const r = Math.max(0.05, getRadiusAtHeight(y, params) - thickness);
      points.push(new THREE.Vector2(r, y));
    }
    
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const closedProfile = getClosedProfilePoints();

  switch (type) {
    case 'organic_cell': {
      const scale = params.noiseScale || 1.5;
      geometry = new THREE.LatheGeometry(closedProfile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        
        const noise = (
          pseudoNoise(Math.cos(angle) * scale, py * scale, Math.sin(angle) * scale, seed) * 0.6 +
          pseudoNoise(Math.cos(angle) * scale * 2, py * scale * 2, Math.sin(angle) * scale * 2, seed) * 0.4
        );
        
        const r = Math.sqrt(px * px + pz * pz);
        const factor = (r + noise * (params.noiseStrength || 1.0)) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'double_wall': {
      const gap = params.gapDistance || 0.5;
      // For double wall, we still want two separate closed shells
      const outerProfile = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const y = -height / 2 + height * t;
        outerProfile.push(new THREE.Vector2(getRadiusAtHeight(y, params), y));
      }
      for (let i = 60; i >= 0; i--) {
        const t = i / 60;
        const y = -height / 2 + height * t;
        outerProfile.push(new THREE.Vector2(getRadiusAtHeight(y, params) - thickness, y));
      }

      const innerProfile = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const y = -height / 2 + height * t;
        innerProfile.push(new THREE.Vector2(getRadiusAtHeight(y, params) - gap, y));
      }
      for (let i = 60; i >= 0; i--) {
        const t = i / 60;
        const y = -height / 2 + height * t;
        innerProfile.push(new THREE.Vector2(getRadiusAtHeight(y, params) - gap - thickness, y));
      }

      const outerGeom = new THREE.LatheGeometry(outerProfile, segments);
      const innerGeom = new THREE.LatheGeometry(innerProfile, segments);
      geometry = BufferGeometryUtils.mergeGeometries([outerGeom, innerGeom]);
      break;
    }

    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 0.8;
      geometry = new THREE.LatheGeometry(closedProfile, folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const r = Math.sqrt(px * px + pz * pz);
        const angle = Math.atan2(pz, px);
        const segmentIndex = Math.round((angle / (Math.PI * 2)) * (folds * 2));
        const isInnerFold = segmentIndex % 2 !== 0;
        const factor = isInnerFold ? (r - depth) / r : 1;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'slotted': {
      const count = params.slotCount || 16;
      const slotW = params.slotWidth || 0.2;
      const geoms: THREE.BufferGeometry[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        // Create a solid fin with thickness
        const finGeom = new THREE.BoxGeometry(2, height, thickness);
        const pos = finGeom.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const r = getRadiusAtHeight(py, params);
          const px = pos.getX(j);
          // Offset the fin so it attaches to the rings
          if (px > 0) pos.setX(j, r);
          else pos.setX(j, r - 2); 
        }
        finGeom.rotateY(angle);
        geoms.push(finGeom);
      }
      const ringTop = new THREE.TorusGeometry(topRadius, thickness / 2, 8, segments);
      ringTop.rotateX(Math.PI / 2);
      ringTop.translate(0, height / 2, 0);
      geoms.push(ringTop);
      const ringBottom = new THREE.TorusGeometry(bottomRadius, thickness / 2, 8, segments);
      ringBottom.rotateX(Math.PI / 2);
      ringBottom.translate(0, -height / 2, 0);
      geoms.push(ringBottom);
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'voronoi': {
      const cells = params.cellCount || 12;
      geometry = new THREE.LatheGeometry(closedProfile, segments);
      const pos = geometry.attributes.position;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < cells; i++) {
        const angle = pseudoNoise(i, 0, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(0, i, 0, seed) - 0.5) * height;
        const r = getRadiusAtHeight(h, params);
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
      geometry = new THREE.LatheGeometry(closedProfile, segments);
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
      geometry = new THREE.LatheGeometry(closedProfile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const normY = (py + height / 2) / height;
        const noise = (
          pseudoNoise(angle * scale, normY * scale, 0, seed) * 1.0 +
          pseudoNoise(angle * scale * 2, normY * scale * 2, 0, seed) * 0.5
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
      geometry = new THREE.LatheGeometry(closedProfile, segments);
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
      geometry = new THREE.LatheGeometry(closedProfile, segments);
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
      const outerGeom = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, false);
      const innerGeom = new THREE.CylinderGeometry(topRadius - thickness, bottomRadius - thickness, height, sides, 1, false);
      innerGeom.scale(-1, 1, 1); // Invert normals for inner shell
      geometry = BufferGeometryUtils.mergeGeometries([outerGeom, innerGeom]);
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
      geometry = new THREE.LatheGeometry(closedProfile, segments);
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
  const { fitterType, fitterDiameter, fitterHeight, height, thickness } = params;
  const geoms: THREE.BufferGeometry[] = [];
  const fitterRadius = fitterDiameter / 20; 
  
  const yPos = height / 2 - fitterHeight;
  const baseRadius = getRadiusAtHeight(yPos, params);
  
  const ring = new THREE.TorusGeometry(fitterRadius, 0.15, 8, 32);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, yPos, 0);
  geoms.push(ring);
  
  const spokeCount = fitterType === 'spider' ? 3 : 4;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    
    // Calculate the radius at this specific angle, accounting for patterns
    let displacedRadius = baseRadius;
    const normY = (yPos + height / 2) / height;
    
    if (params.type === 'ribbed_drum') {
      const count = params.ribCount || 20;
      const depth = params.ribDepth || 0.5;
      displacedRadius = baseRadius * (1 + Math.sin(angle * count) * (depth / baseRadius));
    } else if (params.type === 'wave_shell') {
      const amp = params.amplitude || 0.5;
      const freq = params.frequency || 8;
      displacedRadius = baseRadius + Math.sin(angle * freq + normY * Math.PI * 2) * amp;
    } else if (params.type === 'organic_cell' || params.type === 'perlin_noise') {
      const strength = params.noiseStrength || 0.4;
      const scale = params.noiseScale || 2.0;
      const noise = (
        pseudoNoise(Math.cos(angle) * scale, yPos * scale, Math.sin(angle) * scale, params.seed) * 0.6 +
        pseudoNoise(Math.cos(angle) * scale * 2, yPos * scale * 2, Math.sin(angle) * scale * 2, params.seed) * 0.4
      ) * strength;
      displacedRadius = baseRadius + noise;
    }
    
    // Spoke should end at the inner wall (displacedRadius - thickness)
    // We subtract a tiny bit more (0.05cm = 0.5mm) to ensure it doesn't poke through
    const targetRadius = displacedRadius - thickness - 0.05;
    const spokeLength = Math.max(0.1, targetRadius - fitterRadius);
    
    const spoke = new THREE.BoxGeometry(spokeLength, 0.15, 0.3);
    // Position the spoke so it starts at the fitter ring and ends at the inner wall
    spoke.translate(fitterRadius + spokeLength / 2, yPos, 0);
    spoke.rotateY(angle);
    geoms.push(spoke);
  }
  
  return BufferGeometryUtils.mergeGeometries(geoms);
}