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
import { Download, RefreshCw, Eye, Box, Settings2, Hash, Sparkles, RotateCcw, Anchor, Palette, Layers, Ruler, Sliders, Star, Save, History, Trash2, Weight, MoveVertical, ShieldAlert, Maximize2 } from 'lucide-react';
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

const MATERIALS = [
  { name: 'Matte White PLA', color: '#ffffff', roughness: 0.8, metalness: 0, transmission: 0, opacity: 1 },
  { name: 'Silk Gold', color: '#ffd700', roughness: 0.2, metalness: 0.8, transmission: 0, opacity: 1 },
  { name: 'Translucent PETG', color: '#e2e8f0', roughness: 0.1, metalness: 0, transmission: 0.9, opacity: 0.6 },
  { name: 'Galaxy Black', color: '#1a1a1a', roughness: 0.4, metalness: 0.2, transmission: 0, opacity: 1 },
];

const PRESETS: Record<string, Partial<LampshadeParams>> = {
  'Modern Minimalist': { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 },
  'Organic Cell': { type: 'organic_cell', silhouette: 'convex', noiseStrength: 1.2, noiseScale: 2.0, height: 15, topRadius: 5, bottomRadius: 8 },
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
    const volume = surfaceArea * (params.thickness / 10); // cm3
    return (volume * 1.24).toFixed(1); // PLA density
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
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={saveToHistory} className="h-8 w-8 text-slate-400 hover:text-indigo-600" title="Save Snapshot">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-slate-400 hover:text-indigo-600" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="shape" className="w-full">
        <TabsList className="grid grid-cols-5 w-full h-9 bg-slate-50 p-1">
          <TabsTrigger value="shape" className="text-[9px] font-bold uppercase">Shape</TabsTrigger>
          <TabsTrigger value="pattern" className="text-[9px] font-bold uppercase">Pattern</TabsTrigger>
          <TabsTrigger value="build" className="text-[9px] font-bold uppercase">Build</TabsTrigger>
          <TabsTrigger value="pro" className="text-[9px] font-bold uppercase">Pro</TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] font-bold uppercase"><History className="w-3 h-3" /></TabsTrigger>
        </TabsList>

        <TabsContent value="shape" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3" /> Design Presets
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.keys(PRESETS).map(name => (
                <Button key={name} variant="outline" size="sm" onClick={() => setParams({...params, ...PRESETS[name]})} className="h-7 text-[9px] px-2 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600">
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organic_cell" className="text-xs">Organic Cellular</SelectItem>
                  <SelectItem value="ribbed_drum" className="text-xs">Ribbed Drum</SelectItem>
                  <SelectItem value="spiral_twist" className="text-xs">Spiral Twist</SelectItem>
                  <SelectItem value="voronoi" className="text-xs">Voronoi Cells</SelectItem>
                  <SelectItem value="slotted" className="text-xs">Slotted Fins</SelectItem>
                  <SelectItem value="double_wall" className="text-xs">Double Wall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Silhouette</Label>
              <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight" className="text-xs">Straight</SelectItem>
                  <SelectItem value="hourglass" className="text-xs">Hourglass</SelectItem>
                  <SelectItem value="convex" className="text-xs">Convex</SelectItem>
                  <SelectItem value="concave" className="text-xs">Concave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
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
          </div>
        </TabsContent>

        <TabsContent value="pattern" className="space-y-4 pt-4">
          <div className="space-y-3">
            {params.type === 'organic_cell' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Noise Scale</Label>
                  <Input type="number" step={0.1} value={params.noiseScale} onChange={(e) => updateParam('noiseScale', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Strength</Label>
                  <Input type="number" step={0.1} value={params.noiseStrength} onChange={(e) => updateParam('noiseStrength', parseFloat(e.target.value))} className="h-9 text-xs font-mono" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Random Seed</span>
                <span className="text-indigo-600">{params.seed.toFixed(0)}</span>
              </div>
              <Slider value={[params.seed]} min={0} max={9999} step={1} onValueChange={([v]) => updateParam('seed', v)} className="py-1" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="build" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Wall Thickness</span>
                <span className="text-indigo-600">{params.thickness.toFixed(2)} cm</span>
              </div>
              <Slider 
                value={[params.thickness]} 
                min={0.04} 
                max={0.5} 
                step={0.01} 
                onValueChange={([v]) => updateParam('thickness', v)} 
                className="py-1" 
              />
              <p className="text-[9px] text-slate-400 italic">Adjust for structural strength (0.2cm = 2mm)</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fitter Type</Label>
              <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  <SelectItem value="spider" className="text-xs">Spider (3 Spokes)</SelectItem>
                  <SelectItem value="uno" className="text-xs">Uno (4 Spokes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {params.fitterType !== 'none' && (
              <div className="space-y-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1"><MoveVertical className="w-3 h-3" /> Fitter Height Offset</span>
                    <span className="text-indigo-600">{params.fitterHeight.toFixed(1)} cm</span>
                  </div>
                  <Slider 
                    value={[params.fitterHeight]} 
                    min={0} 
                    max={params.height} 
                    step={0.1} 
                    onValueChange={([v]) => updateParam('fitterHeight', v)} 
                    className="py-1" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-slate-500">Fitter Ring Diameter (mm)</Label>
                  <Input 
                    type="number" 
                    value={params.fitterDiameter} 
                    onChange={(e) => updateParam('fitterDiameter', parseFloat(e.target.value))} 
                    className="h-8 text-xs font-mono" 
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Anchor className="w-3 h-3" /> Spoke Strength
                  </Label>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-medium text-slate-500">
                      <span>Vertical Thickness</span>
                      <span>{params.spokeThickness.toFixed(2)} cm</span>
                    </div>
                    <Slider 
                      value={[params.spokeThickness]} 
                      min={0.1} 
                      max={0.8} 
                      step={0.05} 
                      onValueChange={([v]) => updateParam('spokeThickness', v)} 
                      className="py-1" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-medium text-slate-500">
                      <span>Horizontal Width</span>
                      <span>{params.spokeWidth.toFixed(2)} cm</span>
                    </div>
                    <Slider 
                      value={[params.spokeWidth]} 
                      min={0.1} 
                      max={1.0} 
                      step={0.05} 
                      onValueChange={([v]) => updateParam('spokeWidth', v)} 
                      className="py-1" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pro" className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Printability Analysis</span>
                  <span className="text-[9px] text-slate-500">Highlight steep overhangs</span>
                </div>
              </div>
              <Switch checked={showPrintability} onCheckedChange={setShowPrintability} />
            </div>
            
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">Estimated Weight</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600">{estimateWeight()}g</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-2 pt-4">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Snapshots</Label>
          {history.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-[10px] text-slate-400">No saved designs yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-7 justify-start text-[10px] font-medium px-2 hover:bg-indigo-50 hover:text-indigo-600"
                    onClick={() => setParams(item.params)}
                  >
                    {item.name}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteHistory(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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