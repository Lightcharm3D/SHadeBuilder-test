"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';

interface ViewportProps {
  params: LampshadeParams;
  showWireframe?: boolean;
  onSceneReady?: (scene: THREE.Scene, mesh: THREE.Mesh) => void;
}

const LampshadeViewport: React.FC<ViewportProps> = ({ 
  params, 
  showWireframe = false, 
  onSceneReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
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
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(20, 40, 20);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x6366f1, 0.5);
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    // Print Bed
    const bedGroup = new THREE.Group();
    const bedSize = 40;
    const bedGeom = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMat = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 0.8 
    });
    const bed = new THREE.Mesh(bedGeom, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    bedGroup.add(bed);
    
    const grid = new THREE.GridHelper(bedSize, 20, 0x475569, 0x334155);
    grid.position.y = 0.01;
    bedGroup.add(grid);

    // Brand Label - Centered at Front Edge
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
    const brandGeom = new THREE.PlaneGeometry(20, 5);
    const brandMat = new THREE.MeshBasicMaterial({ 
      map: brandTexture, 
      transparent: true,
      opacity: 0.5
    });
    const brandMesh = new THREE.Mesh(brandGeom, brandMat);
    brandMesh.rotation.x = -Math.PI / 2;
    // Position at the front edge (positive Z)
    brandMesh.position.set(0, 0.05, bedSize / 2 - 3); 
    bedGroup.add(brandMesh);

    scene.add(bedGroup);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.screenSpacePanning = false;
    controlsRef.current = controls;

    // Initial Mesh
    const geometry = generateLampshadeGeometry(params);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xe2e8f0, 
      side: THREE.DoubleSide, 
      roughness: 0.4, 
      metalness: 0.1, 
      wireframe: showWireframe 
    });
    
    const mesh = new THREE.Mesh(geometry, material);
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
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (meshRef.current) {
        if (meshRef.current.geometry) {
          meshRef.current.geometry.dispose();
        }
        if (meshRef.current.material) {
          (meshRef.current.material as THREE.Material).dispose();
        }
      }
    };
  }, []);

  // Update geometry
  useEffect(() => {
    if (meshRef.current) {
      const newGeom = generateLampshadeGeometry(params);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = newGeom;
      meshRef.current.position.y = params.height / 2;
      
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.wireframe = showWireframe;
      }
    }
  }, [params, showWireframe]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-slate-950" />;
};

export default LampshadeViewport;