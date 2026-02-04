"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { LithophaneParams, LithophaneType } from '@/utils/lithophane-generator';
import { Download, Image as ImageIcon, Sun, Contrast, Zap, Sparkles } from 'lucide-react';

interface LithophaneControlsProps {
  params: LithophaneParams;
  setParams: (params: LithophaneParams) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onApplyPreset: (preset: string) => void;
  isProcessing: boolean;
}

const LithophaneControls: React.FC<LithophaneControlsProps> = ({
  params,
  setParams,
  onImageUpload,
  onExport,
  onApplyPreset,
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
        <p className="text-sm text-slate-500">Professional 3D Relief Generator</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Source Image</Label>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={onImageUpload}
            className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => onApplyPreset('portrait')} className="text-[10px] h-8">Portrait</Button>
          <Button variant="outline" size="sm" onClick={() => onApplyPreset('landscape')} className="text-[10px] h-8">Landscape</Button>
          <Button variant="outline" size="sm" onClick={() => onApplyPreset('keychain')} className="text-[10px] h-8">Keychain</Button>
          <Button variant="outline" size="sm" onClick={() => onApplyPreset('high_detail')} className="text-[10px] h-8">High Detail</Button>
        </div>

        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Image Adjustments
          </Label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                <span>{params.brightness}</span>
              </div>
              <Slider value={[params.brightness]} min={-100} max={100} step={1} onValueChange={([v]) => updateParam('brightness', v)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                <span>{params.contrast}</span>
              </div>
              <Slider value={[params.contrast]} min={-100} max={100} step={1} onValueChange={([v]) => updateParam('contrast', v)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Smoothing</span>
                <span>{params.smoothing}</span>
              </div>
              <Slider value={[params.smoothing]} min={0} max={5} step={0.5} onValueChange={([v]) => updateParam('smoothing', v)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Model Settings</Label>
          
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Width (cm)</Label>
              <Input type="number" value={params.width} onChange={(e) => updateParam('width', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Height (cm)</Label>
              <Input type="number" value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Base Thick (mm)</Label>
              <Input type="number" step={0.1} value={params.baseThickness} onChange={(e) => updateParam('baseThickness', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Max Relief (mm)</Label>
              <Input type="number" step={0.1} value={params.maxThickness} onChange={(e) => updateParam('maxThickness', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-medium text-slate-700">Invert Height</span>
            <Switch checked={params.inverted} onCheckedChange={(v) => updateParam('inverted', v)} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button 
          onClick={onExport} 
          disabled={isProcessing}
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Export STL for 3D Print'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneControls;