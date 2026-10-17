import React from 'react';
import { Link } from 'react-router-dom';
import { STATIC_ADS, AD_TIERS, getStoredAds } from '../src/data/staticAds';

/**
 * AdBanner Component
 * 
 * Props:
 * - slot: string ('SEARCH_TOP', 'SEARCH_INFEED', 'HOME_MID', 'PROFILE_SIDEBAR', 'SEARCH_SIDEBAR')
 * - tier: string ('LEADERBOARD', 'INFEED_CARD', 'SIDEBAR')
 * - adIndex: number (optional index to pick specific ad if multiple exist)
 * - showFallback: boolean (shows "Advertise Here" placeholder if true or if no ad found)
 */
export default function AdBanner({ slot, tier = 'LEADERBOARD', adIndex = 0, showFallback = true }) {
  const allAds = getStoredAds() || STATIC_ADS;
  const matchedAds = allAds.filter(
    ad => ad.status === 'APPROVED' && (slot ? ad.slot === slot : ad.tier === tier)
  );
  const ad = matchedAds.length > 0 ? matchedAds[adIndex % matchedAds.length] : null;

  // ─────────────────────────────────────────────────────────────
  // 1. TIER 1: LEADERBOARD BANNER (With Visual Ad Creative Poster)
  // ─────────────────────────────────────────────────────────────
  if (tier === 'LEADERBOARD') {
    if (!ad && !showFallback) return null;

    if (!ad) {
      return (
        <div className="w-full my-4 p-4 rounded-2xl border-2 border-dashed border-deep-maroon/20 bg-white shadow-xs text-charcoal-text flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-deep-maroon/8 text-deep-maroon flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-2 py-0.5 rounded inline-block mb-0.5">
                Leaderboard Ad Slot
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Promote Your Brand Here – Reach 10,000+ Kerala Families
              </p>
              <p className="text-[11px] text-slate-500">
                Placement: {AD_TIERS.LEADERBOARD.dimensions}
              </p>
            </div>
          </div>
          <Link
            to="/advertise"
            className="shrink-0 px-4 py-2 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl transition-all shadow-xs"
          >
            Book This Slot →
          </Link>
        </div>
      );
    }

    return (
      <div className="w-full my-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3.5 sm:p-4">
          
          {/* Ad Creative Image Thumbnail / Banner */}
          {ad.creativeUrl && (
            <div className="relative w-full md:w-56 lg:w-64 h-32 md:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-2xs group">
              <img
                src={ad.creativeUrl}
                alt={ad.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                AD
              </span>
            </div>
          )}

          {/* Ad Copy */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                Sponsored
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-1.5 py-0.5 rounded">
                {ad.badge}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {ad.title}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
              {ad.tagline}
            </p>
          </div>

          {/* CTA & Phone */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            {ad.phone && (
              <a
                href={`tel:${ad.phone}`}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-deep-maroon font-semibold transition-colors"
              >
                <span>📞</span>
                <span className="font-mono text-[11px] sm:text-xs">{ad.phone}</span>
              </a>
            )}
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>{ad.ctaText || 'Learn More'}</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TIER 2: IN-FEED MATCH CARD (With Real Photo Creative)
  // ─────────────────────────────────────────────────────────────
  if (tier === 'INFEED_CARD') {
    if (!ad) {
      return (
        <div className="h-full min-h-[380px] flex flex-col justify-between p-5 rounded-2xl border-2 border-dashed border-deep-maroon/20 bg-white text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-2 py-0.5 rounded self-center">
            Sponsored Slot
          </div>
          <div className="my-auto py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-deep-maroon/8 text-deep-maroon flex items-center justify-center text-2xl mb-3">
              <span className="material-symbols-outlined text-[28px]">storefront</span>
            </div>
            <h4 className="text-base font-bold text-charcoal-text mb-1">
              Promote Your Brand
            </h4>
            <p className="text-xs text-soft-gray leading-relaxed mb-3">
              Reach thousands of prospective brides, grooms & families actively exploring matches.
            </p>
            <span className="text-[11px] font-semibold text-deep-maroon bg-deep-maroon/5 px-2.5 py-1 rounded-md">
              In-Feed Match Card
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/advertise"
              className="w-full inline-block py-2.5 px-3 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              Book Ad Slot (₹3,499/mo)
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md hover:border-deep-maroon/40 transition-all overflow-hidden text-left group">
        
        {/* Ad Image / Creative Top Section */}
        {ad.creativeUrl ? (
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
            <img
              src={ad.creativeUrl}
              alt={ad.title}
              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Top Sponsored Tag */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
              <span className="bg-black/70 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded tracking-widest border border-white/20">
                Sponsored Ad
              </span>
            </div>
            {/* Bottom Overlay with Category */}
            <div className="pointer-events-none absolute bottom-0 inset-x-0 pb-1.5 pt-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-between px-3 z-10">
              <span className="text-heritage-gold font-bold uppercase text-[9px] tracking-wider">
                {ad.category || 'Featured Vendor'}
              </span>
              <span className="text-white text-[10px] font-bold">
                {ad.rating || 'Verified'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
              Sponsored
            </span>
            <span className="text-[9px] font-bold uppercase text-deep-maroon tracking-wider">
              {ad.badge}
            </span>
          </div>
        )}

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-deep-maroon transition-colors line-clamp-1 mb-0.5">
              {ad.businessName}
            </h4>
            <h5 className="text-[11px] font-semibold text-slate-700 line-clamp-1 mb-1">
              {ad.title}
            </h5>
            <p className="text-[11px] text-soft-gray leading-relaxed line-clamp-2 mb-2">
              {ad.tagline}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-600">
            {ad.location && (
              <div className="flex items-center gap-1.5 truncate">
                <span>📍</span>
                <span className="truncate">{ad.location}</span>
              </div>
            )}
            {ad.phone && (
              <div className="flex items-center gap-1.5">
                <span>📞</span>
                <a href={`tel:${ad.phone}`} className="hover:text-deep-maroon font-semibold">
                  {ad.phone}
                </a>
              </div>
            )}

            <div className="pt-1.5 flex items-center gap-2">
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 text-center bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                {ad.ctaText || 'Contact Vendor'} ↗
              </a>
              <Link
                to="/advertise"
                className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                title="Want to advertise here?"
              >
                Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. TIER 3: SIDEBAR AD (With Food/Sadya Image Creative)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full my-4 rounded-2xl border border-slate-200 bg-white overflow-hidden text-left shadow-xs hover:shadow-md transition-shadow">
      {/* Sidebar Ad Creative Image */}
      {ad?.creativeUrl && (
        <div className="relative w-full aspect-video sm:aspect-[4/3] overflow-hidden bg-slate-100 border-b border-slate-100">
          <img
            src={ad.creativeUrl}
            alt={ad.title}
            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
          />
          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-widest">
            SPONSORED
          </span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-1.5 py-0.5 rounded">
            {ad?.badge || 'Official Partner'}
          </span>
          <span className="text-[10px] font-bold text-amber-700">
            {ad?.category || 'Catering'}
          </span>
        </div>

        <h5 className="text-sm font-bold text-slate-900 mb-1">
          {ad?.businessName || 'Promote Your Brand Here'}
        </h5>
        <p className="text-xs text-soft-gray mb-3 leading-relaxed line-clamp-2">
          {ad?.tagline || 'Reach thousands of prospective brides, grooms & families across Kerala.'}
        </p>

        {ad?.phone && (
          <div className="text-[11px] text-slate-600 mb-3 font-semibold flex items-center gap-1.5">
            <span>📞</span>
            <a href={`tel:${ad.phone}`} className="hover:text-deep-maroon font-mono">
              {ad.phone}
            </a>
          </div>
        )}

        <div className="flex items-center gap-2">
          {ad?.targetUrl ? (
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 text-center bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              {ad.ctaText || 'Get Quote'} ↗
            </a>
          ) : (
            <Link
              to="/advertise"
              className="flex-1 py-2 text-center bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              Book Slot
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
