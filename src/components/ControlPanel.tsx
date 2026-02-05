"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LampshadeParams, FitterType, SilhouetteType } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import { Download, RefreshCw, Box, Settings2, Hash, RotateCcw, Anchor, Layers, Ruler, Sliders, Star, Save, History, Trash2, Weight, MoveVertical, ShieldAlert, Palette, Zap, Droplets, Share2, ClipboardCheck, Import, Sparkles, CircleDot, Info, Waves } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ControlPanelProps {
  params: LampshadeParams;
  setParams: (params: LampshadeParams) => void;
  material: MaterialParams;
  setMaterial: (material: MaterialParams) => void;
  showWireframe: boolean;
  setShowWireframe: (show: boolean) => void;
  showPrintability: boolean;
  setShowPrintability: (show: boolean) => void;
  onExport: () => void;
  onRandomize: () => void;
  onReset: () => void;
}

const PRESETS: Record<string, Partial<LampshadeParams>> = {
  'Modern Minimal': { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 },
  'Organic Cell': { type: 'organic_cell', silhouette: 'convex', noiseStrength: 1.2, noiseScale: 2.0, height: 15, topRadius: 5, bottomRadius: 8 },
  'Honeycomb': { type: 'honeycomb', silhouette: 'straight', gridDensity: 15, thickness: 0.15, height: 16, topRadius: 7, bottomRadius: 7, rimThickness: 0.2 },
  'Knurled Tech': { type: 'knurled', silhouette: 'straight', patternScale: 15, patternDepth: 0.4, height: 14, topRadius: 6, bottomRadius: 6 },
  'Wave Rings': { type: 'wave_rings', silhouette: 'bell', frequency: 12, amplitude: 0.6, height: 15, topRadius: 4, bottomRadius: 9 },
  'Crystal Gem': { type: 'faceted_gem', silhouette: 'concave', noiseStrength: 1.5, height: 14, topRadius: 5, bottomRadius: 9 },
};

