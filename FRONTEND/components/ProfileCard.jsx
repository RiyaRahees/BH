import React, { useState } from 'react';
import { getResolvedImageUrl, handleImageError } from '../src/utils/imageUtils';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

const getPoruthamScore = (star1, star2) => {
  if (!star1 || !star2) return 5;
  const combinedStr = star1 + star2;
  let sum = 0;
  for (let i = 0; i < combinedStr.length; i++) {
    sum += combinedStr.charCodeAt(i);
  }
  return 5 + (sum % 6);
};

export default function ProfileCard({ profile, compact = false, fullWidth = false, guestStar = null, showPlanName = false }) {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const displayId = profile.id;
  const district = (profile.district || profile.location || 'Unknown').split(',')[0].trim().replace(/^\d+\s*-\s*/, '');
  
  // Working status strictly based on backend data:
  const rawStatus = (profile.employmentStatus || profile.employment_status || '').trim();
  const rawProf = (profile.profession || profile.job || profile.occupation || '').trim();
  
  let isWorking = true;
  let employmentStatusText = 'Working';

  if (rawStatus && !['none', 'null', 'undefined', ''].includes(rawStatus.toLowerCase())) {
    isWorking = !['not working', 'unemployed', 'homemaker', 'home maker', 'seeking job', 'student'].includes(rawStatus.toLowerCase());
    employmentStatusText = rawStatus;
  } else if (rawProf && !['none', 'null', 'undefined', 'n/a', 'nil', ''].includes(rawProf.toLowerCase())) {
    const profLower = rawProf.toLowerCase();
    if (['not working', 'unemployed'].includes(profLower)) {
      isWorking = false;
      employmentStatusText = 'Not Working';
    } else if (['homemaker', 'home maker'].includes(profLower)) {
      isWorking = false;
      employmentStatusText = 'Homemaker';
    } else if (['student'].includes(profLower)) {
      isWorking = false;
      employmentStatusText = 'Student';
    } else {
      isWorking = true;
      employmentStatusText = 'Working';
    }
  } else {
    isWorking = true;
    employmentStatusText = 'Working';
  }
  
  const isOnline = profile.isOnline !== undefined 
    ? Boolean(profile.isOnline)
    : Boolean(profile.is_online);

  const handleClick = (e) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      setShowLoginModal(true);
    }
  };

  const religionText = profile.religion ? profile.religion.split('-')[0].trim() : '';
  const rawCaste = profile.caste || profile.community || (profile.religion && profile.religion.includes('-') ? profile.religion.split('-')[1]?.trim() : '');
  const cleanCaste = (rawCaste && !['none', 'null', 'undefined', 'others', 'other', 'open to all'].includes(rawCaste.toLowerCase())) ? rawCaste.trim() : '';
  const religionCasteDisplay = [religionText, cleanCaste].filter(Boolean).join(', ');

  return (
    <>
      <Link
        to={`/profile/${profile.id}`}
        onClick={handleClick}
        className={`group shrink-0 block overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
          fullWidth ? 'w-full' : (compact ? 'w-[145px] sm:w-[190px]' : 'w-[200px] sm:w-[240px]')
        }`}
      >
        {/* Profile Image */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
          <img
            src={getResolvedImageUrl(profile.image, profile.gender)}
            alt={profile.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
            onError={(e) => handleImageError(e, profile.gender)}
          />

          {/* Bottom Watermark Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute bottom-0 inset-x-0 pb-1.5 pt-4 bg-gradient-to-t from-black/65 via-black/30 to-transparent flex items-center justify-center z-10"
          >
            <span className="text-white/90 font-bold tracking-widest drop-shadow-md uppercase text-[9px] sm:text-[10px] whitespace-nowrap">
              Bharath Marriage
            </span>
          </div>

          {guestStar && profile.religion === 'Hindu' && profile.star && (
            <span className="absolute left-1.5 sm:left-2.5 top-1.5 sm:top-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 text-[7px] sm:text-[9px] font-bold tracking-wider text-white border border-white/20 shadow-md flex items-center gap-0.5 z-10">
              <span>🌟</span> <span>{getPoruthamScore(guestStar, profile.star)}/10</span> <span className="hidden min-[380px]:inline">Porutham</span>
            </span>
          )}
        </div>

        {/* Profile Details */}
        <div className={`${compact ? 'p-2' : 'p-3'} flex flex-col gap-1.5`}>
          {/* ID & Status */}
          <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
            <span className="text-[8px] sm:text-[10px] font-bold text-deep-maroon bg-deep-maroon/5 border border-deep-maroon/10 px-1 sm:px-2 py-0.5 rounded-md tracking-wider truncate min-w-0">
              {displayId}
            </span>
            <span className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              isOnline 
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' 
                : 'text-slate-400 bg-slate-50 border border-slate-100'
            }`}>
              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <h3 className={`font-bold text-slate-800 truncate text-left flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            <span className="truncate">{profile.name}</span>
            {profile.verified && (
              <span
                className="material-symbols-outlined leading-none text-emerald-600 shrink-0"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: compact ? '11px' : '13px' }}
              >
                verified
              </span>
            )}
            {profile.age && (
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 shrink-0 ml-1">
                {profile.age} Yrs
              </span>
            )}
          </h3>

          {/* Info Details in 1 Line (Line 3): Religion/Caste • Place • Working Status */}
          <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 text-[9px] sm:text-[10px] text-slate-600 font-medium overflow-hidden text-left w-full">
            {/* Religion & Caste */}
            {religionCasteDisplay && (
              <span className="text-deep-maroon font-semibold truncate max-w-[65px] sm:max-w-[80px] shrink">
                {religionCasteDisplay}
              </span>
            )}
            
            {religionCasteDisplay && district && <span className="text-slate-300 font-bold shrink-0">•</span>}

            {/* Place */}
            {district && (
              <span className="truncate max-w-[65px] sm:max-w-[80px] shrink">
                {district}
              </span>
            )}

            {(religionCasteDisplay || district) && employmentStatusText && <span className="text-slate-300 font-bold shrink-0">•</span>}

            {/* Working Status */}
            {employmentStatusText && (
              <span className={`shrink-0 font-medium flex items-center gap-0.5 ml-auto sm:ml-0 ${isWorking ? 'text-emerald-600' : 'text-slate-500'}`}>
                <span 
                  className="material-symbols-outlined leading-none shrink-0" 
                  style={{ fontSize: '11px' }}
                >
                  {isWorking ? 'work_outline' : 'person_outline'}
                </span>
                <span className="whitespace-nowrap">{employmentStatusText}</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Guest Login Required Modal */}
      {showLoginModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity"
          onClick={(e) => { e.stopPropagation(); setShowLoginModal(false); }}
        >
          <div 
            className="relative w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl border border-white/40 text-center animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Shield / Lock Badge */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-deep-maroon via-primary to-amber-500 text-white flex items-center justify-center shadow-lg shadow-deep-maroon/20 mb-4">
              <span className="material-symbols-outlined text-2xl font-bold">lock</span>
            </div>

            <h3 className="font-display-lg text-lg sm:text-xl font-bold text-slate-800 mb-2">
              Login Required
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              To view complete profile details, photos, and contact info of <strong className="text-deep-maroon">{profile.name}</strong>, please log in or create a free account.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate(`/login?redirect=/profile/${profile.id}`)}
                className="w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Log In to Continue</span>
              </button>

              <button
                onClick={() => navigate('/register')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Create Free Account</span>
              </button>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              className="mt-4 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}