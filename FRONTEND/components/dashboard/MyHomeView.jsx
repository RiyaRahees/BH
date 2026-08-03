import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../ProfileCard';
import { useAuth } from '../../src/context/AuthContext';

import { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
export default function MyHomeView() {
  const { user } = useAuth();
  const scrollContainerRef = useRef(null);
  const [recommendedProfiles, setRecommendedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axiosInstance.get('/users/recommendations');
        if (response.data && response.data.profiles) {
          setRecommendedProfiles(response.data.profiles);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      {/* Header Greeting Banner Card with Indian Heritage Look */}
      <section className="relative rounded-none md:rounded-xl overflow-hidden bg-gradient-to-r from-deep-maroon to-primary p-3.5 md:p-5 text-white shadow-none md:shadow-sm shrink-0">
        <div className="absolute inset-0 opacity-10 hero-pattern pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
          <div>
            <span className="font-label-caps text-[8px] sm:text-[9px] text-heritage-gold tracking-widest block mb-0.5 font-bold uppercase">
              Namaste, Welcome Back
            </span>
            <h1 className="font-headline-lg text-base sm:text-xl text-white font-bold">
              {user?.full_name }
            </h1>
          </div>
          <p className="font-body-lg text-[10px] sm:text-xs text-white/80 max-w-sm sm:text-right">
            Let's continue your search for the perfect life partner.
          </p>
        </div>
      </section>

      {/* Daily Recommendations Section with Clock Timer */}
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-5 shadow-none md:shadow-sm">
        <div className="mb-4 md:mb-5 flex items-center justify-between border-b border-slate-100 pb-3 md:pb-4">
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
            Daily Recommendations
          </h2>
        </div>

        {/* Horizontal Scroll wrapper with overlay buttons */}
        <div className="relative group/scroll">
          {/* Left Arrow Button */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-150 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer duration-200"
            title="Scroll Left"
          >
            <span className="material-symbols-outlined font-bold text-lg md:text-xl">chevron_left</span>
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-150 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer duration-200"
            title="Scroll Right"
          >
            <span className="material-symbols-outlined font-bold text-lg md:text-xl">chevron_right</span>
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden snap-x snap-mandatory scroll-smooth"
          >
            {loading ? (
              <div className="text-sm text-slate-500 py-4 px-2">Loading recommendations...</div>
            ) : recommendedProfiles.length > 0 ? (
              recommendedProfiles.map((profile) => (
                <div className="snap-start" key={profile.id}>
                  <ProfileCard profile={profile} compact />
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4 px-2">No recommendations available at the moment.</div>
            )}
          </div>
        </div>
      </section>

      {/* Top Matches Section */}
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-5 shadow-none md:shadow-sm">
        <div className="mb-4 md:mb-5 flex items-center justify-between border-b border-slate-100 pb-3 md:pb-4">
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-heritage-gold"></span>
            Top Matches
          </h2>
          <Link to="/search" className="text-[10px] sm:text-xs font-bold text-deep-maroon hover:text-primary transition-colors flex items-center gap-0.5">
            View All
            <span className="material-symbols-outlined text-[12px] sm:text-[14px]">chevron_right</span>
          </Link>
        </div>

        {/* Grid layout going down */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-2">
          {loading ? (
            <div className="col-span-full text-sm text-slate-500 py-4 px-2">Loading top matches...</div>
          ) : recommendedProfiles.length > 0 ? (
            recommendedProfiles.slice(0, 5).map((profile, index) => (
              <ProfileCard key={`${profile.id}-${index}`} profile={profile} fullWidth />
            ))
          ) : (
            <div className="col-span-full text-sm text-slate-500 py-4 px-2">No top matches available.</div>
          )}
        </div>
      </section>

      {/* Trust and Verification Banner */}
      <section className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 p-4 md:p-5 shadow-none md:shadow-sm flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div className="flex gap-4 items-start text-left">
          <span className="material-symbols-outlined text-[30px] md:text-[36px] text-emerald-600 shrink-0">verified_user</span>
          <div>
            <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-charcoal-text">Shielded &amp; Secure Verification</h4>
            <p className="text-[10px] md:text-[11px] text-soft-gray leading-relaxed mt-0.5">
              Keep your matrimonial search completely safe. Profiles verified with government IDs get a <span className="font-semibold text-emerald-600">Verified Badge</span>, increasing connection rates by up to 2.5x.
            </p>
          </div>
        </div>
        <button className="whitespace-nowrap border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-[10px] md:text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer self-start md:self-auto">
          Verify My Profile
        </button>
      </section>
    </div>
  );
}
