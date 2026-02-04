"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LithophaneViewport from '@/components/LithophaneViewport';
import LithophaneControls from '@/components/LithophaneControls';
import ImageCropper from '@/components/ImageCropper';
import { LithophaneParams, generateLithophaneGeometry } from '@/utils/lithophane-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft, Sparkles, Image as ImageIcon, Cpu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LithophaneGenerator = () => {
  const [params, setParams] = useState<LithophaneParams>({
    type: 'flat',
    width: 10,
    height: 10,
    minThickness: 0.4,
    maxThickness: 2.8,
    baseThickness: 0.8,
    curveRadius: 15,
    resolution: 200,
    inverted: false,
    brightness: 0,
    contrast: 20,
    smoothing: 1.0,
    hasHole: false,
    holeSize: 3,
    hasBorder: false,
    borderThickness: 2,
    borderHeight: 2,
  });
  
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const processCroppedImage = useCallback(async (croppedImageUrl: string) => {
    setIsCropping(false);
    setImagePreview(croppedImageUrl);
    setIsProcessing(true);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height);
        setImageData(data);
        
        // Auto-adjust height based on crop aspect ratio
        const aspect = img.width / img.height;
        setParams(prev => ({ ...prev, height: parseFloat((prev.width / aspect).toFixed(2)) }));
        
        setIsProcessing(false);
        showSuccess("Image cropped and processed!");
      };
      img.src = croppedImageUrl;
    } catch (err) {
      console.error("Processing error:", err);
      showError("Failed to process cropped image");
      setIsProcessing(false);
    }
  }, []);

  const handleApplyPreset = useCallback((preset: string) => {
    switch (preset) {
      case 'portrait':
        setParams({ ...params, width: 8, height: 10, resolution: 250, contrast: 30, smoothing: 1.0 });
        break;
      case 'landscape':
        setParams({ ...params, width: 15, height: 10, resolution: 250, contrast: 25, smoothing: 1.5 });
        break;
      case 'keychain':
        setParams({ ...params, width: 4, height: 4, resolution: 150, baseThickness: 1.2, maxThickness: 2.0, smoothing: 0.5, hasHole: true });
        break;
      case 'high_detail':
        setParams({ ...params, resolution: 350, contrast: 40, smoothing: 0.5 });
        break;
    }
    showSuccess(`Applied ${preset} preset`);
  }, [params]);

  useEffect(() => {
    if (imageData) {
      try {
        const geom = generateLithophaneGeometry(imageData, params);
        setGeometry(geom);
      } catch (err) {
        console.error("Geometry generation error:", err);
        showError("Failed to generate 3D model");
      }
    }
  }, [imageData, params]);

  const handleExport = useCallback(() => {
    if (!geometry) {
      showError("Please upload and crop an image first");
      return;
    }
    try {
      const exporter = new STLExporter();
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      const result = exporter.parse(mesh);
      const blob = new Blob([result as any], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lithophane-${params.type}-${Date.now()}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("Custom shaped STL exported!");
    } catch (err) {
      console.error("Export error:", err);
      showError("Failed to export STL");
    }
  }, [geometry, params.type]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-2xl px-8 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </Link>
          <div className="relative group">
            <div className="absolute -inset-2 brand-gradient rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none flex items-center gap-2">
              LITHO<span className="brand-text-gradient">STUDIO</span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest ml-2 shadow-lg shadow-indigo-200">Pro</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1.5">Custom Shape Generator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-slate-100 h-11 w-11">
            <Sparkles className="w-5 h-5 text-slate-400" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-8 overflow-hidden max-w-[1920px] mx-auto w-full">
        <div className="flex-1 relative min-h-[500px] bg-slate-950 rounded-[3rem] shadow-2xl border border-slate-800 overflow-hidden studio-shadow group">
          <div className="absolute inset-0 scanline opacity-20 pointer-events-none z-10"></div>
          <LithophaneViewport geometry={geometry} />
          
          {!imageData && !imagePreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 text-center max-w-md shadow-2xl">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ImageIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-white font-black text-2xl mb-3 tracking-tight">Custom Shape Studio</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  Upload a photo and choose a shape. Perfect for keychains and personalized gifts.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full lg:w-[480px] shrink-0">
          <LithophaneControls 
            params={params} 
            setParams={setParams} 
            onImageUpload={handleImageUpload} 
            onExport={handleExport} 
            onApplyPreset={handleApplyPreset} 
            onTriggerCrop={() => setIsCropping(true)}
            isProcessing={isProcessing} 
            imagePreview={imagePreview}
            imageData={imageData}
          />
        </div>
      </main>

      {rawImage && (
        <ImageCropper
          image={rawImage}
          aspect={params.width / params.height}
          open={isCropping}
          onCropComplete={processCroppedImage}
          onCancel={() => setIsCropping(false)}
        />
      )}
      
      <footer className="py-8 px-12 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} LightCharm 3D Studio. Optimized for 3D Printing.
        </p>
      </footer>
    </div>
  );
};

export default LithophaneGenerator;