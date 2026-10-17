import React, { useEffect, useState } from 'react';

export default function PhotoViewerModal({
  isOpen,
  onClose,
  photos = [],
  initialIndex = 0,
  userName = '',
  userCode = '',
  onApprove,
  onReject,
  actionLoading = null
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos]);

  if (!isOpen || !photos || photos.length === 0) return null;

  // Filter only items that have valid URLs or show all available
  const validPhotos = photos.filter(p => !!p.url);
  if (validPhotos.length === 0) return null;

  const currentPhoto = validPhotos[currentIndex] || validPhotos[0];
  const safeIndex = validPhotos.indexOf(currentPhoto);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validPhotos.length - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev < validPhotos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col w-full max-w-5xl max-h-[96vh] bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-deep-maroon to-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
              <span className="material-symbols-outlined text-lg">image</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {currentPhoto.label || `Photo ${safeIndex + 1}`}
                </h3>
                {userCode && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-[10px] font-mono font-medium">
                    {userCode}
                  </span>
                )}
                {userName && (
                  <span className="text-xs text-slate-300 font-medium truncate hidden sm:inline">
                    &bull; {userName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Photo {safeIndex + 1} of {validPhotos.length}</span>
                <span>&bull;</span>
                <span className={`inline-flex items-center gap-1 font-bold ${
                  currentPhoto.status === 'PENDING' 
                    ? 'text-amber-400' 
                    : currentPhoto.status === 'APPROVED' 
                    ? 'text-emerald-400' 
                    : 'text-rose-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {currentPhoto.status === 'PENDING' ? 'Under Review (Pending)' : currentPhoto.status || 'Approved'}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons on top-right */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom toggle */}
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center"
              title={isZoomed ? "Reset Zoom" : "Zoom In"}
            >
              <span className="material-symbols-outlined text-lg">
                {isZoomed ? 'zoom_out' : 'zoom_in'}
              </span>
            </button>

            {/* Open in new tab */}
            <a
              href={currentPhoto.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center"
              title="Open full resolution in new tab"
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer flex items-center justify-center ml-1"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Main Image Display Area with Navigation Arrows */}
        <div className="relative flex-1 flex items-center justify-center p-3 sm:p-6 min-h-[320px] max-h-[70vh] sm:max-h-[74vh] overflow-auto bg-black/40">
          {/* Previous Arrow */}
          {validPhotos.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/20 backdrop-blur-md shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
              title="Previous photo (Left arrow)"
            >
              <span className="material-symbols-outlined text-2xl -ml-0.5">chevron_left</span>
            </button>
          )}

          {/* Image */}
          <div className={`relative transition-all duration-300 flex items-center justify-center ${isZoomed ? 'w-full h-full min-w-[700px] overflow-auto cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in'}`}
               onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              key={currentPhoto.url}
              src={currentPhoto.url}
              alt={currentPhoto.label || 'User Photo'}
              className={`rounded-2xl shadow-2xl object-contain transition-all duration-200 border border-white/10 ${
                isZoomed 
                  ? 'w-auto max-w-none scale-125 my-auto' 
                  : 'max-h-[64vh] sm:max-h-[68vh] w-auto max-w-full'
              }`}
            />
          </div>

          {/* Next Arrow */}
          {validPhotos.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/20 backdrop-blur-md shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
              title="Next photo (Right arrow)"
            >
              <span className="material-symbols-outlined text-2xl -mr-0.5">chevron_right</span>
            </button>
          )}
        </div>

        {/* Thumbnail Selector Strip (if multiple photos) */}
        {validPhotos.length > 1 && (
          <div className="px-4 py-2.5 bg-slate-950/70 border-t border-white/5 flex items-center justify-center gap-2.5 overflow-x-auto shrink-0">
            {validPhotos.map((p, idx) => (
              <button
                key={p.slot || idx}
                type="button"
                onClick={() => {
                  setIsZoomed(false);
                  setCurrentIndex(idx);
                }}
                className={`relative w-11 h-14 sm:w-13 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  safeIndex === idx
                    ? 'border-rose-500 shadow-lg scale-105 ring-2 ring-rose-500/50'
                    : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                }`}
              >
                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                <span className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.5 leading-tight ${
                  p.status === 'PENDING' ? 'bg-amber-600/90' : p.status === 'APPROVED' ? 'bg-emerald-600/90' : 'bg-rose-600/90'
                }`}>
                  {p.label?.replace('Photo ', 'P') || `#${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Moderation Action Bar */}
        {(onApprove || onReject) && (
          <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="material-symbols-outlined text-sm text-slate-500 hidden sm:inline">keyboard</span>
              <span className="hidden sm:inline">Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">◀</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">▶</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">ESC</kbd> to close</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto flex-wrap">
              {currentPhoto.status === 'APPROVED' && (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Approved</span>
                </span>
              )}

              {currentPhoto.status === 'REJECTED' && (
                <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                  <span>Rejected</span>
                </span>
              )}

              {onApprove && currentPhoto.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => onApprove(currentPhoto.slot)}
                  disabled={actionLoading === `approve-${currentPhoto.slot}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>{currentPhoto.status === 'REJECTED' ? 'Re-Approve Photo' : 'Approve Photo'}</span>
                </button>
              )}

              {onReject && currentPhoto.status !== 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => onReject(currentPhoto.slot)}
                  disabled={actionLoading === `reject-${currentPhoto.slot}`}
                  className="px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white border border-rose-500/40 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  <span>{currentPhoto.status === 'APPROVED' ? 'Reject This Photo' : 'Reject Photo'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
