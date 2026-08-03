import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import HoroscopeCharts from '../../../components/HoroscopeCharts';
import { downloadHoroscope } from '../../utils/downloadHoroscope';
import axiosInstance from '../../utils/axiosInstance';

function DetailSection({ title, rows }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <h2 className="font-display-lg text-[13px] tracking-wider text-deep-maroon font-bold uppercase border-b border-heritage-gold/20 pb-1.5 mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-heritage-gold"></span>
        {title}
      </h2>

      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-start py-1.5 border-b border-slate-100/60 last:border-b-0 gap-4">
            <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wider mt-0.5 shrink-0">{label}</span>
            <span className="text-xs font-semibold text-charcoal-text text-right">{value || 'Not Specified'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileDetails() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/users/profile/${profileId}`);
        setProfile(response.data.user);
        
        if (isLoggedIn) {
          try {
            const favRes = await axiosInstance.get(`/users/profile/${profileId}/favourites/status`);
            setIsFavourite(favRes.data.isFavourite);
          } catch (e) {
            console.error("Failed to fetch favourite status", e);
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileId, isLoggedIn]);

  const handleToggleFavourite = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setFavLoading(true);
    try {
      if (isFavourite) {
        await axiosInstance.delete(`/users/profile/${profileId}/favourites`);
        setIsFavourite(false);
      } else {
        await axiosInstance.post(`/users/profile/${profileId}/favourites`);
        setIsFavourite(true);
      }
    } catch (err) {
      console.error("Failed to toggle favourite", err);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/10 to-amber-50/5 pt-32 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-maroon"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/10 to-amber-50/5 pt-32 pb-16 flex items-center justify-center">
        <div className="text-red-600 font-bold text-xl">Profile Not Found</div>
      </div>
    );
  }

  const firstName = profile.name ? profile.name.split(' ')[0] : 'Member';
  const subject = profile.gender === 'Female' ? 'She' : 'He';
  const isHindu = profile.religion?.toLowerCase().includes('hindu');

  const quickFacts = [
    { icon: 'cake', label: `${profile.age || 'N/A'} yrs` },
    { icon: 'diversity_3', label: profile.religion ? profile.religion.split(' - ')[0] : 'Hindu' },
    { icon: 'straighten', label: profile.height ? profile.height.split(' - ')[0] : 'Not specified' },
    { icon: 'school', label: profile.education || 'Degree' },
  ];

  const basicDetails = [
    ['Name', profile.name],
    ['Gender', profile.gender],
    ['Age', profile.age ? String(profile.age) : 'N/A'],
    ['Marital Status', profile.maritalStatus || 'Unmarried'],
    ['Height', profile.height],
    ['Profile Created For', profile.profileCreatedFor || 'Myself'],
  ];

  const professionalDetails = [
    ['Education', profile.education],
    ['Occupation', profile.profession],
    ['Employed In', profile.employedIn || profile.employment_country || 'India'],
  ];

  const locationDetails = [
    ['Country', profile.country || 'India'],
    ['State', profile.state || 'Kerala'],
    ['District', profile.district ? profile.district.replace(/^\d{2}-\s*/, '') : 'Not specified'],
    ['City', profile.location || profile.place],
  ];

  const horoscopeDetails = [
    ['Birth Time', profile.birth_time || 'Not specified'],
    ['Janma Sista Dasa', profile.janmaSistaDasa || 'Not specified'],
    ['End Dasa', profile.endDasa || 'Not specified'],
    ['Dob (Malayalam)', (() => {
      const val = profile.date_of_birth_malayalam || profile.dobMalayalam;
      if (!val) return 'Not specified';
      const parts = val.split(' ');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val.replace(/ /g, '/');
    })()],
    ['Dob (English)', (() => {
      const val = profile.date_of_birth || profile.dobEnglish;
      if (!val) return '';
      if (val.includes('/')) return val; // Already DD/MM/YYYY
      const parts = val.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val;
    })()],
    ['Star / Rasi', profile.horoscope_information || profile.nakshatra || profile.starRasi || 'Not specified'],
  ];

  const familyDetails = [
    ['Father\'s Name', profile.fathersName || 'Not specified'],
    ['Father\'s Age', profile.fathersAge || 'Not specified'],
    ['Father\'s Job', profile.fathersJob || 'Not specified'],
    ['Mother\'s Name', profile.mothersName || 'Not specified'],
    ['Mother\'s Age', profile.mothersAge || 'Not specified'],
    ['Mother\'s Job', profile.mothersJob || 'Not specified'],
    ['Sibling Details', profile.siblingDetails || 'Not specified'],
  ];

  const isValidPhoto = (url) => url && url.includes('/uploads/');
  const defaultAvatar = profile.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png';

  const userPhotos = [profile.photo_1, profile.photo_2, profile.photo_3, profile.photo_4].filter(isValidPhoto);
  if (userPhotos.length === 0) {
    userPhotos.push(defaultAvatar);
  }

  const galleryPhotos = [...userPhotos, 'placeholder_avatar'];

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/10 to-amber-50/5 text-charcoal-text pt-24 md:pt-28 pb-16">
      <main className="mx-auto grid max-w-container-max gap-6 px-margin-mobile py-6 md:grid-cols-[360px_1fr] md:px-margin-desktop">
        
        {/* Left Column: Portrait & Locked Contact Panel */}
        <aside className="md:sticky md:top-24 md:self-start w-full max-w-sm md:max-w-none mx-auto md:bg-transparent md:p-0 md:border-0 md:shadow-none">
          <div className="relative overflow-hidden rounded-2xl border-2 border-heritage-gold/20 p-1.5 bg-white shadow-md group max-w-[240px] md:max-w-none mx-auto">
            {/* Main Active Photo / Avatar */}
            {galleryPhotos[activePhotoIdx] === 'placeholder_avatar' ? (
              <div className="aspect-[4/5] w-full bg-[#f8fafc] rounded-xl flex items-center justify-center border border-slate-100">
                <svg className="w-20 h-20 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            ) : (
              <img src={galleryPhotos[activePhotoIdx]} alt={profile.name} className="aspect-[4/5] w-full object-cover rounded-xl" />
            )}
            
            {/* Verified Profile Badge */}
            <div className="absolute top-4 left-4 bg-emerald-600/90 text-white font-bold tracking-wider text-[9px] uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1 z-10">
              <span className="material-symbols-outlined text-[10px] leading-none fill-current">verified</span>
              100% Verified
            </div>

            {/* Carousel Chevrons */}
            <button 
              onClick={handlePrevPhoto} 
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-charcoal-text w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 z-20 opacity-0 group-hover:opacity-100 duration-250"
              aria-label="Previous photo"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">chevron_left</span>
            </button>
            <button 
              onClick={handleNextPhoto} 
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-charcoal-text w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 z-20 opacity-0 group-hover:opacity-100 duration-250"
              aria-label="Next photo"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">chevron_right</span>
            </button>
          </div>

          {/* Gallery Thumbnails */}
          <div className="mt-3 flex gap-2 justify-center flex-wrap">
            {galleryPhotos.map((photo, index) => {
              const isActive = activePhotoIdx === index;
              return photo === 'placeholder_avatar' ? (
                <button
                  key={index}
                  onClick={() => setActivePhotoIdx(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    isActive ? 'border-blue-500 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  aria-label="Toggle avatar placeholder"
                >
                  <div className="w-full h-full bg-[#f1f5f9] flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </button>
              ) : (
                <button
                  key={index}
                  onClick={() => setActivePhotoIdx(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    isActive ? 'border-blue-500 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Toggle photo ${index + 1}`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-center md:text-left">
            <h1 className="font-display-lg text-xl md:text-2xl font-bold text-deep-maroon tracking-wide">{profile.name}</h1>
            <p className="mt-0.5 text-[10px] md:text-[11px] font-semibold text-soft-gray uppercase tracking-widest">{profile.id} • {profile.profession}</p>
          </div>

          <div className="mt-3 flex items-center justify-center md:justify-start gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <span className="material-symbols-outlined text-[18px] md:text-[20px] text-deep-maroon">location_on</span>
            <div className="text-left">
              <p className="text-xs font-bold text-charcoal-text">{profile.location}, {profile.state}</p>
            </div>
          </div>

          {/* Compatibility score widget */}
          <div className="mt-3 bg-gradient-to-br from-emerald-50/55 to-teal-50/30 rounded-xl p-3 border border-emerald-100/60">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" className="stroke-emerald-100" strokeWidth="3" fill="transparent" />
                  <circle cx="24" cy="24" r="20" className="stroke-emerald-600 transition-all duration-500" strokeWidth="3" fill="transparent" strokeDasharray="125" strokeDashoffset={125 - (125 * 82) / 100} />
                </svg>
                <span className="text-[10px] font-bold text-emerald-800">82%</span>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">Excellent Match Score</p>
                <p className="text-[10px] text-emerald-600/80 font-medium">Strong preference alignment</p>
              </div>
            </div>
          </div>

          {/* Contact Address Locked Section */}
          <div className="mt-4 border-t border-slate-200 pt-4 text-left">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="material-symbols-outlined text-[16px] sm:text-[20px] text-charcoal-text font-bold">phone_in_talk</span>
              <h3 className="text-[11px] sm:text-xs font-bold text-charcoal-text uppercase tracking-wider">Contact Details</h3>
            </div>

            {isLoggedIn ? (
              <>
                {/* Masked Phone Line */}
                <div className="flex items-center gap-2 pl-1 mb-1.5 text-[11px] sm:text-xs font-bold text-charcoal-text">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-slate-500">smartphone</span>
                  <span>+91 099* *** ***</span>
                </div>

                {/* WhatsApp Line */}
                <div className="flex items-center gap-2 pl-1 mb-3 text-[11px] sm:text-xs font-bold text-charcoal-text">
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.887-6.963C16.578 1.928 14.113.901 11.49.901c-5.45 0-9.875 4.421-9.879 9.855-.001 1.75.475 3.46 1.378 4.975l-1.03 3.766 3.864-1.013zm11.366-7.406c-.3-.15-1.774-.875-2.046-.975-.272-.1-.47-.15-.667.15-.198.3-.767.975-.94 1.175-.173.2-.347.225-.647.075-.3-.15-1.266-.467-2.41-1.485-.89-.795-1.49-1.777-1.664-2.078-.174-.3-.019-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.667-1.605-.913-2.197-.24-.578-.484-.5-.667-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.774-.725 2.022-1.425.247-.699.247-1.299.173-1.425-.074-.124-.272-.198-.57-.348z" />
                  </svg>
                  <span>WhatsApp Verified</span>
                </div>

                {/* Lock Action Box */}
                <div className="bg-[#f4f6f8] rounded-xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3.5 border border-slate-100">
                  <div className="relative flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center bg-violet-500 rounded-xl text-white shadow-sm">
                    <span className="material-symbols-outlined text-[15px] sm:text-[18px] fill-current">lock</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-charcoal-text leading-tight">Upgrade to unlock contact details</p>
                    <a href="#packages" className="text-[9px] sm:text-[10px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 mt-0.5 transition-colors">
                      Upgrade Now
                      <span className="material-symbols-outlined text-[12px] leading-none">chevron_right</span>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Masked Phone Line */}
                <div className="flex items-center gap-2 pl-1 mb-1.5 text-[11px] sm:text-xs font-bold text-slate-400">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px]">smartphone</span>
                  <span>+91 9447x xxxxx</span>
                </div>

                {/* WhatsApp Line */}
                <div className="flex items-center gap-2 pl-1 mb-3 text-[11px] sm:text-xs font-bold text-slate-400">
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.887-6.963C16.578 1.928 14.113.901 11.49.901c-5.45 0-9.875 4.421-9.879 9.855-.001 1.75.475 3.46 1.378 4.975l-1.03 3.766 3.864-1.013zm11.366-7.406c-.3-.15-1.774-.875-2.046-.975-.272-.1-.47-.15-.667.15-.198.3-.767.975-.94 1.175-.173.2-.347.225-.647.075-.3-.15-1.266-.467-2.41-1.485-.89-.795-1.49-1.777-1.664-2.078-.174-.3-.019-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.667-1.605-.913-2.197-.24-.578-.484-.5-.667-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.774-.725 2.022-1.425.247-.699.247-1.299.173-1.425-.074-.124-.272-.198-.57-.348z" />
                  </svg>
                  <span>WhatsApp Number (Locked)</span>
                </div>

                {/* Lock Action Box */}
                <div className="bg-[#f4f6f8] rounded-xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3.5 border border-slate-100">
                  <div className="relative flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center bg-amber-500 rounded-xl text-white shadow-sm">
                    <span className="material-symbols-outlined text-[15px] sm:text-[18px] fill-current">lock</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-charcoal-text leading-tight">Login to unlock contact details</p>
                    <Link to="/login" className="text-[9px] sm:text-[10px] font-bold text-deep-maroon hover:text-primary inline-flex items-center gap-0.5 mt-0.5 transition-colors">
                      Login Now
                      <span className="material-symbols-outlined text-[12px] leading-none">chevron_right</span>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Report Button Link */}
            <button className="w-full text-center text-[10px] font-bold text-soft-gray hover:text-red-600 hover:underline transition-colors mt-4 cursor-pointer flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[13px]">flag</span>
              Report Profile
            </button>
          </div>
        </aside>

        {/* Right Column: Premium Details Content */}
        <section className="min-w-0 flex flex-col gap-6">
          
          {/* Quick Action Toolbar */}
          <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-slate-200/60 md:shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-0 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="grid grid-cols-2 w-full sm:w-auto gap-2 sm:gap-4">
              <button
                onClick={handleToggleFavourite}
                disabled={favLoading}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-[10px] sm:text-xs font-bold ${
                  isFavourite 
                    ? 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100' 
                    : 'border-slate-200 bg-slate-50 text-soft-gray hover:bg-slate-100'
                } ${favLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
              >
                <span className={`material-symbols-outlined text-[16px] sm:text-[20px] ${isFavourite ? 'fill-current text-pink-600' : ''}`}>favorite</span>
                <span>{isFavourite ? 'Favourited' : 'Favourite'}</span>
              </button>
              <Link
                to={isLoggedIn ? "/dashboard?tab=inbox" : "/login"}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50 hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95 text-[10px] sm:text-xs font-bold"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">chat</span>
                <span>Chat Now</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-bold text-soft-gray cursor-pointer" aria-label="Share profile">
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Quick Facts Widget */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickFacts.map((fact) => (
              <div key={fact.label} className="bg-white border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:border-heritage-gold/20 hover:shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-heritage-gold bg-amber-50/60 p-1.5 rounded-xl">{fact.icon}</span>
                <span className="text-xs font-bold text-charcoal-text">{fact.label}</span>
              </div>
            ))}
          </div>

          {/* Combined Profile Details Card */}
          <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-slate-200/60 md:shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-0 md:p-6 flex flex-col gap-6 relative overflow-hidden">
            
            {/* Basic Details (Always Visible) */}
            <DetailSection title="Basic Details" rows={basicDetails} />

            {/* Restricted Content Wrapper */}
            <div className={`flex flex-col gap-6 transition-all duration-300 ${!isLoggedIn ? 'select-none filter blur-sm pointer-events-none md:max-h-[300px] max-h-[250px] overflow-hidden' : ''}`}>
              {/* About Me Segment */}
              <div>
                <h2 className="font-display-lg text-[13px] tracking-wider text-deep-maroon font-bold uppercase border-b border-heritage-gold/20 pb-1.5 mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-heritage-gold"></span>
                  About Me
                </h2>
                <p className="text-xs leading-6 text-slate-600 italic font-medium max-w-3xl">
                  "{firstName} is a warm, family-oriented professional working as a {profile.profession} in {profile.location}. {subject} values honesty,
                  education, and a balanced lifestyle, and is looking for a partner with shared family values and mutual respect."
                </p>
              </div>

              {/* Profile Details Sections */}
              <DetailSection title="Professional Info" rows={professionalDetails} />
              <DetailSection title="Location Details" rows={locationDetails} />
              <DetailSection title="Family Details" rows={familyDetails} />

              {isHindu && (
                <div className="py-4 border-t border-slate-100/60 mt-2">
                  <div className="flex items-center justify-between border-b border-heritage-gold/20 pb-1.5 mb-3">
                    <h2 className="font-display-lg text-[13px] tracking-wider text-deep-maroon font-bold uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-deep-maroon">cake</span>
                      Horoscope Details
                    </h2>
                    <button
                      onClick={() => downloadHoroscope(profile)}
                      className="flex items-center gap-1.5 bg-deep-maroon hover:bg-deep-maroon/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Download
                    </button>
                  </div>

                  <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {horoscopeDetails.map(([label, value]) => (
                      <div key={label} className="flex justify-between items-start py-1.5 border-b border-slate-100/60 last:border-b-0 gap-4">
                        <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wider mt-0.5 shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-charcoal-text text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* South Indian / Kerala Style Horoscope Grids Component */}
                  <HoroscopeCharts />
                </div>
              )}
            </div>

            {/* Lock Overlay for Restricted Content */}
            {!isLoggedIn && (
              <div className="absolute inset-x-0 bottom-0 top-[220px] bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="max-w-md bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 -mt-8 sm:mt-0">
                  <div className="w-12 h-12 rounded-full bg-deep-maroon/10 text-deep-maroon flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[24px] fill-current">lock</span>
                  </div>
                  <h3 className="font-display-lg text-base sm:text-lg text-charcoal-text uppercase tracking-wider mb-2 font-bold">
                    Unlock Full Profile Details
                  </h3>
                  <p className="text-[11px] sm:text-xs text-soft-gray leading-relaxed mb-6">
                    About me, professional information, family background, location preferences, and horoscope details are only visible to registered members.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/login"
                      className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-md transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      Login
                    </Link>
                    <Link
                      to="/#register"
                      className="bg-white hover:bg-slate-50 text-deep-maroon border border-deep-maroon/30 text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Register Free
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}
