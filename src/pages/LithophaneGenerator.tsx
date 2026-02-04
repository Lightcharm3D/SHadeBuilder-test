"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LithophaneViewport from '@/components/LithophaneViewport';
import LithophaneControls from '@/components/LithophaneControls';
import { LithophaneParams, generateLithophaneGeometry, getImageData } from '@/utils/lithophane-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Box, Zap, ArrowLeft, Info } from 'lucide-react';

const LithophaneGenerator = () => {
  const [params, setParams] = useState<LithophaneParams>({
    type: 'flat',
    width: 10,
    height: 10,
    minThickness: 0.8,
    maxThickness: 3.0,
    curveRadius: 15,
    resolution: 150,
    inverted: false,
  });

  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const data = await getImageData(file);
      setImageData(data);
      showSuccess("Image uploaded successfully!");
    } catch (err) {
      showError("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
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
      link.download = `lithophane-${Date.now()}.stl`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("STL file exported successfully!");
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
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">ShadeBuilder</h1>
            <p className="text-xs text-slate-500 font-medium">Lithophane Generator</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-xl shadow-2xl border border-slate-800">
          <LithophaneViewport geometry={geometry} />
          
          {!imageData && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 text-center max-w-md">
                <Info className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">No Image Uploaded</h3>
                <p className="text-slate-400 text-sm">Upload a photo in the control panel to generate your 3D lithophane preview.</p>
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
            isProcessing={isProcessing}
          />
        </div>
      </main>

      <footer className="py-4 border-t border-slate-200 bg-white text-center">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} LightCharm 3D. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LithophaneGenerator;