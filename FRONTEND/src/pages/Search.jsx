import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../../components/ProfileCard';
import axiosInstance from '../../src/utils/axiosInstance';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const KERALA_DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Karthika", "Rohini", "Makayiram", "Thiruvathira", 
  "Punartham", "Pooyam", "Ayilyam", "Makam", "Pooram", "Uthram", 
  "Atham", "Chithira", "Chothhi", "Visakham", "Anizham", "Thrikketta", 
  "Moolam", "Pooradam", "Uthradam", "Thiruvonam", "Avittam", "Chathayam", 
  "Pooruruttathi", "Uthruttathi", "Revathi"
];

const EDUCATION_OPTIONS = [
  "High School / SSLC",
  "Plus Two / Higher Secondary",
  "Diploma / ITI",
  "B.Tech / B.E. (Engineering)",
  "M.Tech / M.E.",
  "BCA (Computer Applications)",
  "MCA (Master of Computer Applications)",
  "B.Sc (Bachelor of Science)",
  "M.Sc (Master of Science)",
  "B.Com (Bachelor of Commerce)",
  "M.Com (Master of Commerce)",
  "BBA (Business Administration)",
  "MBA (Master of Business Administration)",
  "MBBS (Medicine)",
  "BDS (Dental)",
  "MD / MS / Super Specialty",
  "B.Pharm / M.Pharm",
  "BAMS / BHMS (Ayurveda / Homeopathy)",
  "B.Sc Nursing / GNM",
  "CA / ACCA / ICWA",
  "CS (Company Secretary)",
  "LLB / LLM (Law)",
  "B.Ed / M.Ed (Teaching)",
  "B.Arch / M.Arch (Architecture)",
  "B.Des / M.Des (Design)",
  "BA (Bachelor of Arts)",
  "MA (Master of Arts)",
  "Ph.D / Doctorate",
];

const OCCUPATION_OPTIONS = [
  "Software Engineer / IT Professional",
  "Doctor / Medical Practitioner",
  "Nurse / Healthcare Professional",
  "Pharmacist",
  "Teacher / Professor / Educator",
  "Accountant / Auditor / CA",
  "Banking / Finance Professional",
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical / Electronics Engineer",
  "Architect / Interior Designer",
  "Businessman / Entrepreneur",
  "Manager / Executive",
  "HR / Recruitment Professional",
  "Sales & Marketing Professional",
  "Lawyer / Legal Professional",
  "Government / PSU Employee",
  "Defense / Police Services",
  "Civil Services (IAS/IPS/IFS)",
  "Designer / Artist / Animator",
  "Media / Journalist / Creator",
  "Chef / Hospitality Professional",
  "Pilot / Aviation Professional",
  "Merchant Navy / Marine Officer",
  "Technician / Skilled Specialist",
  "Self Employed / Freelancer",
  "Homemaker",
  "Student",
];

function CustomScrollSelect({ name, value, options, onChange, disabled, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isKnown = options.includes(value);
  const displayLabel = isKnown
    ? value
    : value === 'Other' || (value && !isKnown)
    ? 'Other (Specify...)'
    : placeholder;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white text-charcoal-text flex items-center justify-between disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon text-left cursor-pointer"
      >
        <span className={`truncate ${!value ? 'text-slate-400' : ''}`}>
          {displayLabel}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200/80 py-1 z-50 flex flex-col divide-y divide-slate-50">
          <button
            type="button"
            onClick={() => {
              onChange({ target: { name, value: '' } });
              setIsOpen(false);
            }}
            className="px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50 font-medium"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange({ target: { name, value: opt } });
                setIsOpen(false);
              }}
              className={`px-3 py-1.5 text-left text-xs hover:bg-slate-50 font-medium transition-colors ${
                value === opt ? 'bg-deep-maroon/10 text-deep-maroon font-bold' : 'text-charcoal-text'
              }`}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onChange({ target: { name, value: 'Other' } });
              setIsOpen(false);
            }}
            className={`px-3 py-1.5 text-left text-xs hover:bg-slate-50 font-semibold transition-colors ${
              value === 'Other' || (value && !isKnown) ? 'bg-deep-maroon/10 text-deep-maroon font-bold' : 'text-slate-600'
            }`}
          >
            Other (Specify...)
          </button>
        </div>
      )}
    </div>
  );
}

