import React from 'react';
import { Link } from 'react-router-dom';
import { STATIC_ADS, AD_TIERS, getStoredAds, getStoredAdTiers } from '../src/data/staticAds';

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
                Placement: {getStoredAdTiers().LEADERBOARD.dimensions}
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
      if (!showFallback) return null;
      return (
        <Link
          to="/advertise"
          className="group shrink-0 flex flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-deep-maroon/25 bg-white p-3 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-deep-maroon/50 hover:shadow-md w-full"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[8px] sm:text-[10px] font-bold text-deep-maroon bg-deep-maroon/5 border border-deep-maroon/10 px-1 sm:px-2 py-0.5 rounded-md uppercase">
              Sponsored Slot
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">Available</span>
          </div>

          <div className="my-auto py-3">
            <div className="w-10 h-10 mx-auto rounded-xl bg-deep-maroon/8 text-deep-maroon flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">storefront</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5">
              Promote Your Brand
            </h4>
            <p className="text-[10px] text-slate-500">
              In-Feed Vendor Placement
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="w-full inline-block py-1.5 px-2 bg-deep-maroon group-hover:bg-primary text-white font-bold text-[10px] sm:text-xs rounded-lg transition-all shadow-xs">
              Book Ad Slot →
            </span>
          </div>
        </Link>
      );
    }

    return (
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group shrink-0 block overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full text-left"
      >
        {/* Ad Image / Creative Top Section */}
        {ad.creativeUrl ? (
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
            <img
              src={ad.creativeUrl}
              alt={ad.title || ad.businessName}
              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Top Sponsored Tag */}
            <span className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-white border border-white/20 shadow-xs z-10">
              Sponsored Ad
            </span>

            {/* Bottom Watermark Overlay (Identical to ProfileCard.jsx) */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute bottom-0 inset-x-0 pb-1.5 pt-4 bg-gradient-to-t from-black/65 via-black/30 to-transparent flex items-center justify-center z-10"
            >
              <span className="text-white/90 font-bold tracking-widest drop-shadow-md uppercase text-[9px] sm:text-[10px] whitespace-nowrap">
                Bharath Marriage
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-3 text-center">
            <span className="material-symbols-outlined text-[36px] text-deep-maroon/40 mb-1">campaign</span>
            <span className="text-xs font-bold text-slate-700">{ad.businessName}</span>
          </div>
        )}

        {/* Card Details (Strictly mirrors ProfileCard.jsx padding & height) */}
        <div className="p-3 flex flex-col gap-1.5">
          {/* Line 1: Sponsored Badge & Verified Status */}
          <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
            <span className="text-[8px] sm:text-[10px] font-bold text-deep-maroon bg-deep-maroon/5 border border-deep-maroon/10 px-1 sm:px-2 py-0.5 rounded-md tracking-wider truncate min-w-0">
              SPONSORED AD
            </span>
            <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 text-emerald-700 bg-emerald-50 border border-emerald-100">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 bg-emerald-500"></span>
              Verified
            </span>
          </div>

          {/* Line 2: Business Name & Title */}
          <h3 className="font-bold text-slate-800 truncate text-left flex items-center justify-between gap-1 text-xs sm:text-sm">
            <span className="truncate group-hover:text-deep-maroon transition-colors">{ad.businessName}</span>
            {ad.title && (
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 shrink-0 ml-1 truncate max-w-[85px] sm:max-w-[105px]">
                {ad.title.split('&')[0].trim()}
              </span>
            )}
          </h3>

          {/* Line 3: Info Line (Place • Partner • Action) with border-t */}
          <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 text-[9px] sm:text-[10px] text-slate-600 font-medium overflow-hidden text-left w-full">
            {ad.location && (
              <span className="text-deep-maroon font-semibold truncate max-w-[80px] sm:max-w-[100px] shrink">
                {ad.location.split('&')[0].trim().replace(/^MG Road,\s*/i, '')}
              </span>
            )}

            {ad.location && <span className="text-slate-300 font-bold shrink-0">•</span>}

            <span className="truncate max-w-[75px] sm:max-w-[95px] shrink text-slate-600">
              Featured Partner
            </span>

            <span className="text-slate-300 font-bold shrink-0">•</span>

            <span className="shrink-0 font-medium flex items-center gap-0.5 ml-auto text-emerald-600">
              <span 
                className="material-symbols-outlined leading-none shrink-0" 
                style={{ fontSize: '11px' }}
              >
                storefront
              </span>
              <span className="whitespace-nowrap">{ad.ctaText || 'View Catalogue'}</span>
            </span>
          </div>
        </div>
      </a>
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
