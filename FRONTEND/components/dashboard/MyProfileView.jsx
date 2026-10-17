import React, { useState, useEffect, useRef } from 'react';
import HoroscopeChartsProfile from '../HoroscopeChartsProfile';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import axiosInstance from '../../src/utils/axiosInstance';
import * as kollavarshamPkg from 'kollavarsham';

const Kollavarsham = kollavarshamPkg.Kollavarsham || kollavarshamPkg.default || kollavarshamPkg;
const kollavarshamInstance = new Kollavarsham();
const HEIGHT_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const cm = 120 + i;
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) { feet += 1; inches = 0; }
  return { value: String(cm), label: `${cm} cm - ${feet} ft ${inches}` };
});

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

const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod"
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
        className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text flex items-center justify-between disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon text-left cursor-pointer"
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
            className="px-3 py-1.5 text-left text-[11px] text-slate-400 hover:bg-slate-50 font-medium"
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
              className={`px-3 py-1.5 text-left text-[11px] hover:bg-slate-50 font-medium transition-colors ${
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
            className={`px-3 py-1.5 text-left text-[11px] hover:bg-slate-50 font-semibold transition-colors ${
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

export default function MyProfileView({ onProfileUpdate, onNext }) {
  const { user, login } = useAuth();
  const toast = useToast();
  
  const [casteOptions, setCasteOptions] = useState([]);
  
  const [profileData, setProfileData] = useState({
    name: '',
    gender: '',
    religion: '',
    age: '',
    maritalStatus: '',
    height: '',
    profileCreatedFor: '',
    caste: '',
    motherTongue: '',
    education: '',
    profession: '',
    employmentStatus: 'Working',
    country: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    houseName: '',
    streetLocality: '',
    postOffice: '',
    birthTime: '',
    janmaSistaDasa: '',
    endDasa: '',
    dobMalayalam: '',
    dobEnglish: '',
    nakshatra: '',
    rasi: '',
    fathersName: '',
    fathersJob: '',
    mothersName: '',
    mothersJob: '',
    siblingDetails: '',
    aboutMe: '',
  });

  const [initialProfileData, setInitialProfileData] = useState(null);
  const [initialGrahanila, setInitialGrahanila] = useState(null);
  const [initialNavamsakam, setInitialNavamsakam] = useState(null);
  const [isNextClicked, setIsNextClicked] = useState(false);

  useEffect(() => {
    // Fetch available castes (try public first, fallback to admin)
    axiosInstance.get('/public/castes')
      .then(res => setCasteOptions(res.data.castes || []))
      .catch(() => {
        axiosInstance.get('/admin/castes')
          .then(res => setCasteOptions(res.data.castes || []))
          .catch(err => console.error('Failed to fetch castes', err));
      });

    if (user?.profile_id) {
      axiosInstance.get(`/users/profile/${user.profile_id}`)
        .then(res => {
          const fetchedProfile = res.data.user;
          if (fetchedProfile) {
            const data = {
              name: fetchedProfile.name || '',
              gender: fetchedProfile.gender || '',
              religion: fetchedProfile.religion || '',
              age: fetchedProfile.age || '',
              maritalStatus: fetchedProfile.marital_status || '',
              height: fetchedProfile.height || '',
              profileCreatedFor: fetchedProfile.profile_created_for || '',
              caste: fetchedProfile.caste || '',
              motherTongue: fetchedProfile.mother_tongue || fetchedProfile.language || 'Malayalam',
              education: fetchedProfile.education || '',
              profession: fetchedProfile.profession || '',
              employmentStatus: fetchedProfile.employmentStatus || fetchedProfile.employment_status || 'Working',
              country: fetchedProfile.country || '',
              state: fetchedProfile.state || '',
              district: fetchedProfile.district ? fetchedProfile.district.replace(/^\d+\s*-\s*/, '') : '',
              city: fetchedProfile.place || '',
              pincode: fetchedProfile.pincode || '',
              houseName: fetchedProfile.house_name || '',
              streetLocality: fetchedProfile.street_locality || '',
              postOffice: fetchedProfile.post_office || '',
              birthTime: fetchedProfile.birth_time || '',
              janmaSistaDasa: '', // Not in DB schema
              endDasa: '', // Not in DB schema
              dobMalayalam: fetchedProfile.date_of_birth_malayalam ? (() => {
                const parts = fetchedProfile.date_of_birth_malayalam.split(' ');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return fetchedProfile.date_of_birth_malayalam;
              })() : '',
              dobEnglish: fetchedProfile.date_of_birth ? (() => {
                const d = new Date(fetchedProfile.date_of_birth);
                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              })() : '',
              nakshatra: fetchedProfile.nakshatra || '',
              rasi: fetchedProfile.rasi || '',
              fathersName: fetchedProfile.fathers_name || '',
              fathersJob: fetchedProfile.fathers_job || '',
              mothersName: fetchedProfile.mothers_name || '',
              mothersJob: fetchedProfile.mothers_job || '',
              siblingDetails: fetchedProfile.sibling_details || '',
              aboutMe: fetchedProfile.about_me || '',
            };
            setProfileData(data);
            setInitialProfileData(data);
          }
        })
        .catch(err => console.error('Failed to fetch profile', err));

      axiosInstance.get(`/users/profile/${user.profile_id}/planetary-positions`)
        .then(res => {
          const positions = res.data.positions || [];
          const newGrahanila = {};
          const newNavamsakam = {};
          
          const englishToPlanet = {
            'Lagna': 'ല',
            'Sun': 'സൂ',
            'Moon': 'ച',
            'Mars': 'ചൊ',
            'Mercury': 'ബു',
            'Jupiter': 'ഗു',
            'Venus': 'ശു',
            'Saturn': 'ശ',
            'Rahu': 'രാ',
            'Ketu': 'കെ'
          };

          positions.forEach(pos => {
            const malPlanet = englishToPlanet[pos.planet_name] || pos.planet_name;
            if (pos.chart_type === 'grahanila') {
              if (!newGrahanila[pos.house_number]) newGrahanila[pos.house_number] = [];
              newGrahanila[pos.house_number].push(malPlanet);
            } else if (pos.chart_type === 'navamsakam') {
              if (!newNavamsakam[pos.house_number]) newNavamsakam[pos.house_number] = [];
              newNavamsakam[pos.house_number].push(malPlanet);
            }
          });
          
          setGrahanila(newGrahanila);
          setInitialGrahanila(newGrahanila);
          setNavamsakam(newNavamsakam);
          setInitialNavamsakam(newNavamsakam);
        })
        .catch(err => console.error('Failed to fetch planetary positions', err));
    }
  }, [user?.profile_id]);

  const [grahanila, setGrahanila] = useState({});
  const [navamsakam, setNavamsakam] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasChanges = 
    JSON.stringify(profileData) !== JSON.stringify(initialProfileData) ||
    JSON.stringify(grahanila) !== JSON.stringify(initialGrahanila) ||
    JSON.stringify(navamsakam) !== JSON.stringify(initialNavamsakam);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'dobEnglish') {
        if (value && value.includes('/')) {
          const parts = value.split('/');
          if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(d.getTime())) {
              // Calculate Age
              const today = new Date();
              let age = today.getFullYear() - d.getFullYear();
              const m = today.getMonth() - d.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
                age--;
              }
              newData.age = age;

              // Calculate Malayalam DOB if Hindu
              if (user?.religion === 'Hindu') {
                const result = kollavarshamInstance.fromGregorianDate(d);
                newData.dobMalayalam = `${String(result.date).padStart(2, '0')}/${String(result.month).padStart(2, '0')}/${String(result.year).padStart(4, '0')}`;
              }
            }
          }
        }
      }
      return newData;
    });
  };

  const handleSubmit = (e, shouldGoNextParam = false) => {
    if (e) e.preventDefault();
    const shouldGoNext = shouldGoNextParam || isNextClicked;
    setIsNextClicked(false);
    
    if (!user?.profile_id) return;

    if (!profileData.pincode || profileData.pincode.length !== 6 || !/^\d+$/.test(profileData.pincode)) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return;
    }

    const submitData = { ...profileData };
    if (submitData.dobEnglish && submitData.dobEnglish.includes('/')) {
      const parts = submitData.dobEnglish.split('/');
      if (parts.length === 3) {
        submitData.dobEnglish = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    if (submitData.nakshatra || submitData.rasi) {
      submitData.starRasi = `${submitData.nakshatra || ''} / ${submitData.rasi || ''}`;
    } else {
      submitData.starRasi = '';
    }

    const planetToEnglish = {
      'ല': 'Lagna',
      'സൂ': 'Sun',
      'ച': 'Moon',
      'ചൊ': 'Mars',
      'ബു': 'Mercury',
      'ഗു': 'Jupiter',
      'ശു': 'Venus',
      'ശ': 'Saturn',
      'രാ': 'Rahu',
      'കെ': 'Ketu'
    };

    const positions = [];
    Object.keys(grahanila).forEach(house => {
      grahanila[house].forEach(planet => {
        const enPlanet = planetToEnglish[planet] || planet;
        positions.push({ chart_type: 'grahanila', planet_name: enPlanet, house_number: Number(house) });
      });
    });
    Object.keys(navamsakam).forEach(house => {
      navamsakam[house].forEach(planet => {
        const enPlanet = planetToEnglish[planet] || planet;
        positions.push({ chart_type: 'navamsakam', planet_name: enPlanet, house_number: Number(house) });
      });
    });

    const updateProfilePromise = axiosInstance.put(`/users/profile/${user.profile_id}`, submitData);
    
    // Only call planetary-positions endpoint if religion is Hindu
    const isHindu = ((user.religion || profileData.religion || '').toLowerCase() === 'hindu');
    const updatePositionsPromise = (isHindu && positions.length > 0)
      ? axiosInstance.put(`/users/profile/${user.profile_id}/planetary-positions`, { positions }).catch(err => {
          console.warn('Astrology positions update error (non-fatal):', err);
        })
      : Promise.resolve();

    Promise.all([updateProfilePromise, updatePositionsPromise])
      .then(() => {
        setIsSaved(true);
        setIsEditing(false);
        setInitialProfileData(profileData);
        setInitialGrahanila(grahanila);
        setInitialNavamsakam(navamsakam);
        // Sync the updated name to the global AuthContext so the sidebar/header updates instantly
        if (profileData.name && user.full_name !== profileData.name) {
          login({ ...user, full_name: profileData.name });
        }
        if (onProfileUpdate) onProfileUpdate();
        toast.success("Profile updated successfully!");
        setTimeout(() => setIsSaved(false), 3000);
        
        if (shouldGoNext && typeof onNext === 'function') {
          onNext();
        }
      })
      .catch(err => {
        console.error('Failed to update profile or planetary positions', err);
        const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to update profile. Please try again.";
        toast.error(errMsg);
      });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-6 shadow-none md:shadow-sm text-left">
        <div className="mb-4 md:mb-6 border-b border-slate-100 pb-3 md:pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm md:text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
              My Profile
            </h2>
            <p className="text-[10px] md:text-[11px] text-soft-gray mt-0.5">
              Keep your profile updated to receive higher <br className="block md:hidden" /> match quality.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSaved && (
              <div className="text-[10px] md:text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                <span className="material-symbols-outlined text-[12px] md:text-[13px]">check_circle</span>
                Saved!
              </div>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-slate-100 hover:bg-slate-200 text-charcoal-text font-semibold py-1.5 px-3 md:py-2 md:px-4 rounded-lg shadow-sm transition-all cursor-pointer text-[11px] md:text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[12px] md:text-[14px] -mt-[1px]">edit</span>
                <span className="mt-[1px]">Edit <span className="hidden md:inline">Profile</span></span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} noValidate className="space-y-4 md:space-y-6">
          {/* Section 1: About Me */}
          <div className="space-y-2">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-deep-maroon">About Me</h3>
            <textarea
              name="aboutMe"
              value={profileData.aboutMe}
              onChange={handleChange} disabled={!isEditing}
              rows={3}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/60 leading-relaxed"
              placeholder="Tell prospective matches about your personality, interests, and family..."
            />
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Personal Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-deep-maroon">Personal Details</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Gender</label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Height</label>
                <select
                  name="height"
                  value={profileData.height}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Height</option>
                  {HEIGHT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Age</label>
                <input
                  type="text"
                  name="age"
                  value={profileData.age}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={profileData.maritalStatus}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Marital Status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Second Marriage">Second Marriage</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Profile Created For</label>
                <select
                  name="profileCreatedFor"
                  value={profileData.profileCreatedFor}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select</option>
                  <option value="Myself">Myself</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Relative">Relative</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Caste / Community</label>
                <select
                  name="caste"
                  value={profileData.caste}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Caste / Community</option>
                  {casteOptions
                    .filter((c) => {
                      const userReligion = profileData?.religion || user?.religion || 'Hindu';
                      return c.religion?.toLowerCase() === userReligion.toLowerCase();
                    })
                    .map((c) => (
                      <option key={c.id} value={c.caste_name}>
                        {c.caste_name}
                      </option>
                    ))}
                  {/* Keep current custom caste if not in the list */}
                  {profileData.caste &&
                    !casteOptions.some((c) => c.caste_name === profileData.caste) && (
                      <option value={profileData.caste}>{profileData.caste}</option>
                    )}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Mother Tongue</label>
                <select
                  name="motherTongue"
                  value={profileData.motherTongue}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Mother Tongue</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Tamil">Tamil</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Professional Info */}
          <div className="space-y-3">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-deep-maroon">Professional & Academic Details</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Education Level</label>
                <CustomScrollSelect
                  name="education"
                  value={profileData.education}
                  options={EDUCATION_OPTIONS}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Select Education"
                />

                {(!EDUCATION_OPTIONS.includes(profileData.education) && profileData.education !== '') && (
                  <input
                    type="text"
                    name="education"
                    placeholder="Specify your course / degree"
                    value={profileData.education === 'Other' ? '' : profileData.education}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-white text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  />
                )}
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Occupation / Profession</label>
                <CustomScrollSelect
                  name="profession"
                  value={profileData.profession}
                  options={OCCUPATION_OPTIONS}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Select Occupation / Profession"
                />

                {(!OCCUPATION_OPTIONS.includes(profileData.profession) && profileData.profession !== '') && (
                  <input
                    type="text"
                    name="profession"
                    placeholder="Specify your occupation"
                    value={profileData.profession === 'Other' ? '' : profileData.profession}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-white text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  />
                )}
              </div>
              
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Employment Status</label>
                <select
                  name="employmentStatus"
                  value={profileData.employmentStatus}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Status</option>
                  <option value="Working">Working</option>
                  <option value="Not Working">Not Working</option>
                </select>
              </div>

            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Location Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-deep-maroon">Location Details</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Country</label>
                <input
                  type="text"
                  name="country"
                  value={profileData.country}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={profileData.state}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">District</label>
                <select
                  name="district"
                  value={profileData.district}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select District</option>
                  {KERALA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleChange} disabled={!isEditing}
                  placeholder="e.g. Kozhikode"
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">PIN Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="pincode"
                  value={profileData.pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleChange({ target: { name: 'pincode', value: val } });
                  }}
                  disabled={!isEditing}
                  required
                  placeholder="6-digit PIN"
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">House Name / Flat No.</label>
                <input
                  type="text"
                  name="houseName"
                  value={profileData.houseName}
                  onChange={handleChange} disabled={!isEditing}
                  placeholder="e.g. Skyline Apartments"
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Street / Area / Locality</label>
                <input
                  type="text"
                  name="streetLocality"
                  value={profileData.streetLocality}
                  onChange={handleChange} disabled={!isEditing}
                  placeholder="e.g. MG Road, Near Metro"
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Post Office</label>
                <input
                  type="text"
                  name="postOffice"
                  value={profileData.postOffice}
                  onChange={handleChange} disabled={!isEditing}
                  placeholder="e.g. Ernakulam North PO"
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

         

          {/* Section: Family Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-deep-maroon">Family details</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Father's Name</label>
                <input type="text" name="fathersName" value={profileData.fathersName} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
              </div>
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Father's Job</label>
                <input type="text" name="fathersJob" value={profileData.fathersJob} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
              </div>
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Mother's Name</label>
                <input type="text" name="mothersName" value={profileData.mothersName} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
              </div>
              <div className="col-span-1">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Mother's Job</label>
                <input type="text" name="mothersJob" value={profileData.mothersJob} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
              </div>
              <div className="col-span-2">
                <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Sibling Details</label>
                <textarea name="siblingDetails" value={profileData.siblingDetails} onChange={handleChange} disabled={!isEditing} rows={2} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
              </div>
            </div>
          </div>
          {/* Section: Horoscope Details */}
          {user?.religion === 'Hindu' && (
            <div className="space-y-3">
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-deep-maroon">Horoscope Details</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Birth Time</label>
                  <input type="time" name="birthTime" value={profileData.birthTime} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div>
                {/* <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Janma Sista Dasa</label>
                  <input type="text" name="janmaSistaDasa" value={profileData.janmaSistaDasa} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div> */}
                <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">End Dasa</label>
                  <input type="text" name="endDasa" value={profileData.endDasa} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Dob (Malayalam)</label>
                  <input type="text" name="dobMalayalam" value={profileData.dobMalayalam} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Dob (English)</label>
                  <input type="text" placeholder="DD/MM/YYYY" name="dobEnglish" value={profileData.dobEnglish} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Star / Nakshatra</label>
                  <input type="text" name="nakshatra" value={profileData.nakshatra} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[9px] md:text-[10px] text-slate-400 font-semibold mb-0.5">Rasi</label>
                  <input type="text" name="rasi" value={profileData.rasi} onChange={handleChange} disabled={!isEditing} className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] md:text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon" />
                </div>
              </div>
              <HoroscopeChartsProfile 
                editMode={isEditing} 
                grahanila={grahanila}
                setGrahanila={setGrahanila}
                navamsakam={navamsakam}
                setNavamsakam={setNavamsakam}
              />
            </div>
          )}

          <hr className="border-slate-100" />

          {isEditing && (
            <div className="pt-2 md:pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (initialProfileData) setProfileData(initialProfileData);
                  if (initialGrahanila) setGrahanila(initialGrahanila);
                  if (initialNavamsakam) setNavamsakam(initialNavamsakam);
                }}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-charcoal-text font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-lg shadow-sm transition-all cursor-pointer text-[10px] md:text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges}
                className={`font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-lg shadow-md transition-all text-[10px] md:text-xs uppercase tracking-wider ${
                  hasChanges 
                    ? 'bg-deep-maroon hover:bg-primary text-white hover:shadow-lg active:scale-[0.98] cursor-pointer' 
                    : 'bg-deep-maroon text-white opacity-50 cursor-not-allowed'
                }`}
              >
                Save
              </button>
              <button
                type={hasChanges ? "submit" : "button"}
                onClick={(e) => {
                  if (hasChanges) {
                    setIsNextClicked(true);
                  } else {
                    if (onNext) onNext();
                  }
                }}
                className="font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-lg shadow-md transition-all text-[10px] md:text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                {hasChanges ? 'Save & Next' : 'Next'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
