"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { LithophaneParams } from '@/utils/lithophane-generator';
import { Download, Image as ImageIcon, Layers, Maximize, Square, Circle, Heart, Crop, Sliders, Box, Settings2, Star } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface LithophaneControlsProps {
  params: LithophaneParams;
  setParams: (params: LithophaneParams) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onApplyPreset: (preset: string) => void;
  onTriggerCrop: () => void;
  isProcessing: boolean;
  imagePreview?: string | null;
  imageData?: ImageData | null;
}

const LithophaneControls: React.FC<LithophaneControlsProps> = ({ 
  params, 
  setParams, 
  onImageUpload, 
  onExport, 
  onApplyPreset,
  onTriggerCrop,
  isProcessing,
  imagePreview,
  imageData
}) => {
  const updateParam = (key: keyof LithophaneParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  const fixAspectRatio = () => {
    if (!imageData) return;
    const aspect = imageData.width / imageData.height;
    updateParam('height', parseFloat((params.width / aspect).toFixed(2)));
    showSuccess("Aspect ratio matched to image!");
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Lithophane Studio
          </h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onApplyPreset('portrait')} className="h-7 text-[9px] px-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600">
              Portrait
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onApplyPreset('keychain')} className="h-7 text-[9px] px-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600">
              Keychain
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-500">Professional 3D Print Generator</p>
      </div>

      <div className="space-y-4">
        {/* Step 1: Source */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Source Image</Label>
          <div className="flex gap-2">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={onImageUpload} 
              className="cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
            />
            {imagePreview && (
              <Button variant="outline" size="icon" onClick={onTriggerCrop} className="shrink-0 h-10 w-10 border-slate-200">
                <Crop className="w-4 h-4 text-slate-600" />
              </Button>
            )}
          </div>
        </div>

        {/* Step 2: Shape */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Select Shape</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button 
              variant={params.type === 'flat' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'flat')}
              className="h-8 text-[10px] py-0 px-2"
            >
              <Square className="w-3 h-3 mr-1" /> Flat
            </Button>
            <Button 
              variant={params.type === 'curved' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'curved')}
              className="h-8 text-[10px] py-0 px-2"
            >
              <Box className="w-3 h-3 mr-1" /> Curved
            </Button>
            <Button 
              variant={params.type === 'cylinder' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'cylinder')}
              className="h-8 text-[10px] py-0 px-2"
            >
              <Circle className="w-3 h-3 mr-1" /> Cylinder
            </Button>
            <Button 
              variant={params.type === 'circle' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'circle')}
              className="h-8 text-[10px] py-0 px-2"
            >
              <Circle className="w-3 h-3 mr-1" /> Circle
            </Button>
            <Button 
              variant={params.type === 'heart' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'heart')}
              className="h-8 text-[10px] py-0 px-2"
            >
              <Heart className="w-3 h-3 mr-1" /> Heart
            </Button>
          </div>
        </div>

        {/* Step 3: Adjustments */}
        <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Image Adjustments
          </Label>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span>Brightness</span>
                <span>{params.brightness}</span>
              </div>
              <Slider 
                value={[params.brightness]} 
                min={-100} max={100} step={1} 
                onValueChange={([v]) => updateParam('brightness', v)} 
                className="py-1"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span>Contrast</span>
                <span>{params.contrast}</span>
              </div>
              <Slider 
                value={[params.contrast]} 
                min={-100} max={100} step={1} 
                onValueChange={([v]) => updateParam('contrast', v)} 
                className="py-1"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span>Smoothing</span>
                <span>{params.smoothing.toFixed(1)}</span>
              </div>
              <Slider 
                value={[params.smoothing]} 
                min={0} max={5} step={0.1} 
                onValueChange={([v]) => updateParam('smoothing', v)} 
                className="py-1"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Model Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">4. Model Settings</Label>
            {imageData && (
              <Button variant="ghost" size="sm" onClick={fixAspectRatio} className="h-6 text-[9px] gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <Maximize className="w-2 h-2" /> Fix Aspect
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Width (cm)</Label>
              <Input 
                type="number" 
                value={params.width} 
                onChange={(e) => updateParam('width', parseFloat(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Height (cm)</Label>
              <Input 
                type="number" 
                value={params.height} 
                onChange={(e) => updateParam('height', parseFloat(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Min Thick (mm)</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.minThickness} 
                onChange={(e) => updateParam('minThickness', parseFloat(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Max Thick (mm)</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.maxThickness} 
                onChange={(e) => updateParam('maxThickness', parseFloat(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-medium text-slate-700">Add Keychain Hole</span>
            <Switch checked={params.hasHole} onCheckedChange={(v) => updateParam('hasHole', v)} />
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-medium text-slate-700">Invert Height</span>
            <Switch checked={params.inverted} onCheckedChange={(v) => updateParam('inverted', v)} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <Button 
          onClick={onExport} 
          disabled={isProcessing || !imageData}
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-100 h-10 text-xs font-bold uppercase tracking-wider"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Export STL'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneControls;