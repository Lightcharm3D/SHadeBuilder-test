"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Eye, Box } from 'lucide-react';

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
    // If it's a number, round to 2 decimal places
    const finalValue = typeof value === 'number' ? Math.round(value * 100) / 100 : value;
    setParams({ ...params, [key]: finalValue });
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

        {/* Geometry Inputs */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Dimensions (cm)</Label>
          
          <div className="space-y-2">
            <Label className="text-sm">Height</Label>
            <Input 
              type="number" 
              min={5} 
              max={50} 
              step={0.01}
              value={params.height} 
              onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Top Radius</Label>
              <Input 
                type="number" 
                min={1} 
                max={30} 
                step={0.01}
                value={params.topRadius} 
                onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bottom Radius</Label>
              <Input 
                type="number" 
                min={1} 
                max={30} 
                step={0.01}
                value={params.bottomRadius} 
                onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) || 0)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Resolution (Faces)</Label>
            <Input 
              type="number" 
              min={3} 
              max={256} 
              step={1}
              value={params.segments} 
              onChange={(e) => updateParam('segments', parseInt(e.target.value) || 3)}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          {(params.type === 'spiral' || params.type === 'twisted') && (
            <div className="space-y-2">
              <Label className="text-sm">Twist Angle (Degrees)</Label>
              <Input 
                type="number" 
                min={-720} 
                max={720} 
                step={0.01}
                value={params.twist} 
                onChange={(e) => updateParam('twist', parseFloat(e.target.value) || 0)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          )}

          {(params.type === 'wave' || params.type === 'ribbed') && (
            <div className="space-y-2">
              <Label className="text-sm">Pattern Density</Label>
              <Input 
                type="number" 
                min={1} 
                max={100} 
                step={0.01}
                value={params.density} 
                onChange={(e) => updateParam('density', parseFloat(e.target.value) || 1)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <Button variant="outline" onClick={onRandomize} className="w-full gap-2 border-slate-200 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" />
          Randomize Design
        </Button>
        <Button onClick={onExport} className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
          <Download className="w-4 h-4" />
          Export STL for 3D Print
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;