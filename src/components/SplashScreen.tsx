"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative"
      >
        <div className="absolute -inset-12 brand-gradient rounded-full blur-[60px] opacity-20 animate-pulse"></div>
        <div className="relative w-28 h-28 brand-gradient rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(99,102,241,0.3)] transform hover:scale-105 transition-transform duration-500">
          <Cpu className="w-14 h-14" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="mt-10 text-center"
      >
        <h1 className="text-4xl font-black tracking-tighter text-white leading-none">
          SHADE<span className="brand-text-gradient">BUILDER</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.5em] mt-4">
          Precision Geometry Engine
        </p>
      </motion.div>

      <div className="absolute bottom-20 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full brand-gradient"
        />
      </div>
    </motion.div>
  );
};

export default SplashScreen;