import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../src/utils/axiosInstance';

const religionOptions = [
  { value: 'All', label: 'All Religions' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Christian', label: 'Christian' },
  { value: 'Muslim', label: 'Muslim' },
  { value: 'Other', label: 'Other' }
];

const lookingForOptions = [
  { value: 'Bride', label: 'Female' },
  { value: 'Groom', label: 'Male' }
];

const districtOptions = [
  { value: '', label: 'All Districts' },
  { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
  { value: 'Kollam', label: 'Kollam' },
  { value: 'Pathanamthitta', label: 'Pathanamthitta' },
  { value: 'Alappuzha', label: 'Alappuzha' },
  { value: 'Kottayam', label: 'Kottayam' },
  { value: 'Idukki', label: 'Idukki' },
  { value: 'Ernakulam', label: 'Ernakulam' },
  { value: 'Thrissur', label: 'Thrissur' },
  { value: 'Palakkad', label: 'Palakkad' },
  { value: 'Malappuram', label: 'Malappuram' },
  { value: 'Kozhikode', label: 'Kozhikode' },
  { value: 'Wayanad', label: 'Wayanad' },
  { value: 'Kannur', label: 'Kannur' },
  { value: 'Kasaragod', label: 'Kasaragod' }
];

const maritalStatusOptions = [
  { value: 'Never Married', label: 'Never Married' },
  { value: 'Second Marriage', label: 'Second Marriage' }
];

const ageRangeOptions = [
  { value: '', label: 'Any Age' },
  { value: '18-25', label: '18 - 25' },
  { value: '26-30', label: '26 - 30' },
  { value: '31-35', label: '31 - 35' },
  { value: '36-40', label: '36 - 40' }
];


export default function HeroSearch() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [religion, setReligion] = useState('All');
  const [caste, setCaste] = useState('Open to all');
  const [allCastes, setAllCastes] = useState([]);
  const [lookingFor, setLookingFor] = useState('Bride');
  const [location, setLocation] = useState('');
  
  const [maritalStatus, setMaritalStatus] = useState('Never Married');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isLookingForGroom = (gender) => ['groom', 'male', 'man'].includes(String(gender || '').trim().toLowerCase());
  const getMinAllowedAge = (gender) => isLookingForGroom(gender) ? 21 : 18;

  const handleLookingForSelect = (val) => {
    setLookingFor(val);
    setActiveDropdown(null);
    const minAllowed = getMinAllowedAge(val);
    if (!minAge || minAge === '18' || minAge === '21' || parseInt(minAge, 10) < minAllowed) {
      setMinAge(String(minAllowed));
    }
  };

  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    axiosInstance.get('/public/castes')
      .then(res => setAllCastes(res.data.castes || []))
      .catch(() => {
        axiosInstance.get('/admin/castes')
          .then(res => setAllCastes(res.data.castes || []))
          .catch(err => console.error('Failed to fetch castes in search bar', err));
      });
  }, []);

  // Filter castes by selected religion
  const dynamicCasteOptions = [
    { value: 'Open to all', label: 'All Castes' },
    ...allCastes
      .filter((c) => {
        if (!religion || religion === 'All' || religion === 'All Religions') return true;
        return c.religion?.toLowerCase() === religion.toLowerCase();
      })
      .map((c) => ({ value: c.caste_name, label: c.caste_name }))
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSearch = () => {
    const params = new URLSearchParams();
    params.set('gender', lookingFor);
    if (religion && religion !== 'All' && religion !== 'All Religions') {
      params.set('religion', religion);
    }
    if (caste && caste !== 'Open to all') params.set('caste', caste);
    if (location) params.set('location', location);
    // Only include maritalStatus if it's a non-default selection
    if (maritalStatus && maritalStatus !== 'Never Married') params.set('maritalStatus', maritalStatus);
    if (minAge || maxAge) {
      params.set('age', `${minAge || 18}-${maxAge || 60}`);
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div ref={dropdownRef} className="relative z-30 w-full max-w-[320px] sm:max-w-2xl lg:max-w-3xl mx-auto glass-search-card rounded-xl sm:rounded-xl p-2 sm:p-3 md:p-3.5 shadow-2xl border border-white/25 animate-slide-up-fade">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2.5 items-center w-full">
        
        {/* Religion Dropdown */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'religion' ? null : 'religion')}
            className="relative border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 bg-transparent text-left w-full hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-center min-h-[34px] sm:min-h-[40px]"
          >
            <span className="block text-[6.5px] sm:text-[9px] text-white/70 font-semibold leading-none mb-0.5 select-none uppercase tracking-wider">Religion</span>
            <span className="block font-bold text-white text-[10px] sm:text-xs leading-none">
              {religionOptions.find(o => o.value === religion)?.label || 'All Religions'}
            </span>
            <span className={`absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 transition-transform duration-200 pointer-events-none ${activeDropdown === 'religion' ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>
          {activeDropdown === 'religion' && (
            <div className="absolute left-0 right-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-55 animate-fade-in text-left max-h-60 overflow-y-auto">
              {religionOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setReligion(option.value);
                    setCaste('Open to all');
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-[10px] sm:text-xs font-semibold hover:bg-slate-50 transition-colors flex justify-between items-center ${
                    religion === option.value ? 'text-deep-maroon bg-deep-maroon/5 font-bold' : 'text-charcoal-text font-medium'
                  }`}
                >
                  <span>{option.label}</span>
                  {religion === option.value && (
                    <span className="material-symbols-outlined text-sm text-deep-maroon">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Caste Dropdown */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'caste' ? null : 'caste')}
            className="relative border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 bg-transparent text-left w-full hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-center min-h-[34px] sm:min-h-[40px]"
          >
            <span className="block text-[6.5px] sm:text-[9px] text-white/70 font-semibold leading-none mb-0.5 select-none uppercase tracking-wider">Caste</span>
            <span className="block font-bold text-white text-[10px] sm:text-xs leading-none">
              {dynamicCasteOptions.find(o => o.value === caste)?.label || 'All Castes'}
            </span>
            <span className={`absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 transition-transform duration-200 pointer-events-none ${activeDropdown === 'caste' ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>
          {activeDropdown === 'caste' && (
            <div className="absolute left-0 right-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-55 animate-fade-in text-left max-h-60 overflow-y-auto">
              {dynamicCasteOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCaste(option.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-[10px] sm:text-xs font-semibold hover:bg-slate-50 transition-colors flex justify-between items-center ${
                    caste === option.value ? 'text-deep-maroon bg-deep-maroon/5 font-bold' : 'text-charcoal-text font-medium'
                  }`}
                >
                  <span>{option.label}</span>
                  {caste === option.value && (
                    <span className="material-symbols-outlined text-sm text-deep-maroon">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Looking For Dropdown */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'lookingFor' ? null : 'lookingFor')}
            className="relative border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 bg-transparent text-left w-full hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-center min-h-[34px] sm:min-h-[40px]"
          >
            <span className="block text-[6.5px] sm:text-[9px] text-white/70 font-semibold leading-none mb-0.5 select-none uppercase tracking-wider">I'm looking for a</span>
            <span className="block font-bold text-white text-[10px] sm:text-xs leading-none">
              {lookingForOptions.find(o => o.value === lookingFor)?.label || 'Female'}
            </span>
            <span className={`absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 transition-transform duration-200 pointer-events-none ${activeDropdown === 'lookingFor' ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>
          {activeDropdown === 'lookingFor' && (
            <div className="absolute left-0 right-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-55 animate-fade-in text-left max-h-60 overflow-y-auto">
              {lookingForOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleLookingForSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-[10px] sm:text-xs font-semibold hover:bg-slate-50 transition-colors flex justify-between items-center ${
                    lookingFor === option.value ? 'text-deep-maroon bg-deep-maroon/5 font-bold' : 'text-charcoal-text font-medium'
                  }`}
                >
                  <span>{option.label}</span>
                  {lookingFor === option.value && (
                    <span className="material-symbols-outlined text-sm text-deep-maroon">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* District Dropdown */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'district' ? null : 'district')}
            className="relative border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 bg-transparent text-left w-full hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-center min-h-[34px] sm:min-h-[40px]"
          >
            <span className="block text-[6.5px] sm:text-[9px] text-white/70 font-semibold leading-none mb-0.5 select-none uppercase tracking-wider">District</span>
            <span className="block font-bold text-white text-[10px] sm:text-xs leading-none">
              {districtOptions.find(o => o.value === location)?.label || 'All Districts'}
            </span>
            <span className={`absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 transition-transform duration-200 pointer-events-none ${activeDropdown === 'district' ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>
          {activeDropdown === 'district' && (
            <div className="absolute left-0 right-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-55 animate-fade-in text-left max-h-60 overflow-y-auto">
              {districtOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLocation(option.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-[10px] sm:text-xs font-semibold hover:bg-slate-50 transition-colors flex justify-between items-center ${
                    location === option.value ? 'text-deep-maroon bg-deep-maroon/5 font-bold' : 'text-charcoal-text font-medium'
                  }`}
                >
                  <span>{option.label}</span>
                  {location === option.value && (
                    <span className="material-symbols-outlined text-sm text-deep-maroon">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleQuickSearch}
          className="col-span-2 lg:col-span-1 flex items-center justify-center gap-1 bg-deep-maroon hover:bg-primary text-white font-bold rounded-lg transition-all active:scale-95 cursor-pointer text-[10px] sm:text-xs shrink-0 w-full h-[28px] sm:h-[38px] lg:h-[40px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
        >
          <span className="material-symbols-outlined text-[14px] sm:text-[20px]">search</span>
          Search
        </button>
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-2 md:gap-3.5 mt-2.5 pt-2.5 border-t border-white/20 items-end animate-slide-up-fade">
          
          {/* Marital Status Dropdown */}
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'maritalStatus' ? null : 'maritalStatus')}
              className="relative border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 bg-transparent text-left w-full hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-center min-h-[34px] sm:min-h-[40px]"
            >
              <span className="block text-[6.5px] sm:text-[9px] text-white/70 font-semibold leading-none mb-0.5 select-none uppercase tracking-wider">Marital Status</span>
              <span className="block font-bold text-white text-[10px] sm:text-xs leading-none">
                {maritalStatusOptions.find(o => o.value === maritalStatus)?.label || 'Never Married'}
              </span>
              <span className={`absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 transition-transform duration-200 pointer-events-none ${activeDropdown === 'maritalStatus' ? 'rotate-180' : ''}`}>
                keyboard_arrow_down
              </span>
            </button>
            {activeDropdown === 'maritalStatus' && (
              <div className="absolute left-0 right-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-55 animate-fade-in text-left max-h-60 overflow-y-auto">
                {maritalStatusOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setMaritalStatus(option.value);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] sm:text-xs font-semibold hover:bg-slate-50 transition-colors flex justify-between items-center ${
                      maritalStatus === option.value ? 'text-deep-maroon bg-deep-maroon/5 font-bold' : 'text-charcoal-text font-medium'
                    }`}
                  >
                    <span>{option.label}</span>
                    {maritalStatus === option.value && (
                      <span className="material-symbols-outlined text-sm text-deep-maroon">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Age Between Dropdown */}
          <div className="relative w-full text-left">
            <label className="block text-[6.5px] sm:text-[9px] text-white/70 font-semibold leading-none mb-1 select-none uppercase tracking-wider">
              Age Between
            </label>
            <div className="flex items-center gap-1.5 min-h-[34px] sm:min-h-[40px]">
              <div className="relative w-full">
                <select
                  value={minAge || String(getMinAllowedAge(lookingFor))}
                  onChange={(e) => setMinAge(e.target.value)}
                  className="w-full border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 text-[10px] sm:text-xs bg-transparent hover:bg-white/10 transition-all text-white font-bold focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer appearance-none h-[34px] sm:h-[40px]"
                >
                  <option value="" className="text-charcoal-text bg-white">Min Age</option>
                  {Array.from({ length: 70 - getMinAllowedAge(lookingFor) + 1 }, (_, i) => i + getMinAllowedAge(lookingFor)).map(a => (
                    <option key={a} value={a} className="text-charcoal-text bg-white">{a} Yrs</option>
                  ))}
                </select>
                <span className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 pointer-events-none">
                  keyboard_arrow_down
                </span>
              </div>
              <span className="text-xs text-white/80 font-bold">-</span>
              <div className="relative w-full">
                <select
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  className="w-full border border-white/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-2.5 text-[10px] sm:text-xs bg-transparent hover:bg-white/10 transition-all text-white font-bold focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer appearance-none h-[34px] sm:h-[40px]"
                >
                  <option value="" className="text-charcoal-text bg-white">Max Age</option>
                  {Array.from({ length: 53 }, (_, i) => i + 18).map(a => (
                    <option key={a} value={a} className="text-charcoal-text bg-white">{a} Yrs</option>
                  ))}
                </select>
                <span className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[11px] sm:text-[15px] text-white/80 pointer-events-none">
                  keyboard_arrow_down
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Advanced Filters Toggle Button */}
      <div className="mt-2.5 flex justify-center lg:justify-end pr-0.5">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-white/80 hover:text-white font-semibold text-[9px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors duration-200 select-none animate-fade-in"
        >
          <span>Advanced Filters</span>
          <span className={`material-symbols-outlined text-[12px] sm:text-[16px] transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
            keyboard_arrow_down
          </span>
        </button>
      </div>

    </div>
  );
}
