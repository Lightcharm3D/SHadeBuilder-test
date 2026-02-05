import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
  | 'bricks'
  | 'petal_bloom'
  | 'faceted_gem'
  | 'honeycomb'
  | 'diamond_mesh'
  | 'knurled'
  | 'wave_rings'
  | 'triangular_lattice'
  | 'square_grid'
  | 'radial_spokes'
  | 'chevron_mesh'
  | 'spiral_ribs'
  | 'voronoi_wire'
  | 'star_mesh'
  | 'organic_mesh'
  | 'woven_basket'
  | 'bubble_foam'
  | 'parametric_fins'
  | 'spiral_stairs'
  | 'diamond_plate'
  | 'knurled_v2'
  | 'radial_fins'
  | 'cellular_automata'
  | 'voronoi_v2'
  | 'spiral_mesh'
  | 'diamond_lattice'
  | 'honeycomb_v2'
  | 'crystal_lattice'
  | 'organic_veins'
  | 'geometric_tiles'
  | 'spiral_vortex'
  | 'ribbed_conic'
  | 'fractal_tree'
  | 'geometric_weave'
  | 'parametric_waves'
  | 'scalloped_edge'
  | 'twisted_column'
  | 'organic_coral'
  | 'geometric_stars'
  | 'ribbed_spiral'
  | 'faceted_poly'
  | 'wave_shell_v2';

export type SilhouetteType = 
  | 'straight' | 'hourglass' | 'bell' | 'convex' | 'concave' 
  | 'tapered' | 'bulbous' | 'flared' | 'waisted' | 'asymmetric' 
  | 'trumpet' | 'teardrop' | 'diamond' | 'stepped' | 'wavy'
  | 'ovoid' | 'scalloped' | 'conic_stepped' | 'twisted_profile' | 'fluted'
  | 'onion' | 'pagoda' | 'egg' | 'barrel' | 'spindle' | 'chalice' | 'urn';

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
  rimThickness?: number;
  rimHeight?: number;
  internalRibDepth?: number;
  
  // Fitter params
  fitterType: FitterType;
  fitterDiameter: number; 
  fitterOuterDiameter: number; 
  fitterRingHeight: number; 
  fitterHeight: number;  
  spokeThickness: number; 
  spokeWidth: number;     
  spokeCount?: number;    
  
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
  noiseFrequency?: number;
  slotCount?: number;
  slotWidth?: number;
  gapDistance?: number;
  patternScale?: number;
  patternDepth?: number;
  patternRotation?: number;
}

