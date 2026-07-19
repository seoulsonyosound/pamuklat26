'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface CaptureProgressProps {
  currentStep: number; // 1 to 4
  totalSteps: number;
}

export const CaptureProgress: React.FC<CaptureProgressProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      {/* Label */}
      <span className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
        <Camera className="h-4 w-4 text-indigo-400" />
        Photo {currentStep} of {totalSteps}
      </span>

      {/* Progress Dots */}
      <div className="flex items-center gap-2.5">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'w-8 bg-indigo-500 shadow-md shadow-indigo-500/25'
                  : isActive
                  ? 'w-12 bg-indigo-400 animate-pulse shadow-md shadow-indigo-400/35'
                  : 'w-2.5 bg-slate-300 dark:bg-slate-800'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
export default CaptureProgress;
