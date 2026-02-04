"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Ruler, Image as ImageIcon, Box, Lightbulb, ChevronRight, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_PARAMS: LampshadeParams = {
  type: 'ribbed_drum',
  silhouette: 'straight',
  height: 15,
  topRadius: 5,
  bottomRadius: 8,
  thickness: 0.2,
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
  fitterDiameter: 27.6,
  fitterOuterDiameter: 36,
  fitterRingHeight: 10,
  fitterHeight: 3,
  spokeThickness: 5,
  spokeWidth: 10,
};

const DEFAULT_MATERIAL: MaterialParams = {
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
  const [showPrintability, setShowPrintability] = useState(false);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const handleSceneReady = (scene: THREE.Scene, mesh: THREE.Mesh) => {
    meshRef.current = mesh;
  };

  const estimateWeight = () => {
    const avgRadius = (params.topRadius + params.bottomRadius) / 2;
    const surfaceArea = 2 * Math.PI * avgRadius * params.height;
    const volume = surfaceArea * (params.thickness / 10); 
    return (volume * 1.24).toFixed(1); 
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
      link.download = `lampshade-${params.type}-${Date.now()}.stl`;
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
    const types: LampshadeType[] = ['ribbed_drum', 'spiral_twist', 'voronoi', 'wave_shell', 'geometric_poly', 'lattice', 'origami', 'perlin_noise', 'slotted', 'double_wall', 'organic_cell'];
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
    });
    
    showSuccess("New design generated!");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 brand-gradient rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-10 h-10 brand-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
              <Lightbulb className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none flex items-center gap-1">
              SHADE<span className="brand-text-gradient">BUILDER</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">by LightCharm 3D</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/lithophane">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-xs uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              Lithophane Studio
              <ChevronRight className="w-3 h-3 opacity-50" />
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden studio-shadow">
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            showPrintability={showPrintability}
            onSceneReady={handleSceneReady} 
          />
          
          {/* Floating HUD */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Ruler className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Live Specs</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-8">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Height</span>
                  <span className="text-[10px] font-mono text-white">{(params.height * 10).toFixed(1)}mm</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Diameter</span>
                  <span className="text-[10px] font-mono text-white">{(Math.max(params.topRadius, params.bottomRadius) * 20).toFixed(1)}mm</span>
                </div>
                <div className="flex justify-between gap-8 pt-1 border-t border-white/5 mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Weight className="w-2.5 h-2.5" /> Weight
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300">{estimateWeight()}g</span>
                </div>
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
            showPrintability={showPrintability}
            setShowPrintability={setShowPrintability}
            onExport={handleExport} 
            onRandomize={handleRandomize}
            onReset={handleReset}
          />
        </div>
      </main>
      
      <footer className="py-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} LightCharm 3D Studio
        </p>
        <div className="flex gap-4">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Precision Geometry Engine v2.4</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;