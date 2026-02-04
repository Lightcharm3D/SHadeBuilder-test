"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Sparkles, Eye, Box } from 'lucide-react';

interface ControlPanelProps {
  params: LampshadeParams;
  setParams: (params: LampshadeParams) => void;
  showWireframe: boolean;
  setShowWireframe: (show: boolean) => void;
  onExport: () => void;
  onRandomize: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  params, 
  setParams, 
  showWireframe, 
  setShowWireframe, 
  onExport, 
  onRandomize 
}) => {
  const updateParam = (key: keyof LampshadeParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Box className="w-5 h-5 text-indigo-600" />
          Design Studio
        </h2>
        <p className="text-sm text-slate-500">Customize your parametric lampshade</p>
      </div>

      <div className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Template</Label>
          <Select value={params.type} onValueChange={(v) => updateParam('type', v as LampshadeType)}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drum">Classic Drum</SelectItem>
              <SelectItem value="dome">Modern Dome</SelectItem>
              <SelectItem value="spiral">Spiral Twist</SelectItem>
              <SelectItem value="twisted">Twisted Polygon</SelectItem>
              <SelectItem value="wave">Organic Wave</SelectItem>
              <SelectItem value="ribbed">Ribbed Shell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview Settings */}
        <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preview Settings</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Wireframe Mode</span>
            </div>
            <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
          </div>
        </div>

        {/* Geometry Sliders */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Dimensions</Label>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Height</Label>
              <span className="text-xs font-mono text-indigo-600 font-bold">{params.height * 10}mm</span>
            </div>
            <input 
              type="range" min="5" max="30" step="0.5" 
              value={params.height} 
              onChange={(e) => updateParam('height', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Top Radius</Label>
              <input 
                type="range" min="2" max="15" step="0.5" 
                value={params.topRadius} 
                onChange={(e) => updateParam('topRadius', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bottom Radius</Label>
              <input 
                type="range" min="2" max="15" step="0.5" 
                value={params.bottomRadius} 
                onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Resolution</Label>
              <span className="text-xs font-mono text-slate-500">{params.segments} faces</span>
            </div>
            <input 
              type="range" min="3" max="128" step="1" 
              value={params.segments} 
              onChange={(e) => updateParam('segments', parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {(params.type === 'spiral' || params.type === 'twisted') && (
            <div className="space-y-2">
              <Label className="text-sm">Twist Angle ({params.twist}°)</Label>
              <input 
                type="range" min="-360" max="360" step="10" 
                value={params.twist} 
                onChange={(e) => updateParam('twist', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}

          {(params.type === 'wave' || params.type === 'ribbed') && (
            <div className="space-y-2">
              <Label className="text-sm">Pattern Density</Label>
              <input 
                type="range" min="1" max="50" step="1" 
                value={params.density} 
                onChange={(e) => updateParam('density', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onRandomize} className="w-full gap-2 border-slate-200 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />
            Randomize
          </Button>
          <Button variant="outline" className="w-full gap-2 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100">
            <Sparkles className="w-4 h-4" />
            AI Suggest
          </Button>
        </div>
        <Button onClick={onExport} className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
          <Download className="w-4 h-4" />
          Export STL for 3D Print
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;