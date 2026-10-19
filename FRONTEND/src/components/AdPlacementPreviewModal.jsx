import React, { useState, useEffect } from 'react';
import { getStoredAdTiers } from '../data/staticAds';

/**
 * AdPlacementPreviewModal
 *
 * Renders an ultra-realistic, custom JSX preview of how each ad format
 * looks on the actual Bharath Marriage website in its native context:
 * - LEADERBOARD: Rendered atop the Search Results page
 * - INFEED_CARD: Rendered inside the profile search grid between bride/groom profiles
 * - SIDEBAR: Rendered in the left column of the User Profile Detail view
 */
export default function AdPlacementPreviewModal({
  isOpen,
  tierKey = 'LEADERBOARD',
  onClose,
  onSelectTier,
}) {
  const [activeTier, setActiveTier] = useState(tierKey || 'LEADERBOARD');
  const [leaderboardDevice, setLeaderboardDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [infeedMode, setInfeedMode] = useState('sponsored'); // 'sponsored' | 'unbooked'

  // Sync active tier when modal opens with a specific tier
  useEffect(() => {
    if (tierKey) {
      setActiveTier(tierKey);
    }
  }, [tierKey]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tiers = getStoredAdTiers();
  const currentTier = tiers[activeTier] || tiers.LEADERBOARD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                {activeTier === 'LEADERBOARD'
                  ? 'leaderboard'
                  : activeTier === 'INFEED_CARD'
                  ? 'view_agenda'
                  : 'space_dashboard'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                  {currentTier.name}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-deep-maroon/10 text-deep-maroon shrink-0">
                  {currentTier.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{currentTier.dimensions}</span>
                <span>•</span>
                <span className="font-semibold text-deep-maroon">
                  ₹{Number(currentTier.monthlyPrice).toLocaleString()} / month
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Preview (Esc)"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ── Tier Navigation Tabs ── */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTier('LEADERBOARD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTier === 'LEADERBOARD'
                  ? 'bg-white text-deep-maroon shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">leaderboard</span>
              Leaderboard Banner
            </button>
            <button
              type="button"
              onClick={() => setActiveTier('INFEED_CARD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTier === 'INFEED_CARD'
                  ? 'bg-white text-deep-maroon shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_agenda</span>
              In-Feed Match Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTier('SIDEBAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTier === 'SIDEBAR'
                  ? 'bg-white text-deep-maroon shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">space_dashboard</span>
              Sidebar &amp; Detail Banner
            </button>
          </div>

          {/* Contextual Sub-Toggles */}
          {activeTier === 'LEADERBOARD' && (
            <div className="flex items-center gap-1 text-xs shrink-0 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLeaderboardDevice('desktop')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  leaderboardDevice === 'desktop'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-xs">computer</span>
                Desktop (728×90)
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardDevice('mobile')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  leaderboardDevice === 'mobile'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-xs">smartphone</span>
                Mobile (320×100)
              </button>
            </div>
          )}

          {activeTier === 'INFEED_CARD' && (
            <div className="flex items-center gap-1 text-xs shrink-0 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInfeedMode('sponsored')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  infeedMode === 'sponsored'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-xs">verified</span>
                Live Sponsored Ad
              </button>
              <button
                type="button"
                onClick={() => setInfeedMode('unbooked')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  infeedMode === 'unbooked'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-xs">storefront</span>
                Unbooked Slot
              </button>
            </div>
          )}
        </div>

        {/* ── Modal Body: Simulated Browser & Site Context ── */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/60 flex-1">
          {/* Simulated Browser Frame */}
          <div className="w-full bg-white rounded-2xl shadow-md border border-slate-300/80 overflow-hidden flex flex-col">
            
            {/* Simulated Chrome Browser Bar */}
            <div className="bg-slate-200/90 px-4 py-2.5 border-b border-slate-300/70 flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>

              {/* Address bar */}
              <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-slate-600 flex items-center justify-between border border-slate-300/70 shadow-2xs font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-emerald-600 text-xs font-bold">🔒</span>
                  <span className="text-slate-400">https://</span>
                  <span className="font-semibold text-slate-800">bharathmarriage.com</span>
                  <span className="text-slate-500">
                    {activeTier === 'LEADERBOARD'
                      ? '/search?district=Ernakulam'
                      : activeTier === 'INFEED_CARD'
                      ? '/search?category=Brides'
                      : '/profile/BKLH0200000025'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                  Live Placement Preview
                </span>
              </div>
            </div>

            {/* Simulated Website Mini-Header */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-deep-maroon">
                  Bharath <span className="text-heritage-gold">Marriage</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  Kerala
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="text-deep-maroon">Matches</span>
                <span>Search</span>
                <span>Packages</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Simulated Web Page Content with the Placed Ad */}
            <div className="p-4 sm:p-6 bg-[#fbfaf9] min-h-[360px]">

              {/* ─────────────────────────────────────────────────────────────
                  PREVIEW 1: TOP LEADERBOARD BANNER
                  ───────────────────────────────────────────────────────────── */}
              {activeTier === 'LEADERBOARD' && (
                <div className="space-y-4">
                  {/* Surrounding Context: Search header bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Verified Matches in Kerala
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Showing 1,420 profiles • Top Leaderboard Slot (Positions 1 &amp; Homepage)
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-deep-maroon/10 text-deep-maroon">
                      Leaderboard Ad Slot
                    </span>
                  </div>

                  {/* Desktop Leaderboard View */}
                  {leaderboardDevice === 'desktop' ? (
                    <div className="w-full rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left ring-2 ring-deep-maroon/15">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3.5 sm:p-4">
                        
                        {/* Ad Creative Image Thumbnail */}
                        <div className="relative w-full md:w-56 lg:w-64 h-32 md:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-2xs group">
                          <img
                            src="/ad_jewellery.jpg"
                            alt="Malabar Heritage Gold & Diamonds"
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                            AD
                          </span>
                        </div>

                        {/* Ad Copy */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              Sponsored
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-1.5 py-0.5 rounded">
                              OFFICIAL SPONSOR
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            Malabar Heritage Gold &amp; Diamonds
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                            Exclusive 2026 Kerala Bridal Jewellery Collection • Antique Temple &amp; Diamond Sets
                          </p>
                        </div>

                        {/* CTA & Phone */}
                        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                            <span>📞</span>
                            <span className="font-mono text-[11px] sm:text-xs">
                              +91 98470 11223
                            </span>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Explore Collection</span>
                            <span>↗</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Mobile Responsive Leaderboard (Stacked View) */
                    <div className="max-w-sm mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-3 space-y-2.5 ring-2 ring-deep-maroon/15">
                      <div className="relative w-full h-32 rounded-xl overflow-hidden">
                        <img
                          src="/ad_jewellery.jpg"
                          alt="Malabar Heritage"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                          AD
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          Sponsored
                        </span>
                        <span className="text-[9px] font-bold uppercase text-deep-maroon bg-deep-maroon/10 px-1.5 py-0.5 rounded">
                          Official Sponsor
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          Malabar Heritage Gold &amp; Diamonds
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                          Exclusive 2026 Kerala Bridal Jewellery Collection
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-mono text-slate-700 font-semibold">
                          📞 +91 98470 11223
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-deep-maroon text-white font-bold text-[11px] rounded-lg"
                        >
                          Explore ↗
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Simulated Profile Row Below the Leaderboard */}
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Search Results Continue Below:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-60 pointer-events-none">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 mb-1.5" />
                        <div className="h-3 w-16 bg-slate-300 rounded mx-auto mb-1" />
                        <div className="h-2 w-10 bg-slate-200 rounded mx-auto" />
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 mb-1.5" />
                        <div className="h-3 w-16 bg-slate-300 rounded mx-auto mb-1" />
                        <div className="h-2 w-10 bg-slate-200 rounded mx-auto" />
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center hidden sm:block">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 mb-1.5" />
                        <div className="h-3 w-16 bg-slate-300 rounded mx-auto mb-1" />
                        <div className="h-2 w-10 bg-slate-200 rounded mx-auto" />
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center hidden sm:block">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 mb-1.5" />
                        <div className="h-3 w-16 bg-slate-300 rounded mx-auto mb-1" />
                        <div className="h-2 w-10 bg-slate-200 rounded mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  PREVIEW 2: IN-FEED MATCH CARD (In profile grid)
                  ───────────────────────────────────────────────────────────── */}
              {activeTier === 'INFEED_CARD' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Search Results Grid (Matches)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        In-Feed Card blends naturally inside the 3-column or 4-column profile grid
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      Card Position #3 or #6
                    </span>
                  </div>

                  {/* 3-Card Grid: Profile Card, IN-FEED AD CARD, Profile Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                    
                    {/* Simulated Profile Card 1 */}
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
                      <div className="relative aspect-[4/4] bg-emerald-700 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100/90 flex items-center justify-center text-4xl">
                          👩
                        </div>
                        <span className="absolute bottom-2 text-white/90 text-[10px] font-bold tracking-wider uppercase">
                          BHARATH MARRIAGE
                        </span>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            BKLC0800000021
                          </span>
                          <span className="text-[9px] text-slate-400">Offline</span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs">
                          Rose Maria Joseph <span className="font-normal text-slate-500">28 Yrs</span>
                        </h5>
                        <p className="text-[10px] text-slate-600">Christian • Thrissur • Working</p>
                      </div>
                    </div>

                    {/* ── THE IN-FEED AD CARD ── */}
                    <div className="relative ring-4 ring-deep-maroon/20 rounded-2xl">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-deep-maroon text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs z-20">
                        Your Ad Position
                      </div>

                      {infeedMode === 'sponsored' ? (
                        /* Sponsored Active Vendor Card */
                        <div className="h-full flex flex-col justify-between rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden text-left group">
                          {/* Photo Section */}
                          <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
                            <img
                              src="/ad_saree.jpg"
                              alt="Varmala Bridal Coutures"
                              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 z-10">
                              <span className="bg-black/70 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded tracking-widest border border-white/20">
                                Sponsored Ad
                              </span>
                            </div>
                            {/* Bottom Watermark Overlay */}
                            <div
                              aria-hidden="true"
                              className="pointer-events-none select-none absolute bottom-0 inset-x-0 pb-1.5 pt-4 bg-gradient-to-t from-black/65 via-black/30 to-transparent flex items-center justify-center z-10"
                            >
                              <span className="text-white/90 font-bold tracking-widest drop-shadow-md uppercase text-[9px] sm:text-[10px] whitespace-nowrap">
                                Bharath Marriage
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-3 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
                              <span className="text-[8px] sm:text-[10px] font-bold text-deep-maroon bg-deep-maroon/5 border border-deep-maroon/10 px-1 sm:px-2 py-0.5 rounded-md tracking-wider truncate min-w-0">
                                SPONSORED AD
                              </span>
                              <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 text-emerald-700 bg-emerald-50 border border-emerald-100">
                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 bg-emerald-500"></span>
                                Verified
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-800 truncate text-left flex items-center justify-between gap-1 text-xs sm:text-sm">
                              <span className="truncate group-hover:text-deep-maroon transition-colors">Varmala Bridal Coutures</span>
                              <span className="text-[10px] sm:text-xs font-medium text-slate-500 shrink-0 ml-1 truncate max-w-[85px] sm:max-w-[105px]">
                                Handcrafted Silks
                              </span>
                            </h3>

                            <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 text-[9px] sm:text-[10px] text-slate-600 font-medium overflow-hidden text-left w-full">
                              <span className="text-deep-maroon font-semibold truncate max-w-[70px] sm:max-w-[85px] shrink">
                                Kochi
                              </span>
                              <span className="text-slate-300 font-bold shrink-0">•</span>
                              <span className="truncate max-w-[75px] sm:max-w-[95px] shrink text-slate-600">
                                Featured Partner
                              </span>
                              <span className="text-slate-300 font-bold shrink-0">•</span>
                              <span className="shrink-0 font-medium flex items-center gap-0.5 ml-auto text-emerald-600">
                                <span className="material-symbols-outlined leading-none shrink-0 text-[11px]">storefront</span>
                                <span className="whitespace-nowrap">View Catalogue</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Unbooked / Fallback Slot View */
                        <div className="h-full flex flex-col justify-between p-4 rounded-2xl border-2 border-dashed border-deep-maroon/40 bg-white text-center shadow-xs">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-2 py-0.5 rounded self-center">
                            Sponsored Slot
                          </div>
                          <div className="my-auto py-3">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-deep-maroon/8 text-deep-maroon flex items-center justify-center text-xl mb-2">
                              <span className="material-symbols-outlined text-2xl">storefront</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">
                              Promote Your Brand
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                              Reach thousands of prospective brides, grooms &amp; families actively exploring matches.
                            </p>
                            <span className="text-[10px] font-semibold text-deep-maroon bg-deep-maroon/5 px-2 py-0.5 rounded">
                              In-Feed Match Card
                            </span>
                          </div>
                          <button
                            type="button"
                            className="w-full py-2 bg-deep-maroon text-white font-bold text-xs rounded-xl shadow-xs"
                          >
                            Book Ad Slot (₹{Number(currentTier.monthlyPrice).toLocaleString()}/mo)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Simulated Profile Card 2 */}
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
                      <div className="relative aspect-[4/4] bg-emerald-800 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100/90 flex items-center justify-center text-4xl">
                          👩
                        </div>
                        <span className="absolute bottom-2 text-white/90 text-[10px] font-bold tracking-wider uppercase">
                          BHARATH MARRIAGE
                        </span>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            BKLH0100000019
                          </span>
                          <span className="text-[9px] text-slate-400">Offline</span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs">
                          Devika Pillai <span className="font-normal text-slate-500">26 Yrs</span>
                        </h5>
                        <p className="text-[10px] text-slate-600">Hindu • Thrissur • Working</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  PREVIEW 3: SIDEBAR & DETAIL BANNER (Profile Detail View)
                  ───────────────────────────────────────────────────────────── */}
              {activeTier === 'SIDEBAR' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Profile Detail Page (Sticky Left Sidebar Placement)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Viewed continuously while users read horoscope charts and family background
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                      Profile View Sidebar
                    </span>
                  </div>

                  {/* Split Layout: Left Sidebar with Ad + Right Main Profile Column */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    
                    {/* Left Sidebar Column (Width ~ 5 cols) */}
                    <div className="md:col-span-5 space-y-3">
                      <div className="p-2.5 rounded-xl bg-slate-200/60 text-slate-600 text-[11px] font-semibold text-center">
                        👤 Profile Photos &amp; Key Details
                      </div>

                      {/* ── THE SIDEBAR AD CARD ── */}
                      <div className="rounded-2xl border-2 border-deep-maroon/30 bg-white overflow-hidden text-left shadow-lg ring-4 ring-deep-maroon/10">
                        {/* Food / Sadya Creative Image */}
                        <div className="relative w-full aspect-video sm:aspect-[4/3] overflow-hidden bg-slate-100 border-b border-slate-100">
                          <img
                            src="/ad_catering.jpg"
                            alt="Royal Kerala Feast Caterers"
                            className="w-full h-full object-cover object-center"
                          />
                          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-widest">
                            SPONSORED
                          </span>
                        </div>

                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-2 py-0.5 rounded">
                              PREMIUM CATERER
                            </span>
                            <span className="text-[10px] font-bold text-amber-700">
                              Authentic Sadya &amp; Multi-Cuisine
                            </span>
                          </div>

                          <div>
                            <h5 className="text-sm font-bold text-slate-900 leading-tight">
                              Royal Kerala Feast Caterers
                            </h5>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Hygienic, traditional 28-course Kerala Sadya crafted by veteran master chefs with 25+ years experience.
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                              <span>📞</span>
                              <span className="font-mono">+91 98470 99001</span>
                            </div>

                            <button
                              type="button"
                              className="w-full py-2 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Get Free Menu Quote</span>
                              <span>↗</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Main Column: Horoscope & Profile Mockup */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Horoscope locked banner */}
                      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-3">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">
                          stars
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            Horoscope Details Locked
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                            Upgrade to the Silver plan or higher to view full horoscope details and planetary charts.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl pointer-events-none opacity-80"
                        >
                          Upgrade Plan
                        </button>
                      </div>

                      {/* Family details placeholder lines */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-full bg-slate-100 rounded" />
                        <div className="h-3 w-5/6 bg-slate-100 rounded" />
                        <div className="h-3 w-2/3 bg-slate-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Placement Specs & Details Footer Bar ── */}
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Target Aspect Ratio
              </span>
              <span className="font-bold text-slate-800">
                {currentTier.aspectRatio || 'Standard'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Banner Dimensions
              </span>
              <span className="font-bold text-slate-800">
                {currentTier.dimensions}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Best Suited For
              </span>
              <span className="font-bold text-slate-800 truncate block">
                {currentTier.idealFor?.split(',')[0]} &amp; more
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Current Pricing
              </span>
              <span className="font-extrabold text-deep-maroon">
                ₹{Number(currentTier.monthlyPrice).toLocaleString()} / month
              </span>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 hidden sm:block">
            High-intent matrimonial impressions across Kerala's 14 districts.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            {onSelectTier && (
              <button
                type="button"
                onClick={() => onSelectTier(activeTier)}
                className="px-5 py-2 rounded-xl bg-deep-maroon hover:bg-primary text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Select {currentTier.name} for Booking</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
