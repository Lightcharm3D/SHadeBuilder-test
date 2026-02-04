"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Ruler, Image as ImageIcon, Box, Lightbulb, ChevronRight, Weight, Sparkles, Cpu, Activity, Users, Layers, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  fitterHeight: 0,
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
    const types: LampshadeType[] = [
      'ribbed_drum', 'spiral_twist', 'voronoi', 'wave_shell', 'geometric_poly', 
      'lattice', 'origami', 'perlin_noise', 'slotted', 'double_wall', 
      'organic_cell', 'bricks', 'petal_bloom', 'faceted_gem'
    ];
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
      gridDensity: 8 + Math.floor(Math.random() * 10),
      twistAngle: Math.random() * 720,
    });
    
    showSuccess("New design generated!");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl px-10 flex items-center justify-between shrink-0 z-40 sticky top-0">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="relative group">
            <div className="absolute -inset-2 brand-gradient rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none flex items-center gap-2">
              SHADE<span className="brand-text-gradient">BUILDER</span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest ml-2 shadow-lg shadow-indigo-200">Pro</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1.5">Precision Geometry Engine</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link to="/lithophane">
            <Button variant="outline" size="sm" className="gap-2.5 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-2xl transition-all shadow-sm group">
              <ImageIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Lithophane Studio
              <ChevronRight className="w-3.5 h-3.5 opacity-30" />
            </Button>
          </Link>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-slate-100 h-11 w-11 text-slate-400 hover:text-indigo-600 transition-colors">
            <Sparkles className="w-5 h-5" />
          </Button>
        </motion.div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-8 gap-8 overflow-hidden max-w-[1920px] mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 relative min-h-[500px] bg-slate-950 rounded-[3.5rem] shadow-2xl border border-slate-800/50 overflow-hidden studio-shadow group"
        >
          <div className="absolute inset-0 scanline opacity-20 pointer-events-none z-10"></div>
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            showPrintability={showPrintability}
            onSceneReady={handleSceneReady} 
          />
          
          <div className="absolute top-10 left-10 z-20 flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/80">Live Mesh Preview</span>
            </div>
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/80">{params.type.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="absolute bottom-10 left-10 pointer-events-none z-20">
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Engine Active: 60FPS</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-[500px] shrink-0"
        >
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
        </motion.div>
      </main>
      
      <footer className="py-8 px-12 border-t border-slate-200/60 bg-white flex items-center justify-between">
        <div className="flex items-center gap-8">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} LightCharm 3D Studio
          </p>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Geometry Engine v2.6.0-PREMIUM</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <Avatar className="w-8 h-8 border-2 border-white shadow-sm hover:z-20 transition-all">
                <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop" />
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-white shadow-sm hover:z-20 transition-all">
                <AvatarImage src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop" />
                <AvatarFallback>U2</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-white shadow-sm hover:z-20 transition-all">
                <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop" />
                <AvatarFallback>U3</AvatarFallback>
              </Avatar>
              <div className="relative z-10 w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center shadow-sm">
                <span className="text-[8px] font-black text-indigo-600">782</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">1.5k Designs Exported Today</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;