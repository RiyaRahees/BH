import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';

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
        className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text flex items-center justify-between disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon text-left cursor-pointer"
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

function LocationMultiSelect({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const rawTokens = value 
    ? String(value).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const isAnySelected = rawTokens.length === 0 || rawTokens.some(t => ['any', 'all', 'open to all', 'kerala', 'any district / kerala', 'any district'].includes(t.toLowerCase()));

  const selectedDistricts = isAnySelected 
    ? [] 
    : rawTokens.filter(t => KERALA_DISTRICTS.map(d => d.toLowerCase()).includes(t.toLowerCase())).map(t => {
        const found = KERALA_DISTRICTS.find(d => d.toLowerCase() === t.toLowerCase());
        return found || t;
      });

  const toggleDistrict = (district) => {
    let newDistricts = [...selectedDistricts];
    if (newDistricts.includes(district)) {
      newDistricts = newDistricts.filter(d => d !== district);
    } else {
      newDistricts.push(district);
    }

    if (newDistricts.length === 0 || newDistricts.length === KERALA_DISTRICTS.length) {
      onChange({ target: { name: 'location', value: 'Any District / Kerala' } });
    } else {
      onChange({ target: { name: 'location', value: newDistricts.join(', ') } });
    }
  };

  const removeDistrict = (district) => {
    const newDistricts = selectedDistricts.filter(d => d !== district);
    if (newDistricts.length === 0) {
      onChange({ target: { name: 'location', value: 'Any District / Kerala' } });
    } else {
      onChange({ target: { name: 'location', value: newDistricts.join(', ') } });
    }
  };

  const selectOnlyAllKerala = () => {
    onChange({ target: { name: 'location', value: 'Any District / Kerala' } });
  };

  const filteredDistricts = KERALA_DISTRICTS.filter(d => 
    d.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2.5" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full border rounded-xl py-2.5 px-3.5 text-xs transition-all flex items-center justify-between text-left cursor-pointer ${
            isOpen 
              ? 'border-deep-maroon ring-2 ring-deep-maroon/10 bg-white shadow-sm' 
              : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
          } ${disabled ? 'opacity-70 bg-slate-100/50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            <span className="material-symbols-outlined text-[18px] text-deep-maroon shrink-0">
              location_on
            </span>
            <div className="truncate">
              {isAnySelected ? (
                <span className="font-semibold text-charcoal-text text-xs">
                  Any District / All Kerala <span className="text-slate-400 font-normal">(Open to all 14 districts)</span>
                </span>
              ) : (
                <span className="font-semibold text-deep-maroon text-xs">
                  {selectedDistricts.length} {selectedDistricts.length === 1 ? 'District' : 'Districts'} Selected
                  <span className="text-slate-500 font-normal ml-1.5 truncate">
                    ({selectedDistricts.join(', ')})
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isAnySelected && (
              <span className="bg-deep-maroon/10 text-deep-maroon text-[10px] font-bold px-2 py-0.5 rounded-full">
                {selectedDistricts.length}
              </span>
            )}
            <span className="material-symbols-outlined text-[18px] text-slate-400">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </button>

        {isOpen && !disabled && (
          <div className="mt-2.5 bg-white rounded-xl shadow-xs border border-slate-200 py-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 pb-2.5 space-y-2 border-b border-slate-100">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search district (e.g., Ernakulam, Kollam)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white text-charcoal-text"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={selectOnlyAllKerala}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAnySelected
                      ? 'bg-deep-maroon text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">public</span>
                  All Kerala (Open to All)
                </button>

                {!isAnySelected && selectedDistricts.length > 0 && (
                  <button
                    type="button"
                    onClick={selectOnlyAllKerala}
                    className="text-[11px] text-slate-500 hover:text-deep-maroon font-medium px-2 py-1 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                    Reset to All Kerala
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto px-2 py-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filteredDistricts.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 col-span-2">
                  No district found matching "{search}"
                </div>
              ) : (
                filteredDistricts.map((district) => {
                  const isChecked = !isAnySelected && selectedDistricts.includes(district);
                  return (
                    <label
                      key={district}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDistrict(district);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors border ${
                        isChecked 
                          ? 'bg-deep-maroon/10 border-deep-maroon/20 text-deep-maroon font-bold' 
                          : 'hover:bg-slate-50 border-transparent text-charcoal-text font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-deep-maroon border-deep-maroon text-white' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && (
                            <span className="material-symbols-outlined text-[11px] leading-none">
                              check
                            </span>
                          )}
                        </div>
                        <span className="truncate">{district}</span>
                      </div>
                      {isChecked && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-deep-maroon bg-white/90 px-1 py-0.2 rounded shrink-0">
                          Selected
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="px-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {isAnySelected 
                  ? 'Matches profiles across all Kerala' 
                  : `Matches profiles in ${selectedDistricts.length} selected district(s)`}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {isAnySelected ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">
              public
            </span>
            Any District / Open to All Kerala
          </span>
        ) : (
          selectedDistricts.map((district) => (
            <span
              key={district}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50/90 text-deep-maroon border border-amber-200/80 shadow-2xs group animate-in fade-in duration-100"
            >
              <span className="material-symbols-outlined text-[13px] text-amber-700">
                location_on
              </span>
              {district}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeDistrict(district)}
                  className="w-4 h-4 rounded-full hover:bg-deep-maroon hover:text-white inline-flex items-center justify-center text-slate-400 transition-colors ml-0.5 cursor-pointer text-[10px]"
                  title={`Remove ${district}`}
                >
                  ✕
                </button>
              )}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
import LoadingSpinner from '../LoadingSpinner';

const religionOptions = [
  { value: '', label: 'Any Religion' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Christian', label: 'Christian' },
  { value: 'Muslim', label: 'Muslim' },
  { value: 'Other', label: 'Other' }
];

export default function PartnerPreferencesView({ onProfileUpdate, onNext }) {
  const toast = useToast();
  const { user } = useAuth();

  const userGender = user?.gender;
  const isMaleUser = userGender ? ['male', 'groom', 'man'].includes(String(userGender).trim().toLowerCase()) : true;
  const partnerLabel = isMaleUser ? 'Bride' : 'Groom';
  const minAllowedAge = isMaleUser ? 18 : 21;

  const [preferences, setPreferences] = useState({
    ageMin: minAllowedAge,
    ageMax: '',
    heightMin: '',
    heightMax: '',
    maritalStatus: '',
    religion: '',
    caste: '',
    motherTongue: 'Malayalam',
    education: '',
    profession: '',
    location: '',
  });

  const [initialPreferences, setInitialPreferences] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allCastes, setAllCastes] = useState([]);

  useEffect(() => {
    // Fetch all castes for cascading dropdown
    axiosInstance.get('/public/castes')
      .then(res => setAllCastes(res.data.castes || []))
      .catch(() => {
        axiosInstance.get('/admin/castes')
          .then(res => setAllCastes(res.data.castes || []))
          .catch(err => console.error('Failed to fetch castes in partner preferences', err));
      });
  }, []);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (user?.profile_id) {
        try {
          const response = await axiosInstance.get(`/users/profile/${user.profile_id}/partner-preferences`);
          const data = response.data.preferences;
          if (data) {
            const parsedMinAge = data.min_age ? Math.max(parseInt(data.min_age, 10), minAllowedAge) : minAllowedAge;
            const newPrefs = {
              ageMin: parsedMinAge,
              ageMax: data.max_age || '',
              heightMin: data.min_height || '',
              heightMax: data.max_height || '',
              maritalStatus: data.marital_status || '',
              religion: data.religion || '',
              caste: data.caste || '',
              motherTongue: data.mother_tongue || 'Malayalam',
              education: data.education_level || '',
              profession: data.preferred_professions || '',
              location: data.location_preferences || '',
            };
            setPreferences(newPrefs);
            setInitialPreferences(newPrefs);
          } else {
            setPreferences(prev => ({ ...prev, ageMin: minAllowedAge }));
          }
        } catch (error) {
          console.error("Failed to fetch partner preferences:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchPreferences();
  }, [user?.profile_id, minAllowedAge]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'heightMin' && value && next.heightMax && parseInt(next.heightMax, 10) <= parseInt(value, 10)) {
        next.heightMax = '';
      }
      if (name === 'heightMax' && value && next.heightMin && parseInt(value, 10) <= parseInt(next.heightMin, 10)) {
        next.heightMin = '';
      }
      return next;
    });
  };

  const handleMinAgeBlur = () => {
    if (preferences.ageMin !== '') {
      const num = parseInt(preferences.ageMin, 10);
      if (!isNaN(num) && num < minAllowedAge) {
        setPreferences(prev => ({ ...prev, ageMin: minAllowedAge }));
        toast.warning(`Minimum age preference for ${partnerLabel} is ${minAllowedAge} years.`);
      }
    }
  };

  const handleSubmit = async (e, shouldGoNext = false) => {
    if (e) e.preventDefault();
    if (user?.profile_id) {
      if (preferences.ageMin && parseInt(preferences.ageMin, 10) < minAllowedAge) {
        toast.error(`Minimum age preference for ${partnerLabel} cannot be less than ${minAllowedAge} years.`);
        setPreferences(prev => ({ ...prev, ageMin: minAllowedAge }));
        return;
      }

      if (preferences.ageMin && preferences.ageMax && parseInt(preferences.ageMax, 10) <= parseInt(preferences.ageMin, 10)) {
        toast.error("Maximum age must be greater than Minimum age.");
        return;
      }

      if (preferences.heightMin && preferences.heightMax && parseInt(preferences.heightMax, 10) <= parseInt(preferences.heightMin, 10)) {
        toast.error("Maximum height must be greater than Minimum height.");
        return;
      }

      try {
        await axiosInstance.put(`/users/profile/${user.profile_id}/partner-preferences`, {
          min_age: preferences.ageMin || minAllowedAge,
          max_age: preferences.ageMax,
          min_height: preferences.heightMin,
          max_height: preferences.heightMax,
          marital_status: preferences.maritalStatus,
          mother_tongue: preferences.motherTongue,
          religion: preferences.religion,
          caste: preferences.caste,
          education_level: preferences.education,
          preferred_professions: preferences.profession,
          location_preferences: preferences.location
        });
        setIsSaved(true);
        setIsEditing(false);
        setInitialPreferences(preferences);
        if (onProfileUpdate) onProfileUpdate();
        toast.success("Preferences updated successfully!");
        setTimeout(() => setIsSaved(false), 3000);

        if (shouldGoNext && typeof onNext === 'function') {
          onNext();
        }
      } catch (error) {
        console.error("Failed to update partner preferences:", error);
        const errMsg = error.response?.data?.error || "Failed to save preferences. Please try again.";
        toast.error(errMsg);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading preferences..." />;
  }

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);

  // Filter castes by selected religion
  const dynamicCasteOptions = [
    { value: '', label: 'Any Caste' },
    ...allCastes
      .filter((c) => {
        if (!preferences.religion || preferences.religion === 'All' || preferences.religion === '') return true;
        return c.religion?.toLowerCase() === preferences.religion.toLowerCase();
      })
      .map((c) => ({ value: c.caste_name, label: c.caste_name }))
  ];

  return (
    <div className="w-full flex flex-col gap-6 pb-12 md:pb-16">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-6 shadow-none md:shadow-sm text-left">
        <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-heritage-gold"></span>
              Partner Preferences
            </h2>
            <p className="text-[11px] text-soft-gray mt-1">
              Refine your partner criteria to get more <br className="block md:hidden" /> relevant matches in your feed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSaved && (
              <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full flex items-center gap-1 animate-fade-in">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
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
                <span className="mt-[1px]">Edit <span className="hidden md:inline">Preferences</span></span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Section 1: Demographics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon">Basic Criteria</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                Seeking: <strong className="text-deep-maroon">{partnerLabel}</strong> (Min {minAllowedAge} yrs)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-slate-400 font-semibold">Min Age</label>
                  </div>
                  <input
                    type="number"
                    name="ageMin"
                    value={preferences.ageMin}
                    onChange={handleChange}
                    onBlur={handleMinAgeBlur}
                    disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    min={minAllowedAge}
                    max={preferences.ageMax ? parseInt(preferences.ageMax, 10) - 1 : "70"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Max Age</label>
                  <input
                    type="number"
                    name="ageMax"
                    value={preferences.ageMax}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    min={preferences.ageMin || minAllowedAge}
                    max="70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Min Height</label>
                  <select
                    name="heightMin"
                    value={preferences.heightMin}
                    onChange={handleChange} disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  >
                    <option value="">Any</option>
                    {HEIGHT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Max Height</label>
                  <select
                    name="heightMax"
                    value={preferences.heightMax}
                    onChange={handleChange} disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  >
                    <option value="">Any</option>
                    {HEIGHT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={preferences.maritalStatus}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Select Marital Status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Second Marriage">Second Marriage</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Mother Tongue</label>
                <select
                  name="motherTongue"
                  value={preferences.motherTongue}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  <option value="">Any Mother Tongue</option>
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

          {/* Section 2: Religion & Caste */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon">Religious & Community Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Religion</label>
                <select
                  name="religion"
                  value={preferences.religion}
                  onChange={(e) => {
                    // Reset caste when religion changes
                    setPreferences((prev) => ({ ...prev, religion: e.target.value, caste: '' }));
                  }}
                  disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  {religionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Caste / Sub-Caste</label>
                <select
                  name="caste"
                  value={preferences.caste}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                >
                  {dynamicCasteOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Professional & Education */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon">Professional & Academic Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Education Level</label>
                <CustomScrollSelect
                  name="education"
                  value={preferences.education}
                  options={EDUCATION_OPTIONS}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Any Education"
                />

                {(!EDUCATION_OPTIONS.includes(preferences.education) && preferences.education !== '') && (
                  <input
                    type="text"
                    name="education"
                    placeholder="Specify education preference"
                    value={preferences.education === 'Other' ? '' : preferences.education}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Preferred Professions</label>
                <CustomScrollSelect
                  name="profession"
                  value={preferences.profession}
                  options={OCCUPATION_OPTIONS}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Any Profession"
                />

                {(!OCCUPATION_OPTIONS.includes(preferences.profession) && preferences.profession !== '') && (
                  <input
                    type="text"
                    name="profession"
                    placeholder="Specify profession preference"
                    value={preferences.profession === 'Other' ? '' : preferences.profession}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  />
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Location */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">location_city</span>
                Location Preferences
              </h3>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-1.5">
                Preferred District(s) in Kerala
              </label>
              <LocationMultiSelect
                value={preferences.location}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (initialPreferences) setPreferences(initialPreferences);
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
              {onNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    if (hasChanges) {
                      handleSubmit(e, true);
                    } else {
                      onNext();
                    }
                  }}
                  className="font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-lg shadow-md transition-all text-[10px] md:text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  {hasChanges ? 'Save & Next' : 'Next'}
                </button>
              )}
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