function pseudoNoise(x: number, y: number, z: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function getRadiusAtHeight(y: number, params: LampshadeParams): number {
  const { height, topRadius, bottomRadius, silhouette } = params;
  const t = (y + height / 2) / height;
  let r = bottomRadius + (topRadius - bottomRadius) * t;
  
  switch (silhouette) {
    case 'onion':
      r *= 1 + Math.sin(t * Math.PI * 0.8) * 0.7;
      break;
    case 'pagoda':
      r *= 1 + (Math.sin(t * Math.PI * 3) * 0.15 + (1 - t) * 0.4);
      break;
    case 'egg':
      r *= 1 + Math.sin(t * Math.PI) * 0.35;
      break;
    case 'barrel':
      r *= 1 + Math.sin(t * Math.PI) * 0.25;
      break;
    case 'spindle':
      r *= 1 + Math.sin(t * Math.PI) * 0.6 * (1 - Math.abs(t - 0.5) * 2);
      break;
    case 'chalice':
      r *= 1 + Math.pow(t - 0.5, 2) * 2.0;
      break;
    case 'urn':
      r *= 1 + Math.sin(t * Math.PI * 1.2) * 0.5;
      break;
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
    case 'tapered':
      r *= 1 + (1 - t) * 0.5;
      break;
    case 'bulbous':
      r *= 1 + Math.sin(t * Math.PI) * 0.5;
      break;
    case 'flared':
      r *= 1 + Math.pow(t, 3) * 0.8;
      break;
    case 'waisted':
      r *= 1 + Math.pow(Math.sin(t * Math.PI), 4) * -0.4;
      break;
    case 'asymmetric':
      r *= 1 + Math.sin(t * Math.PI * 0.5) * 0.3;
      break;
    case 'trumpet':
      r *= 1 + Math.pow(t, 4) * 1.5;
      break;
    case 'teardrop':
      r *= 1 + Math.sin(t * Math.PI * 0.8) * 0.6;
      break;
    case 'diamond':
      r *= 1 - Math.abs(t - 0.5) * 0.8;
      break;
    case 'stepped':
      r *= 1 + Math.floor(t * 5) * 0.1;
      break;
    case 'wavy':
      r *= 1 + Math.sin(t * Math.PI * 6) * 0.1;
      break;
    case 'ovoid':
      r *= 1 + Math.sin(t * Math.PI) * 0.4;
      break;
    case 'scalloped':
      r *= 1 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.15;
      break;
    case 'conic_stepped':
      r *= 1 + Math.floor(t * 8) * 0.05;
      break;
    case 'twisted_profile':
      r *= 1 + Math.sin(t * Math.PI * 2 + (params.seed % 10)) * 0.2;
      break;
    case 'fluted':
      r *= 1 + Math.pow(Math.sin(t * Math.PI * 0.5), 0.5) * 0.3;
      break;
  }
  return r;
}

function getDisplacementAt(angle: number, y: number, params: LampshadeParams): number {
  const { type, seed, height, patternRotation = 0 } = params;
  const normY = (y + height / 2) / height;
  const rotatedAngle = angle + (patternRotation * Math.PI / 180) * normY;

  switch (type) {
    case 'organic_coral': {
      const scale = params.noiseScale || 1.5;
      const strength = params.noiseStrength || 1.0;
      const n = pseudoNoise(Math.cos(rotatedAngle) * scale, y * scale, Math.sin(rotatedAngle) * scale, seed);
      return n > 0.6 ? (n - 0.6) * strength * 4 : 0;
    }
    case 'geometric_stars': {
      const count = params.ribCount || 6;
      const depth = params.ribDepth || 0.8;
      return Math.abs(Math.sin(rotatedAngle * count)) * depth;
    }
    case 'ribbed_spiral': {
      const count = params.ribCount || 12;
      const twist = (params.twistAngle || 180) * (Math.PI / 180);
      return Math.sin(rotatedAngle * count + normY * twist) * (params.ribDepth || 0.5);
    }
    case 'faceted_poly': {
      const sides = params.sides || 8;
      const strength = params.noiseStrength || 0.5;
      const step = (Math.PI * 2) / sides;
      const localAngle = Math.floor(rotatedAngle / step) * step;
      return pseudoNoise(Math.cos(localAngle), y, Math.sin(localAngle), seed) * strength;
    }
    case 'wave_shell_v2': {
      const freq = params.frequency || 12;
      const amp = params.amplitude || 0.8;
      return Math.sin(rotatedAngle * freq) * Math.cos(normY * freq * 0.5) * amp;
    }
    case 'ribbed_drum':
      return Math.sin(rotatedAngle * (params.ribCount || 24)) * (params.ribDepth || 0.4);
    case 'ribbed_conic':
      return Math.sin(rotatedAngle * (params.ribCount || 24)) * (params.ribDepth || 0.4) * normY;
    case 'spiral_ribs': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      return Math.sin(rotatedAngle * (params.ribCount || 24) + normY * twist) * (params.ribDepth || 0.4);
    }
    case 'spiral_vortex': {
      const twist = (params.twistAngle || 720) * (Math.PI / 180);
      return Math.sin(rotatedAngle * 5 + normY * twist) * (params.ribDepth || 0.8);
    }
    case 'wave_shell':
      return Math.sin(rotatedAngle * (params.frequency || 5) + normY * Math.PI * 2) * (params.amplitude || 1);
    case 'wave_rings':
      return Math.sin(normY * (params.frequency || 10) * Math.PI) * (params.amplitude || 0.5);
    case 'knurled': {
      const scale = params.patternScale || 10;
      const depth = params.patternDepth || 0.3;
      return (Math.sin(rotatedAngle * scale + normY * scale) * Math.sin(rotatedAngle * scale - normY * scale)) * depth;
    }
    case 'knurled_v2': {
      const scale = params.patternScale || 15;
      const depth = params.patternDepth || 0.4;
      const a = Math.sin(rotatedAngle * scale + normY * scale);
      const b = Math.sin(rotatedAngle * scale - normY * scale);
      return (Math.pow(a, 3) * Math.pow(b, 3)) * depth;
    }
    case 'bubble_foam': {
      const scale = params.patternScale || 10;
      const depth = params.patternDepth || 0.5;
      return (Math.sin(rotatedAngle * scale) * Math.cos(normY * scale * 2) + Math.sin(normY * scale) * Math.cos(rotatedAngle * scale * 2)) * depth;
    }
    case 'diamond_plate': {
      const scale = params.patternScale || 15;
      const depth = params.patternDepth || 0.3;
      const a = Math.sin(rotatedAngle * scale);
      const b = Math.sin(normY * scale * 2);
      return (Math.abs(a) > 0.8 && Math.abs(b) > 0.8) ? depth : 0;
    }
    case 'geometric_tiles': {
      const scale = params.patternScale || 12;
      const depth = params.patternDepth || 0.4;
      const a = Math.floor(rotatedAngle * scale);
      const b = Math.floor(normY * scale);
      return ((a + b) % 2 === 0) ? depth : -depth;
    }
    case 'cellular_automata': {
      const scale = params.patternScale || 20;
      const depth = params.patternDepth || 0.5;
      const x = Math.floor(rotatedAngle * scale);
      const yIdx = Math.floor(normY * scale);
      return (pseudoNoise(x, yIdx, 0, seed) > 0.6) ? depth : 0;
    }
    case 'spiral_stairs': {
      const steps = params.ribCount || 12;
      const depth = params.ribDepth || 0.8;
      const stepIndex = Math.floor((rotatedAngle / (Math.PI * 2)) * steps + normY * steps);
      return (stepIndex % 2 === 0) ? depth : 0;
    }
    case 'petal_bloom': {
      const petals = params.ribCount || 8;
      const bloom = normY * 2;
      return Math.abs(Math.sin(rotatedAngle * petals / 2)) * bloom;
    }
    case 'faceted_gem': {
      return pseudoNoise(Math.cos(rotatedAngle), y, Math.sin(rotatedAngle), seed) * (params.noiseStrength || 0.5);
    }
    case 'organic_cell':
    case 'perlin_noise': {
      const scale = params.noiseScale || 0.5;
      const strength = params.noiseStrength || 0.5;
      const freq = params.noiseFrequency || 1.0;
      return (
        pseudoNoise(Math.cos(rotatedAngle) * scale * freq, y * scale * freq, Math.sin(rotatedAngle) * scale * freq, seed) * 0.6 +
        pseudoNoise(Math.cos(rotatedAngle) * scale * 2 * freq, y * scale * 2 * freq, Math.sin(rotatedAngle) * scale * 2 * freq, seed) * 0.4
      ) * strength;
    }
    case 'organic_veins': {
      const scale = params.noiseScale || 1.0;
      const strength = params.noiseStrength || 0.8;
      const n = pseudoNoise(Math.cos(rotatedAngle) * scale, y * scale, Math.sin(rotatedAngle) * scale, seed);
      return n > 0.7 ? (n - 0.7) * strength * 5 : 0;
    }
    case 'voronoi_v2': {
      const cells = params.cellCount || 20;
      const strength = params.noiseStrength || 1.0;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < cells; i++) {
        const a = pseudoNoise(i, 0, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(0, i, 0, seed) - 0.5) * height;
        const r = getRadiusAtHeight(h, params);
        points.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
      }
      const v = new THREE.Vector3(Math.cos(rotatedAngle) * getRadiusAtHeight(y, params), y, Math.sin(rotatedAngle) * getRadiusAtHeight(y, params));
      let minDist = Infinity;
      let secondMinDist = Infinity;
      points.forEach(p => {
        const d = v.distanceTo(p);
        if (d < minDist) {
          secondMinDist = minDist;
          minDist = d;
        } else if (d < secondMinDist) {
          secondMinDist = d;
        }
      });
      return (secondMinDist - minDist) * strength * -0.5;
    }
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 0.8;
      const segmentIndex = Math.round((rotatedAngle / (Math.PI * 2)) * (folds * 2));
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
      const v = new THREE.Vector3(Math.cos(rotatedAngle) * getRadiusAtHeight(y, params), y, Math.sin(rotatedAngle) * getRadiusAtHeight(y, params));
      let minDist = Infinity;
      points.forEach(p => {
        const d = v.distanceTo(p);
        if (d < minDist) minDist = d;
      });
      return -Math.exp(-minDist * 0.5) * 1.5;
    }
    case 'parametric_waves': {
      const freq = params.frequency || 8;
      const amp = params.amplitude || 0.6;
      return Math.sin(rotatedAngle * freq + normY * Math.PI * 4) * Math.cos(normY * freq) * amp;
    }
    case 'scalloped_edge': {
      const count = params.ribCount || 12;
      const depth = params.ribDepth || 0.5;
      return Math.abs(Math.sin(rotatedAngle * count)) * depth * normY;
    }
    case 'twisted_column': {
      const twist = (params.twistAngle || 180) * (Math.PI / 180);
      const count = params.ribCount || 6;
      return Math.sin(rotatedAngle * count + normY * twist) * (params.ribDepth || 0.8);
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
    
    points.push(points[0].clone());
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const closedProfile = getClosedProfilePoints();

  const createStrut = (start: THREE.Vector3, end: THREE.Vector3, radius: number) => {
    const dist = start.distanceTo(end);
    const strut = new THREE.CylinderGeometry(radius, radius, dist, 6);
    strut.translate(0, dist / 2, 0);
    strut.rotateX(Math.PI / 2);
    strut.lookAt(end.clone().sub(start));
    strut.translate(start.x, start.y, start.z);
    return strut;
  };

  switch (type) {
    case 'fractal_tree': {
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      const levels = 4;
      
      const generateBranch = (start: THREE.Vector3, dir: THREE.Vector3, length: number, level: number) => {
        if (level === 0) return;
        const end = start.clone().add(dir.clone().multiplyScalar(length));
        geoms.push(createStrut(start, end, strutRadius * (level / levels)));
        
        const count = 3;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const newDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5);
          generateBranch(end, newDir, length * 0.7, level - 1);
        }
      };

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = getRadiusAtHeight(-height / 2, params);
        const start = new THREE.Vector3(Math.cos(angle) * r, -height / 2, Math.sin(angle) * r);
        generateBranch(start, new THREE.Vector3(0, 1, 0), height / 3, levels);
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'geometric_weave': {
      const density = params.gridDensity || 15;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / segments;

      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        for (let i = 0; i < segments; i++) {
          const angle = i * aStep;
          const r = getRadiusAtHeight(y, params);
          const p1 = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);

          if (j < density) {
            const ny = y + hStep;
            const nr = getRadiusAtHeight(ny, params);
            const pUp = new THREE.Vector3(Math.cos(angle + aStep * 0.5) * nr, ny, Math.sin(angle + aStep * 0.5) * nr);
            const pUpPrev = new THREE.Vector3(Math.cos(angle - aStep * 0.5) * nr, ny, Math.sin(angle - aStep * 0.5) * nr);
            geoms.push(createStrut(p1, pUp, strutRadius));
            geoms.push(createStrut(p1, pUpPrev, strutRadius));
          }
        }
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'diamond_lattice':
    case 'spiral_mesh':
    case 'crystal_lattice': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 1.5;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / segments;
      const twist = (params.twistAngle || 360) * (Math.PI / 180);

      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        const normY = j / density;
        for (let i = 0; i < segments; i++) {
          const angle = i * aStep + normY * twist;
          const r = getRadiusAtHeight(y, params);
          const p1 = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);

          if (j < density) {
            const ny = y + hStep;
            const nNormY = (j + 1) / density;
            const nr = getRadiusAtHeight(ny, params);
            
            const nAngle1 = i * aStep + nNormY * twist;
            const pUp1 = new THREE.Vector3(Math.cos(nAngle1) * nr, ny, Math.sin(nAngle1) * nr);
            geoms.push(createStrut(p1, pUp1, strutRadius));

            if (type === 'diamond_lattice' || type === 'crystal_lattice') {
              const nAngle2 = (i + 1) * aStep + nNormY * twist;
              const pUp2 = new THREE.Vector3(Math.cos(nAngle2) * nr, ny, Math.sin(nAngle2) * nr);
              geoms.push(createStrut(p1, pUp2, strutRadius));
            }

            if (type === 'crystal_lattice' && i % 2 === 0) {
              const nAngle3 = (i + 2) * aStep + nNormY * twist;
              const pUp3 = new THREE.Vector3(Math.cos(nAngle3) * nr, ny, Math.sin(nAngle3) * nr);
              geoms.push(createStrut(p1, pUp3, strutRadius));
            }
          }
        }
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'radial_fins': {
      const count = params.slotCount || 12;
      const finThick = params.slotWidth || thickness;
      const geoms: THREE.BufferGeometry[] = [];
      const coreScale = 0.5;
      
      const coreProfile = getClosedProfilePoints(40, thickness);
      const coreGeom = new THREE.LatheGeometry(coreProfile, segments);
      coreGeom.scale(coreScale, 1, coreScale);
      geoms.push(coreGeom);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const finGeom = new THREE.BoxGeometry(thickness * 8, height, finThick, 1, 32, 1);
        const pos = finGeom.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const r = getRadiusAtHeight(py, params);
          const px = pos.getX(j);
          const dist = px + (r * (1 + coreScale) / 2);
          pos.setXYZ(j, Math.cos(angle) * dist, py, Math.sin(angle) * dist);
        }
        geoms.push(finGeom);
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'woven_basket': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 1.5;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / segments;

      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        for (let i = 0; i < segments; i++) {
          const angle = i * aStep;
          const r = getRadiusAtHeight(y, params);
          
          const weaveOffset = Math.sin(i * 2 + j * 2) * (thickness * 0.8);
          const p1 = new THREE.Vector3(Math.cos(angle) * (r + weaveOffset), y, Math.sin(angle) * (r + weaveOffset));

          const pNext = new THREE.Vector3(Math.cos(angle + aStep) * (r - weaveOffset), y, Math.sin(angle + aStep) * (r - weaveOffset));
          geoms.push(createStrut(p1, pNext, strutRadius));

          if (j < density) {
            const ny = y + hStep;
            const nr = getRadiusAtHeight(ny, params);
            const nWeaveOffset = Math.sin(i * 2 + (j + 1) * 2) * (thickness * 0.8);
            const pUp = new THREE.Vector3(Math.cos(angle) * (nr + nWeaveOffset), ny, Math.sin(angle) * (nr + nWeaveOffset));
            geoms.push(createStrut(p1, pUp, strutRadius));
          }
        }
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'parametric_fins': {
      const count = params.slotCount || 16;
      const finThick = params.slotWidth || thickness;
      const geoms: THREE.BufferGeometry[] = [];
      const coreScale = 0.7;
      
      const coreProfile = getClosedProfilePoints(40, thickness);
      const coreGeom = new THREE.LatheGeometry(coreProfile, segments);
      coreGeom.scale(coreScale, 1, coreScale);
      geoms.push(coreGeom);

      for (let i = 0; i < count; i++) {
        const baseAngle = (i / count) * Math.PI * 2;
        const finGeom = new THREE.BoxGeometry(thickness * 5, height, finThick, 1, 64, 1);
        const pos = finGeom.attributes.position;
        const twist = (params.twistAngle || 90) * (Math.PI / 180);

        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const normY = (py + height / 2) / height;
          const r = getRadiusAtHeight(py, params);
          const angle = baseAngle + normY * twist;
          const px = pos.getX(j);
          const distFromCore = px + (r * (1 + coreScale) / 2);
          pos.setXYZ(j, Math.cos(angle) * distFromCore, py, Math.sin(angle) * distFromCore);
        }
        geoms.push(finGeom);
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'voronoi_wire':
    case 'organic_mesh': {
      const density = params.gridDensity || 10;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 1.5;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / segments;
      const jitter = type === 'voronoi_wire' ? 0.6 : 0.3;

      const getPoint = (i: number, j: number, layer = 0) => {
        const seedOffset = layer * 1000;
        const u = (i + (pseudoNoise(i, j, seedOffset, params.seed) - 0.5) * jitter) * aStep;
        const v = (j + (pseudoNoise(seedOffset, i, j, params.seed) - 0.5) * jitter) * hStep - height / 2;
        const r = getRadiusAtHeight(v, params);
        return new THREE.Vector3(Math.cos(u) * r, v, Math.sin(u) * r);
      };

      for (let j = 0; j <= density; j++) {
        for (let i = 0; i < segments; i++) {
          const p = getPoint(i, j);
          const pRight = getPoint((i + 1) % segments, j);
          geoms.push(createStrut(p, pRight, strutRadius));
          
          if (j < density) {
            const pUp = getPoint(i, j + 1);
            geoms.push(createStrut(p, pUp, strutRadius));
            const pDiag = getPoint((i + 1) % segments, j + 1);
            geoms.push(createStrut(p, pDiag, strutRadius));
          }

          if (type === 'organic_mesh') {
            const p2 = getPoint(i, j, 1);
            const pRight2 = getPoint((i + 1) % segments, j, 1);
            geoms.push(createStrut(p2, pRight2, strutRadius));
            if (j < density) {
              const pUp2 = getPoint(i, j + 1, 1);
              geoms.push(createStrut(p2, pUp2, strutRadius));
            }
          }
        }
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'star_mesh': {
      const density = params.gridDensity || 10;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 1.5;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / segments;

      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        for (let i = 0; i < segments; i++) {
          const angle = i * aStep;
          const r = getRadiusAtHeight(y, params);
          const p1 = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);

          if (j < density) {
            const ny = y + hStep;
            const nr = getRadiusAtHeight(ny, params);
            const pUp = new THREE.Vector3(Math.cos(angle) * nr, ny, Math.sin(angle) * nr);
            const pUpNext = new THREE.Vector3(Math.cos(angle + aStep) * nr, ny, Math.sin(angle + aStep) * nr);
            const pUpPrev = new THREE.Vector3(Math.cos(angle - aStep) * nr, ny, Math.sin(angle - aStep) * nr);

            geoms.push(createStrut(p1, pUp, strutRadius));
            geoms.push(createStrut(p1, pUpNext, strutRadius));
            geoms.push(createStrut(p1, pUpPrev, strutRadius));
          }
          
          const pNext = new THREE.Vector3(Math.cos(angle + aStep) * r, y, Math.sin(angle + aStep) * r);
          geoms.push(createStrut(p1, pNext, strutRadius));
        }
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'triangular_lattice':
    case 'square_grid':
    case 'radial_spokes':
    case 'chevron_mesh':
    case 'honeycomb':
    case 'honeycomb_v2':
    case 'diamond_mesh':
    case 'bricks': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 1.5;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / segments;

      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        for (let i = 0; i < segments; i++) {
          const angle = i * aStep;
          const r = getRadiusAtHeight(y, params);
          const p1 = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);

          if (j < density) {
            const ny = y + hStep;
            const nr = getRadiusAtHeight(ny, params);
            const pUp = new THREE.Vector3(Math.cos(angle) * nr, ny, Math.sin(angle) * nr);

            if (type === 'square_grid' || type === 'radial_spokes') {
              geoms.push(createStrut(p1, pUp, strutRadius));
            }

            if (type === 'triangular_lattice') {
              const pUpNext = new THREE.Vector3(Math.cos(angle + aStep) * nr, ny, Math.sin(angle + aStep) * nr);
              geoms.push(createStrut(p1, pUp, strutRadius));
              geoms.push(createStrut(p1, pUpNext, strutRadius));
            }

            if (type === 'chevron_mesh') {
              const offset = (j % 2 === 0) ? aStep : -aStep;
              const pUpDiag = new THREE.Vector3(Math.cos(angle + offset) * nr, ny, Math.sin(angle + offset) * nr);
              geoms.push(createStrut(p1, pUpDiag, strutRadius));
            }

            if (type === 'diamond_mesh') {
              const pUp1 = new THREE.Vector3(Math.cos(angle + aStep) * nr, ny, Math.sin(angle + aStep) * nr);
              const pUp2 = new THREE.Vector3(Math.cos(angle - aStep) * nr, ny, Math.sin(angle - aStep) * nr);
              geoms.push(createStrut(p1, pUp1, strutRadius));
              geoms.push(createStrut(p1, pUp2, strutRadius));
            }

            if (type === 'honeycomb' || type === 'honeycomb_v2') {
              const offset = (j % 2 === 0) ? aStep / 2 : -aStep / 2;
              const pUpH = new THREE.Vector3(Math.cos(angle + offset) * nr, ny, Math.sin(angle + offset) * nr);
              geoms.push(createStrut(p1, pUpH, strutRadius));
              if (type === 'honeycomb_v2') {
                const pUpH2 = new THREE.Vector3(Math.cos(angle - offset) * nr, ny, Math.sin(angle - offset) * nr);
                geoms.push(createStrut(p1, pUpH2, strutRadius));
              }
            }

            if (type === 'bricks') {
              const nextY = y + hStep / 2;
              const nrB = getRadiusAtHeight(nextY, params);
              const pUp1 = new THREE.Vector3(Math.cos(angle + 0.5 * aStep) * nrB, nextY, Math.sin(angle + 0.5 * aStep) * nrB);
              const pUp2 = new THREE.Vector3(Math.cos(angle - 0.5 * aStep) * nrB, nextY, Math.sin(angle - 0.5 * aStep) * nrB);
              geoms.push(createStrut(p1, pUp1, strutRadius));
              geoms.push(createStrut(p1, pUp2, strutRadius));
            }
          }

          if (type === 'square_grid' || type === 'radial_spokes' || type === 'triangular_lattice' || type === 'honeycomb' || type === 'honeycomb_v2') {
            const pNext = new THREE.Vector3(Math.cos(angle + aStep) * r, y, Math.sin(angle + aStep) * r);
            geoms.push(createStrut(p1, pNext, strutRadius));
          }
        }
      }
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'organic_coral':
    case 'geometric_stars':
    case 'ribbed_spiral':
    case 'faceted_poly':
    case 'wave_shell_v2':
    case 'faceted_gem':
    case 'knurled':
    case 'knurled_v2':
    case 'wave_rings':
    case 'petal_bloom':
    case 'organic_cell':
    case 'perlin_noise':
    case 'wave_shell':
    case 'voronoi':
    case 'voronoi_v2':
    case 'origami':
    case 'ribbed_drum':
    case 'ribbed_conic':
    case 'spiral_ribs':
    case 'spiral_vortex':
    case 'bubble_foam':
    case 'diamond_plate':
    case 'geometric_tiles':
    case 'spiral_stairs':
    case 'cellular_automata':
    case 'organic_veins':
    case 'parametric_waves':
    case 'scalloped_edge':
    case 'twisted_column': {
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
      geometry = mergeGeometries(geoms);
      break;
    }

    case 'double_wall': {
      const gap = params.gapDistance || 0.5;
      const outerGeom = new THREE.LatheGeometry(getClosedProfilePoints(60, thickness), segments);
      const innerGeom = new THREE.LatheGeometry(getClosedProfilePoints(60, thickness), segments);
      innerGeom.scale(1 - (gap / topRadius), 1, 1 - (gap / topRadius));
      geometry = mergeGeometries([outerGeom, innerGeom]);
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
      geometry = mergeGeometries(geoms);
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

  if (params.rimThickness && params.rimThickness > 0) {
    const rimGeoms: THREE.BufferGeometry[] = [];
    const rimThick = params.rimThickness;
    const rimHeight = params.rimHeight || rimThick;
    const segs = type === 'geometric_poly' ? (params.sides || 6) : segments;
    
    const topRadiusAtEdge = getRadiusAtHeight(height / 2, params);
    const topRimProfile = [
      new THREE.Vector2(topRadiusAtEdge - rimThick, height / 2),
      new THREE.Vector2(topRadiusAtEdge, height / 2),
      new THREE.Vector2(topRadiusAtEdge, height / 2 + rimHeight),
      new THREE.Vector2(topRadiusAtEdge - rimThick, height / 2 + rimHeight),
      new THREE.Vector2(topRadiusAtEdge - rimThick, height / 2)
    ];
    const topRim = new THREE.LatheGeometry(topRimProfile, segs);
    rimGeoms.push(topRim);

    const bottomRadiusAtEdge = getRadiusAtHeight(-height / 2, params);
    const bottomRimProfile = [
      new THREE.Vector2(bottomRadiusAtEdge - rimThick, -height / 2),
      new THREE.Vector2(bottomRadiusAtEdge, -height / 2),
      new THREE.Vector2(bottomRadiusAtEdge, -height / 2 - rimHeight),
      new THREE.Vector2(bottomRadiusAtEdge - rimThick, -height / 2 - rimHeight),
      new THREE.Vector2(bottomRadiusAtEdge - rimThick, -height / 2)
    ];
    const bottomRim = new THREE.LatheGeometry(bottomRimProfile, segs);
    rimGeoms.push(bottomRim);
    
    geometry = mergeGeometries([geometry, ...rimGeoms]);
  }

  if (params.internalRibs > 0) {
    const ribGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < params.internalRibs; i++) {
      const angle = (i / params.internalRibs) * Math.PI * 2;
      const ribWidth = params.ribThickness || 0.2;
      const ribDepth = params.internalRibDepth || 0.5;
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
    geometry = mergeGeometries([geometry, ...ribGeoms]);
  }

  if (params.fitterType !== 'none') {
    const fitterGeom = generateFitterGeometry(params);
    geometry = mergeGeometries([geometry, fitterGeom]);
  }
  
  geometry.computeVertexNormals();
  return mergeVertices(geometry);
}

function generateFitterGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { 
    fitterType, fitterDiameter, fitterOuterDiameter, fitterRingHeight, 
    fitterHeight, height, thickness, type, sides = 6
  } = params;
  
  const geoms: THREE.BufferGeometry[] = [];
  const innerRadius = fitterDiameter / 20; 
  const outerRadius = fitterOuterDiameter / 20;
  const ringHeightCm = fitterRingHeight / 10;
  const spokeThickCm = (params.spokeThickness || 5) / 10;
  const spokeWidthCm = (params.spokeWidth || 10) / 10;
  
  const ringYPos = -height / 2 + fitterHeight + ringHeightCm / 2;
  const spokeYPos = -height / 2 + fitterHeight + spokeThickCm / 2;
  
  const ringProfile = [
    new THREE.Vector2(innerRadius, -ringHeightCm / 2),
    new THREE.Vector2(outerRadius, -ringHeightCm / 2),
    new THREE.Vector2(outerRadius, ringHeightCm / 2),
    new THREE.Vector2(innerRadius, ringHeightCm / 2),
    new THREE.Vector2(innerRadius, -ringHeightCm / 2)
  ];
  const ring = new THREE.LatheGeometry(ringProfile, 64);
  ring.translate(0, ringYPos, 0);
  geoms.push(ring);
  
  const baseRadiusAtZ = getRadiusAtHeight(spokeYPos, params);
  const diameterMm = baseRadiusAtZ * 2 * 10;
  const wallThicknessCm = thickness;
  const safetyMarginCm = Math.min(0.05, wallThicknessCm * 0.2); 
  const connectionOverlapCm = 0.2; 
  
  let spokeCount = params.spokeCount || Math.max(4, Math.round(diameterMm / 20));
  const fuseDepthCm = wallThicknessCm * 0.5;

  for (let i = 0; i < spokeCount; i++) {
    let angle = (i / spokeCount) * Math.PI * 2;
    if (type === 'geometric_poly') {
      const step = (Math.PI * 2) / sides;
      angle = Math.round(angle / step) * step;
    }

    const maxPossibleLength = (params.bottomRadius + params.topRadius) * 2;
    const spoke = new THREE.BoxGeometry(maxPossibleLength, spokeThickCm, spokeWidthCm, 60, 1, 1);
    spoke.translate(outerRadius + maxPossibleLength / 2 - connectionOverlapCm, spokeYPos, 0);
    spoke.rotateY(angle);
    
    const pos = spoke.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const vx = pos.getX(j);
      const vy = pos.getY(j);
      const vz = pos.getZ(j);
      const currentR = Math.sqrt(vx * vx + vz * vz);
      const currentAngle = Math.atan2(vz, vx);
      let baseR = getRadiusAtHeight(vy, params);
      let disp = getDisplacementAt(currentAngle, vy, params);
      
      if (type === 'slotted') {
        baseR *= 0.8;
        disp = 0;
      } else if (type === 'double_wall') {
        const gap = params.gapDistance || 0.5;
        baseR *= (1 - (gap / params.topRadius));
      }

      const localOuterR = baseR + disp;
      const localInnerR = localOuterR - wallThicknessCm;
      const absoluteLimitR = localOuterR - safetyMarginCm;
      const targetFusionR = localInnerR + fuseDepthCm;
      const safeR = Math.min(targetFusionR, absoluteLimitR);
      
      if (currentR > outerRadius + 0.01) {
        const factor = safeR / currentR;
        if (factor < 1.0) {
          pos.setX(j, vx * factor);
          pos.setZ(j, vz * factor);
        }
      }
    }
    geoms.push(spoke);
  }
  return mergeGeometries(geoms);
}