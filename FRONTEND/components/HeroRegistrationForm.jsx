import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../src/utils/axiosInstance';
import { COUNTRY_CODES } from '../src/utils/countryCodes';
import { useSettings } from '../src/context/SettingsContext';

const defaultCastes = {
  Hindu: [
    'Nair', 'Ezhava', 'Brahmin', 'Viswakarma', 'Dheevara', 'Thiyya', 'Kshatriya', 
    'Ambalavasi', 'Veluthedathu Nair', 'Vilakkithala Nair', 'Ganaka', 'Vaniyan', 
    'Kudumbi', 'Pulaya', 'Cheramar', 'Sambava', 'Vettuvan', 'SC / ST', 'General / Other'
  ],
  Christian: [
    'Roman Catholic', 'Latin Catholic', 'Syrian Catholic', 'Jacobite', 'Orthodox', 
    'Marthoma', 'CSI', 'Pentecost', 'Knanaya Catholic', 'Knanaya Jacobite', 'General / Other'
  ],
  Muslim: [
    'Sunni', 'Mujahid', 'Shafi', 'Hanafi', 'Jamaat-e-Islami', 'Thangal', 'General / Other'
  ],
  Other: ['General / Open to all', 'Other']
};

const CountryCodeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];

  return (
    <div className="relative flex-shrink-0">
      <div
        className="bg-slate-50/70 hover:bg-slate-100/70 rounded-l-lg border-r border-surface-variant/60 text-charcoal-text text-[10px] sm:text-[11px] font-body-sm py-1.5 px-2 focus:outline-none cursor-pointer font-medium min-w-[68px] sm:min-w-[74px] flex items-center justify-between gap-1 h-full select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="whitespace-nowrap leading-none">{selected.label}</span>
        <span className="material-symbols-outlined text-[12px] leading-none shrink-0 text-slate-400">
          {isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200/80 shadow-xl rounded-lg py-1 text-left w-28 sm:w-32 max-h-[160px] overflow-y-auto animate-fade-in custom-scrollbar">
            {COUNTRY_CODES.map((c) => (
              <div
                key={c.code}
                className={`px-2 py-1.5 text-[10px] sm:text-[11px] font-body-sm hover:bg-slate-50 cursor-pointer font-medium ${c.code === value ? 'text-deep-maroon bg-rose-50/50' : 'text-charcoal-text'}`}
                onClick={() => {
                  onChange(c.code);
                  setIsOpen(false);
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const CustomDropdown = ({ value, onChange, options, placeholder, disabled, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  const filteredOptions = searchable && searchTerm && isOpen
    ? options.filter((opt) => {
        const optLabel = typeof opt === 'string' ? opt : opt.label;
        if (searchTerm === value) return true;
        return optLabel.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : options;

  return (
    <div className="relative w-full">
      {searchable ? (
        <div className={`w-full flex items-center justify-between border rounded-lg bg-white focus-within:ring-1 focus-within:ring-deep-maroon focus-within:border-deep-maroon ${
          disabled ? 'bg-slate-50 opacity-75' : 'hover:bg-slate-50'
        } ${isOpen ? 'border-deep-maroon ring-1 ring-deep-maroon' : 'border-surface-variant'}`}>
          <input
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={isOpen ? searchTerm : (value || '')}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            className="w-full py-1.5 px-2 text-[11px] bg-transparent focus:outline-none text-charcoal-text disabled:cursor-not-allowed rounded-lg"
          />
          <span 
            className="material-symbols-outlined text-[14px] text-soft-gray shrink-0 leading-none pr-2 cursor-pointer"
            onClick={() => {
              if (!disabled) setIsOpen(!isOpen);
            }}
          >
            {isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={`w-full flex items-center justify-between border rounded-lg py-1.5 px-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon ${
            disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-75' : 'text-charcoal-text cursor-pointer hover:bg-slate-50'
          } ${isOpen ? 'border-deep-maroon ring-1 ring-deep-maroon' : 'border-surface-variant'}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <span className="material-symbols-outlined text-[14px] text-soft-gray shrink-0 leading-none">
            {isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearchTerm(value || ''); }}></div>
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200/80 shadow-xl rounded-lg py-1 animate-fade-in text-left max-h-[200px] flex flex-col">
            <div className="overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const optValue = typeof opt === 'string' ? opt : opt.value;
                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onChange(optValue);
                        setIsOpen(false);
                        setSearchTerm(optValue);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-deep-maroon/5 transition-colors ${
                        value === optValue ? 'text-deep-maroon font-semibold bg-deep-maroon/5' : 'text-charcoal-text'
                      }`}
                    >
                      {optLabel}
                    </button>
                  );
                })
              ) : (
                <div className="px-2.5 py-2 text-[10px] text-soft-gray text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function HeroRegistrationForm({ onClose } = {}) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [community, setCommunity] = useState('');
  const [caste, setCaste] = useState('');
  const [allCastes, setAllCastes] = useState([]);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Date of Birth states
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Dynamic minimum age requirements configured in Admin System Settings
  const minBrideAge = settings?.minBrideAge || 18;
  const minGroomAge = settings?.minGroomAge || 21;
  const minRequiredAge = gender === 'Female' ? minBrideAge : minGroomAge;

  const currentYear = new Date().getFullYear();
  const maxAllowedYear = currentYear - minRequiredAge;

  const selectableYears = useMemo(() => {
    return Array.from({ length: 65 }, (_, i) => maxAllowedYear - i);
  }, [maxAllowedYear]);

  // If user changed gender (e.g. Female -> Male) and currently selected year is now too young, clear it
  useEffect(() => {
    if (dobYear && parseInt(dobYear) > maxAllowedYear) {
      setDobYear('');
    }
  }, [gender, maxAllowedYear]);

  const calculateAge = (day, month, year) => {
    if (!day || !month || !year) return null;
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const mIdx = months[month];
    if (mIdx === undefined) return null;
    const birthDate = new Date(parseInt(year), mIdx, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    axiosInstance.get('/public/castes')
      .then(res => setAllCastes(res.data.castes || []))
      .catch(() => {
        axiosInstance.get('/admin/castes')
          .then(res => setAllCastes(res.data.castes || []))
          .catch(err => console.error('Failed to fetch castes in hero registration form', err));
      });
  }, []);

  const dynamicCasteOptions = useMemo(() => {
    if (!community) return [];
    const fromApi = allCastes
      .filter(c => c.religion && c.religion.toLowerCase() === community.toLowerCase())
      .map(c => c.caste_name);
    
    if (fromApi.length > 0) return fromApi;
    return defaultCastes[community] || ['General / Other'];
  }, [community, allCastes]);

  const handleReligionChange = (e) => {
    const val = e.target.value;
    setCommunity(val);
    setCaste('');
  };

  const validatePhoneNumber = (val, code) => {
    if (!val) return '';
    if (code === '+91') {
      if (val.length !== 10 || !/^[6-9]\d{9}$/.test(val)) {
        return 'Invalid mobile number';
      }
    } else {
      if (val.length < 7 || val.length > 15 || !/^\d{7,15}$/.test(val)) {
        return 'Invalid mobile number';
      }
    }
    return '';
  };

  const showToast = (message, type = 'error') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || fullName.trim().length < 2) {
      showToast('Please enter your full name (minimum 2 characters)');
      return;
    }

    if (!phone) {
      setPhoneError('Please enter your mobile number');
      showToast('Please enter your mobile number');
      return;
    }

    const phoneErr = validatePhoneNumber(phone, countryCode);
    if (phoneErr) {
      setPhoneError(phoneErr);
      showToast(phoneErr);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      showToast('Please enter a valid email address');
      return;
    }

    if (!community) {
      showToast('Please select your Religion');
      return;
    }

    if (!district) {
      showToast('Please select your District');
      return;
    }

    if (!dobDay || !dobMonth || !dobYear) {
      showToast('Please select your Date of Birth');
      return;
    }

    // Age validation against Admin System Settings
    const userAge = calculateAge(dobDay, dobMonth, dobYear);
    if (userAge !== null && userAge < minRequiredAge) {
      const role = gender === 'Female' ? 'Bride' : 'Groom';
      showToast(`Minimum age limit for ${role} is ${minRequiredAge} years. (Selected age: ${userAge} yrs)`);
      return;
    }

    if (!termsAccepted) {
      showToast('Please agree to the Terms of Use & Privacy Policy');
      return;
    }

    const dobString = `${dobDay} ${dobMonth} ${dobYear}`;

    const payload = {
      full_name: fullName.trim(),
      country_code: countryCode,
      mobile_number: phone,
      email_address: email.trim(),
      religion: community,
      caste: caste || '',
      district: district,
      dob: dobString,
      gender: gender
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/register', payload);
      setRegisteredEmail(email.trim());
      setShowSuccessModal(true);

      // Clear form
      setFullName('');
      setGender('Male');
      setCommunity('');
      setCaste('');
      setPhone('');
      setEmail('');
      setDistrict('');
      setDobDay('');
      setDobMonth('');
      setDobYear('');
      setTermsAccepted(false);
      setPhoneError('');

    } catch (error) {
      console.error('Registration failed:', error);
      showToast(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
      className={
        onClose
          ? 'bg-paper-white p-4 w-full'
          : 'bg-paper-white p-3 sm:p-4 md:p-5 rounded-xl shadow-lg border border-surface-variant/40 border-t-4 border-t-deep-maroon fade-in w-full max-w-[290px] sm:max-w-[340px] md:max-w-[370px] md:justify-self-end md:translate-x-6 md:-translate-y-8 mx-auto'
      }
      style={onClose ? {} : { animationDelay: '0.2s' }}
    >
      <div className="mb-2 sm:mb-3">
        <h3 className="font-semibold text-xs sm:text-sm text-charcoal-text leading-snug">
          Find Your Partner From <span className="text-deep-maroon font-bold">5 Lakh+</span> Profiles
        </h3>
        <p className="text-[9px] sm:text-[10px] text-soft-gray mt-0.5">
          100% Free matrimonial services
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5 text-left">
        {/* 1. Full Name (Full-Width) */}
        <div>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value.replace(/\d/g, ''))}
            className="w-full border border-surface-variant rounded-lg py-1.5 px-2.5 text-[11px] font-body-sm bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/60"
            placeholder="Full Name"
            required
          />
        </div>

        {/* 2. Mobile Number & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          <div>
            <div className={`flex items-center border h-[34px] sm:h-[36px] ${phoneError ? 'border-red-500' : 'border-surface-variant'} rounded-lg bg-white focus-within:ring-1 ${phoneError ? 'focus-within:ring-red-500 focus-within:border-red-500' : 'focus-within:ring-deep-maroon focus-within:border-deep-maroon'}`}>
              <CountryCodeDropdown
                value={countryCode}
                onChange={(code) => {
                  setCountryCode(code);
                  if (phone) {
                    setPhoneError(validatePhoneNumber(phone, code));
                  }
                }}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (val) {
                    setPhoneError(validatePhoneNumber(val, countryCode));
                  } else {
                    setPhoneError('');
                  }
                }}
                onBlur={() => {
                  setPhoneError(validatePhoneNumber(phone, countryCode));
                }}
                maxLength={countryCode === '+91' ? 10 : 15}
                className="w-full border-none h-full px-2 text-[11px] font-body-sm bg-transparent text-charcoal-text placeholder-soft-gray/60 focus:ring-0 focus:outline-none rounded-r-lg"
                placeholder="Mobile Number"
                title="Please enter a valid mobile number"
                required
              />
            </div>
            {phoneError && <p className="text-red-500 text-[9px] mt-0.5 ml-1 font-medium">{phoneError}</p>}
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-surface-variant rounded-lg py-1.5 px-2.5 text-[11px] font-body-sm bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/60"
            placeholder="Email Address"
            required
          />
        </div>

        {/* 3. Religion & Caste (Dynamic based on Religion) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <CustomDropdown
            value={community}
            onChange={(val) => {
              setCommunity(val);
              setCaste('');
            }}
            placeholder="Religion"
            options={['Hindu', 'Christian', 'Muslim', 'Other']}
          />

          <CustomDropdown
            value={caste}
            onChange={(val) => setCaste(val)}
            disabled={!community}
            placeholder={community ? 'Select Caste' : 'Caste (Select Religion)'}
            options={dynamicCasteOptions}
            searchable={true}
          />
        </div>

        {/* 4. District & DOB */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <CustomDropdown
            value={district}
            onChange={(val) => setDistrict(val)}
            placeholder="District"
            searchable={true}
            options={[
              '01- Thiruvananthapuram',
              '02- Kollam',
              '03- Pathanamthitta',
              '04- Alappuzha',
              '05- Kottayam',
              '06- Idukki',
              '07- Ernakulam',
              '08- Thrissur',
              '09- Palakkad',
              '10- Malappuram',
              '11- Kozhikode',
              '12- Wayanad',
              '13- Kannur',
              '14- Kasaragod'
            ]}
          />

          {/* DOB Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDobPicker(!showDobPicker)}
              className={`w-full flex items-center justify-between gap-1 border rounded-lg py-1.5 px-2 text-[10px] sm:text-[11px] bg-white text-charcoal-text hover:bg-slate-50 cursor-pointer h-full min-h-[32px] ${dobDay && dobMonth && dobYear
                ? 'border-deep-maroon font-semibold text-deep-maroon'
                : 'border-surface-variant text-soft-gray'
                }`}
            >
              <span className="flex items-center gap-1 overflow-hidden truncate">
                <span className="material-symbols-outlined text-[13px] text-soft-gray shrink-0">calendar_month</span>
                <span className="truncate">
                  {dobDay && dobMonth && dobYear ? `${dobDay} ${dobMonth} ${dobYear}` : 'DOB'}
                </span>
              </span>
              <span className="material-symbols-outlined text-[12px] text-soft-gray shrink-0">keyboard_arrow_down</span>
            </button>

            {showDobPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDobPicker(false)}></div>
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200/80 shadow-xl rounded-xl p-3.5 w-[260px] animate-fade-in text-left">
                  <div className="text-[11px] font-semibold text-charcoal-text mb-1 flex justify-between items-center">
                    <span>Select Date of Birth</span>
                    <button
                      type="button"
                      onClick={() => setShowDobPicker(false)}
                      className="text-soft-gray hover:text-charcoal-text text-[10px] font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-2">
                    <span className="text-[9.5px] font-bold text-deep-maroon bg-deep-maroon/10 px-2 py-0.5 rounded inline-block">
                      Min Age for {gender === 'Female' ? 'Bride' : 'Groom'}: {minRequiredAge} yrs
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {/* Day */}
                    <select
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      className="w-full border border-slate-200 rounded-md py-1 px-1.5 text-[10px] bg-slate-50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d < 10 ? `0${d}` : `${d}`}>{d}</option>
                      ))}
                    </select>

                    {/* Month */}
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className="w-full border border-slate-200 rounded-md py-1 px-1.5 text-[10px] bg-slate-50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    >
                      <option value="">Month</option>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {/* Year (Restricted dynamically by admin min age) */}
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className="w-full border border-slate-200 rounded-md py-1 px-1.5 text-[10px] bg-slate-50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    >
                      <option value="">Year</option>
                      {selectableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => { if (dobDay && dobMonth && dobYear) setShowDobPicker(false); }}
                    disabled={!dobDay || !dobMonth || !dobYear}
                    className="w-full bg-deep-maroon text-white font-semibold py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Gender: Male / Female toggle */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setGender('Male')}
            className={`flex items-center justify-center gap-1 border rounded-lg py-1.5 px-1 text-[10px] cursor-pointer transition-all ${gender === 'Male'
              ? 'border-deep-maroon text-deep-maroon bg-deep-maroon/5 font-semibold'
              : 'border-surface-variant text-soft-gray bg-white hover:bg-slate-50'
              }`}
          >
            <span
              className="material-symbols-outlined text-[14px] leading-none"
              style={{ fontVariationSettings: gender === 'Male' ? "'FILL' 1" : "'FILL' 0" }}
            >
              account_circle
            </span>
            Male
          </button>
          <button
            type="button"
            onClick={() => setGender('Female')}
            className={`flex items-center justify-center gap-1 border rounded-lg py-1.5 px-1 text-[10px] cursor-pointer transition-all ${gender === 'Female'
              ? 'border-deep-maroon text-deep-maroon bg-deep-maroon/5 font-semibold'
              : 'border-surface-variant text-soft-gray bg-white hover:bg-slate-50'
              }`}
          >
            <span
              className="material-symbols-outlined text-[14px] leading-none"
              style={{ fontVariationSettings: gender === 'Female' ? "'FILL' 1" : "'FILL' 0" }}
            >
              account_circle
            </span>
            Female
          </button>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-1.5 pt-0.5">
          <input
            type="checkbox"
            id="agreeTermsHero"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
            className="mt-0.5 h-3 w-3 rounded border-surface-variant text-deep-maroon focus:ring-deep-maroon cursor-pointer"
          />
          <label htmlFor="agreeTermsHero" className="font-body-sm text-[9px] text-soft-gray leading-tight select-none">
            I have read and agree to the{' '}
            <a
              href="/terms-privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-deep-maroon hover:underline cursor-pointer"
            >
              Terms of Use &amp; Privacy Policy
            </a>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-deep-maroon hover:bg-primary text-white font-semibold py-2 rounded-lg mt-0.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer text-center text-[10px] tracking-wider uppercase disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register Free'}
        </button>

        {/* Support Links */}
        <div className="flex justify-center gap-6 mt-2.5 pt-2 border-t border-surface-variant/40">
          <a
            href={`mailto:${settings?.supportEmail || 'support@bharathmarriage.com'}`}
            className="flex items-center gap-1 text-soft-gray hover:text-deep-maroon transition-colors text-[10px] font-body-sm cursor-pointer"
            title={`Send email to ${settings?.supportEmail || 'support@bharathmarriage.com'}`}
          >
            <span className="material-symbols-outlined text-[13px] leading-none">support_agent</span>
            Support
          </a>
          <a
            href={`mailto:${settings?.supportEmail || 'support@bharathmarriage.com'}?subject=Assistance%20Needed%20-%20Bharath%20Marriage`}
            className="flex items-center gap-1 text-soft-gray hover:text-deep-maroon transition-colors text-[10px] font-body-sm cursor-pointer"
            title={`Send email to ${settings?.supportEmail || 'support@bharathmarriage.com'}`}
          >
            <span className="material-symbols-outlined text-[13px] leading-none">chat</span>
            Chat for assistance
          </a>
        </div>
      </form>

      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border bg-slate-800 border-slate-700 text-white min-w-[280px] justify-center">
          <span className={`material-symbols-outlined ${toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>

    {/* Success Modal via Portal */}
    {showSuccessModal && createPortal(
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          setShowSuccessModal(false);
          if (onClose) onClose();
          navigate('/login');
        }}
      >
        <div 
          className="relative w-full max-w-sm rounded-xl bg-white p-6 sm:p-8 shadow-2xl text-center animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Check Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>

          <h3 className="font-display-lg text-xl font-bold text-slate-800 mb-3">
            Registration Successful!
          </h3>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-700 font-medium mb-2">
              Your password has been sent to:
            </p>
            <p className="text-sm font-bold text-deep-maroon truncate">
              {registeredEmail}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Please check your email to log in.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onClose) onClose();
                navigate('/login');
              }}
              className="w-full bg-deep-maroon hover:bg-primary text-white font-bold text-sm py-3 px-4 rounded-lg shadow transition-colors cursor-pointer"
            >
              Go to Login
            </button>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onClose) onClose();
              }}
              className="w-full text-slate-500 hover:text-slate-700 font-bold text-sm py-2 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
