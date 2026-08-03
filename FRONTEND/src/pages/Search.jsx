import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../../components/ProfileCard';
import axiosInstance from '../../src/utils/axiosInstance';

const searchProfiles = [
  {
    id: "BKLH000000001",
    name: "Aishwarya R.",
    age: 26,
    height: "5'4\"",
    heightCm: 162,
    religion: "Hindu",
    caste: "Brahmin",
    education: "M.Tech",
    profession: "Software Engineer",
    location: "Bangalore",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: true,
    gender: "Bride",
    star: "Chathayam"
  },
  {
    id: "BKLH000000002",
    name: "Adithya K.",
    age: 28,
    height: "5'11\"",
    heightCm: 180,
    religion: "Hindu",
    caste: "Brahmin",
    education: "MBA",
    profession: "Product Manager",
    location: "Chennai",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: false,
    gender: "Groom",
    star: "Anizham"
  },
  {
    id: "BKLH000000003",
    name: "Meera Joseph",
    age: 25,
    height: "5'5\"",
    heightCm: 165,
    religion: "Christian",
    caste: "Open to all",
    education: "MD - Pediatrics",
    profession: "Doctor",
    location: "Kochi",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: true,
    gender: "Bride"
  },
  {
    id: "BKLH000000004",
    name: "Sandeep Singh",
    age: 29,
    height: "6'0\"",
    heightCm: 182,
    religion: "Sikh",
    caste: "Open to all",
    education: "B.Tech",
    profession: "Merchant Navy Officer",
    location: "Delhi",
    image: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: true,
    gender: "Groom"
  },
  {
    id: "BKLH000000005",
    name: "Neha Sharma",
    age: 27,
    height: "5'6\"",
    heightCm: 167,
    religion: "Hindu",
    caste: "Brahmin",
    education: "M.S. Data Science",
    profession: "Data Scientist",
    location: "Hyderabad",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: true,
    gender: "Bride",
    star: "Rohini"
  },
  {
    id: "BKLH000000006",
    name: "Arjun Reddy",
    age: 30,
    height: "6'1\"",
    heightCm: 185,
    religion: "Hindu",
    caste: "Reddy",
    education: "B.Tech + MS",
    profession: "Hardware Engineer",
    location: "Hyderabad",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: true,
    gender: "Groom",
    star: "Thiruvathira"
  },
  {
    id: "BKLH000000007",
    name: "Kavya Madhavan",
    age: 25,
    height: "5'3\"",
    heightCm: 160,
    religion: "Hindu",
    caste: "Open to all",
    education: "BFA - Design",
    profession: "UI/UX Designer",
    location: "Kochi",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: false,
    gender: "Bride",
    star: "Makayiram"
  },
  {
    id: "BKLH000000008",
    name: "Vikram Malhotra",
    age: 29,
    height: "5'10\"",
    heightCm: 178,
    religion: "Hindu",
    caste: "Open to all",
    education: "Chartered Accountant",
    profession: "Finance Manager",
    location: "Delhi",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=500",
    verified: true,
    premium: true,
    gender: "Groom",
    star: "Uthradam"
  }
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Karthika", "Rohini", "Makayiram", "Thiruvathira", 
  "Punartham", "Pooyam", "Ayilyam", "Makam", "Pooram", "Uthram", 
  "Atham", "Chithira", "Chothhi", "Visakham", "Anizham", "Thrikketta", 
  "Moolam", "Pooradam", "Uthradam", "Thiruvonam", "Avittam", "Chathayam", 
  "Pooruruttathi", "Uthruttathi", "Revathi"
];

const calculateStarFromBirthDetails = (dob, tob) => {
  if (!dob) return "Rohini";
  const seedStr = dob + (tob || "");
  let sum = 0;
  for (let i = 0; i < seedStr.length; i++) {
    sum += seedStr.charCodeAt(i);
  }
  const index = sum % NAKSHATRAS.length;
  return NAKSHATRAS[index];
};

