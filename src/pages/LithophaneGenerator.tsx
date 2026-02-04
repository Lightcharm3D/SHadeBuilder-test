"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LithophaneViewport from '@/components/LithophaneViewport';
import LithophaneControls from '@/components/LithophaneControls';
import { LithophaneParams, generateLithophaneGeometry, getImageData } from '@/utils/lithophane-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft, Sparkles, Image as ImageIcon } from 'lucide-react';

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
  
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsProcessing(true);
      const data = await getImageData(file);
      setImageData(data);
      showSuccess("Image processed for 3D relief!");
    } catch (err) {
      console.error("Image processing error:", err);
      showError("Failed to process image");
    } finally {
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
      showError("Please upload an image first");
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
      <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-4 h-4" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">ShadeBuilder</h1>
            <p className="text-[10px] text-slate-500 font-medium">Custom Shape Studio</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-2 gap-4 overflow-hidden">
        <div className="flex-1 relative min-h-[300px] bg-slate-950 rounded-xl shadow-lg border border-slate-800">
          <LithophaneViewport geometry={geometry} />
          
          {!imageData && !imagePreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 text-center max-w-xs">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Custom Shape Studio</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Upload a photo and choose a shape. Perfect for keychains and personalized gifts.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full">
          <LithophaneControls 
            params={params} 
            setParams={setParams} 
            onImageUpload={handleImageUpload} 
            onExport={handleExport} 
            onApplyPreset={handleApplyPreset} 
            isProcessing={isProcessing} 
            imagePreview={imagePreview}
            imageData={imageData}
          />
        </div>
      </main>
      
      <footer className="py-3 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] text-slate-400">
          © {new Date().getFullYear()} LightCharm 3D. Optimized for 3D Printing.
        </p>
      </footer>
    </div>
  );
};

export default LithophaneGenerator;