export default function Search() {
  const toast = useToast();
  const [lookingFor, setLookingFor] = useState('Bride');
  const [religion, setReligion] = useState('All');
  const [caste, setCaste] = useState('Open to all');
  const [location, setLocation] = useState('');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('');
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLookingForGroom = (gender) => ['groom', 'male', 'man'].includes(String(gender || '').trim().toLowerCase());
  const getMinAllowedAge = (gender) => isLookingForGroom(gender) ? 21 : 18;

  const handleLookingForChange = (newGender) => {
    setLookingFor(newGender);
    const minAllowed = getMinAllowedAge(newGender);
    if (!minAge || minAge === '18' || minAge === '21' || parseInt(minAge, 10) < minAllowed) {
      setMinAge(String(minAllowed));
    }
  };

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

  const [allCastes, setAllCastes] = useState([]);

  useEffect(() => {
    axiosInstance.get('/public/castes')
      .then(res => setAllCastes(res.data.castes || []))
      .catch(() => {
        axiosInstance.get('/admin/castes')
          .then(res => setAllCastes(res.data.castes || []))
          .catch(err => console.error('Failed to fetch castes for search', err));
      });
  }, []);

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

  const updateUrlWithFilters = (filterState) => {
    const urlParams = new URLSearchParams();
    if (filterState.gender) urlParams.set('gender', filterState.gender);
    if (filterState.religion && filterState.religion !== 'All' && filterState.religion !== 'All Religions') {
      urlParams.set('religion', filterState.religion);
    }
    if (filterState.caste && filterState.caste !== 'Open to all') urlParams.set('caste', filterState.caste);
    if (filterState.location) urlParams.set('location', filterState.location);
    if (filterState.maritalStatus) urlParams.set('maritalStatus', filterState.maritalStatus);
    if (filterState.minAge) urlParams.set('minAge', filterState.minAge);
    if (filterState.maxAge) urlParams.set('maxAge', filterState.maxAge);
    if (filterState.profession) urlParams.set('profession', filterState.profession);
    if (filterState.education) urlParams.set('education', filterState.education);
    if (filterState.searchId) urlParams.set('profileId', filterState.searchId);

    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState(null, '', newUrl);
  };

  const performSearchWithParams = async (filters) => {
    setSearched(true);
    setIsLoading(true);

    try {
      const apiParams = {};
      if (filters.searchId && filters.searchId.trim() !== '') apiParams.profileId = filters.searchId.trim();
      if (filters.gender) apiParams.gender = filters.gender;
      if (filters.religion && filters.religion !== 'All' && filters.religion !== 'All Religions') {
        apiParams.religion = filters.religion;
      }
      if (filters.location) apiParams.location = filters.location;
      if (filters.maritalStatus) apiParams.maritalStatus = filters.maritalStatus;
      if (filters.profession) apiParams.profession = filters.profession;
      if (filters.education) apiParams.education = filters.education;
      if (filters.caste && filters.caste !== 'Open to all') apiParams.community = filters.caste;
      if (filters.minAge) apiParams.minAge = filters.minAge;
      if (filters.maxAge) apiParams.maxAge = filters.maxAge;

      updateUrlWithFilters(filters);

      const response = await axiosInstance.get('/users/search', { params: apiParams });
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
    }
  };

  const performSearch = () => {
    performSearchWithParams({
      gender: lookingFor,
      religion,
      location,
      caste,
      maritalStatus,
      minAge,
      maxAge,
      profession,
      education,
      searchId
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genderParam = params.get('gender');
    const ageParam = params.get('age');
    const minAgeParam = params.get('minAge');
    const maxAgeParam = params.get('maxAge');
    const religionParam = params.get('religion');
    const locationParam = params.get('location');
    const casteParam = params.get('caste');
    const maritalStatusParam = params.get('maritalStatus');
    const professionParam = params.get('profession');
    const educationParam = params.get('education');
    const profileIdParam = params.get('profileId');

    let isFiltered = false;

    if (genderParam) { setLookingFor(genderParam); isFiltered = true; }
    if (religionParam) { setReligion(religionParam); isFiltered = true; } else { setReligion('All'); }
    if (locationParam) { setLocation(locationParam); isFiltered = true; }
    if (casteParam) { setCaste(casteParam); isFiltered = true; }
    if (profileIdParam) { setSearchId(profileIdParam); isFiltered = true; }

    if (maritalStatusParam) { 
      setMaritalStatus(maritalStatusParam); 
      isFiltered = true;
    }
    if (professionParam) { 
      setProfession(professionParam); 
      isFiltered = true;
    }
    if (educationParam) { 
      setEducation(educationParam); 
      isFiltered = true;
    }
    const genderVal = genderParam || 'Bride';
    const minAllowed = getMinAllowedAge(genderVal);
    let resolvedMinAge = String(minAllowed);

    if (minAgeParam || maxAgeParam) {
      if (minAgeParam) {
        resolvedMinAge = minAgeParam;
        setMinAge(minAgeParam);
      }
      if (maxAgeParam) setMaxAge(maxAgeParam);
      isFiltered = true;
    } else if (ageParam) {
      const [min, max] = ageParam.split('-');
      if (min) {
        resolvedMinAge = min;
        setMinAge(min);
      }
      if (max) setMaxAge(max);
      isFiltered = true;
    } else {
      setMinAge(resolvedMinAge);
    }

    performSearchWithParams({
      gender: genderVal,
      religion: religionParam || 'All',
      location: locationParam || '',
      caste: casteParam || 'Open to all',
      maritalStatus: maritalStatusParam || 'Never Married',
      minAge: resolvedMinAge,
      maxAge: maxAgeParam || (ageParam ? ageParam.split('-')[1] : ''),
      profession: professionParam || '',
      education: educationParam || '',
      searchId: profileIdParam || ''
    });
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    performSearch();
  };

  return (
    <div className="w-full flex flex-col pt-16 bg-slate-50 min-h-screen">
      {/* Header Banner (Compact) */}
      <section className="relative bg-gradient-to-r from-primary via-deep-maroon to-primary py-3.5 sm:py-4.5 text-white text-center px-margin-mobile md:px-margin-desktop overflow-hidden">
        {/* Background Graphics */}
        <div className="absolute inset-0 opacity-10 hero-pattern pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-container-max mx-auto relative z-10 w-full">
          {/* Back Navigation */}
          <div className="flex justify-start mb-1">
            <Link 
              to="/" 
              title="Back to Home"
              aria-label="Back to Home"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs border border-white/20 active:scale-95 group"
            >
              <span className="material-symbols-outlined text-base sm:text-lg group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
            </Link>
          </div>

          <h1 className="font-display-lg text-sm sm:text-base font-bold text-heritage-gold uppercase tracking-wider mb-2.5">
            Search Your Partner Here
          </h1>

          {/* Search by Profile ID Input */}
          <form onSubmit={handleSearch} className="max-w-xs sm:max-w-sm mx-auto relative px-2">
            <input
              type="text"
              placeholder="Search by ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-white rounded-full py-1.5 px-4 pr-9 text-xs font-body-sm text-charcoal-text placeholder-soft-gray/60 focus:outline-none shadow-sm border border-slate-100"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-deep-maroon text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[12px] text-white">search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Main Filter Section */}
      <section className="py-6 md:py-10 relative z-10 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-100">
          <form onSubmit={handleSearch} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  Religion
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white"
                >
                  <option value="All">All Religions</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  Caste
                </label>
                <select
                  value={caste}
                  onChange={(e) => setCaste(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white text-slate-800 font-medium"
                >
                  <option value="Open to all">All Castes</option>
                  {allCastes
                    .filter((c) => !religion || c.religion?.toLowerCase() === religion.toLowerCase())
                    .map((c) => (
                      <option key={c.id} value={c.caste_name}>
                        {c.caste_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="text-left">
                <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                  I'm Looking For
                </label>
                <select
                  value={lookingFor}
                  onChange={(e) => handleLookingForChange(e.target.value)}
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
                  {KERALA_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
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
                      Age Between
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={minAge || String(getMinAllowedAge(lookingFor))}
                        onChange={(e) => setMinAge(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg py-2 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                      >
                        <option value="">Min Age</option>
                        {Array.from({ length: 70 - getMinAllowedAge(lookingFor) + 1 }, (_, i) => i + getMinAllowedAge(lookingFor)).map(a => (
                          <option key={a} value={a}>{a} Yrs</option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400 font-bold">-</span>
                      <select
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg py-2 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                      >
                        <option value="">Max Age</option>
                        {Array.from({ length: 53 }, (_, i) => i + 18).map(a => (
                          <option key={a} value={a}>{a} Yrs</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                      Profession
                    </label>
                    <CustomScrollSelect
                      name="profession"
                      value={profession}
                      options={OCCUPATION_OPTIONS}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Any Profession"
                    />
                    {(!OCCUPATION_OPTIONS.includes(profession) && profession !== '') && (
                      <input
                        type="text"
                        placeholder="Specify profession"
                        value={profession === 'Other' ? '' : profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="mt-1.5 w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                      />
                    )}
                  </div>

                  <div className="text-left">
                    <label className="block text-[9px] md:text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                      Education
                    </label>
                    <CustomScrollSelect
                      name="education"
                      value={education}
                      options={EDUCATION_OPTIONS}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="Any Education"
                    />
                    {(!EDUCATION_OPTIONS.includes(education) && education !== '') && (
                      <input
                        type="text"
                        placeholder="Specify education"
                        value={education === 'Other' ? '' : education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="mt-1.5 w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                      />
                    )}
                  </div>
                </div>
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
        <div className="max-w-6xl mx-auto" ref={resultsRef}>
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
                <div className="bg-white py-8 rounded-xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                  <LoadingSpinner text="Searching Profiles..." />
                  <p className="text-xs text-soft-gray -mt-4">Please wait while we find the best matches for you.</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
                    toast.error('Please enter your Date of Birth and Time of Birth.');
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
