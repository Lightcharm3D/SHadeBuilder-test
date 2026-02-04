"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Zap, Ruler, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_PARAMS: LampshadeParams = {
  type: 'ribbed_drum',
  silhouette: 'straight',
  height: 15,
  topRadius: 5,
  bottomRadius: 8,
  thickness: 0.8,
  segments: 64,
  internalRibs: 0,
  ribThickness: 0.2,
  ribCount: 24,
  ribDepth: 0.4,
  twistAngle: 0,
  cellCount: 12,
  amplitude: 1,
  frequency: 5,
  sides: 6,
  gridDensity: 10,
  foldCount: 12,
  foldDepth: 0.8,
  noiseScale: 0.5,
  noiseStrength: 0.5,
  slotCount: 16,
  slotWidth: 0.1,
  gapDistance: 0.5,
  seed: 1234,
  fitterType: 'spider',
  fitterDiameter: 27,
  fitterHeight: 3,
  patternType: 'none',
  patternScale: 1.0,
  patternDensity: 5.0,
};

const DEFAULT_MATERIAL: MaterialParams = {
  name: 'Matte White PLA',
  color: '#ffffff',
  roughness: 0.8,
  metalness: 0,
  transmission: 0,
  opacity: 1,
};

const Index = () => {
  const [params, setParams] = useState<LampshadeParams>(DEFAULT_PARAMS);
  const [material, setMaterial] = useState<MaterialParams>(DEFAULT_MATERIAL);
  const [showWireframe, setShowWireframe] = useState(false);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const handleSceneReady = (scene: THREE.Scene, mesh: THREE.Mesh) => {
    meshRef.current = mesh;
  };

  const handleExport = () => {
    if (!meshRef.current) {
      showError("Geometry not ready for export");
      return;
    }
    try {
      const exporter = new STLExporter();
      const result = exporter.parse(meshRef.current);
      const blob = new Blob([result as any], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shade-${params.type}-${Date.now()}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("STL file exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      showError("Failed to export STL");
    }
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setMaterial(DEFAULT_MATERIAL);
    showSuccess("Parameters reset to default");
  };

  const handleRandomize = () => {
    const types: LampshadeType[] = ['ribbed_drum', 'spiral_twist', 'voronoi', 'wave_shell', 'geometric_poly', 'lattice', 'origami', 'double_wall'];
    const silhouettes: SilhouetteType[] = ['straight', 'hourglass', 'bell', 'convex', 'concave'];
    
    const newType = types[Math.floor(Math.random() * types.length)];
    const newSilhouette = silhouettes[Math.floor(Math.random() * silhouettes.length)];
    
    setParams({
      ...params,
      type: newType,
      silhouette: newSilhouette,
      height: 12 + Math.random() * 12,
      topRadius: 4 + Math.random() * 6,
      bottomRadius: 6 + Math.random() * 8,
      seed: Math.random() * 10000,
      internalRibs: Math.random() > 0.7 ? Math.floor(Math.random() * 8) : 0,
      patternType: Math.random() > 0.5 ? 'none' : ['stars', 'hearts', 'hexagons', 'dots'][Math.floor(Math.random() * 4)] as any,
    });
    
    showSuccess("New design generated!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Zap className="w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight">ShadeBuilder</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">by LightCharm 3D</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/lithophane">
            <Button variant="outline" size="sm" className="gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-10 px-4 rounded-xl font-bold text-xs transition-all hover:scale-105">
              <ImageIcon className="w-4 h-4" />
              Lithophane Studio
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-6 overflow-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-800 overflow-hidden group">
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            onSceneReady={handleSceneReady} 
          />
          
          <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
            <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Geometry</span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-300 font-medium">Height: <span className="font-mono text-white font-bold">{params.height * 10}mm</span></div>
                <div className="text-[11px] text-slate-300 font-medium">Max Width: <span className="font-mono text-white font-bold">{Math.max(params.topRadius, params.bottomRadius) * 20}mm</span></div>
                <div className="text-[11px] text-slate-300 font-medium">Pattern: <span className="font-mono text-indigo-400 font-bold uppercase">{params.patternType}</span></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-[400px] shrink-0">
          <ControlPanel 
            params={params} 
            setParams={setParams} 
            material={material}
            setMaterial={setMaterial}
            showWireframe={showWireframe} 
            setShowWireframe={setShowWireframe} 
            onExport={handleExport} 
            onRandomize={handleRandomize}
            onReset={handleReset}
          />
        </div>
      </main>
      
      <footer className="py-4 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} LightCharm 3D • Professional 3D Printing Solutions
        </p>
      </footer>
    </div>
  );
};

export default Index;