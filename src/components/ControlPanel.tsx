"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LampshadeParams, FitterType, SilhouetteType, PatternType } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import PrintEstimator from './PrintEstimator';
import { Download, RefreshCw, Eye, Box, Settings2, Hash, Sparkles, RotateCcw, Anchor, Palette, Layers, Ruler, Sliders, Star, Scissors } from 'lucide-react';

interface ControlPanelProps {
  params: LampshadeParams;
  setParams: (params: LampshadeParams) => void;
  material: MaterialParams;
  setMaterial: (material: MaterialParams) => void;
  showWireframe: boolean;
  setShowWireframe: (show: boolean) => void;
  onExport: () => void;
  onRandomize: () => void;
  onReset: () => void;
}

const MATERIALS = [
  { name: 'Matte White PLA', color: '#ffffff', roughness: 0.8, metalness: 0, transmission: 0, opacity: 1 },
  { name: 'Silk Gold', color: '#ffd700', roughness: 0.2, metalness: 0.8, transmission: 0, opacity: 1 },
  { name: 'Glow in the Dark', color: '#e2ffc1', roughness: 0.5, metalness: 0, transmission: 0.2, opacity: 1, emissive: '#a3ff4d' },
  { name: 'Translucent PETG', color: '#e2e8f0', roughness: 0.1, metalness: 0, transmission: 0.9, opacity: 0.6 },
  { name: 'Galaxy Black', color: '#1a1a1a', roughness: 0.4, metalness: 0.2, transmission: 0, opacity: 1 },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  params, 
  setParams, 
  material,
  setMaterial,
  showWireframe, 
  setShowWireframe, 
  onExport, 
  onRandomize,
  onReset
}) => {
  const updateParam = (key: keyof LampshadeParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Box className="w-5 h-5 text-indigo-600" />
            ShadeBuilder <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full ml-1">PRO</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Parametric Design Studio</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-full" title="Reset to Default">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <PrintEstimator params={params} />

      <Tabs defaultValue="shape" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-10 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="shape" className="text-[9px] font-bold uppercase tracking-wider rounded-lg">Shape</TabsTrigger>
          <TabsTrigger value="pattern" className="text-[9px] font-bold uppercase tracking-wider rounded-lg">Pattern</TabsTrigger>
          <TabsTrigger value="structure" className="text-[9px] font-bold uppercase tracking-wider rounded-lg">Build</TabsTrigger>
          <TabsTrigger value="finish" className="text-[9px] font-bold uppercase tracking-wider rounded-lg">Finish</TabsTrigger>
        </TabsList>

        <TabsContent value="shape" className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Template</Label>
              <Select value={params.type} onValueChange={(v) => updateParam('type', v)}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ribbed_drum">Ribbed Drum</SelectItem>
                  <SelectItem value="spiral_twist">Spiral Twist</SelectItem>
                  <SelectItem value="wave_shell">Wave Shell</SelectItem>
                  <SelectItem value="voronoi">Voronoi Cells</SelectItem>
                  <SelectItem value="slotted">Slotted Fins</SelectItem>
                  <SelectItem value="origami">Origami Folds</SelectItem>
                  <SelectItem value="double_wall">Double Wall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Silhouette</Label>
              <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                  <SelectValue placeholder="Select silhouette" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="hourglass">Hourglass</SelectItem>
                  <SelectItem value="bell">Bell</SelectItem>
                  <SelectItem value="convex">Convex</SelectItem>
                  <SelectItem value="concave">Concave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Ruler className="w-4 h-4 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Dimensions (cm)</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold"><span>Height</span><span className="text-indigo-600">{params.height}</span></div>
                <Slider value={[params.height]} min={5} max={30} step={0.5} onValueChange={([v]) => updateParam('height', v)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold"><span>Thickness</span><span className="text-indigo-600">{params.thickness}mm</span></div>
                <Slider value={[params.thickness]} min={0.4} max={3.0} step={0.1} onValueChange={([v]) => updateParam('thickness', v)} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pattern" className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Scissors className="w-4 h-4 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Pattern Cutouts</Label>
            </div>
            <Select value={params.patternType} onValueChange={(v: PatternType) => updateParam('patternType', v)}>
              <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">No Pattern</SelectItem>
                <SelectItem value="stars">Star Projections</SelectItem>
                <SelectItem value="hearts">Heart Cutouts</SelectItem>
                <SelectItem value="hexagons">Hexagonal Grid</SelectItem>
                <SelectItem value="dots">Perforated Dots</SelectItem>
              </SelectContent>
            </Select>

            {params.patternType !== 'none' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold"><span>Scale</span><span className="text-indigo-600">{params.patternScale}x</span></div>
                  <Slider value={[params.patternScale]} min={0.1} max={2.0} step={0.1} onValueChange={([v]) => updateParam('patternScale', v)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold"><span>Density</span><span className="text-indigo-600">{params.patternDensity}</span></div>
                  <Slider value={[params.patternDensity]} min={1} max={15} step={1} onValueChange={([v]) => updateParam('patternDensity', v)} />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Anchor className="w-4 h-4 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Lamp Fitter</Label>
            </div>
            <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
              <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                <SelectValue placeholder="Select fitter" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">None (Shell Only)</SelectItem>
                <SelectItem value="spider">Spider (3-Spoke)</SelectItem>
                <SelectItem value="uno">UNO (4-Spoke)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="finish" className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Palette className="w-4 h-4 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Material Preset</Label>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {MATERIALS.map(m => (
                <Button 
                  key={m.name} 
                  variant="outline" 
                  onClick={() => setMaterial(m as any)}
                  className={`h-10 justify-start gap-3 rounded-xl border-slate-100 hover:bg-indigo-50 transition-all ${material.name === m.name ? 'border-indigo-600 bg-indigo-50' : ''}`}
                >
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: m.color }} />
                  <span className="text-xs font-bold">{m.name}</span>
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Wireframe Mode</span>
              </div>
              <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-6 space-y-3">
        <Button variant="outline" onClick={onRandomize} className="w-full gap-2 border-slate-200 hover:bg-slate-50 h-12 rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className="w-4 h-4" />
          Randomize Design
        </Button>
        <Button onClick={onExport} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 h-12 rounded-xl text-xs font-black uppercase tracking-widest">
          <Download className="w-4 h-4" />
          Export STL
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;