"use client";

import React, { useState, useRef } from 'react';
import LampshadeViewport from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Box, Layers, Zap } from 'lucide-react';

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
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        {/* Viewport Area */}
        <div className="flex-1 relative min-h-[400px]">
          <LampshadeViewport params={params} onSceneReady={handleSceneReady} />
          
          {/* Overlay Info */}
          <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-lg border border-white/50 shadow-sm pointer-events-none">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Specs</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-xs text-slate-600">Volume: <span className="font-mono text-slate-900">~1.2L</span></div>
              <div className="text-xs text-slate-600">Material: <span className="font-mono text-slate-900">PLA/PETG</span></div>
              <div className="text-xs text-slate-600">Print Time: <span className="font-mono text-slate-900">~4h</span></div>
              <div className="text-xs text-slate-600">Complexity: <span className="font-mono text-slate-900">Medium</span></div>
            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-[380px] shrink-0">
          <ControlPanel 
            params={params} 
            setParams={setParams} 
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