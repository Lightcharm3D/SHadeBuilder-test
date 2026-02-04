"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LampshadeParams, FitterType, SilhouetteType } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import { Download, RefreshCw, Eye, Box, Settings2, Hash, Sparkles, RotateCcw, Anchor, Palette, Layers, Ruler, Sliders, Star } from 'lucide-react';

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
  { name: 'Translucent PETG', color: '#e2e8f0', roughness: 0.1, metalness: 0, transmission: 0.9, opacity: 0.6 },
  { name: 'Wood Fill', color: '#8b4513', roughness: 0.9, metalness: 0, transmission: 0, opacity: 1 },
  { name: 'Galaxy Black', color: '#1a1a1a', roughness: 0.4, metalness: 0.2, transmission: 0, opacity: 1 },
];

const PRESETS: Record<string, Partial<LampshadeParams>> = {
  'Modern Minimalist': { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 },
  'Organic Cell': { type: 'voronoi', silhouette: 'convex', cellCount: 18, height: 15, topRadius: 5, bottomRadius: 8 },
  'Industrial Ribbed': { type: 'ribbed_drum', silhouette: 'straight', ribCount: 32, ribDepth: 0.6, height: 20, topRadius: 7, bottomRadius: 7 },
  'Twisted Deco': { type: 'spiral_twist', silhouette: 'hourglass', twistAngle: 120, height: 16, topRadius: 4, bottomRadius: 6 },
};

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

  const applyPreset = (name: string) => {
    setParams({ ...params, ...PRESETS[name] });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-600" />
            Parametric Studio
          </h2>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Procedural 3D Design</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-slate-400 hover:text-indigo-600" title="Reset to Default">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="shape" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-9 bg-slate-50 p-1">
          <TabsTrigger value="shape" className="text-[10px] font-bold uppercase tracking-wider">Shape</TabsTrigger>
          <TabsTrigger value="pattern" className="text-[10px] font-bold uppercase tracking-wider">Pattern</TabsTrigger>
          <TabsTrigger value="structure" className="text-[10px] font-bold uppercase tracking-wider">Build</TabsTrigger>
          <TabsTrigger value="finish" className="text-[10px] font-bold uppercase tracking-wider">Finish</TabsTrigger>
        </TabsList>

        <TabsContent value="shape" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3" /> Design Presets
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.keys(PRESETS).map(name => (
                <Button key={name} variant="outline" size="sm" onClick={() => applyPreset(name)} className="h-7 text-[9px] px-2 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600">
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Template</Label>
              <Select value={params.type} onValueChange={(v) => updateParam('type', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-xs font-medium">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ribbed_drum" className="text-xs">Ribbed Drum</SelectItem>
                  <SelectItem value="spiral_twist" className="text-xs">Spiral Twist</SelectItem>
                  <SelectItem value="wave_shell" className="text-xs">Wave Shell</SelectItem>
                  <SelectItem value="voronoi" className="text-xs">Voronoi Cells</SelectItem>
                  <SelectItem value="slotted" className="text-xs">Slotted Fins</SelectItem>
                  <SelectItem value="origami" className="text-xs">Origami Folds</SelectItem>
                  <SelectItem value="geometric_poly" className="text-xs">Geometric Polygon</SelectItem>
                  <SelectItem value="lattice" className="text-xs">Parametric Lattice</SelectItem>
                  <SelectItem value="perlin_noise" className="text-xs">Perlin Noise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Silhouette</Label>
              <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-xs font-medium">
                  <SelectValue placeholder="Select silhouette" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight" className="text-xs">Straight Taper</SelectItem>
                  <SelectItem value="hourglass" className="text-xs">Hourglass Curve</SelectItem>
                  <SelectItem value="bell" className="text-xs">Bell Shape</SelectItem>
                  <SelectItem value="convex" className="text-xs">Convex (Bulge)</SelectItem>
                  <SelectItem value="concave" className="text-xs">Concave (Inward)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-900 mb-1">
              <Ruler className="w-3.5 h-3.5 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Dimensions</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Height (cm)</Label>
                <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Top Radius</Label>
                <Input type="number" step={0.1} value={params.topRadius} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} className="h-9 text-xs font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Bottom Radius</Label>
                <Input type="number" step={0.1} value={params.bottomRadius} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) || 0)} className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Thickness (mm)</Label>
                <Input type="number" step={0.1} value={params.thickness} onChange={(e) => updateParam('thickness', parseFloat(e.target.value) || 0)} className="h-9 text-xs font-mono" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pattern" className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-900 mb-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Pattern Controls</Label>
            </div>
            
            {params.type === 'origami' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Fold Count</Label>
                  <Input type="number" value={params.foldCount} onChange={(e) => updateParam('foldCount', parseInt(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Fold Depth</Label>
                  <Input type="number" step={0.1} value={params.foldDepth} onChange={(e) => updateParam('foldDepth', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
              </div>
            )}

            {params.type === 'slotted' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Fin Count</Label>
                  <Input type="number" value={params.slotCount} onChange={(e) => updateParam('slotCount', parseInt(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Fin Width</Label>
                  <Input type="number" step={0.1} value={params.slotWidth} onChange={(e) => updateParam('slotWidth', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
              </div>
            )}

            {params.type === 'voronoi' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Cell Density</Label>
                <Input type="number" value={params.cellCount} onChange={(e) => updateParam('cellCount', parseInt(e.target.value))} className="h-9 text-xs font-mono" />
              </div>
            )}

            {params.type === 'wave_shell' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Amplitude</Label>
                  <Input type="number" step={0.1} value={params.amplitude} onChange={(e) => updateParam('amplitude', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Frequency</Label>
                  <Input type="number" value={params.frequency} onChange={(e) => updateParam('frequency', parseInt(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Random Seed</span>
                  <span className="text-indigo-600">{params.seed.toFixed(0)}</span>
                </div>
                <Slider value={[params.seed]} min={0} max={9999} step={1} onValueChange={([v]) => updateParam('seed', v)} className="py-1" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Smoothness</span>
                  <span className="text-indigo-600">{params.segments}</span>
                </div>
                <Slider value={[params.segments]} min={12} max={128} step={1} onValueChange={([v]) => updateParam('segments', v)} className="py-1" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-900 mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Reinforcement</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Internal Ribs</Label>
                <Input type="number" value={params.internalRibs} onChange={(e) => updateParam('internalRibs', parseInt(e.target.value) || 0)} className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-slate-500">Rib Thick (mm)</Label>
                <Input type="number" step={0.1} value={params.ribThickness} onChange={(e) => updateParam('ribThickness', parseFloat(e.target.value) || 0)} className="h-9 text-xs font-mono" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-900 mb-1">
              <Anchor className="w-3.5 h-3.5 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Lamp Fitter</Label>
            </div>
            <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
              <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-xs font-medium">
                <SelectValue placeholder="Select fitter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None (Shell Only)</SelectItem>
                <SelectItem value="spider" className="text-xs">Spider (3-Spoke)</SelectItem>
                <SelectItem value="uno" className="text-xs">UNO (4-Spoke)</SelectItem>
              </SelectContent>
            </Select>
            {params.fitterType !== 'none' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Ring ID (mm)</Label>
                  <Input type="number" value={params.fitterDiameter} onChange={(e) => updateParam('fitterDiameter', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Drop (cm)</Label>
                  <Input type="number" step={0.1} value={params.fitterHeight} onChange={(e) => updateParam('fitterHeight', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="finish" className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-900 mb-1">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Material & Finish</Label>
            </div>
            <Select onValueChange={(v) => {
              const mat = MATERIALS.find(m => m.name === v);
              if (mat) setMaterial(mat);
            }}>
              <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-xs font-medium">
                <SelectValue placeholder="Select filament preset" />
              </SelectTrigger>
              <SelectContent>
                {MATERIALS.map(m => (
                  <SelectItem key={m.name} value={m.name} className="text-xs">{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="color" value={material.color} onChange={(e) => setMaterial({ ...material, color: e.target.value })} className="h-9 w-12 p-1 cursor-pointer" />
              <Input type="text" value={material.color} onChange={(e) => setMaterial({ ...material, color: e.target.value })} className="h-9 text-xs font-mono flex-1" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Wireframe Mode</span>
              </div>
              <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-4 space-y-2.5">
        <Button variant="outline" onClick={onRandomize} className="w-full gap-2 border-slate-200 hover:bg-slate-50 h-10 text-xs font-bold uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5" />
          Randomize Design
        </Button>
        <Button onClick={onExport} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 h-10 text-xs font-bold uppercase tracking-wider">
          <Download className="w-3.5 h-3.5" />
          Export STL
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;