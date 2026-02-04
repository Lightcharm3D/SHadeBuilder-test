"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LithophaneParams, LithophaneType } from '@/utils/geometry-generator';
import { Upload, Download, Image as ImageIcon, Settings2, Layers } from 'lucide-react';

interface LithophaneControlsProps {
  params: LithophaneParams;
  setParams: (params: LithophaneParams) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  isProcessing: boolean;
}

const LithophaneControls: React.FC<LithophaneControlsProps> = ({
  params,
  setParams,
  onImageUpload,
  onExport,
  isProcessing
}) => {
  const updateParam = (key: keyof LithophaneParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
          Lithophane Studio
        </h2>
        <p className="text-sm text-slate-500">Convert images to 3D relief models</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Upload Image</Label>
          <div className="relative">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={onImageUpload}
              className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Model Type</Label>
          <Select value={params.type} onValueChange={(v) => updateParam('type', v as LithophaneType)}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat Panel</SelectItem>
              <SelectItem value="curved">Curved Arc</SelectItem>
              <SelectItem value="cylinder">Full Cylinder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 mb-2">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <Label className="text-xs font-bold uppercase tracking-wider">3. Parameters</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Width (cm)</Label>
              <Input type="number" value={params.width} onChange={(e) => updateParam('width', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Height (cm)</Label>
              <Input type="number" value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Min Thick (mm)</Label>
              <Input type="number" step={0.1} value={params.minThickness} onChange={(e) => updateParam('minThickness', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max Thick (mm)</Label>
              <Input type="number" step={0.1} value={params.maxThickness} onChange={(e) => updateParam('maxThickness', parseFloat(e.target.value))} />
            </div>
          </div>

          {params.type !== 'flat' && (
            <div className="space-y-2">
              <Label className="text-xs">Curve Radius (cm)</Label>
              <Input type="number" value={params.curveRadius} onChange={(e) => updateParam('curveRadius', parseFloat(e.target.value))} />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Resolution (Pixels)</Label>
            <Input type="number" step={10} value={params.resolution} onChange={(e) => updateParam('resolution', parseInt(e.target.value))} />
            <p className="text-[10px] text-slate-400">Higher = more detail, slower generation</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Invert Height</span>
            </div>
            <Switch checked={params.inverted} onCheckedChange={(v) => updateParam('inverted', v)} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button 
          onClick={onExport} 
          disabled={isProcessing}
          className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? 'Generating...' : 'Export STL for 3D Print'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneControls;