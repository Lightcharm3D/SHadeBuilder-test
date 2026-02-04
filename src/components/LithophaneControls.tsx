"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { LithophaneParams } from '@/utils/lithophane-generator';
import { Download, Image as ImageIcon, Layers, Maximize, Square, Circle, Heart, Crop } from 'lucide-react';
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
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          Lithophane Studio
        </h2>
        <p className="text-xs text-slate-500">Custom Shape Generator</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Source Image</Label>
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
          
          {imagePreview && (
            <div className="mt-2 flex justify-center">
              <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 group">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-32 w-auto object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={onTriggerCrop} className="h-7 text-[10px] gap-1">
                    <Crop className="w-3 h-3" /> Recrop
                  </Button>
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mb-1"></div>
                      <p className="text-xs">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Select Shape</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button 
              variant={params.type === 'flat' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'flat')}
              className="h-8 text-xs py-0 px-2"
            >
              <Square className="w-3 h-3 mr-1" />
              Square
            </Button>
            <Button 
              variant={params.type === 'circle' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'circle')}
              className="h-8 text-xs py-0 px-2"
            >
              <Circle className="w-3 h-3 mr-1" />
              Circle
            </Button>
            <Button 
              variant={params.type === 'heart' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => updateParam('type', 'heart')}
              className="h-8 text-xs py-0 px-2"
            >
              <Heart className="w-3 h-3 mr-1" />
              Heart
            </Button>
          </div>
        </div>

        <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Layers className="w-2 h-2" />
            Mesh Quality
          </Label>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-medium">
              <span>Resolution (Vertices)</span>
              <span>{params.resolution}</span>
            </div>
            <Slider 
              value={[params.resolution]} 
              min={50} 
              max={600} 
              step={10} 
              onValueChange={([v]) => updateParam('resolution', v)} 
              className="py-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Model Settings</Label>
            {imageData && (
              <Button variant="ghost" size="sm" onClick={fixAspectRatio} className="h-6 text-[9px] gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <Maximize className="w-2 h-2" />
                Fix Aspect Ratio
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
            <span className="text-xs font-medium text-slate-700">Invert Height</span>
            <Switch checked={params.inverted} onCheckedChange={(v) => updateParam('inverted', v)} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <Button 
          onClick={onExport} 
          disabled={isProcessing}
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-100 h-10 text-sm"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Export STL'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneControls;