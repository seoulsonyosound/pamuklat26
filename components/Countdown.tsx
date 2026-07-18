'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownProps {
  count: number;
}

export const Countdown: React.FC<CountdownProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] z-30 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.6, opacity: 0, rotate: 10 }}
          transition={{ 
            type: 'spring', 
            damping: 12, 
            stiffness: 180,
            mass: 0.8
          }}
          className="text-[10rem] sm:text-[14rem] font-black text-white font-sans select-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
        >
          {count}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
export default Countdown;
