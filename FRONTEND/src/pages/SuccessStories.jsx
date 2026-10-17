import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { getResolvedImageUrl } from '../utils/imageUtils';
import LoadingSpinner from '../../components/LoadingSpinner';

const DEFAULT_COUPLE_PHOTO = '/default-couple.jpg';

export default function SuccessStories() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryModal, setActiveStoryModal] = useState(null);
  const [activeModalPhotoIdx, setActiveModalPhotoIdx] = useState(0);

  const fetchSuccessStories = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/public/success-stories');
      if (res.data?.success) {
        setStories(res.data.stories || []);
      }
    } catch (err) {
      console.error('Error fetching success stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuccessStories();
  }, []);

  const featuredStory = stories.length > 0 ? (stories.find(s => s.isFeatured) || stories[0]) : null;

  // Helper to get image URL with fallback to default couple image
  const getStoryImage = (story, photoNum = 1) => {
    if (photoNum === 2 && story?.couple_photo_2) {
      return getResolvedImageUrl(story.couple_photo_2);
    }
    if (story?.image && story.image !== 'null' && story.image !== 'undefined') {
      return getResolvedImageUrl(story.image);
    }
    return DEFAULT_COUPLE_PHOTO;
  };

  const handleOpenModal = (story) => {
    setActiveStoryModal(story);
    setActiveModalPhotoIdx(0);
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-16">
      <Helmet>
        <title>Success Stories & Matrimonial Testimonials | Bharath Marriage</title>
        <meta
          name="description"
          content="Read heart-warming wedding success stories of couples who found their life partners through Bharath Marriage. Verified stories of trust, horoscope matching, and everlasting love."
        />
      </Helmet>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Breadcrumb / Back to Registration */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link
            to="/#register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-maroon hover:text-primary bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs transition-all hover:shadow-xs group"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span>Back to Registration</span>
          </Link>

          <div className="text-xs text-soft-gray flex items-center gap-1.5">
            <Link to="/" className="hover:text-deep-maroon transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[10px] text-slate-300">chevron_right</span>
            <span className="text-slate-400">Success Stories</span>
          </div>
        </div>

        {/* ── 1. Page Header ── */}
        <div className="text-center mb-10 md:mb-14">
          <span className="text-heritage-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] block mb-2">
            Matrimonial Success
          </span>
          <h1 className="font-display-lg text-2xl md:text-4xl text-charcoal-text font-bold leading-tight">
            Our Success Stories
          </h1>
          <p className="text-soft-gray text-xs md:text-sm mt-3 max-w-md mx-auto leading-relaxed px-4 md:px-0">
            Real journeys of verified couples who found their soulmates and everlasting happiness through Bharath Marriage.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-500 font-medium">Loading inspiring stories...</p>
          </div>
        ) : stories.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm mb-16">
            <div className="w-16 h-16 bg-amber-50 text-heritage-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <span className="material-symbols-outlined text-3xl">favorite</span>
            </div>
            <h3 className="font-display-lg text-lg sm:text-xl font-bold text-charcoal-text mb-2">
              Stories Coming Soon!
            </h3>
            <p className="text-xs sm:text-sm text-soft-gray leading-relaxed mb-6">
              Our verified matrimonial matches and real wedding journeys will be showcased here once approved. Start your journey today and be our next success story!
            </p>
            <button
              onClick={() => navigate('/#register')}
              className="bg-deep-maroon hover:bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Find Your Life Partner</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        ) : (
          <>
            {/* ── 2. Featured Story Banner ── */}
            {featuredStory && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden mb-12 md:mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                  
                  {/* Image Side */}
                  <div className="lg:col-span-6 relative h-[280px] sm:h-[360px] md:h-[420px] overflow-hidden group bg-slate-900">
                    <img
                      src={getStoryImage(featuredStory)}
                      alt={featuredStory.names}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_COUPLE_PHOTO;
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-deep-maroon text-white text-[10px] uppercase font-bold tracking-widest py-1 px-3 rounded-full shadow-lg z-10">
                      ★ Featured Couple
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] py-1 px-3 rounded-lg border border-white/20 flex items-center gap-1.5 z-10">
                      <span className="material-symbols-outlined text-heritage-gold text-sm">location_on</span>
                      {featuredStory.location}
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="lg:col-span-6 p-5 sm:p-6 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 text-xs text-soft-gray">
                      <span className="material-symbols-outlined text-sm text-heritage-gold">verified</span>
                      <span className="font-semibold text-slate-700">Verified Marriage Match</span>
                      <span>•</span>
                      <span>{featuredStory.weddingDate}</span>
                    </div>

                    <h2 className="font-display-lg text-xl sm:text-2xl md:text-3xl text-charcoal-text font-bold mb-2 md:mb-3">
                      {featuredStory.names}
                    </h2>

                    <p className="text-soft-gray text-xs md:text-sm italic border-l-2 border-heritage-gold pl-3 mb-3 md:mb-4 leading-relaxed">
                      "{featuredStory.quote}"
                    </p>

                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 line-clamp-3">
                      {featuredStory.story}
                    </p>

                    <div>
                      <button
                        onClick={() => handleOpenModal(featuredStory)}
                        className="btn-premium-cta text-xs py-2 md:py-2.5 px-5 md:px-6 w-full sm:w-auto flex justify-center cursor-pointer"
                      >
                        <span>Read Full Journey</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── 3. Section Title ── */}
            <div className="mb-8 border-b border-slate-200/80 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display-lg text-xl md:text-2xl text-charcoal-text font-bold">
                  Explore Success Stories
                </h3>
                <p className="text-xs text-soft-gray mt-1">
                  Verified matches who found their soulmates on Bharath Marriage ({stories.length})
                </p>
              </div>
            </div>

            {/* ── 4. Stories Cards Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 md:mb-16">
              {stories.map((couple) => (
                <div
                  key={couple.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Card Header Photo */}
                  <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-900">
                    <img
                      src={getStoryImage(couple)}
                      alt={couple.names}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_COUPLE_PHOTO;
                      }}
                    />

                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] py-0.5 px-2 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px] text-heritage-gold">event</span>
                      {couple.weddingDate}
                    </div>

                    {couple.hasCouplePhoto && (
                      <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-bold py-0.5 px-1.5 rounded flex items-center gap-0.5 shadow-xs">
                        <span className="material-symbols-outlined text-[11px]">photo_camera</span>
                        Photo
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-soft-gray mb-1.5">
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="material-symbols-outlined text-xs text-heritage-gold">location_on</span>
                          {couple.location}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.2 rounded border border-emerald-200/60">
                          Verified Match
                        </span>
                      </div>

                      <h4 className="font-display-lg text-base sm:text-lg font-bold text-charcoal-text mb-1.5 sm:mb-2 group-hover:text-deep-maroon transition-colors">
                        {couple.names}
                      </h4>

                      <p className="text-xs text-slate-600 italic line-clamp-3 mb-3 sm:mb-4 leading-relaxed">
                        "{couple.quote}"
                      </p>
                    </div>

                    <div>
                      <button
                        onClick={() => handleOpenModal(couple)}
                        className="w-full py-2 bg-slate-50 hover:bg-deep-maroon hover:text-white border border-slate-200 text-charcoal-text text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Read Story</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── 5. Call To Action ── */}
        <section className="bg-gradient-to-r from-deep-maroon via-primary to-[#540227] rounded-3xl px-5 py-8 sm:p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">favorite</span>
          </div>

          <div className="max-w-2xl relative z-10">
            <span className="text-heritage-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-2">
              Ready To Start Your Own Story?
            </span>
            <h3 className="font-display-lg text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4 leading-tight">
              Begin Your Journey With Us
            </h3>
            <p className="text-slate-200 text-xs md:text-sm leading-relaxed mb-5 md:mb-6">
              Join thousands of hopeful brides, grooms, and families looking for genuine compatibility and lifetime love. Take the first step towards your forever today.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/#register')}
                className="bg-heritage-gold hover:bg-amber-600 text-white font-bold text-xs md:text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-base">search</span>
                Find Your Match Now
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ── 6. Story Details Modal ── */}
      {activeStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col md:grid md:grid-cols-12 relative">
            
            {/* Close Button Top Right */}
            <button
              onClick={() => setActiveStoryModal(null)}
              className="absolute top-3.5 right-3.5 z-30 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              title="Close"
            >
              ✕
            </button>

            {/* Left: Image Side */}
            <div className="md:col-span-5 lg:col-span-5 relative h-56 sm:h-72 md:h-full min-h-[240px] md:min-h-[440px] overflow-hidden bg-slate-950 flex items-center justify-center shrink-0">
              {/* Blurred background fill */}
              <img
                src={
                  activeModalPhotoIdx === 1 && activeStoryModal.couple_photo_2
                    ? getStoryImage(activeStoryModal, 2)
                    : getStoryImage(activeStoryModal, 1)
                }
                alt=""
                className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-40 scale-110 pointer-events-none"
              />

              {/* Main Full Fit Image */}
              <img
                src={
                  activeModalPhotoIdx === 1 && activeStoryModal.couple_photo_2
                    ? getStoryImage(activeStoryModal, 2)
                    : getStoryImage(activeStoryModal, 1)
                }
                alt={activeStoryModal.names}
                className="relative z-10 w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_COUPLE_PHOTO;
                }}
              />

              {/* Multiple photos indicator/tabs if available */}
              {activeStoryModal.couple_photo_1 && activeStoryModal.couple_photo_2 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveModalPhotoIdx(0)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      activeModalPhotoIdx === 0 ? 'bg-heritage-gold text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Photo 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalPhotoIdx(1)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      activeModalPhotoIdx === 1 ? 'bg-heritage-gold text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Photo 2
                  </button>
                </div>
              )}
            </div>

            {/* Right: Content Side */}
            <div className="md:col-span-7 lg:col-span-7 p-5 sm:p-7 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                      Verified Match
                    </span>
                    <span className="text-xs text-soft-gray">•</span>
                    <span className="text-xs text-soft-gray italic font-medium">{activeStoryModal.weddingDate}</span>
                  </div>

                  <h3 className="font-display-lg text-xl sm:text-2xl md:text-3xl font-bold text-charcoal-text leading-tight">
                    {activeStoryModal.names}
                  </h3>

                  <p className="text-xs text-soft-gray flex items-center gap-1 mt-1 font-medium">
                    <span className="material-symbols-outlined text-xs text-heritage-gold">location_on</span>
                    {activeStoryModal.location}
                  </p>
                </div>

                <blockquote className="border-l-4 border-heritage-gold pl-4 py-2.5 text-xs sm:text-sm italic text-slate-700 bg-amber-50/50 rounded-r-xl leading-relaxed">
                  "{activeStoryModal.quote}"
                </blockquote>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-deep-maroon">auto_stories</span>
                    Their Story & Journey
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    {activeStoryModal.story}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStoryModal(null);
                    navigate('/#register');
                  }}
                  className="text-xs font-bold text-deep-maroon hover:text-primary flex items-center gap-1 cursor-pointer"
                >
                  <span>Find your match like them</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>

                <button
                  onClick={() => setActiveStoryModal(null)}
                  className="px-5 py-2 bg-deep-maroon text-white text-xs font-bold rounded-xl hover:bg-primary transition-colors cursor-pointer shadow-sm"
                >
                  Close Story
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
