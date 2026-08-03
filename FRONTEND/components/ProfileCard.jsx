import React from 'react';
import { Link } from 'react-router-dom';

const getPoruthamScore = (star1, star2) => {
  if (!star1 || !star2) return 5;
  const combinedStr = star1 + star2;
  let sum = 0;
  for (let i = 0; i < combinedStr.length; i++) {
    sum += combinedStr.charCodeAt(i);
  }
  return 5 + (sum % 6);
};

export default function ProfileCard({ profile, compact = false, fullWidth = false, guestStar = null }) {
  const displayId = profile.id;
  const district = (profile.district || profile.location || 'Unknown').split(',')[0].trim();
  const isWorking = profile.employmentStatus 
    ? profile.employmentStatus === 'Working' 
    : (profile.profession && !['none', 'unemployed', 'not working', 'homemaker', 'home maker'].includes(profile.profession.toLowerCase()));
  const employmentStatusText = isWorking ? 'Working' : 'Not Working';
  
  const isOnline = profile.isOnline !== undefined 
    ? profile.isOnline 
    : (typeof profile.id === 'number' ? profile.id % 2 === 0 : profile.id.charCodeAt(profile.id.length - 1) % 2 === 0);

  return (
    <Link
      to={`/profile/${profile.id}`}
      className={`group shrink-0 block overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        fullWidth ? 'w-full' : (compact ? 'w-[145px] sm:w-[190px]' : 'w-[200px] sm:w-[240px]')
      }`}
    >
      {/* Profile Image */}
      <div className="relative w-full aspect-[5/4] overflow-hidden bg-slate-50">
        <img
          src={profile.image}
          alt={profile.name}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Single Centered Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-60"
        >
          <span className="text-white font-bold tracking-wider drop-shadow-md -rotate-[20deg] whitespace-nowrap" style={{ fontSize: compact ? '12px' : '16px' }}>
            Bharath Marriage
          </span>
        </div>


        {guestStar && profile.religion === 'Hindu' && profile.star && (
          <span className="absolute left-1.5 sm:left-2.5 top-1.5 sm:top-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 text-[7px] sm:text-[9px] font-bold tracking-wider text-white border border-white/20 shadow-md flex items-center gap-0.5 z-10">
            <span>🌟</span> <span>{getPoruthamScore(guestStar, profile.star)}/10</span> <span className="hidden min-[380px]:inline">Porutham</span>
          </span>
        )}

        {profile.premium && (
          <span className="absolute right-1.5 sm:right-2.5 top-1.5 sm:top-2.5 rounded-full bg-heritage-gold/90 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 text-[7px] sm:text-[9px] font-bold tracking-wider text-white border border-white/20">
            PREMIUM
          </span>
        )}
      </div>

      {/* Profile Details */}
      <div className={`${compact ? 'p-2' : 'p-3'} flex flex-col gap-1.5`}>
        {/* ID & Status */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-deep-maroon bg-deep-maroon/5 border border-deep-maroon/10 px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider">
            {displayId}
          </span>
          <span className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            isOnline 
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' 
              : 'text-slate-400 bg-slate-50 border border-slate-100'
          }`}>
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
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
        </h3>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1.5 border-t border-slate-100 text-[9px] sm:text-[10px] text-slate-500 text-left">
          {/* District */}
          <div className="flex items-center gap-1 truncate">
            <span className="material-symbols-outlined text-slate-400 text-xs shrink-0" style={{ fontSize: compact ? '11px' : '13px' }}>location_on</span>
            <span className="truncate">{district}</span>
          </div>

          {/* Age */}
          <div className="flex items-center gap-1 truncate">
            <span className="material-symbols-outlined text-slate-400 text-xs shrink-0" style={{ fontSize: compact ? '11px' : '13px' }}>cake</span>
            <span className="truncate">{profile.age} Yrs</span>
          </div>

          {/* Education */}
          <div className="flex items-center gap-1 truncate col-span-2">
            <span className="material-symbols-outlined text-slate-400 text-xs shrink-0" style={{ fontSize: compact ? '11px' : '13px' }}>school</span>
            <span className="truncate">{profile.education}</span>
          </div>

          {/* Employment Status */}
          <div className="flex items-center gap-1 truncate col-span-2">
            <span className="material-symbols-outlined text-slate-400 text-xs shrink-0" style={{ fontSize: compact ? '11px' : '13px' }}>work</span>
            <span className={`font-semibold ${isWorking ? 'text-emerald-700 font-bold' : 'text-slate-500'} truncate`}>
              {employmentStatusText}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}