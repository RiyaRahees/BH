import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useSettings } from '../../src/context/SettingsContext';
import { useToast } from '../../src/context/ToastContext';
import { COUNTRY_CODES } from '../../src/utils/countryCodes';

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

export default function AddUserModal({ isOpen, onClose, onSuccess, onError }) {
  const { settings } = useSettings();
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    countryCode: '+91',
    mobileNumber: '',
    email: '',
    district: '',
    religion: '',
    caste: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: 'Male',
    terms: false
  });
  const [showDobPicker, setShowDobPicker] = useState(false);

  const minBrideAge = settings?.minBrideAge || 18;
  const minGroomAge = settings?.minGroomAge || 21;
  const minRequiredAge = newUserData.gender === 'Female' ? minBrideAge : minGroomAge;

  const currentYear = new Date().getFullYear();
  const maxAllowedYear = currentYear - minRequiredAge;

  const selectableYears = useMemo(() => {
    return Array.from({ length: 65 }, (_, i) => maxAllowedYear - i);
  }, [maxAllowedYear]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewUserData({
        fullName: '',
        countryCode: 'IN +91',
        mobileNumber: '',
        email: '',
        district: '',
        religion: '',
        caste: '',
        dobDay: '',
        dobMonth: '',
        dobYear: '',
        gender: 'Male',
        terms: false
      });
      setShowDobPicker(false);
    }
  }, [isOpen]);

  // Clear year if it exceeds maxAllowedYear on gender toggle
  useEffect(() => {
    if (newUserData.dobYear && parseInt(newUserData.dobYear) > maxAllowedYear) {
      setNewUserData(prev => ({ ...prev, dobYear: '' }));
    }
  }, [newUserData.gender, maxAllowedYear]);

  const allCastes = useMemo(() => {
    if (!newUserData.religion) return [];
    if (defaultCastes[newUserData.religion]) return defaultCastes[newUserData.religion];
    if (newUserData.religion === 'Others' || newUserData.religion === 'Other') return defaultCastes.Other;
    return [];
  }, [newUserData.religion]);

  // Reset caste if religion changes
  useEffect(() => {
    setNewUserData(prev => ({ ...prev, caste: '' }));
  }, [newUserData.religion]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newUserData.dobDay || !newUserData.dobMonth || !newUserData.dobYear) {
        onError('Please select Date of Birth');
        return;
      }

      const userAge = calculateAge(newUserData.dobDay, newUserData.dobMonth, newUserData.dobYear);
      if (userAge !== null && userAge < minRequiredAge) {
        const role = newUserData.gender === 'Female' ? 'Bride' : 'Groom';
        onError(`Minimum age limit for ${role} is ${minRequiredAge} years. (Selected age: ${userAge} yrs)`);
        return;
      }
      
      const countryCodeParts = newUserData.countryCode.split(' ');
      const countryCode = countryCodeParts.length > 1 ? countryCodeParts[1] : newUserData.countryCode;

      const dobString = `${newUserData.dobDay} ${newUserData.dobMonth} ${newUserData.dobYear}`;

      const payload = {
        full_name: newUserData.fullName,
        country_code: countryCode,
        mobile_number: newUserData.mobileNumber,
        email_address: newUserData.email,
        religion: newUserData.religion,
        caste: newUserData.caste,
        district: newUserData.district,
        dob: dobString,
        gender: newUserData.gender
      };

      await axiosInstance.post('/auth/register', payload);
      onSuccess('User added successfully. Email with password sent.');
      onClose();
    } catch (err) {
      console.error('Error adding user:', err);
      onError(err.response?.data?.error || 'Failed to add user. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="bg-paper-white rounded-2xl shadow-xl border border-surface-variant/40 overflow-hidden w-full max-w-md relative z-10 animate-fade-in text-left max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between shrink-0">
          <h3 className="font-bold text-sm tracking-wide uppercase">
            Add New User
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-charcoal-text">Find Your Partner From <span className="text-deep-maroon">5 Lakh+</span> Profiles</h2>
            <p className="text-xs text-slate-500 mt-1">100% Free matrimonial services</p>
          </div>

          <div>
            <input
              type="text"
              value={newUserData.fullName}
              onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
              className="w-full border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray"
              placeholder="Full Name"
              required
            />
          </div>

          <div className="flex gap-2">
            <select
              value={newUserData.countryCode}
              onChange={(e) => setNewUserData({ ...newUserData, countryCode: e.target.value })}
              className="w-1/3 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              type="tel"
              value={newUserData.mobileNumber}
              onChange={(e) => setNewUserData({ ...newUserData, mobileNumber: e.target.value })}
              className="w-2/3 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray"
              placeholder="Mobile Number"
              required
            />
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              className="w-1/2 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray"
              placeholder="Email Address"
              required
            />
            <select
              value={newUserData.district}
              onChange={(e) => setNewUserData({ ...newUserData, district: e.target.value })}
              className={`w-1/2 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon ${newUserData.district ? 'text-charcoal-text' : 'text-slate-400'}`}
              required
            >
              <option value="" disabled hidden>District</option>
              <option value="Thiruvananthapuram">Thiruvananthapuram</option>
              <option value="Kollam">Kollam</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="Kozhikode">Kozhikode</option>
              <option value="Malappuram">Malappuram</option>
              <option value="Kannur">Kannur</option>
              <option value="Kottayam">Kottayam</option>
              <option value="Thrissur">Thrissur</option>
              <option value="Palakkad">Palakkad</option>
              <option value="Alappuzha">Alappuzha</option>
              <option value="Pathanamthitta">Pathanamthitta</option>
              <option value="Wayanad">Wayanad</option>
              <option value="Idukki">Idukki</option>
              <option value="Kasaragod">Kasaragod</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={newUserData.religion}
              onChange={(e) => setNewUserData({ ...newUserData, religion: e.target.value })}
              className={`w-1/2 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon ${newUserData.religion ? 'text-charcoal-text' : 'text-slate-400'}`}
              required
            >
              <option value="" disabled hidden>Religion</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Christian">Christian</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={newUserData.caste}
              onChange={(e) => setNewUserData({ ...newUserData, caste: e.target.value })}
              className={`w-1/2 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon ${newUserData.caste ? 'text-charcoal-text' : 'text-slate-400'}`}
              disabled={!newUserData.religion}
              required
            >
              <option value="" disabled hidden>{newUserData.religion ? "Caste" : "Select Religion First"}</option>
              {allCastes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="w-full relative">
            <button
                type="button"
                onClick={() => setShowDobPicker(!showDobPicker)}
                className={`w-full flex items-center justify-between gap-1 border rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text hover:bg-slate-50 cursor-pointer h-full min-h-[38px] ${
                  newUserData.dobDay && newUserData.dobMonth && newUserData.dobYear
                    ? 'border-deep-maroon font-semibold text-deep-maroon'
                    : 'border-surface-variant text-slate-400'
                }`}
              >
                <span className="flex items-center gap-1.5 overflow-hidden truncate">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  <span className="truncate">
                    {newUserData.dobDay && newUserData.dobMonth && newUserData.dobYear 
                      ? `${newUserData.dobDay} ${newUserData.dobMonth} ${newUserData.dobYear}` 
                      : 'DOB'}
                  </span>
                </span>
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </button>

              {showDobPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDobPicker(false)}></div>
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200/80 shadow-xl rounded-xl p-3.5 w-[250px] animate-fade-in text-left">
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
                        Min Age for {newUserData.gender === 'Female' ? 'Bride' : 'Groom'}: {minRequiredAge} yrs
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {/* Day */}
                      <select
                        value={newUserData.dobDay}
                        onChange={(e) => setNewUserData({...newUserData, dobDay: e.target.value})}
                        className="w-full border border-slate-200 rounded-md py-1 px-1.5 text-[10px] bg-slate-50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d < 10 ? `0${d}` : `${d}`}>{d}</option>
                        ))}
                      </select>

                      {/* Month */}
                      <select
                        value={newUserData.dobMonth}
                        onChange={(e) => setNewUserData({...newUserData, dobMonth: e.target.value})}
                        className="w-full border border-slate-200 rounded-md py-1 px-1.5 text-[10px] bg-slate-50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                      >
                        <option value="">Month</option>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      {/* Year */}
                      <select
                        value={newUserData.dobYear}
                        onChange={(e) => setNewUserData({...newUserData, dobYear: e.target.value})}
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
                      onClick={() => { if (newUserData.dobDay && newUserData.dobMonth && newUserData.dobYear) setShowDobPicker(false); }}
                      disabled={!newUserData.dobDay || !newUserData.dobMonth || !newUserData.dobYear}
                      className="w-full bg-deep-maroon text-white font-semibold py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              )}
            </div>

          <div className="flex gap-2 mt-2">
            <label className={`w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
              newUserData.gender === 'Male'
                ? 'border-deep-maroon text-deep-maroon bg-rose-50'
                : 'border-surface-variant text-slate-500 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={newUserData.gender === 'Male'}
                onChange={(e) => setNewUserData({ ...newUserData, gender: e.target.value })}
                className="hidden"
                required
              />
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              <span className="font-bold text-xs">Male</span>
            </label>
            <label className={`w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
              newUserData.gender === 'Female'
                ? 'border-deep-maroon text-deep-maroon bg-rose-50'
                : 'border-surface-variant text-slate-500 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={newUserData.gender === 'Female'}
                onChange={(e) => setNewUserData({ ...newUserData, gender: e.target.value })}
                className="hidden"
                required
              />
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              <span className="font-bold text-xs">Female</span>
            </label>
          </div>

          <div className="flex items-center gap-2 mt-2 px-1">
            <input
              type="checkbox"
              id="terms"
              checked={newUserData.terms}
              onChange={(e) => setNewUserData({ ...newUserData, terms: e.target.checked })}
              className="w-3.5 h-3.5 text-deep-maroon border-slate-300 rounded focus:ring-deep-maroon accent-deep-maroon shrink-0"
              required
            />
            <label htmlFor="terms" className="text-[10px] text-slate-500 select-none">
              I have read and agree to the{' '}
              <a
                href="/terms-privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-deep-maroon hover:underline cursor-pointer"
              >
                Terms of Use &amp; Privacy Policy
              </a>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!newUserData.terms}
              className="w-full py-2.5 bg-deep-maroon hover:bg-primary text-white font-bold rounded-xl text-xs cursor-pointer select-none transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Register Free
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
