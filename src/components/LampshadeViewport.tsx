"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { Lightbulb, LightbulbOff, ShieldAlert } from 'lucide-react';

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
  const bulbMeshRef = useRef<THREE.Mesh | null>(null);
  
  const [isLightOn, setIsLightOn] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(30, 30, 30);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(30, 50, 30);
    mainLight.castShadow = true;
    
    // Configure shadow camera to prevent "square" clipping
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.left = -40;
    mainLight.shadow.camera.right = 40;
    mainLight.shadow.camera.top = 40;
    mainLight.shadow.camera.bottom = -40;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 200;
    mainLight.shadow.bias = -0.0005; // Prevent shadow acne
    
    scene.add(mainLight);

    const bulbLight = new THREE.PointLight(0xffaa44, 0, 100);
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    const bulbGeom = new THREE.SphereGeometry(1, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0 });
    const bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
    scene.add(bulbMesh);
    bulbMeshRef.current = bulbMesh;

    // Buildplate (Print Bed)
    const bedGroup = new THREE.Group();
    const bedSize = 40;
    const bedGeom = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMat = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 0.8,
      metalness: 0.2
    });
    const bed = new THREE.Mesh(bedGeom, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    bedGroup.add(bed);
    
    const grid = new THREE.GridHelper(bedSize, 20, 0x475569, 0x334155);
    grid.position.y = 0.01;
    bedGroup.add(grid);

    // Brand Label
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 110px sans-serif';
      ctx.fillStyle = '#818cf8'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIGHTCHARM 3D', 512, 128);
    }
    const brandTexture = new THREE.CanvasTexture(canvas);
    const brandGeom = new THREE.PlaneGeometry(22, 5.5);
    const brandMat = new THREE.MeshBasicMaterial({ 
      map: brandTexture, 
      transparent: true,
      opacity: 0.7
    });
    const brandMesh = new THREE.Mesh(brandGeom, brandMat);
    brandMesh.rotation.x = -Math.PI / 2;
    brandMesh.position.set(0, 0.05, bedSize / 2 - 5); 
    bedGroup.add(brandMesh);

    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const geometry = generateLampshadeGeometry(params);
    const meshMaterial = new THREE.MeshPhysicalMaterial({ 
      color: material.color, 
      roughness: material.roughness, 
      metalness: material.metalness,
      transmission: material.transmission,
      transparent: material.opacity < 1,
      opacity: material.opacity,
      side: THREE.DoubleSide, 
      wireframe: showWireframe 
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

    // Robust Resize Handling
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
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      const newGeom = generateLampshadeGeometry(params);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = newGeom;
      meshRef.current.position.y = params.height / 2;
      
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.color.set(material.color);
      mat.roughness = material.roughness;
      mat.metalness = material.metalness;
      mat.transmission = material.transmission;
      mat.opacity = material.opacity;
      mat.transparent = material.opacity < 1;
      mat.wireframe = showWireframe;
      
      if (isLightOn) {
        mat.emissive.set(0xffaa44);
        mat.emissiveIntensity = 0.4;
      } else {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
      
      mat.needsUpdate = true;
    }
  }, [params, material, showWireframe, isLightOn, showPrintability]);

  useEffect(() => {
    if (bulbLightRef.current && bulbMeshRef.current) {
      bulbLightRef.current.intensity = isLightOn ? 2.5 : 0;
      (bulbMeshRef.current.material as THREE.MeshBasicMaterial).opacity = isLightOn ? 1 : 0;
    }
  }, [isLightOn]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      <div className="absolute bottom-3 right-3 flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsLightOn(!isLightOn)}
          className={`gap-2 h-8 text-[10px] font-bold uppercase tracking-wider shadow-lg ${isLightOn ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          {isLightOn ? <Lightbulb className="w-3 h-3" /> : <LightbulbOff className="w-3 h-3" />}
          {isLightOn ? 'Light On' : 'Light Off'}
        </Button>
      </div>
      {showPrintability && (
        <div className="absolute top-3 right-3 bg-red-500/20 backdrop-blur-md border border-red-500/50 px-3 py-1.5 rounded-full flex items-center gap-2">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          <span className="text-[9px] font-bold text-red-100 uppercase tracking-widest">Overhang Analysis Active</span>
        </div>
      )}
    </div>
  );
};

export default LampshadeViewport;