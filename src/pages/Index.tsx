"use client";

import React, { useState, useRef } from 'react';
import LampshadeViewport from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Box, Layers, Zap, Ruler } from 'lucide-react';

const Index = () => {
  const [params, setParams] = useState<LampshadeParams>({
    type: 'drum',
    height: 15,
    topRadius: 5,
    bottomRadius: 8,
    thickness: 0.2,
    segments: 64,
    twist: 0,
    density: 10,
    seed: Math.random() * 1000,
  });

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
      link.download = `lampshade-${params.type}-${Date.now()}.stl`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("STL file exported successfully!");
    } catch (err) {
      showError("Failed to export STL");
    }
  };

  const handleRandomize = () => {
    const types: LampshadeType[] = ['drum', 'dome', 'spiral', 'twisted', 'wave', 'ribbed'];
    setParams({
      ...params,
      type: types[Math.floor(Math.random() * types.length)],
      height: 10 + Math.random() * 15,
      topRadius: 3 + Math.random() * 7,
      bottomRadius: 5 + Math.random() * 10,
      twist: (Math.random() - 0.5) * 720,
      density: 5 + Math.random() * 30,
      seed: Math.random() * 1000,
    });
    showSuccess("New design generated!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">LuminaGen</h1>
            <p className="text-xs text-slate-500 font-medium">Parametric 3D Design</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Box className="w-4 h-4" />
            <span>E27 Compatible</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Layers className="w-4 h-4" />
            <span>3D Print Ready</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-xl shadow-2xl border border-slate-800">
          <LampshadeViewport 
            params={params} 
            showWireframe={showWireframe}
            onSceneReady={handleSceneReady} 
          />
          
          <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Ruler className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dimensions</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                <div className="text-xs text-slate-300">Height: <span className="font-mono text-white">{params.height * 10}mm</span></div>
                <div className="text-xs text-slate-300">Max Width: <span className="font-mono text-white">{Math.max(params.topRadius, params.bottomRadius) * 20}mm</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[380px] shrink-0">
          <ControlPanel 
            params={params} 
            setParams={setParams} 
            showWireframe={showWireframe}
            setShowWireframe={setShowWireframe}
            onExport={handleExport}
            onRandomize={handleRandomize}
          />
        </div>
      </main>

      <footer className="py-4 border-t border-slate-200 bg-white">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;