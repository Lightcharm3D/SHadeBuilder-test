"use client";

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LampshadeParams, FitterType, SilhouetteType } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import { Download, RefreshCw, Box, Settings2, Hash, RotateCcw, Anchor, Layers, Ruler, Sliders, Star, Save, History, Trash2, Weight, MoveVertical, ShieldAlert } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

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
  'Modern Minimalist': { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 },
  'Organic Cell': { type: 'organic_cell', silhouette: 'convex', noiseStrength: 1.2, noiseScale: 2.0, height: 15, topRadius: 5, bottomRadius: 8 },
  'Honeycomb Pro': { type: 'honeycomb_lattice', silhouette: 'straight', gridDensity: 12, thickness: 0.15, height: 16, topRadius: 7, bottomRadius: 7 },
  'DNA Helix': { type: 'dna_spiral', silhouette: 'hourglass', twistAngle: 720, thickness: 0.2, height: 20, topRadius: 4, bottomRadius: 4 },
  'Crystal Gem': { type: 'faceted_gem', silhouette: 'concave', noiseStrength: 1.5, height: 14, topRadius: 5, bottomRadius: 9 },
  'Petal Bloom': { type: 'petal_bloom', silhouette: 'bell', ribCount: 12, height: 15, topRadius: 3, bottomRadius: 10 },
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
    setParams({ ...params, [key]: value });
  };

  const estimateWeight = () => {
    const avgRadius = (params.topRadius + params.bottomRadius) / 2;
    const surfaceArea = 2 * Math.PI * avgRadius * params.height;
    const volume = surfaceArea * (params.thickness / 10); 
    return (volume * 1.24).toFixed(1); 
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-xl h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-600" />
            Studio Controls
          </h2>
          <div className="h-1 w-12 brand-gradient rounded-full"></div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={saveToHistory} className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-lg" title="Save Snapshot">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-lg" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="shape" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-10 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <TabsTrigger value="shape" className="text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Shape</TabsTrigger>
          <TabsTrigger value="pattern" className="text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Pattern</TabsTrigger>
          <TabsTrigger value="build" className="text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Build</TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><History className="w-3.5 h-3.5" /></TabsTrigger>
        </TabsList>

        <TabsContent value="shape" className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400" /> Design Presets
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(PRESETS).map(name => (
                <Button key={name} variant="outline" size="sm" onClick={() => setParams({...params, ...PRESETS[name]})} className="h-8 text-[10px] font-bold px-3 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Template</Label>
              <Select value={params.type} onValueChange={(v) => updateParam('type', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="honeycomb_lattice">Honeycomb Lattice</SelectItem>
                  <SelectItem value="petal_bloom">Petal Bloom</SelectItem>
                  <SelectItem value="dna_spiral">DNA Spiral</SelectItem>
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
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Silhouette</Label>
              <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="hourglass">Hourglass</SelectItem>
                  <SelectItem value="convex">Convex</SelectItem>
                  <SelectItem value="concave">Concave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Height (cm)</Label>
              <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} className="h-10 text-xs font-mono font-bold bg-slate-50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Top Radius</Label>
              <Input type="number" step={0.1} value={params.topRadius} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} className="h-10 text-xs font-mono font-bold bg-slate-50 rounded-xl" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pattern" className="space-y-6 pt-6">
          <div className="space-y-4">
            {(params.type === 'organic_cell' || params.type === 'faceted_gem') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Noise Scale</Label>
                  <Input type="number" step={0.1} value={params.noiseScale} onChange={(e) => updateParam('noiseScale', parseFloat(e.target.value))} className="h-10 text-xs font-mono font-bold bg-slate-50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Strength</Label>
                  <Input type="number" step={0.1} value={params.noiseStrength} onChange={(e) => updateParam('noiseStrength', parseFloat(e.target.value))} className="h-10 text-xs font-mono font-bold bg-slate-50 rounded-xl" />
                </div>
              </div>
            )}
            {(params.type === 'honeycomb_lattice' || params.type === 'lattice') && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Grid Density</Label>
                <Slider value={[params.gridDensity || 10]} min={4} max={30} step={1} onValueChange={([v]) => updateParam('gridDensity', v)} className="py-2" />
              </div>
            )}
            {(params.type === 'dna_spiral' || params.type === 'spiral_twist') && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Twist Angle</Label>
                <Slider value={[params.twistAngle || 360]} min={0} max={1440} step={10} onValueChange={([v]) => updateParam('twistAngle', v)} className="py-2" />
              </div>
            )}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Random Seed</span>
                <span className="text-indigo-600 font-mono">{params.seed.toFixed(0)}</span>
              </div>
              <Slider value={[params.seed]} min={0} max={9999} step={1} onValueChange={([v]) => updateParam('seed', v)} className="py-2" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="build" className="space-y-6 pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700">Printability</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Overhang Analysis</span>
                </div>
              </div>
              <Switch checked={showPrintability} onCheckedChange={setShowPrintability} />
            </div>

            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Wall Thickness</span>
                <span className="text-indigo-600 font-mono">{params.thickness.toFixed(2)} cm</span>
              </div>
              <Slider value={[params.thickness]} min={0.04} max={0.5} step={0.01} onValueChange={([v]) => updateParam('thickness', v)} className="py-2" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Fitter Type</Label>
              <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-10 text-xs font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="spider">Spider (3 Spokes)</SelectItem>
                  <SelectItem value="uno">Uno (4 Spokes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {params.fitterType !== 'none' && (
              <div className="space-y-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <span className="flex items-center gap-2"><MoveVertical className="w-3.5 h-3.5" /> Height Offset</span>
                    <span className="text-indigo-600 font-mono">{params.fitterHeight.toFixed(1)} cm</span>
                  </div>
                  <Slider value={[params.fitterHeight]} min={0} max={params.height} step={0.1} onValueChange={([v]) => updateParam('fitterHeight', v)} className="py-2" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Ring Diameter (mm)</Label>
                  <Input type="number" value={params.fitterDiameter} onChange={(e) => updateParam('fitterDiameter', parseFloat(e.target.value))} className="h-10 text-xs font-mono font-bold bg-white rounded-xl" />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Anchor className="w-3.5 h-3.5" /> Spoke Strength
                  </Label>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <span>Vertical</span>
                        <span className="font-mono">{params.spokeThickness.toFixed(2)} cm</span>
                      </div>
                      <Slider value={[params.spokeThickness]} min={0.1} max={0.8} step={0.05} onValueChange={([v]) => updateParam('spokeThickness', v)} className="py-1" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <span>Horizontal</span>
                        <span className="font-mono">{params.spokeWidth.toFixed(2)} cm</span>
                      </div>
                      <Slider value={[params.spokeWidth]} min={0.1} max={1.0} step={0.05} onValueChange={([v]) => updateParam('spokeWidth', v)} className="py-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 pt-6">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Snapshots</Label>
          {history.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No saved designs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-8 justify-start text-[10px] font-black uppercase tracking-widest px-2 hover:bg-transparent hover:text-indigo-600"
                    onClick={() => setParams(item.params)}
                  >
                    {item.name}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    onClick={() => deleteHistory(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-6 space-y-3">
        <Button variant="outline" onClick={onRandomize} className="w-full gap-2 border-slate-200 hover:bg-slate-50 h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" />
          Randomize
        </Button>
        <Button onClick={onExport} className="w-full gap-2 brand-gradient text-white shadow-xl shadow-indigo-100 h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Download className="w-4 h-4" />
          Export STL
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;