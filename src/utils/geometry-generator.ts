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
  | 'organic_cell'
  | 'honeycomb_lattice'
  | 'petal_bloom'
  | 'dna_spiral'
  | 'faceted_gem';

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
  fitterDiameter: number; // Ledge ID in mm
  fitterOuterDiameter: number; // Cylinder Diameter in mm
  fitterRingHeight: number; // Ledge Height in mm
  fitterHeight: number;  // Offset from top in cm
  spokeThickness: number; // Vertical height in mm
  spokeWidth: number;     // Horizontal depth in mm
  
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

function getDisplacementAt(angle: number, y: number, params: LampshadeParams): number {
  const { type, seed, height } = params;
  const normY = (y + height / 2) / height;

  switch (type) {
    case 'ribbed_drum':
      return Math.sin(angle * (params.ribCount || 24)) * (params.ribDepth || 0.4);
    case 'wave_shell':
      return Math.sin(angle * (params.frequency || 5) + normY * Math.PI * 2) * (params.amplitude || 1);
    case 'petal_bloom': {
      const petals = params.ribCount || 8;
      const bloom = normY * 2;
      return Math.abs(Math.sin(angle * petals / 2)) * bloom;
    }
    case 'faceted_gem': {
      return pseudoNoise(Math.cos(angle), y, Math.sin(angle), seed) * (params.noiseStrength || 0.5);
    }
    case 'organic_cell':
    case 'perlin_noise': {
      const scale = params.noiseScale || 0.5;
      const strength = params.noiseStrength || 0.5;
      return (
        pseudoNoise(Math.cos(angle) * scale, y * scale, Math.sin(angle) * scale, seed) * 0.6 +
        pseudoNoise(Math.cos(angle) * scale * 2, y * scale * 2, Math.sin(angle) * scale * 2, seed) * 0.4
      ) * strength;
    }
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 0.8;
      const segmentIndex = Math.round((angle / (Math.PI * 2)) * (folds * 2));
      return segmentIndex % 2 !== 0 ? -depth : 0;
    }
    case 'voronoi': {
      const cells = params.cellCount || 12;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < cells; i++) {
        const a = pseudoNoise(i, 0, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(0, i, 0, seed) - 0.5) * height;
        const r = getRadiusAtHeight(h, params);
        points.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
      }
      const v = new THREE.Vector3(Math.cos(angle) * getRadiusAtHeight(y, params), y, Math.sin(angle) * getRadiusAtHeight(y, params));
      let minDist = Infinity;
      points.forEach(p => {
        const d = v.distanceTo(p);
        if (d < minDist) minDist = d;
      });
      return -Math.exp(-minDist * 0.5) * 1.5;
    }
    default:
      return 0;
  }
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, thickness } = params;
  
  const getClosedProfilePoints = (steps = 60, customThickness?: number) => {
    const points = [];
    const tVal = customThickness || thickness;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -height / 2 + height * t;
      points.push(new THREE.Vector2(Math.max(0.1, getRadiusAtHeight(y, params)), y));
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const y = -height / 2 + height * t;
      points.push(new THREE.Vector2(Math.max(0.05, getRadiusAtHeight(y, params) - tVal), y));
    }
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const closedProfile = getClosedProfilePoints();

  switch (type) {
    case 'honeycomb_lattice': {
      const density = params.gridDensity || 10;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      
      for (let j = 0; j < density; j++) {
        const y = -height / 2 + (j / density) * height;
        const r = getRadiusAtHeight(y, params);
        const ring = new THREE.TorusGeometry(r, strutRadius, 8, segments);
        ring.rotateX(Math.PI / 2);
        ring.translate(0, y, 0);
        geoms.push(ring);
        
        const nextY = -height / 2 + ((j + 1) / density) * height;
        if (j < density) {
          for (let i = 0; i < segments; i += 4) {
            const angle = (i / segments) * Math.PI * 2 + (j % 2 === 0 ? 0 : (Math.PI / segments) * 2);
            const strut = new THREE.CylinderGeometry(strutRadius, strutRadius, height / density, 6);
            strut.translate(0, (height / density) / 2, 0);
            strut.rotateX(Math.PI / 2);
            strut.rotateY(angle);
            strut.translate(Math.cos(angle) * r, y, Math.sin(angle) * r);
            geoms.push(strut);
          }
        }
      }
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'dna_spiral': {
      const geoms: THREE.BufferGeometry[] = [];
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      const strutRadius = thickness;
      
      for (let i = 0; i < 2; i++) {
        const offset = i * Math.PI;
        const spiral = new THREE.CylinderGeometry(strutRadius, strutRadius, height, 8, 64);
        const pos = spiral.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const t = (py + height / 2) / height;
          const r = getRadiusAtHeight(py, params);
          const angle = t * twist + offset;
          pos.setXYZ(j, Math.cos(angle) * r, py, Math.sin(angle) * r);
        }
        geoms.push(spiral);
      }
      
      // Add rungs
      const rungCount = 12;
      for (let i = 0; i < rungCount; i++) {
        const t = i / (rungCount - 1);
        const py = -height / 2 + t * height;
        const r = getRadiusAtHeight(py, params);
        const angle = t * twist;
        const rung = new THREE.BoxGeometry(r * 2, strutRadius, strutRadius);
        rung.rotateY(angle);
        rung.translate(0, py, 0);
        geoms.push(rung);
      }
      
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'faceted_gem': {
      geometry = new THREE.LatheGeometry(closedProfile, 8); // Low segments for facets
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const r = Math.sqrt(px * px + pz * pz);
        const disp = getDisplacementAt(angle, py, params);
        const factor = (r + disp) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'petal_bloom':
    case 'organic_cell':
    case 'perlin_noise':
    case 'wave_shell':
    case 'voronoi':
    case 'origami':
    case 'ribbed_drum': {
      const segs = type === 'origami' ? (params.foldCount || 12) * 2 : segments;
      geometry = new THREE.LatheGeometry(closedProfile, segs);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const r = Math.sqrt(px * px + pz * pz);
        const disp = getDisplacementAt(angle, py, params);
        const factor = (r + disp) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'slotted': {
      const count = params.slotCount || 16;
      const finThick = params.slotWidth || thickness;
      const geoms: THREE.BufferGeometry[] = [];
      const coreScale = 0.8; 
      
      const coreProfile = getClosedProfilePoints(40, thickness);
      const coreGeom = new THREE.LatheGeometry(coreProfile, segments);
      coreGeom.scale(coreScale, 1, coreScale); 
      geoms.push(coreGeom);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const baseR = getRadiusAtHeight(0, params); 
        const finDepth = baseR * (1 - coreScale) + 0.5; 
        const finGeom = new THREE.BoxGeometry(finDepth, height, finThick, 1, 32, 1);
        const pos = finGeom.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const r = getRadiusAtHeight(py, params);
          const px = pos.getX(j);
          if (px > 0) pos.setX(j, r);
          else pos.setX(j, r * coreScale + 0.01); 
        }
        finGeom.rotateY(angle);
        geoms.push(finGeom);
      }
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'double_wall': {
      const gap = params.gapDistance || 0.5;
      const outerGeom = new THREE.LatheGeometry(getClosedProfilePoints(60, thickness), segments);
      const innerGeom = new THREE.LatheGeometry(getClosedProfilePoints(60, thickness), segments);
      innerGeom.scale(1 - (gap / topRadius), 1, 1 - (gap / topRadius));
      geometry = BufferGeometryUtils.mergeGeometries([outerGeom, innerGeom]);
      break;
    }

    case 'geometric_poly': {
      const sides = params.sides || 6;
      geometry = new THREE.LatheGeometry(closedProfile, sides);
      break;
    }

    case 'lattice': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      
      for (let i = 0; i < density; i++) {
        const angle = (i / density) * Math.PI * 2;
        const strut1 = new THREE.CylinderGeometry(strutRadius, strutRadius, height * 1.1, 6, 32);
        const pos1 = strut1.attributes.position;
        for (let j = 0; j < pos1.count; j++) {
          const py = pos1.getY(j);
          const t = (py + height / 2) / height;
          const r = getRadiusAtHeight(py, params);
          const twist = t * (Math.PI * 2 / density) * 2;
          const curAngle = angle + twist;
          pos1.setXYZ(j, Math.cos(curAngle) * r, py, Math.sin(curAngle) * r);
        }
        geoms.push(strut1);

        const strut2 = new THREE.CylinderGeometry(strutRadius, strutRadius, height * 1.1, 6, 32);
        const pos2 = strut2.attributes.position;
        for (let j = 0; j < pos2.count; j++) {
          const py = pos2.getY(j);
          const t = (py + height / 2) / height;
          const r = getRadiusAtHeight(py, params);
          const twist = -t * (Math.PI * 2 / density) * 2;
          const curAngle = angle + twist;
          pos2.setXYZ(j, Math.cos(curAngle) * r, py, Math.sin(curAngle) * r);
        }
        geoms.push(strut2);
      }
      
      const ringTop = new THREE.TorusGeometry(topRadius, strutRadius, 8, segments);
      ringTop.rotateX(Math.PI / 2);
      ringTop.translate(0, height / 2, 0);
      geoms.push(ringTop);
      
      const ringBottom = new THREE.TorusGeometry(bottomRadius, strutRadius, 8, segments);
      ringBottom.rotateX(Math.PI / 2);
      ringBottom.translate(0, -height / 2, 0);
      geoms.push(ringBottom);

      geometry = BufferGeometryUtils.mergeGeometries(geoms);
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
    
    default:
      geometry = new THREE.LatheGeometry(closedProfile, segments);
  }

  if (params.internalRibs > 0) {
    const ribGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < params.internalRibs; i++) {
      const angle = (i / params.internalRibs) * Math.PI * 2;
      const ribWidth = params.ribThickness || 0.2;
      const ribDepth = 0.5;
      const rib = new THREE.BoxGeometry(ribWidth, height, ribDepth, 1, 32, 1);
      const pos = rib.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const py = pos.getY(j);
        const r = getRadiusAtHeight(py, params) - thickness;
        const pz = pos.getZ(j);
        if (pz > 0) pos.setZ(j, r + 0.01); 
        else pos.setZ(j, r - ribDepth);
      }
      rib.rotateY(angle);
      ribGeoms.push(rib);
    }
    geometry = BufferGeometryUtils.mergeGeometries([geometry, ...ribGeoms]);
  }

  if (params.fitterType !== 'none') {
    const fitterGeom = generateFitterGeometry(params);
    geometry = BufferGeometryUtils.mergeGeometries([geometry, fitterGeom]);
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

function generateFitterGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { 
    fitterType, fitterDiameter, fitterOuterDiameter, fitterRingHeight, 
    fitterHeight, height, thickness, type, sides = 6, 
    spokeThickness, spokeWidth 
  } = params;
  
  const geoms: THREE.BufferGeometry[] = [];
  
  const innerRadius = fitterDiameter / 20; 
  const outerRadius = fitterOuterDiameter / 20;
  const ringHeightCm = fitterRingHeight / 10;
  const spokeThickCm = spokeThickness / 10;
  const spokeWidthCm = spokeWidth / 10;
  
  const yPos = height / 2 - fitterHeight;
  
  const ringProfile = [
    new THREE.Vector2(innerRadius, -ringHeightCm / 2),
    new THREE.Vector2(outerRadius, -ringHeightCm / 2),
    new THREE.Vector2(outerRadius, ringHeightCm / 2),
    new THREE.Vector2(innerRadius, ringHeightCm / 2),
    new THREE.Vector2(innerRadius, -ringHeightCm / 2)
  ];
  const ring = new THREE.LatheGeometry(ringProfile, 64);
  ring.translate(0, yPos, 0);
  geoms.push(ring);
  
  const spokeCount = fitterType === 'spider' ? 3 : 4;
  let baseRadius = getRadiusAtHeight(yPos, params);
  if (type === 'slotted') baseRadius *= 0.8;

  for (let i = 0; i < spokeCount; i++) {
    let angle = (i / spokeCount) * Math.PI * 2;
    if (type === 'geometric_poly') {
      const step = (Math.PI * 2) / sides;
      angle = Math.round(angle / step) * step;
    }

    const disp = getDisplacementAt(angle, yPos, params);
    const safetyMargin = thickness * 0.75; 
    const targetRadius = (baseRadius + disp) - safetyMargin;
    const spokeLength = Math.max(0.1, targetRadius - outerRadius);
    
    const spoke = new THREE.BoxGeometry(spokeLength, spokeThickCm, spokeWidthCm);
    spoke.translate(outerRadius + spokeLength / 2, yPos, 0);
    spoke.rotateY(angle);
    geoms.push(spoke);
  }
  
  return BufferGeometryUtils.mergeGeometries(geoms);
}