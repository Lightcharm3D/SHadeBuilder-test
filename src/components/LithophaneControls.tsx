"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { LithophaneParams } from '@/utils/lithophane-generator';
import { Download, Image as ImageIcon, Sun, Contrast, Zap, Sparkles, Circle, Heart, Square, Frame, Layers } from 'lucide-react';

interface LithophaneControlsProps {
  params: LithophaneParams;
  setParams: (params: LithophaneParams) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onApplyPreset: (preset: string) => void;
  isProcessing: boolean;
  imagePreview?: string | null;
}

const LithophaneControls: React.FC<LithophaneControlsProps> = ({ 
  params, 
  setParams, 
  onImageUpload, 
  onExport, 
  onApplyPreset, 
  isProcessing,
  imagePreview
}) => {
  const updateParam = (key: keyof LithophaneParams, value: any) => {
    setParams({ ...params, [key]: value });
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
          <Input 
            type="file" 
            accept="image/*" 
            onChange={onImageUpload} 
            className="cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
          />
          
          {imagePreview && (
            <div className="mt-2 flex justify-center">
              <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-32 w-auto object-contain"
                />
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
              max={400} 
              step={10} 
              onValueChange={([v]) => updateParam('resolution', v)} 
              className="py-1"
            />
            <p className="text-[8px] text-slate-400 italic">Higher values = more detail but slower processing</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-indigo-900">Keyring Hole</span>
            <span className="text-[9px] text-indigo-600">Adds attachment point</span>
          </div>
          <Switch checked={params.hasHole} onCheckedChange={(v) => updateParam('hasHole', v)} />
        </div>

        <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Frame className="w-2 h-2" />
              Border Frame
            </Label>
            <Switch checked={params.hasBorder} onCheckedChange={(v) => updateParam('hasBorder', v)} />
          </div>
          
          {params.hasBorder && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-medium">
                  <span>Thickness (mm)</span>
                  <span>{params.borderThickness}</span>
                </div>
                <Slider 
                  value={[params.borderThickness]} 
                  min={0.5} 
                  max={5} 
                  step={0.1} 
                  onValueChange={([v]) => updateParam('borderThickness', v)} 
                  className="py-1"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-medium">
                  <span>Height (mm)</span>
                  <span>{params.borderHeight}</span>
                </div>
                <Slider 
                  value={[params.borderHeight]} 
                  min={0.5} 
                  max={5} 
                  step={0.1} 
                  onValueChange={([v]) => updateParam('borderHeight', v)} 
                  className="py-1"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Zap className="w-2 h-2" />
            Image Adjustments
          </Label>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span className="flex items-center gap-1"><Sun className="w-2 h-2" /> Brightness</span>
                <span>{params.brightness}</span>
              </div>
              <Slider 
                value={[params.brightness]} 
                min={-100} 
                max={100} 
                step={1} 
                onValueChange={([v]) => updateParam('brightness', v)} 
                className="py-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span className="flex items-center gap-1"><Contrast className="w-2 h-2" /> Contrast</span>
                <span>{params.contrast}</span>
              </div>
              <Slider 
                value={[params.contrast]} 
                min={-100} 
                max={100} 
                step={1} 
                onValueChange={([v]) => updateParam('contrast', v)} 
                className="py-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span className="flex items-center gap-1"><Sparkles className="w-2 h-2" /> Smoothing</span>
                <span>{params.smoothing}</span>
              </div>
              <Slider 
                value={[params.smoothing]} 
                min={0} 
                max={5} 
                step={0.5} 
                onValueChange={([v]) => updateParam('smoothing', v)} 
                className="py-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Model Settings</Label>
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
              <Label className="text-[9px]">Base Thick (mm)</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.baseThickness} 
                onChange={(e) => updateParam('baseThickness', parseFloat(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Max Relief (mm)</Label>
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