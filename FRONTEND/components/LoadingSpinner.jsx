import React from 'react';

export default function LoadingSpinner({ text = "Loading...", fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <div className="relative w-10 h-10">
        {/* Subtle track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100"></div>
        {/* Smooth spinning head in brand color */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-deep-maroon border-r-deep-maroon animate-spin"></div>
      </div>
      
      {text && (
        <p className="font-medium text-slate-500 text-sm tracking-wide">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center py-12">
      {content}
    </div>
  );
}
