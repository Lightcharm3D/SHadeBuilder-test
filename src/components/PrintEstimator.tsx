"use client";

import React from 'react';
import { LampshadeParams } from '@/utils/geometry-generator';
import { Weight, Clock, Zap, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PrintEstimatorProps {
  params: LampshadeParams;
}

const PrintEstimator: React.FC<PrintEstimatorProps> = ({ params }) => {
  // Rough estimation logic for 3D printing
  const calculateStats = () => {
    const avgRadius = (params.topRadius + params.bottomRadius) / 2;
    const surfaceArea = 2 * Math.PI * avgRadius * params.height;
    const volume = surfaceArea * (params.thickness / 10); // cm3
    const weight = volume * 1.25; // PLA density ~1.25g/cm3
    
    // Rough time estimate: 1 hour per 20g at standard speeds
    const hours = weight / 15;
    const mins = (hours % 1) * 60;
    
    return {
      weight: weight.toFixed(1),
      time: `${Math.floor(hours)}h ${Math.floor(mins)}m`,
      cost: (weight * 0.02).toFixed(2) // $0.02 per gram
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-1">
        <Weight className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-[10px] font-bold text-slate-900">{stats.weight}g</span>
        <span className="text-[8px] text-slate-500 uppercase font-bold">Filament</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1 border-x border-indigo-100">
        <Clock className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-[10px] font-bold text-slate-900">{stats.time}</span>
        <span className="text-[8px] text-slate-500 uppercase font-bold">Est. Time</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1">
        <Zap className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-[10px] font-bold text-slate-900">${stats.cost}</span>
        <span className="text-[8px] text-slate-500 uppercase font-bold">Material</span>
      </div>
    </div>
  );
};

export default PrintEstimator;