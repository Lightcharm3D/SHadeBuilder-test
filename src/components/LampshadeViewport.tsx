"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';

interface ViewportProps {
  params: LampshadeParams;
  showWireframe?: boolean;
  onSceneReady?: (scene: THREE.Scene, mesh: THREE.Mesh) => void;
}

const LampshadeViewport: React.FC<ViewportProps> = ({ params, showWireframe = false, onSceneReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bedRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Darker, more technical background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(25, 25, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Technical/Studio setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(20, 40, 20);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 0.3); // Subtle indigo tint
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    // Print Bed Visualization
    const bed = new THREE.Group();
    const bedSize = 40;
    const bedGeometry = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 0.8,
      metalness: 0.2
    });
    const bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.receiveShadow = true;
    bed.add(bedMesh);

    // Grid on bed
    const grid = new THREE.GridHelper(bedSize, 20, 0x475569, 0x334155);
    grid.position.y = 0.01;
    bed.add(grid);
    
    scene.add(bed);
    bedRef.current = bed;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2; // Don't go below the bed

    // Initial Mesh
    const geometry = generateLampshadeGeometry(params);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Light gray "STL" look
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1,
      wireframe: showWireframe
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    if (onSceneReady) onSceneReady(scene, mesh);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update geometry and position when params change
  useEffect(() => {
    if (meshRef.current) {
      const newGeometry = generateLampshadeGeometry(params);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = newGeometry;
      
      // Position mesh so it sits on the bed
      meshRef.current.position.y = params.height / 2;
      
      // Update wireframe
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.wireframe = showWireframe;
      }
    }
  }, [params, showWireframe]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950" />;
};

export default LampshadeViewport;