export default function Search() {
  const [lookingFor, setLookingFor] = useState('Bride');
  const [religion, setReligion] = useState('Hindu');
  const [caste, setCaste] = useState('Open to all');
  const [location, setLocation] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const [maritalStatus, setMaritalStatus] = useState('Never Married');
  const [searchId, setSearchId] = useState('');
  const [showMore, setShowMore] = useState(false);
  const resultsRef = useRef(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const [guestStar, setGuestStar] = useState(null);
  const [guestDob, setGuestDob] = useState('');
  const [guestTob, setGuestTob] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      const savedStar = localStorage.getItem('guestStar') || sessionStorage.getItem('guestStar');
      const savedDob = localStorage.getItem('guestDob') || sessionStorage.getItem('guestDob');
      const savedTob = localStorage.getItem('guestTob') || sessionStorage.getItem('guestTob');
      if (savedStar) setGuestStar(savedStar);
      if (savedDob) setGuestDob(savedDob);
      if (savedTob) setGuestTob(savedTob);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const savedDob = localStorage.getItem('guestDob') || sessionStorage.getItem('guestDob') || '';
      const savedTob = localStorage.getItem('guestTob') || sessionStorage.getItem('guestTob') || '';
      setGuestDob(savedDob);
      setGuestTob(savedTob);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genderParam = params.get('gender');
    const ageParam = params.get('age');
    const religionParam = params.get('religion');
    const locationParam = params.get('location');
    const casteParam = params.get('caste');
    const maritalStatusParam = params.get('maritalStatus');
    const professionParam = params.get('profession');

    let isFiltered = false;

    if (genderParam) {
      setLookingFor(genderParam);
      isFiltered = true;
    }
    if (religionParam) {
      setReligion(religionParam);
      isFiltered = true;
    }
    if (locationParam) {
      setLocation(locationParam);
      isFiltered = true;
    }
    if (casteParam) {
      setCaste(casteParam);
      isFiltered = true;
    }
    if (maritalStatusParam) {
      setMaritalStatus(maritalStatusParam);
      isFiltered = true;
    }
    if (professionParam) {
      setProfession(professionParam);
      isFiltered = true;
    }
    if (ageParam) {
      isFiltered = true;
    }

    if (isFiltered) {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const savedStar = localStorage.getItem('guestStar') || sessionStorage.getItem('guestStar');
      if (!isLoggedIn && religionParam === 'Hindu' && !savedStar) {
        setIsModalOpen(true);
      } else {
        const filtered = searchProfiles.filter(p => {
          if (genderParam && p.gender !== genderParam) return false;
          if (religionParam && p.religion !== religionParam) return false;
          if (locationParam && p.location !== locationParam) return false;
          if (casteParam && casteParam !== 'Open to all' && p.caste !== casteParam) return false;
          if (maritalStatusParam) {
            const pStatus = p.maritalStatus || 'Never Married';
            if (pStatus !== maritalStatusParam) return false;
          }
          if (professionParam) {
            const prof = p.profession.toLowerCase();
            const param = professionParam.toLowerCase();
            if (param === 'engineer') {
              if (!prof.includes('engineer')) return false;
            } else if (param === 'govt employee') {
              if (!prof.includes('govt') && !prof.includes('government') && !prof.includes('officer')) return false;
            } else {
              if (!prof.includes(param)) return false;
            }
          }
          if (ageParam) {
            const [min, max] = ageParam.split('-');
            if (p.age < parseInt(min) || p.age > parseInt(max)) return false;
          }
          return true;
        });
        setResults(filtered);
        setSearched(true);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, []);

  const performSearch = async () => {
    setSearched(true);
    setIsLoading(true);

    try {
      const params = {};
      if (searchId.trim() !== '') params.profileId = searchId.trim();
      if (lookingFor) params.gender = lookingFor;
      if (religion) params.religion = religion;
      if (location) params.location = location;
      if (maritalStatus && maritalStatus !== 'Never Married') params.maritalStatus = maritalStatus;
      if (profession) params.profession = profession;
      if (education) params.education = education;
      if (nakshatra && religion === 'Hindu') params.nakshatra = nakshatra;
      // We aren't filtering caste on the backend due to schema limitations, 
      // but we send it if we implement it later.
      if (caste && caste !== 'Open to all') params.community = caste;
      
      if (age) {
        const [min, max] = age.split('-');
        params.minAge = min;
        params.maxAge = max;
      }

      const response = await axiosInstance.get('/users/search', { params });
      if (response.data && response.data.profiles) {
        setResults(response.data.profiles);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const savedStar = localStorage.getItem('guestStar') || sessionStorage.getItem('guestStar') || guestStar;
    if (!isLoggedIn && religion === 'Hindu' && !savedStar) {
      setIsModalOpen(true);
      return;
    }
    performSearch();
  };

  return (
    <div className="w-full flex flex-col pt-16 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <section className="relative bg-gradient-to-r from-primary via-deep-maroon to-primary py-2.5 sm:py-3.5 text-white text-center px-margin-mobile md:px-margin-desktop overflow-hidden">
        {/* Subtle Background Graphics */}
        <div className="absolute inset-0 opacity-10 hero-pattern pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-container-max mx-auto relative z-10 w-full">
          {/* Back Navigation */}
          <div className="flex justify-start mb-1">
            <Link to="/" className="text-white/85 hover:text-white flex items-center gap-0.5 font-semibold text-[10px] sm:text-xs transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-[13px] sm:text-[15px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              Back
            </Link>
          </div>

          <h1 className="font-display-lg text-xs sm:text-sm md:text-base text-white mb-2 leading-none uppercase tracking-wider">
            Search Your Partner Here
          </h1>

          {/* Search by ID Input Bar */}
          <form onSubmit={handleSearch} className="max-w-xs sm:max-w-md mx-auto relative px-2">
            <input
              type="text"
              placeholder="Search by ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-white rounded-full py-1.5 px-4 pr-10 text-[11px] sm:text-xs font-body-sm text-charcoal-text placeholder-soft-gray/60 focus:outline-none shadow border border-slate-100"
            />
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-deep-maroon text-white w-6.5 h-6.5 rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[12px] text-white">search</span>
            </button>
          </form>
        </div>
      </section>

      <section className="py-6 md:py-10 relative z-10 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-4xl mx-auto bg-transparent md:bg-white p-0 md:p-8 rounded-none md:rounded-xl shadow-none md:shadow-md border-none md:border md:border-slate-100">

          <form onSubmit={handleSearch} className="space-y-4 md:space-y-6">

            {/* Main Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">

              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  Religion
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                >
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  Caste
                </label>
                <select
                  value={caste}
                  onChange={(e) => setCaste(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                >
                  <option value="Open to all">All Castes</option>
                  <option value="Brahmin">Brahmin</option>
                  <option value="Reddy">Reddy</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  I'm Looking For
                </label>
                <select
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                >
                  <option value="Bride">Bride (Female)</option>
                  <option value="Groom">Groom (Male)</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  District
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                >
                  <option value="">All Districts</option>
                  <option value="Kochi">Kochi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

            </div>

            {/* More Filters */}
            {showMore && (
              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">

                  <div className="text-left">
                    <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                      Marital Status
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                    >
                      <option value="Never Married">Never Married</option>
                      <option value="Second Marriage">Second Marriage</option>
                    </select>
                  </div>

                  <div className="text-left">
                    <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                      Age
                    </label>
                    <select
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                    >
                      <option value="">Any Age</option>
                      <option value="18-25">18 - 25</option>
                      <option value="26-30">26 - 30</option>
                      <option value="31-35">31 - 35</option>
                      <option value="36-40">36 - 40</option>
                    </select>
                  </div>

                  <div className="text-left">
                    <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                      Profession
                    </label>
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                    >
                      <option value="">Any Profession</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Manager">Manager</option>
                      <option value="Advocate">Advocate</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Govt Employee">Govt Sector</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="text-left">
                    <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                      Education
                    </label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                    >
                      <option value="">Any Education</option>
                      <option value="B.Tech">B.Tech / B.E</option>
                      <option value="M.Tech">M.Tech / M.E</option>
                      <option value="B.Sc">B.Sc / M.Sc</option>
                      <option value="B.Com">B.Com / M.Com</option>
                      <option value="MBA">MBA / BBA</option>
                      <option value="MBBS">MBBS / MD</option>
                      <option value="Nursing">Nursing</option>
                      <option value="Degree">Any Degree</option>
                    </select>
                  </div>

                  {religion === 'Hindu' && (
                    <div className="text-left">
                      <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                        Nakshatra
                      </label>
                      <select
                        value={nakshatra}
                        onChange={(e) => setNakshatra(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                      >
                        <option value="">Any Nakshatra</option>
                        {NAKSHATRAS.map((star) => (
                          <option key={star} value={star}>{star}</option>
                        ))}
                      </select>
                    </div>
                  )}                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="text-deep-maroon font-semibold text-xs flex items-center gap-1"
              >
                {showMore ? 'Less Filters' : 'More Filters'}
                <span className="material-symbols-outlined text-[16px]">
                  {showMore ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-deep-maroon hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2 px-8 md:px-14 rounded-lg shadow text-xs uppercase tracking-wider"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="pb-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-4xl mx-auto" ref={resultsRef}>
          {searched ? (
            <div>
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center gap-2 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display-lg text-base md:text-xl text-charcoal-text">
                    Search Results <span className="text-deep-maroon font-bold">({results.length})</span>
                  </h3>
                  {religion === 'Hindu' && guestStar && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-xs">
                      <span>🌟 Star: {guestStar}</span>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="hover:text-amber-900 ml-1 underline cursor-pointer font-bold focus:outline-none"
                      >
                        Change
                      </button>
                    </span>
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-soft-gray">
                  Showing matches matching your filters
                </p>
              </div>

              {isLoading ? (
                <div className="bg-white p-12 rounded-xl border border-slate-100 text-center">
                  <span className="material-symbols-outlined text-[48px] text-deep-maroon animate-spin mb-3">progress_activity</span>
                  <h4 className="font-semibold text-charcoal-text mb-1">Searching Profiles...</h4>
                  <p className="text-xs text-soft-gray">Please wait while we find the best matches for you.</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                  {results.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} fullWidth guestStar={religion === 'Hindu' ? guestStar : null} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-xl border border-slate-100 text-center">
                  <span className="material-symbols-outlined text-[48px] text-soft-gray/40 mb-3">person_search</span>
                  <h4 className="font-semibold text-charcoal-text mb-1">No matches found</h4>
                  <p className="text-xs text-soft-gray">Try adjusting your filters or search ID to find more partners.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-100 text-center shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-deep-maroon/20 mb-3">manage_search</span>
              <h4 className="font-semibold text-charcoal-text mb-1">Ready to search</h4>
              <p className="text-xs text-soft-gray">Choose your criteria above and click the Search button to find your partner.</p>
            </div>
          )}
        </div>
      </section>

      {/* Guest Compatibility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => {
              setIsModalOpen(false);
              performSearch();
            }}
          ></div>

          {/* Glassmorphic Container */}
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl border border-white/30 transition-all duration-300 scale-100 flex flex-col items-center text-center animate-fade-in">
            
            {/* Sparkle Icon with animated gradient background */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-primary flex items-center justify-center text-white shadow-lg mb-4 animate-pulse">
              <span className="material-symbols-outlined text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>

            <h3 className="font-display-lg text-lg sm:text-xl text-slate-800 font-bold leading-tight mb-2">
              Discover Compatibility
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-xs leading-relaxed">
              Enter your birth details to calculate your Nakshatra and see instant Porutham match scores!
            </p>

            {/* Input DOB, TOB */}
            <div className="w-full text-left mb-6 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={guestDob}
                  onChange={(e) => setGuestDob(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Time of Birth
                </label>
                <input
                  type="time"
                  value={guestTob}
                  onChange={(e) => setGuestTob(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => {
                  if (guestDob && guestTob) {
                    const calculatedStar = calculateStarFromBirthDetails(guestDob, guestTob);
                    setGuestStar(calculatedStar);
                    
                    localStorage.setItem('guestStar', calculatedStar);
                    sessionStorage.setItem('guestStar', calculatedStar);
                    
                    localStorage.setItem('guestDob', guestDob);
                    sessionStorage.setItem('guestDob', guestDob);
                    
                    localStorage.setItem('guestTob', guestTob);
                    sessionStorage.setItem('guestTob', guestTob);
                    
                    setIsModalOpen(false);
                    performSearch();
                  } else {
                    alert('Please enter your Date of Birth and Time of Birth.');
                  }
                }}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95 uppercase tracking-wider cursor-pointer border border-white/20"
              >
                ജാതക പൊരുത്തം
              </button>
              
              <button
                onClick={() => {
                  setGuestStar(null);
                  setGuestDob('');
                  setGuestTob('');
                  
                  localStorage.removeItem('guestStar');
                  sessionStorage.removeItem('guestStar');
                  
                  localStorage.removeItem('guestDob');
                  sessionStorage.removeItem('guestDob');
                  
                  localStorage.removeItem('guestTob');
                  sessionStorage.removeItem('guestTob');
                  
                  setIsModalOpen(false);
                  performSearch();
                }}
                className="w-full py-2.5 px-6 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Skip & Browse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
