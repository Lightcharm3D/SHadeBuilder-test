"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Lightbulb, LightbulbOff } from 'lucide-react';

interface ViewportProps {
  geometry: THREE.BufferGeometry | null;
}

const LithophaneViewport: React.FC<ViewportProps> = ({ geometry }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const requestRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const backlightRef = useRef<THREE.PointLight | null>(null);
  
  const [isBacklightOn, setIsBacklightOn] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 5000);
    camera.position.set(0, 150, 250);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(100, 200, 100);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const backlight = new THREE.PointLight(0xfff4e0, 0, 500);
    backlight.position.set(0, 50, -100);
    scene.add(backlight);
    backlightRef.current = backlight;

    const bedSize = 300; 
    const bedGroup = new THREE.Group();
    
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
    grid.position.y = 0.1;
    bedGroup.add(grid);

    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      if (width === 0 || height === 0) return;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
    };

    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    setTimeout(handleResize, 100);

    return () => {
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && geometry) {
      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) (meshRef.current.material as THREE.Material).dispose();
      }

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.98
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.5; 
      
      sceneRef.current.add(mesh);
      meshRef.current = mesh;
    }
  }, [geometry]);

  useEffect(() => {
    if (backlightRef.current) {
      backlightRef.current.intensity = isBacklightOn ? 4.0 : 0;
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissive.set(isBacklightOn ? 0xffaa44 : 0x000000);
        mat.emissiveIntensity = isBacklightOn ? 0.5 : 0;
      }
    }
  }, [isBacklightOn]);

  return (
    <div className="w-full h-full relative bg-slate-950">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      <div className="absolute bottom-6 left-6 z-30">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsBacklightOn(!isBacklightOn)}
          className={`gap-2 h-10 px-4 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${isBacklightOn ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          {isBacklightOn ? <Lightbulb className="w-4 h-4" /> : <LightbulbOff className="w-4 h-4" />}
          {isBacklightOn ? 'Backlight On' : 'Backlight Off'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneViewport;