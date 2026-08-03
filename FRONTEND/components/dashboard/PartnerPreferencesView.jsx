import React, { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';

export default function PartnerPreferencesView({ onProfileUpdate }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    ageMin: '',
    ageMax: '',
    heightMin: '',
    heightMax: '',
    maritalStatus: '',
    religion: '',
    caste: '',
    motherTongue: '',
    education: '',
    profession: '',
    location: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (user?.profile_id) {
        try {
          const response = await axiosInstance.get(`/users/profile/${user.profile_id}/partner-preferences`);
          const data = response.data.preferences;
          if (data) {
            setPreferences({
              ageMin: data.min_age || '',
              ageMax: data.max_age || '',
              heightMin: data.min_height || '',
              heightMax: data.max_height || '',
              maritalStatus: data.marital_status || '',
              religion: data.religion || '',
              caste: data.caste || '',
              motherTongue: data.mother_tongue || '',
              education: data.education_level || '',
              profession: data.preferred_professions || '',
              location: data.location_preferences || '',
            });
          }
        } catch (error) {
          console.error("Failed to fetch partner preferences:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchPreferences();
  }, [user?.profile_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.profile_id) {
      try {
        await axiosInstance.put(`/users/profile/${user.profile_id}/partner-preferences`, {
          min_age: preferences.ageMin,
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
        if (onProfileUpdate) onProfileUpdate();
        setTimeout(() => setIsSaved(false), 3000);
      } catch (error) {
        console.error("Failed to update partner preferences:", error);
        alert("Failed to save preferences. Please try again.");
      }
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-slate-500">Loading preferences...</div>;
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-6 shadow-none md:shadow-sm text-left">
        <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-heritage-gold"></span>
              Partner Preferences
            </h2>
            <p className="text-[11px] text-soft-gray mt-1">Refine your partner criteria to get more relevant matches in your feed.</p>
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
                className="bg-slate-100 hover:bg-slate-200 text-charcoal-text font-semibold py-1.5 px-3 md:py-2 md:px-4 rounded-lg shadow-sm transition-all cursor-pointer text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit Preferences
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Demographics */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon">Basic Criteria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Min Age</label>
                  <input
                    type="number"
                    name="ageMin"
                    value={preferences.ageMin}
                    onChange={handleChange} disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    min="18"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Max Age</label>
                  <input
                    type="number"
                    name="ageMax"
                    value={preferences.ageMax}
                    onChange={handleChange} disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    min="18"
                    max="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Min Height</label>
                  <input
                    type="text"
                    name="heightMin"
                    value={preferences.heightMin}
                    onChange={handleChange} disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Max Height</label>
                  <input
                    type="text"
                    name="heightMax"
                    value={preferences.heightMax}
                    onChange={handleChange} disabled={!isEditing}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  />
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
                <input
                  type="text"
                  name="motherTongue"
                  value={preferences.motherTongue}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
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
                <input
                  type="text"
                  name="religion"
                  value={preferences.religion}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Caste / Sub-Caste</label>
                <input
                  type="text"
                  name="caste"
                  value={preferences.caste}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
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
                <input
                  type="text"
                  name="education"
                  value={preferences.education}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Preferred Professions</label>
                <input
                  type="text"
                  name="profession"
                  value={preferences.profession}
                  onChange={handleChange} disabled={!isEditing}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon">Location Preferences</h3>
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">Country / City / State</label>
              <input
                type="text"
                name="location"
                value={preferences.location}
                onChange={handleChange} disabled={!isEditing}
                className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text disabled:opacity-60 disabled:bg-slate-100/50 disabled:cursor-not-allowed disabled:border-slate-100 focus:outline-none focus:ring-1 focus:ring-deep-maroon"
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-charcoal-text font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-lg shadow-sm transition-all cursor-pointer text-[10px] md:text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-deep-maroon hover:bg-primary text-white font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer text-[10px] md:text-xs uppercase tracking-wider"
              >
                Save Preferences
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
