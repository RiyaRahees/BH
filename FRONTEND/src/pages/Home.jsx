import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../../components/ProfileCard';
import FAQSection from '../../components/Faq';
import { Helmet } from 'react-helmet-async';
import HeroRegistrationForm from '../../components/HeroRegistrationForm';
import HeroSearch from '../../components/HeroSearch';
import axiosInstance from '../../src/utils/axiosInstance';
import AdBanner from '../../components/AdBanner';

export default function Home() {
  const scrollContainerRef = useRef(null);
  const [storiesVisible, setStoriesVisible] = useState(false);
  const storiesRef = useRef(null);
  const [approachVisible, setApproachVisible] = useState(false);
  const approachRef = useRef(null);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef(null);
  const [profilesVisible, setProfilesVisible] = useState(false);
  const profilesRef = useRef(null);
  const [registerVisible, setRegisterVisible] = useState(false);
  const registerRef = useRef(null);
  const [highlightedProfiles, setHighlightedProfiles] = useState([]);

  useEffect(() => {
    const fetchHighlighted = async () => {
      try {
        const response = await axiosInstance.get('/users/highlighted-profiles');
        if (response.data && response.data.profiles) {
          setHighlightedProfiles(response.data.profiles);
        }
      } catch (error) {
        console.error("Error fetching highlighted profiles:", error);
      }
    };
    fetchHighlighted();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStoriesVisible(true);
        }
      },
      { threshold: 0.05 }
    );
    if (storiesRef.current) {
      observer.observe(storiesRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setApproachVisible(true);
        }
      },
      { threshold: 0.05 }
    );
    if (approachRef.current) {
      observer.observe(approachRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHowItWorksVisible(true);
        }
      },
      { threshold: 0.05 }
    );
    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProfilesVisible(true);
        }
      },
      { threshold: 0.05 }
    );
    if (profilesRef.current) {
      observer.observe(profilesRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRegisterVisible(true);
        }
      },
      { threshold: 0.05 }
    );
    if (registerRef.current) {
      observer.observe(registerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const heroVideos = [
    "/hero-video.mp4",
    "/hero-video1.mp4",
    "/hero-video2.mp4",
    "/hero-video3.mp4",
    "/hero-video4.mp4",
  ];
  const [videoIndex] = useState(() => Math.floor(Math.random() * heroVideos.length));
  const [currentVideo, setCurrentVideo] = useState(heroVideos[videoIndex]);
  const [failedVideos, setFailedVideos] = useState([]);
  const handleVideoError = () => {
    // Mark this one as broken, try the next available video
    const remaining = heroVideos.filter(
      (v) => v !== currentVideo && !failedVideos.includes(v)
    );
    if (remaining.length > 0) {
      setFailedVideos((prev) => [...prev, currentVideo]);
      setCurrentVideo(remaining[Math.floor(Math.random() * remaining.length)]);
    }
  };

  return (

    <div className="w-full flex flex-col">
      <Helmet>
        <title>Kerala Matrimony & Malayali Matrimonial Service | Bharath Marriage</title>
        <meta
          name="description"
          content="Find verified bride and groom profiles on Bharath Marriage, a trusted Kerala matrimony platform for genuine Malayali families."
        />
      </Helmet>
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-10 sm:pb-16 overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Hero Background Video */}
        <div className="absolute inset-0 z-0 bg-charcoal-text">
          {/* Dark Overlay for Text/Nav Contrast */}
          <div className="absolute inset-0 dark-glass-scrim z-10"></div>
          <video
            key={currentVideo}
            className="w-full h-full object-cover object-top"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={handleVideoError}
          >
            <source src={currentVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full flex flex-col items-center justify-center text-center py-4 sm:py-12 md:py-16">
          <div className="animate-elegant-fade-up w-full max-w-5xl mx-auto flex flex-col items-center">
            <h1 className="font-display-lg text-2xl sm:text-4xl md:text-5xl text-white mb-1.5 sm:mb-3 leading-tight tracking-wide text-center text-shadow-premium">
              Two Souls, <br className="sm:hidden" />
              <span className="text-heritage-gold">One Beautiful Journey</span>
            </h1>
            <p className="text-white/90 font-body-lg text-[10px] sm:text-sm md:text-base mb-3 sm:mb-8 text-center max-w-xl mx-auto font-medium text-shadow-premium">
              Discover verified profiles and genuine malayali families
            </p>

            {/* Premium Glassmorphism Search Bar Component */}
            <HeroSearch />

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 sm:mt-6 animate-slide-up-fade" style={{ animationDelay: '0.15s' }}>
              <span className="flex items-center gap-1 text-white/90 text-[10px] sm:text-xs font-semibold select-none drop-shadow-sm">
                <span className="material-symbols-outlined text-heritage-gold text-[13px] sm:text-[15px]">verified_user</span>
                5 Lakh+ Profiles
              </span>
              <span className="h-2.5 w-[1px] bg-white/20 hidden sm:inline"></span>
              <span className="flex items-center gap-1 text-white/90 text-[10px] sm:text-xs font-semibold select-none drop-shadow-sm">
                <span className="material-symbols-outlined text-heritage-gold text-[13px] sm:text-[15px]">gpp_good</span>
                100% Verified
              </span>
              <span className="h-2.5 w-[1px] bg-white/20 hidden sm:inline"></span>
              <span className="flex items-center gap-1 text-white/90 text-[10px] sm:text-xs font-semibold select-none drop-shadow-sm">
                <span className="material-symbols-outlined text-heritage-gold text-[13px] sm:text-[15px]">favorite</span>
                Free Registration
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* Highlighted Profiles Section */}
      <section ref={profilesRef} className="bg-white py-16 relative z-10 border-t border-slate-100">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">

          <div className={`mb-12 transition-all duration-300 ${profilesVisible ? 'animate-elegant-fade-up' : 'opacity-0'
            }`}>
            <h2 className="font-display-lg text-3xl md:text-4xl text-charcoal-text mb-4 uppercase tracking-wide">
              Highlighted <span className="text-deep-maroon">Profiles</span>
            </h2>
            <p className="font-body-lg text-sm text-soft-gray max-w-xl mx-auto">
              Explore our most active, verified premium members who are looking for serious commitments.
            </p>
          </div>

          <div className="relative group/scroll w-full">
            {/* Left navigation arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-deep-maroon text-charcoal-text hover:text-white rounded-full p-2.5 shadow-lg border border-slate-200/80 transition-all duration-300 active:scale-90 cursor-pointer flex items-center justify-center opacity-90 hover:opacity-100"
              aria-label="Scroll Left"
            >
              <span className="material-symbols-outlined text-[20px] font-semibold">chevron_left</span>
            </button>

            <div
              ref={scrollContainerRef}
              className={`flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory text-left scroll-smooth w-full scrollbar-hidden transition-all duration-300 ${profilesVisible ? 'animate-slide-from-bottom' : 'opacity-0'
                }`}
            >
              {highlightedProfiles.map((profile, index) => (
                <div
                  className="w-[220px] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] shrink-0 snap-start"
                  key={profile.id}
                  style={profilesVisible ? { animationDelay: `${index * 80}ms` } : {}}
                >
                  <ProfileCard profile={profile} />
                </div>
              ))}
            </div>

            {/* Right navigation arrow */}
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-deep-maroon text-charcoal-text hover:text-white rounded-full p-2.5 shadow-lg border border-slate-200/80 transition-all duration-300 active:scale-90 cursor-pointer flex items-center justify-center opacity-90 hover:opacity-100"
              aria-label="Scroll Right"
            >
              <span className="material-symbols-outlined text-[20px] font-semibold">chevron_right</span>
            </button>
          </div>

          {/* Place 1: Mid-Home Leaderboard Ad */}
          <div className="pt-8">
            <AdBanner slot="HOME_MID" tier="LEADERBOARD" />
          </div>

        </div>
      </section>

      {/* Success Stories Section */}
      <section className="bg-gradient-to-br from-white via-rose-50/25 to-amber-50/15 py-20 relative z-10 border-t border-slate-100/60">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center">

            {/* Left Column: Storytelling Copy */}
            <div className="fade-in text-left">
              <span className="font-label-caps text-xs text-heritage-gold tracking-widest block mb-2 font-semibold">
                SUCCESS STORIES
              </span>
              <h2 className="font-display-lg text-3xl md:text-4xl text-charcoal-text mb-6 uppercase tracking-wide leading-tight">
                Everlasting Tales <br />
                <span className="text-deep-maroon">Of Trust &amp; Love</span>
              </h2>
              <p className="font-body-lg text-sm text-soft-gray mb-6 leading-relaxed">
                Every couple's journey is a beautiful mosaic of emotions, quiet promises, and unforgettable moments. At <span className="text-deep-maroon font-semibold">Bharath Marriage</span>, we specialize in helping families discover compatibility and deep connections. Whether it's a soft smile exchanged under twilight skies or the joyful tears shared with loved ones, we support you in finding the one who truly completes your story. Our trusted matchmaking approach blends elegance and authenticity, turning your search for a life partner into a safe, heritage-rich experience that lasts a lifetime.
              </p>
              <div className="border-l-2 border-heritage-gold pl-4 italic text-xs text-soft-gray/80 mt-6 max-w-md">
                "The most beautiful relationship is the one that was destined, built on compatibility and trust."
                <span className="block text-[10px] font-semibold text-charcoal-text mt-1.5 not-italic">— Bharath Marriage</span>
              </div>
            </div>

            {/* Right Column: Dynamic Visual Cards Grid */}
            <div ref={storiesRef} className="grid grid-cols-2 gap-4 sm:gap-6 items-stretch w-full">
              {/* Tall Vertical Card (Featured Story) - Left Card */}
              <div className={`col-span-2 sm:col-span-1 sm:row-span-2 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col h-[350px] sm:h-[420px] hover:shadow-lg transition-all duration-300 ${storiesVisible ? 'animate-slide-from-left' : 'opacity-0'
                }`}>
                <div className="relative flex-1 overflow-hidden">
                  <img src="/photo1.png" className="w-full h-full object-cover transition-all duration-500" alt="Anjali & Arun" />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-deep-maroon text-white text-[9px] sm:text-[10px] font-label-caps font-semibold py-1 px-2.5 rounded-full tracking-wider shadow-md">
                    Featured Story
                  </div>
                </div>
                <div className="p-3 sm:p-4 text-center bg-white border-t border-slate-50 shrink-0">
                  <h4 className="font-bold text-charcoal-text text-sm sm:text-base">Anjali &amp; Arun</h4>
                  <p className="text-[10px] sm:text-xs text-soft-gray italic mt-1">Destination : Bangalore</p>
                </div>
              </div>

              {/* Card 2: Fathima & Farhan (Muslim Wedding) - Top Right Card */}
              <div className={`col-span-1 bg-white rounded-xl shadow-md border border-slate-100/80 overflow-hidden flex flex-col h-[220px] sm:h-[198px] hover:shadow-lg transition-all duration-300 ${storiesVisible ? 'animate-slide-from-top' : 'opacity-0'
                }`}>
                <div className="relative h-[145px] sm:h-[130px] w-full flex items-center justify-center bg-white p-3 shrink-0">
                  {/* Custom Floral Branch Line Art */}
                  <svg
                    className="absolute left-2.5 top-2.5 w-18 h-18 opacity-25 text-soft-gray pointer-events-none"
                    viewBox="0 0 100 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                  >
                    <path d="M15 85 C 35 65, 55 55, 65 35 C 70 25, 65 15, 55 25 C 45 35, 35 55, 15 85" />
                    <path d="M65 35 C 75 25, 85 25, 95 15 C 85 10, 75 15, 65 35" />
                    <path d="M35 65 C 45 60, 50 50, 50 40 C 45 40, 40 50, 35 65" />
                    <circle cx="55" cy="25" r="2.5" fill="currentColor" />
                    <circle cx="95" cy="15" r="2.5" fill="currentColor" />
                  </svg>

                  {/* Portrait Frame */}
                  <div className="relative w-[72%] h-full rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50 shrink-0">
                    <img
                      src="/image2.png"
                      className="w-full h-full object-cover transition-all duration-500"
                      alt="Fathima & Farhan"
                    />
                  </div>
                </div>
                <div className="p-2 sm:p-3 text-center bg-white border-t border-slate-50 shrink-0 flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-charcoal-text text-[11px] sm:text-xs leading-none">Fathima &amp; Farhan</h4>
                  <p className="text-[9px] sm:text-[10px] text-soft-gray italic mt-1 leading-none">Destination : Kochi</p>
                </div>
              </div>

              {/* Card 3: Merin & Thomas (Christian Wedding) - Bottom Right Card */}
              <div className={`col-span-1 bg-white rounded-xl shadow-md border border-slate-100/80 overflow-hidden flex flex-col h-[220px] sm:h-[198px] hover:shadow-lg transition-all duration-300 ${storiesVisible ? 'animate-slide-from-bottom' : 'opacity-0'
                }`}>
                <div className="relative h-[145px] sm:h-[130px] w-full flex items-center justify-center bg-white p-3.5 shrink-0">
                  {/* Taller Rounded Frame */}
                  <div className="relative w-[92%] h-full rounded-2xl overflow-hidden shadow-sm bg-slate-50 shrink-0">
                    <img
                      src="/image3.png"
                      className="w-full h-full object-cover transition-all duration-500"
                      alt="Merin & Thomas"
                    />
                  </div>
                </div>
                <div className="p-2 sm:p-3 text-center bg-white border-t border-slate-50 shrink-0 flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-charcoal-text text-[11px] sm:text-xs leading-none">Merin &amp; Thomas</h4>
                  <p className="text-[9px] sm:text-[10px] text-soft-gray italic mt-1 leading-none">Destination : Kottayam</p>
                </div>
              </div>    </div>

          </div>
        </div>
      </section>

      {/* Below-Fold Registration Section */}
      <section ref={registerRef} className="bg-slate-50 py-16 sm:py-20 relative z-10 border-t border-b border-slate-100">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left side: Copy and Value Propositions */}
            <div className={`lg:col-span-6 space-y-6 text-left transition-all duration-700 ${registerVisible ? 'animate-slide-from-left' : 'opacity-0'}`}>
              <span className="font-label-caps text-xs text-heritage-gold tracking-widest block mb-1 font-semibold uppercase">
                START YOUR JOURNEY
              </span>
              <h2 className="font-display-lg text-3xl sm:text-4xl text-charcoal-text uppercase tracking-wide leading-tight">
                Begin Your <br />
                <span className="text-deep-maroon">Love Story Today</span>
              </h2>
              <p className="font-body-lg text-sm sm:text-base text-soft-gray leading-relaxed max-w-xl">
                Creating your profile is completely free, quick, and secure. Join thousands of Malayali families who trust Bharath Marriage for finding compatible, verified lifepartners.
              </p>

              {/* Trust Indicators / Checklist */}
              <div className="space-y-3.5 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <span className="material-symbols-outlined text-[18px] leading-none">check</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-charcoal-text">Quick 2-minute registration and profile creation</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <span className="material-symbols-outlined text-[18px] leading-none">check</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-charcoal-text">Set your strict partner preferences and matching filters</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <span className="material-symbols-outlined text-[18px] leading-none">check</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-charcoal-text">100% control over privacy of photos and contact info</p>
                </div>
              </div>
            </div>

            <div id="register" className={`scroll-mt-24 lg:col-span-6 w-full max-w-lg mx-auto transition-all duration-700 ${registerVisible ? 'animate-slide-from-right' : 'opacity-0'}`}>
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
                <h3 className="font-display-lg text-xl sm:text-2xl text-deep-maroon text-center mb-6 uppercase tracking-wider">
                  Register For Free
                </h3>
                <HeroRegistrationForm />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Our Signature Style / Approach Section */}
      <section className="bg-white py-20 relative z-10 border-t border-slate-100">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">

          <div className="mb-12">
            <span className="font-label-caps text-xs text-heritage-gold tracking-widest block mb-2 font-semibold">
              OUR SIGNATURE APPROACH
            </span>
            <h2 className="font-display-lg text-3xl md:text-4xl text-charcoal-text mb-4 uppercase tracking-wide">
              A Matchmaking Experience <br />
              <span className="text-deep-maroon">Built on Trust &amp; Tradition</span>
            </h2>
            <p className="font-body-lg text-sm text-soft-gray max-w-2xl mx-auto leading-relaxed">
              At Bharath Marriage, we believe finding a life partner is a sacred milestone. Our approach combines time-tested traditional values with modern verification technology to create a safe, dignified, and highly compatible matchmaking environment for families.
            </p>
          </div>

          <div ref={approachRef} className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center text-left">

            {/* Left: Storytelling Text */}
            <div className={`space-y-6 transition-all duration-300 ${approachVisible ? 'animate-approach-text' : 'opacity-0'
              }`}>
              <h3 className="font-display-lg text-2xl text-charcoal-text leading-tight">
                Emotive Matching &amp; <br />
                <span className="text-deep-maroon">Curated Compatibility</span>
              </h3>
              <p className="font-body-lg text-sm text-soft-gray leading-relaxed">
                We don't believe in random swipes — we focus on true alignment. Whether it's cultural heritage, professional aspirations, or family backgrounds, we design our match profile insights to help you look beyond the surface. We guide you toward connections that share your values, vision, and lifestyle, ensuring a foundation built for a lifetime.
              </p>
              <p className="font-body-lg text-sm text-soft-gray leading-relaxed">
                Every profile undergoes strict manual and digital verification checks, and we maintain complete privacy controls over your photographs and contact information. Your search remains elegant, confidential, and respected at every single step of the way.
              </p>
              <div className="pt-2">
                <a href="#register" className="inline-flex items-center gap-1.5 bg-deep-maroon hover:bg-primary text-white text-xs font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                  Begin Your Journey
                  <span className="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Right: Premium Wedding Photo */}
            <div className={`rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 ${approachVisible ? 'animate-approach-photo' : 'opacity-0'
              }`}>
              <img
                src="https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=800&h=533"
                alt="Traditional Wedding Couple"
                className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-700"
              />
            </div>

          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50/40 py-20 relative z-10 border-t border-slate-100/60">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="mb-16 text-center">
            <span className="font-label-caps text-xs text-heritage-gold tracking-widest block mb-2 font-semibold">
              MOMENTS
            </span>
            <h2 className="font-display-lg text-3xl md:text-4xl text-deep-maroon mb-4 uppercase tracking-wide">
              How It Works
            </h2>
          </div>

          <div ref={howItWorksRef} className="grid grid-cols-1 md:grid-cols-4 gap-8 relative max-w-5xl mx-auto">
            {/* Curved Connector Path (Desktop) */}
            <div className={`hidden md:block absolute top-[48px] left-[10%] right-[10%] h-[1px] border-t border-dashed border-deep-maroon/30 z-0 transition-all duration-1000 ${howItWorksVisible ? 'opacity-30' : 'opacity-0'
              }`}></div>

            {/* Step 1: Register */}
            <div className={`flex flex-col items-center text-center relative z-10 group transition-all duration-300 ${howItWorksVisible ? 'animate-step-1' : 'opacity-0'
              }`}>
              {/* Concentric Circles */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full bg-deep-maroon/5 animate-pulse"></div>
                {/* Middle Ring */}
                <div className="absolute w-20 h-20 rounded-full bg-deep-maroon/10 border border-deep-maroon/5"></div>
                {/* Inner Core */}
                <div className="absolute w-14 h-14 rounded-full bg-deep-maroon flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px] text-white">person_add</span>
                </div>
              </div>
              <h4 className="font-semibold text-sm text-charcoal-text mb-1 flex items-center gap-1.5">
                <span className="text-deep-maroon">1.</span> Register
              </h4>
              <p className="text-[11px] text-soft-gray leading-tight max-w-[170px]">
                Sign up and create your profile
              </p>
            </div>

            {/* Step 2: Search */}
            <div className={`flex flex-col items-center text-center relative z-10 group transition-all duration-300 ${howItWorksVisible ? 'animate-step-2' : 'opacity-0'
              }`}>
              {/* Concentric Circles */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full bg-heritage-gold/5 animate-pulse"></div>
                {/* Middle Ring */}
                <div className="absolute w-20 h-20 rounded-full bg-heritage-gold/15 border border-heritage-gold/10"></div>
                {/* Inner Core */}
                <div className="absolute w-14 h-14 rounded-full bg-heritage-gold flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px] text-white">search</span>
                </div>
              </div>
              <h4 className="font-semibold text-sm text-charcoal-text mb-1 flex items-center gap-1.5">
                <span className="text-heritage-gold">2.</span> Search
              </h4>
              <p className="text-[11px] text-soft-gray leading-tight max-w-[170px]">
                Find your perfect match
              </p>
            </div>

            {/* Step 3: Connect */}
            <div className={`flex flex-col items-center text-center relative z-10 group transition-all duration-300 ${howItWorksVisible ? 'animate-step-3' : 'opacity-0'
              }`}>
              {/* Concentric Circles */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full bg-deep-maroon/5 animate-pulse"></div>
                {/* Middle Ring */}
                <div className="absolute w-20 h-20 rounded-full bg-deep-maroon/10 border border-deep-maroon/5"></div>
                {/* Inner Core */}
                <div className="absolute w-14 h-14 rounded-full bg-deep-maroon flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px] text-white">chat</span>
                </div>
              </div>
              <h4 className="font-semibold text-sm text-charcoal-text mb-1 flex items-center gap-1.5">
                <span className="text-deep-maroon">3.</span> Connect
              </h4>
              <p className="text-[11px] text-soft-gray leading-tight max-w-[170px]">
                Start conversation with them
              </p>
            </div>

            {/* Step 4: Marriage */}
            <div className={`flex flex-col items-center text-center relative z-10 group transition-all duration-300 ${howItWorksVisible ? 'animate-step-4' : 'opacity-0'
              }`}>
              {/* Concentric Circles */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full bg-heritage-gold/5 animate-pulse"></div>
                {/* Middle Ring */}
                <div className="absolute w-20 h-20 rounded-full bg-heritage-gold/15 border border-heritage-gold/10"></div>
                {/* Inner Core */}
                <div className="absolute w-14 h-14 rounded-full bg-heritage-gold flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px] text-white">celebration</span>
                </div>
              </div>
              <h4 className="font-semibold text-sm text-charcoal-text mb-1 flex items-center gap-1.5">
                <span className="text-heritage-gold">4.</span> Marriage
              </h4>
              <p className="text-[11px] text-soft-gray leading-tight max-w-[170px]">
                Write your success story
              </p>
            </div>
          </div>
        </div>
      </section>
      <FAQSection />
    </div>
  );
}
