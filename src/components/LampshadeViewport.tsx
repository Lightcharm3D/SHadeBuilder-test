"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Scissors } from 'lucide-react';

export interface MaterialParams {
  color: string;
  roughness: number;
  metalness: number;
  transmission: number;
  opacity: number;
}

interface ViewportProps {
  params: LampshadeParams;
  material: MaterialParams;
  showWireframe?: boolean;
  showPrintability?: boolean;
  onSceneReady?: (scene: THREE.Scene, mesh: THREE.Mesh) => void;
}

const LampshadeViewport: React.FC<ViewportProps> = ({ 
  params, 
  material,
  showWireframe = false, 
  showPrintability = false,
  onSceneReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const requestRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bulbLightRef = useRef<THREE.PointLight | null>(null);
  
  const [isLightOn, setIsLightOn] = useState(false);
  const [isCutaway, setIsCutaway] = useState(false);

  const overhangMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(material.color) },
        uThreshold: { value: Math.cos(Math.PI / 4) }, 
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normal;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldNormal;
        uniform vec3 uColor;
        uniform float uThreshold;
        void main() {
          float dotUp = dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
          vec3 color = uColor;
          if (dotUp < uThreshold && dotUp > -0.1) {
            color = mix(uColor, vec3(1.0, 0.2, 0.2), 0.8);
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }, [material.color]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(35, 35, 35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(30, 50, 30);
    mainLight.castShadow = true;
    
    // Expand shadow camera frustum to prevent square clipping
    mainLight.shadow.camera.left = -40;
    mainLight.shadow.camera.right = 40;
    mainLight.shadow.camera.top = 40;
    mainLight.shadow.camera.bottom = -40;
    mainLight.shadow.camera.far = 200;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.001;
    
    scene.add(mainLight);

    const bulbLight = new THREE.PointLight(0xffaa44, 0, 100);
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    const bedGroup = new THREE.Group();
    const bedSize = 40;
    const bedGeom = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const bed = new THREE.Mesh(bedGeom, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    bedGroup.add(bed);
    
    const grid = new THREE.GridHelper(bedSize, 20, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    bedGroup.add(grid);
    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const geometry = generateLampshadeGeometry(params);
    const meshMaterial = new THREE.MeshPhysicalMaterial({ 
      color: material.color, 
      roughness: material.roughness, 
      metalness: material.metalness,
      side: THREE.DoubleSide 
    });
    
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = params.height / 2;
    scene.add(mesh);
    meshRef.current = mesh;

    if (onSceneReady) onSceneReady(scene, mesh);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const { width, height } = entries[0].contentRect;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      const newGeom = generateLampshadeGeometry(params);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = newGeom;
      meshRef.current.position.y = params.height / 2;
      
      if (showPrintability) {
        meshRef.current.material = overhangMaterial;
        overhangMaterial.uniforms.uColor.value.set(material.color);
      } else {
        const mat = new THREE.MeshPhysicalMaterial({
          color: material.color,
          roughness: material.roughness,
          metalness: material.metalness,
          transmission: material.transmission,
          opacity: material.opacity,
          transparent: material.opacity < 1,
          side: THREE.DoubleSide,
          wireframe: showWireframe,
          clippingPlanes: isCutaway ? [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)] : []
        });
        meshRef.current.material = mat;
        if (rendererRef.current) rendererRef.current.localClippingEnabled = isCutaway;
      }
      
      if (isLightOn && !showPrintability) {
        (meshRef.current.material as THREE.MeshPhysicalMaterial).emissive?.set(0xffaa44);
        (meshRef.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.4;
      }
    }
  }, [params, material, showWireframe, isLightOn, showPrintability, isCutaway, overhangMaterial]);

  useEffect(() => {
    if (bulbLightRef.current) bulbLightRef.current.intensity = isLightOn ? 2.5 : 0;
  }, [isLightOn]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      <div className="absolute bottom-4 left-4 flex gap-2 z-20">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsLightOn(!isLightOn)}
          className={`gap-2 h-9 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${isLightOn ? 'bg-amber-100 text-amber-700' : 'bg-slate-800 text-slate-300'}`}
        >
          <img src="/light-icon.png" alt="Light" className={`w-4 h-4 ${!isLightOn ? 'opacity-50 grayscale' : ''}`} />
          {isLightOn ? 'Light On' : 'Light Off'}
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsCutaway(!isCutaway)}
          className={`gap-2 h-9 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${isCutaway ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-800 text-slate-300'}`}
        >
          <Scissors className="w-4 h-4" />
          {isCutaway ? 'Full View' : 'Cutaway'}
        </Button>
      </div>
      {showPrintability && (
        <div className="absolute top-4 right-4 bg-red-500/20 backdrop-blur-md border border-red-500/50 px-4 py-2 rounded-2xl flex items-center gap-3 z-20">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-100 uppercase tracking-widest">Overhang Warning</span>
            <span className="text-[8px] text-red-200/60 font-bold uppercase">Red areas require support</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LampshadeViewport;