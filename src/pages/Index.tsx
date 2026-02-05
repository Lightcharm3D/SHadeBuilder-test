"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three-stdlib';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Ruler, Image as ImageIcon, Box, Lightbulb, ChevronRight, Weight, Sparkles, Cpu, Activity, Users, Layers, Zap, Settings2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/mobile-hooks';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { saveStlFile } from '@/utils/file-saver';

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
  noiseFrequency: 1.0,
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
  spokeCount: 4,
  rimThickness: 0.1,
  rimHeight: 0.1,
  internalRibDepth: 0.5,
  patternScale: 10,
  patternDepth: 0.3,
  patternRotation: 0,
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
  const [showWelcome, setShowWelcome] = useState(true);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const isMobile = useIsMobile();

  const handleSceneReady = (scene: THREE.Scene, mesh: THREE.Mesh) => {
    meshRef.current = mesh;
  };

  const handleExport = async () => {
    if (!meshRef.current) {
      showError("Geometry not ready for export");
      return;
    }
    try {
      const exporter = new STLExporter();
      const exportMesh = meshRef.current.clone();
      exportMesh.scale.set(10, 10, 10);
      exportMesh.updateMatrixWorld();
      const result = exporter.parse(exportMesh);
      const fileName = `lampshade-${params.type}-${Date.now()}.stl`;
      await saveStlFile(result as string, fileName);
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

  const copyPublicLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    showSuccess("Public Link copied!");
  };

  const handleRandomize = () => {
    const types: LampshadeType[] = [
      'ribbed_drum', 'spiral_twist', 'voronoi', 'wave_shell', 'geometric_poly', 
      'lattice', 'origami', 'perlin_noise', 'slotted', 'double_wall', 
      'organic_cell', 'bricks', 'petal_bloom', 'faceted_gem',
      'honeycomb', 'diamond_mesh', 'knurled', 'wave_rings',
      'triangular_lattice', 'square_grid', 'radial_spokes', 'chevron_mesh',
      'spiral_ribs', 'voronoi_wire', 'star_mesh', 'organic_mesh',
      'woven_basket', 'bubble_foam', 'parametric_fins', 'spiral_stairs', 'diamond_plate',
      'knurled_v2', 'radial_fins', 'cellular_automata', 'voronoi_v2', 'spiral_mesh', 'diamond_lattice',
      'honeycomb_v2', 'crystal_lattice', 'organic_veins', 'geometric_tiles', 'spiral_vortex', 'ribbed_conic'
    ];
    const silhouettes: SilhouetteType[] = ['straight', 'hourglass', 'bell', 'convex', 'concave', 'tapered', 'bulbous', 'flared', 'waisted', 'asymmetric', 'trumpet', 'teardrop', 'diamond', 'stepped', 'wavy'];
    
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
      gridDensity: 8 + Math.floor(Math.random() * 15),
      twistAngle: Math.random() * 720,
      patternScale: 5 + Math.random() * 20,
      patternDepth: 0.1 + Math.random() * 0.8,
      patternRotation: Math.random() * 360,
      noiseFrequency: 0.5 + Math.random() * 2.0,
      rimThickness: Math.random() > 0.5 ? 0.1 + Math.random() * 0.2 : 0,
      rimHeight: Math.random() > 0.5 ? 0.1 + Math.random() * 0.5 : 0,
      spokeCount: 3 + Math.floor(Math.random() * 5),
    });
    
    showSuccess("New design generated!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-[#f8fafc] flex flex-col font-sans pt-safe pb-safe overflow-hidden"
    >
      <header className="h-16 lg:h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl px-4 lg:px-10 flex items-center justify-between shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 lg:-inset-2 brand-gradient rounded-xl lg:rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl transform group-hover:scale-105 transition-transform duration-300">
              <img 
                src="logo.png" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h1 className="text-xs lg:text-lg font-black tracking-tighter text-slate-900 leading-none flex items-center gap-1">
              SHADEBUILDER <span className="text-slate-400">X</span> LITHOSTUDIO
            </h1>
            <p className="text-[7px] lg:text-[9px] text-indigo-600 font-bold uppercase tracking-[0.3em] mt-1">by LightCharm 3D</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyPublicLink}
            className="gap-2 border-slate-200 h-9 lg:h-11 px-3 lg:px-6 rounded-xl lg:rounded-2xl font-black text-[8px] lg:text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden xs:inline">Copy Public Link</span>
          </Button>
          <Link to="/lithophane">
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 h-9 lg:h-11 px-3 lg:px-6 rounded-xl lg:rounded-2xl font-black text-[8px] lg:text-[10px] uppercase tracking-widest">
              <img src="litho-icon.png" alt="Lithophane" className="w-4 h-4 lg:w-5 lg:h-5 object-contain" />
              <span className="hidden xs:inline">Lithophane</span>
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-3 lg:p-8 gap-3 lg:gap-8 overflow-hidden w-full">
        <div className="flex-1 relative min-h-0 bg-slate-950 rounded-[2rem] lg:rounded-[3.5rem] shadow-2xl border border-slate-800/50 overflow-hidden studio-shadow">
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            showPrintability={showPrintability}
            onSceneReady={handleSceneReady} 
          />
          
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80">Live</span>
            </div>
          </div>

          <AnimatePresence>
            {showWelcome && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-30 bg-slate-950/40 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-slate-900/80 backdrop-blur-3xl p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/10 text-center max-w-[280px] lg:max-w-sm shadow-[0_0_100px_rgba(99,102,241,0.2)] mx-4"
                >
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-indigo-500/20 rounded-[1.5rem] overflow-hidden flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <img src="logo.png" alt="Welcome Logo" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-white font-black text-lg lg:text-2xl mb-3 tracking-tight">Ready to Design</h3>
                  <p className="text-slate-400 text-[10px] lg:text-sm leading-relaxed mb-8">
                    Welcome to the professional lampshade studio. Start adjusting parameters to create your masterpiece.
                  </p>
                  <Button 
                    onClick={() => setShowWelcome(false)}
                    className="w-full brand-gradient text-white h-12 lg:h-14 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Enter Studio
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isMobile && (
            <div className="absolute bottom-4 right-4 z-30">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="w-16 h-16 rounded-full brand-gradient shadow-2xl flex items-center justify-center text-white p-0 overflow-hidden border-4 border-white/10">
                    <img src="settings-icon.png" alt="Settings" className="w-full h-full object-cover" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh] bg-white rounded-t-[2.5rem] border-none">
                  <div className="p-4 h-full overflow-hidden">
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
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <div className="w-full lg:w-[500px] shrink-0">
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
        )}
      </main>
    </motion.div>
  );
};

export default Index;