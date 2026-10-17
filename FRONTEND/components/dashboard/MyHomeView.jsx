import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileCard from '../ProfileCard';
import { useAuth } from '../../src/context/AuthContext';
import axiosInstance from '../../src/utils/axiosInstance';
import LoadingSpinner from '../LoadingSpinner';

export default function MyHomeView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [dailyRecommendations, setDailyRecommendations] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);

  const [activeSlide, setActiveSlide] = useState(0);

  const adSlides = [
    {
      id: 1,
      badge: "🎉 365 DAYS FREE MEMBERSHIP",
      title: "Enjoy 1 Full Year Free Access!",
      subtitle: "Unlimited access to verified profiles, direct messaging & contact details for 365 days.",
      ctaText: "Find Partner Now",
      ctaLink: "/search",
      bgGradient: "from-deep-maroon via-primary to-rose-950",
      icon: "card_giftcard"
    },
    {
      id: 2,
      badge: "🔮 ASTRO MATCHMAKING",
      title: "Calculate 10-Porutham Star Match",
      subtitle: "Discover perfect horoscope compatibility ratings tailored for Kerala matrimony.",
      ctaText: "Check Porutham",
      ctaLink: "/porutham",
      bgGradient: "from-purple-950 via-deep-maroon to-amber-950",
      icon: "auto_awesome"
    },
    {
      id: 3,
      badge: "🛡️ 100% VERIFIED PROFILES",
      title: "Trusted Kerala Matrimony Platform",
      subtitle: `Welcome back, ${user?.full_name || 'Member'}! Connect with genuine Kerala families across all districts.`,
      ctaText: "Explore Matches",
      ctaLink: "/search",
      bgGradient: "from-primary via-deep-maroon to-slate-950",
      icon: "verified_user"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % adSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [adSlides.length]);

  useEffect(() => {
    const fetchDailyRecommendations = async () => {
      try {
        const response = await axiosInstance.get('/users/daily-recommendations');
        if (response.data && response.data.profiles) {
          const activeOnly = response.data.profiles.filter(p => {
            const st = String(p.status || '').toUpperCase();
            return !['DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE'].includes(st);
          });
          setDailyRecommendations(activeOnly);
        }
      } catch (error) {
        console.error('Error fetching daily recommendations:', error);
      } finally {
        setLoadingDaily(false);
      }
    };

    const fetchTopMatches = async () => {
      try {
        const response = await axiosInstance.get('/users/top-matches');
        if (response.data && response.data.profiles) {
          const activeOnly = response.data.profiles.filter(p => {
            const st = String(p.status || '').toUpperCase();
            return !['DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE'].includes(st);
          });
          setTopMatches(activeOnly);
        }
      } catch (error) {
        console.error('Error fetching top matches:', error);
      } finally {
        setLoadingTop(false);
      }
    };

    fetchDailyRecommendations();
    fetchTopMatches();
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
      {/* Compact High-End Advertisement Banner Carousel */}
      <section className="relative rounded-2xl overflow-hidden shadow-sm shrink-0 border border-heritage-gold/25 group min-h-[96px] sm:min-h-[88px] flex flex-col justify-center">
        {/* Animated Background Gradients & Glow Circles */}
        <div className={`absolute inset-0 bg-gradient-to-r ${adSlides[activeSlide].bgGradient} transition-all duration-700 ease-in-out`}></div>
        <div className="absolute inset-0 opacity-15 hero-pattern pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Banner Main Content - Ultra Compact Height */}
        <div className="relative z-10 py-2.5 px-3 sm:py-3 sm:px-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 h-full">
          <div className="flex items-center gap-2.5 sm:gap-3 max-w-xl min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-heritage-gold text-base sm:text-lg">
                {adSlides[activeSlide].icon}
              </span>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-label-caps text-[7.5px] sm:text-[8.5px] text-heritage-gold tracking-widest block font-bold uppercase mb-0.5 truncate max-w-[220px] sm:max-w-none">
                {adSlides[activeSlide].badge}
              </span>
              <h2 className="font-headline-lg text-[11px] sm:text-sm text-white font-bold leading-tight line-clamp-1 truncate">
                {adSlides[activeSlide].title}
              </h2>
              {/* Hide second line subtitle on mobile to prevent height jump or cut-off */}
              <p className="hidden sm:block font-body-lg text-[10.5px] text-white/85 leading-tight line-clamp-1 truncate mt-0.5">
                {adSlides[activeSlide].subtitle}
              </p>
            </div>
          </div>

          {/* Action CTA Button & Navigation Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-0.5 sm:pt-0">
            <Link
              to={adSlides[activeSlide].ctaLink}
              className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-heritage-gold via-amber-400 to-amber-500 hover:from-amber-400 hover:to-heritage-gold text-deep-maroon font-bold text-[9.5px] sm:text-xs py-1 px-3 sm:py-1.5 sm:px-4 rounded-full shadow hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider group/btn shrink-0"
            >
              <span>{adSlides[activeSlide].ctaText}</span>
              <span className="material-symbols-outlined text-[10px] sm:text-xs font-bold group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
            </Link>

            {/* Pagination & Next/Prev Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveSlide((prev) => (prev - 1 + adSlides.length) % adSlides.length)}
                className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                title="Previous Slide"
              >
                ‹
              </button>

              <div className="flex items-center gap-1">
                {adSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === index ? 'w-3.5 bg-heritage-gold' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveSlide((prev) => (prev + 1) % adSlides.length)}
                className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                title="Next Slide"
              >
                ›
              </button>
            </div>
          </div>
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
          {(!loadingDaily && dailyRecommendations.length > 0) && (
            <>
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
            </>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden snap-x snap-mandatory scroll-smooth"
          >
            {loadingDaily ? (
              <LoadingSpinner text="Loading recommendations..." />
            ) : dailyRecommendations.length > 0 ? (
              dailyRecommendations.map((profile) => (
                <div className="snap-start" key={profile.id}>
                  <ProfileCard profile={profile} compact />
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4 px-2 w-full text-center sm:text-left">No recommendations available at the moment.</div>
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
          {loadingTop ? (
            <div className="col-span-full"><LoadingSpinner text="Loading top matches..." /></div>
          ) : topMatches.length > 0 ? (
            topMatches.slice(0, 6).map((profile, index) => (
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
