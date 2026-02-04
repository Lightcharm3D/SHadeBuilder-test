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
  const requestRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const backlightRef = useRef<THREE.PointLight | null>(null);
  
  const [isBacklightOn, setIsBacklightOn] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 50, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Backlight for Lithophane Effect
    const backlight = new THREE.PointLight(0xfff4e0, 0, 200);
    backlight.position.set(0, 20, -50);
    scene.add(backlight);
    backlightRef.current = backlight;

    // Buildplate (Print Bed)
    const bedSize = 250; 
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
    
    const grid = new THREE.GridHelper(bedSize, 25, 0x475569, 0x334155);
    grid.position.y = 0.1;
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
    const brandGeom = new THREE.PlaneGeometry(120, 30);
    const brandMat = new THREE.MeshBasicMaterial({ 
      map: brandTexture, 
      transparent: true,
      opacity: 0.5
    });
    const brandMesh = new THREE.Mesh(brandGeom, brandMat);
    brandMesh.rotation.x = -Math.PI / 2;
    brandMesh.position.set(0, 0.2, bedSize / 2 - 18); 
    bedGroup.add(brandMesh);

    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 1.8;
    controlsRef.current = controls;

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && geometry) {
      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        if (meshRef.current.geometry) {
          meshRef.current.geometry.dispose();
        }
        if (meshRef.current.material) {
          (meshRef.current.material as THREE.Material).dispose();
        }
      }

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.95
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
      backlightRef.current.intensity = isBacklightOn ? 2.5 : 0;
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissive.set(isBacklightOn ? 0xffaa44 : 0x000000);
        mat.emissiveIntensity = isBacklightOn ? 0.3 : 0;
      }
    }
  }, [isBacklightOn]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 right-3">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsBacklightOn(!isBacklightOn)}
          className={`gap-2 h-8 text-[10px] font-bold uppercase tracking-wider shadow-lg ${isBacklightOn ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          {isBacklightOn ? <Lightbulb className="w-3 h-3" /> : <LightbulbOff className="w-3 h-3" />}
          {isBacklightOn ? 'Backlight On' : 'Backlight Off'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneViewport;