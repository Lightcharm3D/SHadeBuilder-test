"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { Lightbulb, LightbulbOff } from 'lucide-react';

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
  onSceneReady?: (scene: THREE.Scene, mesh: THREE.Mesh) => void;
}

const LampshadeViewport: React.FC<ViewportProps> = ({ 
  params, 
  material,
  showWireframe = false, 
  onSceneReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(20, 40, 20);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x6366f1, 0.8);
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    // Internal Light Bulb
    const bulbLight = new THREE.PointLight(0xffaa44, 0, 100);
    bulbLight.position.set(0, 0, 0);
    bulbLight.castShadow = true;
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    const bulbGeom = new THREE.SphereGeometry(1, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0 });
    const bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
    scene.add(bulbMesh);
    bulbMeshRef.current = bulbMesh;

    // Print Bed
    const bedGroup = new THREE.Group();
    const bedSize = 40;
    const bedGeom = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
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
      ctx.font = 'bold 96px sans-serif';
      ctx.fillStyle = '#6366f1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LightCharm 3D', 512, 128);
    }
    const brandTexture = new THREE.CanvasTexture(canvas);
    const brandGeom = new THREE.PlaneGeometry(15, 4);
    const brandMat = new THREE.MeshBasicMaterial({ 
      map: brandTexture, 
      transparent: true,
      opacity: 0.5
    });
    const brandMesh = new THREE.Mesh(brandGeom, brandMat);
    brandMesh.rotation.x = -Math.PI / 2;
    brandMesh.position.set(0, 0.02, bedSize / 2 - 3); 
    bedGroup.add(brandMesh);

    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.8;
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

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (containerRef.current && renderer.domElement) containerRef.current.removeChild(renderer.domElement);
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
    }
  }, [params, material, showWireframe]);

  useEffect(() => {
    if (bulbLightRef.current && bulbMeshRef.current) {
      bulbLightRef.current.intensity = isLightOn ? 2.5 : 0;
      (bulbMeshRef.current.material as THREE.MeshBasicMaterial).opacity = isLightOn ? 1 : 0;
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(isLightOn ? 0x020617 : 0x0f172a);
      }
    }
  }, [isLightOn]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 right-3">
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
    </div>
  );
};

export default LampshadeViewport;