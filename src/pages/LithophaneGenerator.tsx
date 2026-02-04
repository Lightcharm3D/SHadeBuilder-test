"use client";

import React, { useState, useEffect } from 'react';
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
    resolution: 180,
    inverted: false,
    brightness: 0,
    contrast: 20,
    smoothing: 1.5,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create image preview
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
      showError("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPreset = (preset: string) => {
    switch (preset) {
      case 'portrait':
        setParams({ ...params, width: 8, height: 10, resolution: 200, contrast: 30, smoothing: 1.0 });
        break;
      case 'landscape':
        setParams({ ...params, width: 15, height: 10, resolution: 200, contrast: 25, smoothing: 1.5 });
        break;
      case 'keychain':
        setParams({ ...params, width: 4, height: 4, resolution: 100, baseThickness: 1.2, maxThickness: 2.0, smoothing: 0.5, hasHole: true });
        break;
      case 'high_detail':
        setParams({ ...params, resolution: 300, contrast: 40, smoothing: 0.5 });
        break;
    }
    showSuccess(`Applied ${preset} preset`);
  };

  useEffect(() => {
    if (imageData) {
      const geom = generateLithophaneGeometry(imageData, params);
      setGeometry(geom);
    }
  }, [imageData, params]);

  const handleExport = () => {
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
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("Custom shaped STL exported!");
    } catch (err) {
      showError("Failed to export STL");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">ShadeBuilder</h1>
            <p className="text-xs text-slate-500 font-medium">Custom Shape Studio</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-xl shadow-2xl border border-slate-800">
          <LithophaneViewport geometry={geometry} />
          
          {!imageData && !imagePreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 text-center max-w-md">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Custom Shape Studio</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Upload a photo and choose a shape. Perfect for keychains, ornaments, and personalized gifts.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-[380px] shrink-0">
          <LithophaneControls 
            params={params} 
            setParams={setParams} 
            onImageUpload={handleImageUpload} 
            onExport={handleExport} 
            onApplyPreset={handleApplyPreset} 
            isProcessing={isProcessing} 
            imagePreview={imagePreview}
          />
        </div>
      </main>
      
      <footer className="py-4 border-t border-slate-200 bg-white text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} LightCharm 3D. Optimized for FDM & Resin Printing.
        </p>
      </footer>
    </div>
  );
};

export default LithophaneGenerator;