const FILAMENT_PRESETS: Record<string, Partial<MaterialParams>> = {
  'Matte PLA': { roughness: 0.9, metalness: 0, transmission: 0, opacity: 1 },
  'Silk PLA': { roughness: 0.2, metalness: 0.4, transmission: 0, opacity: 1 },
  'Translucent': { roughness: 0.4, metalness: 0, transmission: 0.8, opacity: 0.7 },
  'PETG Gloss': { roughness: 0.1, metalness: 0.1, transmission: 0, opacity: 1 },
};

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  params, 
  setParams, 
  material,
  setMaterial,
  showWireframe, 
  setShowWireframe, 
  showPrintability,
  setShowPrintability,
  onExport, 
  onRandomize,
  onReset
}) => {
  const [history, setHistory] = useState<{id: string, name: string, params: LampshadeParams}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('shade_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = () => {
    const newEntry = {
      id: Date.now().toString(),
      name: `Design ${history.length + 1}`,
      params: { ...params }
    };
    const updated = [newEntry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('shade_history', JSON.stringify(updated));
    showSuccess("Design snapshot saved!");
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('shade_history', JSON.stringify(updated));
  };

  const updateParam = (key: keyof LampshadeParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setParams({ ...params, [key]: roundedValue });
  };

  const updateMaterial = (key: keyof MaterialParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setMaterial({ ...material, [key]: roundedValue });
  };

  const applyFilament = (preset: string) => {
    const presetData = FILAMENT_PRESETS[preset];
    const roundedPreset = Object.fromEntries(
      Object.entries(presetData).map(([k, v]) => [k, typeof v === 'number' ? parseFloat(v.toFixed(2)) : v])
    );
    setMaterial({ ...material, ...roundedPreset });
    showSuccess(`Applied ${preset} filament`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-8 p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl h-full overflow-y-auto studio-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Studio Controls
          </h2>
          <div className="h-1 w-16 brand-gradient rounded-full"></div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={saveToHistory} className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Save Snapshot">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset} className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="shape" className="w-full">
        <TabsList className="grid grid-cols-6 w-full h-12 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <TabsTrigger value="shape" className="text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600">Shape</TabsTrigger>
          <TabsTrigger value="fitter" className="text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600">Fitter</TabsTrigger>
          <TabsTrigger value="pattern" className="text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600">Pat</TabsTrigger>
          <TabsTrigger value="material" className="text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600">Mat</TabsTrigger>
          <TabsTrigger value="build" className="text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600">Build</TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600"><History className="w-3.5 h-3.5" /></TabsTrigger>
        </TabsList>

        <TabsContent value="shape" className="space-y-8 pt-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Design Presets
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(PRESETS).map(name => (
                <Button 
                  key={name} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const preset = PRESETS[name];
                    const roundedPreset = Object.fromEntries(
                      Object.entries(preset).map(([k, v]) => [k, typeof v === 'number' ? parseFloat(v.toFixed(2)) : v])
                    );
                    setParams({...params, ...roundedPreset});
                  }} 
                  className="h-11 text-[10px] font-black uppercase tracking-widest px-4 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all shadow-sm hover:shadow-md"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Template</Label>
              <Select value={params.type} onValueChange={(v) => updateParam('type', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-12 text-xs font-bold rounded-2xl focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="woven_basket">Woven Basket</SelectItem>
                  <SelectItem value="bubble_foam">Bubble Foam</SelectItem>
                  <SelectItem value="parametric_fins">Parametric Fins</SelectItem>
                  <SelectItem value="spiral_stairs">Spiral Stairs</SelectItem>
                  <SelectItem value="diamond_plate">Diamond Plate</SelectItem>
                  <SelectItem value="organic_mesh">Organic Mesh</SelectItem>
                  <SelectItem value="star_mesh">Star Mesh</SelectItem>
                  <SelectItem value="voronoi_wire">Voronoi Wireframe</SelectItem>
                  <SelectItem value="spiral_ribs">Spiral Ribs</SelectItem>
                  <SelectItem value="triangular_lattice">Triangular Lattice</SelectItem>
                  <SelectItem value="square_grid">Square Grid</SelectItem>
                  <SelectItem value="radial_spokes">Radial Spokes</SelectItem>
                  <SelectItem value="chevron_mesh">Chevron Mesh</SelectItem>
                  <SelectItem value="honeycomb">Honeycomb Grid</SelectItem>
                  <SelectItem value="diamond_mesh">Diamond Mesh</SelectItem>
                  <SelectItem value="knurled">Knurled Texture</SelectItem>
                  <SelectItem value="wave_rings">Wave Rings</SelectItem>
                  <SelectItem value="bricks">Bricks Pattern</SelectItem>
                  <SelectItem value="petal_bloom">Petal Bloom</SelectItem>
                  <SelectItem value="faceted_gem">Faceted Gem</SelectItem>
                  <SelectItem value="organic_cell">Organic Cellular</SelectItem>
                  <SelectItem value="ribbed_drum">Ribbed Drum</SelectItem>
                  <SelectItem value="spiral_twist">Spiral Twist</SelectItem>
                  <SelectItem value="voronoi">Voronoi Cells</SelectItem>
                  <SelectItem value="slotted">Slotted Fins</SelectItem>
                  <SelectItem value="double_wall">Double Wall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Silhouette</Label>
              <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-12 text-xs font-bold rounded-2xl focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="hourglass">Hourglass</SelectItem>
                  <SelectItem value="convex">Convex</SelectItem>
                  <SelectItem value="concave">Concave</SelectItem>
                  <SelectItem value="tapered">Tapered</SelectItem>
                  <SelectItem value="bulbous">Bulbous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Height (cm)</Label>
              <Input type="number" step={0.01} value={params.height.toFixed(2)} onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} className="h-12 text-xs font-mono font-bold bg-slate-50 rounded-2xl border-slate-200 focus:ring-indigo-500" />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Top Radius</Label>
              <Input type="number" step={0.01} value={params.topRadius.toFixed(2)} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} className="h-12 text-xs font-mono font-bold bg-slate-50 rounded-2xl border-slate-200 focus:ring-indigo-500" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fitter" className="space-y-8 pt-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5" /> Fitter Type
              </Label>
              <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-12 text-xs font-bold rounded-2xl focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="spider">Spider (Standard)</SelectItem>
                  <SelectItem value="uno">Uno (Threaded)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {params.fitterType !== 'none' && (
              <div className="space-y-6">
                <div className="space-y-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span className="flex items-center gap-2.5"><MoveVertical className="w-4 h-4" /> Vertical Height (cm)</span>
                    <span className="text-indigo-600 font-mono font-bold">{params.fitterHeight.toFixed(2)}</span>
                  </div>
                  <Slider value={[params.fitterHeight]} min={0} max={params.height} step={0.01} onValueChange={([v]) => updateParam('fitterHeight', v)} className="py-2" />
                </div>

                <div className="space-y-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span className="flex items-center gap-2.5"><Hash className="w-4 h-4" /> Spoke Count</span>
                    <span className="text-indigo-600 font-mono font-bold">{params.spokeCount || 4}</span>
                  </div>
                  <Slider value={[params.spokeCount || 4]} min={2} max={12} step={1} onValueChange={([v]) => updateParam('spokeCount', v)} className="py-2" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <CircleDot className="w-3.5 h-3.5" /> Inner ID (mm)
                    </Label>
                    <Input type="number" step={0.01} value={params.fitterDiameter.toFixed(2)} onChange={(e) => updateParam('fitterDiameter', parseFloat(e.target.value))} className="h-12 text-xs font-mono font-bold bg-slate-50 rounded-2xl border-slate-200" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <CircleDot className="w-3.5 h-3.5" /> Outer OD (mm)
                    </Label>
                    <Input type="number" step={0.01} value={params.fitterOuterDiameter.toFixed(2)} onChange={(e) => updateParam('fitterOuterDiameter', parseFloat(e.target.value))} className="h-12 text-xs font-mono font-bold bg-slate-50 rounded-2xl border-slate-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pattern" className="space-y-8 pt-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Generation Seed
              </Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={params.seed} 
                  onChange={(e) => updateParam('seed', parseInt(e.target.value) || 0)} 
                  className="h-12 text-xs font-mono font-bold bg-slate-50 rounded-2xl border-slate-200 focus:ring-indigo-500"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => updateParam('seed', Math.floor(Math.random() * 1000000))}
                  className="h-12 w-12 shrink-0 rounded-2xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span className="flex items-center gap-2.5"><Sliders className="w-4 h-4" /> Pattern Scale</span>
                    <span className="text-indigo-600 font-mono font-bold">{(params.patternScale || 10).toFixed(2)}</span>
                  </div>
                  <Slider value={[params.patternScale || 10]} min={1} max={50} step={0.1} onValueChange={([v]) => updateParam('patternScale', v)} className="py-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span className="flex items-center gap-2.5"><Layers className="w-4 h-4" /> Pattern Depth</span>
                    <span className="text-indigo-600 font-mono font-bold">{(params.patternDepth || 0.3).toFixed(2)}</span>
                  </div>
                  <Slider value={[params.patternDepth || 0.3]} min={0} max={2} step={0.01} onValueChange={([v]) => updateParam('patternDepth', v)} className="py-2" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="material" className="space-y-8 pt-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Filament Presets
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(FILAMENT_PRESETS).map(name => (
                  <Button 
                    key={name} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyFilament(name)} 
                    className="h-10 text-[9px] font-black uppercase tracking-widest border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl"
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Filament Color
              </Label>
              <div className="flex gap-3 items-center">
                <div 
                  className="w-12 h-12 rounded-2xl border-2 border-slate-200 shadow-inner shrink-0" 
                  style={{ backgroundColor: material.color }}
                />
                <Input 
                  type="color" 
                  value={material.color} 
                  onChange={(e) => updateMaterial('color', e.target.value)} 
                  className="h-12 w-full bg-slate-50 border-slate-200 rounded-2xl cursor-pointer p-1"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="build" className="space-y-8 pt-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Printability</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Overhang Analysis</span>
                </div>
              </div>
              <Switch checked={showPrintability} onCheckedChange={setShowPrintability} />
            </div>

            <div className="space-y-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <span className="flex items-center gap-2.5"><Layers className="w-4 h-4" /> Wall Thickness</span>
                    <span className="text-indigo-600 font-mono font-bold">{params.thickness.toFixed(2)} cm</span>
                  </div>
                  <Slider value={[params.thickness]} min={0.04} max={0.5} step={0.01} onValueChange={([v]) => updateParam('thickness', v)} className="py-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <span className="flex items-center gap-2.5"><CircleDot className="w-4 h-4" /> Rim Reinforcement</span>
                    <span className="text-indigo-600 font-mono font-bold">{(params.rimThickness || 0).toFixed(2)} cm</span>
                  </div>
                  <Slider value={[params.rimThickness || 0]} min={0} max={0.5} step={0.01} onValueChange={([v]) => updateParam('rimThickness', v)} className="py-2" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-8 pt-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Recent Snapshots</Label>
              {history.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No saved designs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-10 justify-start text-[10px] font-black uppercase tracking-widest px-2 hover:bg-transparent hover:text-indigo-600"
                        onClick={() => setParams(item.params)}
                      >
                        {item.name}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                        onClick={() => deleteHistory(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-8 space-y-6">
        <div className="space-y-4">
          <Button variant="outline" onClick={onRandomize} className="w-full gap-3 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 h-14 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Randomize
          </Button>
          <Button onClick={onExport} className="w-full gap-3 brand-gradient text-white shadow-2xl shadow-indigo-200 h-14 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Download className="w-4 h-4" />
            Export STL
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ControlPanel;