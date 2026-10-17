import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../utils/axiosInstance';
import { getResolvedImageUrl, handleImageError } from '../utils/imageUtils';

export default function SafetyTips() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [showReportModal, setShowReportModal] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);

  // Search state for reported profile
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedReportedUser, setSelectedReportedUser] = useState(null);

  const [reason, setReason] = useState('Fake Profile / Stolen Photos');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Live debounced search for profiles
  useEffect(() => {
    if (!searchText.trim() || selectedReportedUser) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axiosInstance.get(`/users/lookup-partner?query=${encodeURIComponent(searchText.trim())}`);
        if (response.data?.success) {
          const filtered = (response.data.results || []).filter(
            r => r.profile_id?.toLowerCase() !== user?.profile_id?.toLowerCase()
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Error looking up profile:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchText, selectedReportedUser, user?.profile_id]);

  const handleOpenReport = () => {
    if (!user || !user?.profile_id) {
      setShowLoginPromptModal(true);
      return;
    }
    setSearchText('');
    setSearchResults([]);
    setSelectedReportedUser(null);
    setReason('Fake Profile / Stolen Photos');
    setDetails('');
    setSubmittedSuccess(false);
    setShowReportModal(true);
  };

  const handleSelectUser = (profile) => {
    setSelectedReportedUser(profile);
    setSearchText(profile.profile_id);
    setSearchResults([]);
  };

  const handleClearSelectedUser = () => {
    setSelectedReportedUser(null);
    setSearchText('');
    setSearchResults([]);
  };

  const handleCloseReportModal = () => {
    if (!submitting) {
      setShowReportModal(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!selectedReportedUser?.profile_id && !searchText.trim()) {
      toast.error('Please search and select the profile you wish to report.');
      return;
    }

    const targetProfileId = selectedReportedUser?.profile_id || searchText.trim();

    if (targetProfileId.toLowerCase() === user?.profile_id?.toLowerCase()) {
      toast.error('You cannot report your own profile.');
      return;
    }

    if (!details.trim()) {
      toast.error('Please provide a brief description of the safety violation.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Submit direct user profile report
      let apiSuccess = false;
      try {
        await axiosInstance.post(`/users/profile/${targetProfileId}/report`, {
          reason,
          details: details.trim()
        });
        apiSuccess = true;
      } catch (directErr) {
        console.warn('Direct profile report failed, fallback to safety desk:', directErr.message);
      }

      // 2. Fallback to contact messages safety desk if needed
      if (!apiSuccess) {
        await axiosInstance.post('/contact-messages', {
          name: user?.full_name || 'Registered Member',
          email: user?.email_address || 'member@bharathmarriage.com',
          phone: user?.mobile_number || null,
          subject: `[Safety Grievance] Reported Profile: ${targetProfileId}`,
          message: `Reporter: ${user?.full_name} (${user?.profile_id})\nReported User: ${targetProfileId}\nReason: ${reason}\n\nDetails:\n${details.trim()}`
        });
      }

      setSubmittedSuccess(true);
      toast.success('Safety report submitted successfully. Our trust & safety team will review this promptly.');
    } catch (err) {
      console.error('Error submitting safety report:', err);
      toast.error(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-20 text-left">
      <Helmet>
        <title>Safe Matrimony & Safety Tips | Bharath Marriage</title>
        <meta
          name="description"
          content="Your safety is our top priority. Read our safe matrimony guide and safety tips for online dating, first meetings, and background verification."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Breadcrumb / Back to Registration */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
            <span className="text-slate-400">Safety Tips</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-10 border-b border-slate-200/80 pb-6">
          <span className="text-heritage-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] block mb-2">
            Safe Matrimony Guide
          </span>
          <h1 className="font-display-lg text-3xl md:text-4xl text-charcoal-text font-bold leading-tight mb-3">
            Matrimonial Safety Tips
          </h1>
          <p className="text-soft-gray text-xs md:text-sm leading-relaxed max-w-2xl">
            At Bharath Marriage, your safety, security, and privacy are our top priorities. Follow these essential safety tips to ensure a secure, respectful, and happy matchmaking journey.
          </p>
        </div>

        {/* Info Grid */}
        <div className="space-y-6">
          
          {/* Card 1: Online Security */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="w-12 h-12 rounded-xl bg-deep-maroon/5 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-semibold">lock</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-charcoal-text">1. Safeguard Personal & Financial Details</h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Never disclose sensitive financial information, banking credentials, credit/debit card numbers, or passwords to anyone you interact with on the platform.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs md:text-sm">
                <li>Never transfer money, wire funds, or provide financial assistance to any member under any circumstances.</li>
                <li>Report any user who asks for financial help, gifts, or loans immediately.</li>
                <li>Keep personal contact details confidential until mutual trust has been established.</li>
              </ul>
            </div>
          </div>

          {/* Card 2: Initial Meetings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="w-12 h-12 rounded-xl bg-deep-maroon/5 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-semibold">diversity_3</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-charcoal-text">2. Safe In-Person Meetings</h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                When deciding to meet a prospective match in person, always take precautions to protect your safety and peace of mind.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs md:text-sm">
                <li>Always meet in public places such as cafes, restaurants, or community centers during daylight hours.</li>
                <li>Inform a family member or trusted friend about your meeting location, time, and companion details.</li>
                <li>Arrange your own transportation to and from the meeting venue.</li>
                <li>Involve parents or elders in meetings early in the process.</li>
              </ul>
            </div>
          </div>

          {/* Card 3: Communications */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="w-12 h-12 rounded-xl bg-deep-maroon/5 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-semibold">chat</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-charcoal-text">3. Mindful Digital Communication</h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Use Bharath Marriage's built-in direct messaging and secure video calling before moving conversations to personal channels.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs md:text-sm">
                <li>Be cautious of members who insist on immediately switching to external chat apps or obscure platforms.</li>
                <li>Never share private, sensitive, or explicit photographs.</li>
                <li>Take your time getting to know the candidate through video calls before planning visits.</li>
              </ul>
            </div>
          </div>

          {/* Card 4: Background Verification */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="w-12 h-12 rounded-xl bg-deep-maroon/5 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-semibold">verified_user</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-charcoal-text">4. Background & Identity Verification</h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                While we strive to verify member profiles, we strongly recommend conducting thorough background checks.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs md:text-sm">
                <li>Independently verify details regarding education, job profile, income, and family background before making commitments.</li>
                <li>Ask for family references and make direct enquiries to verify details.</li>
                <li>Consider doing a search on professional networks like LinkedIn or social media channels to confirm identity details.</li>
              </ul>
            </div>
          </div>

          {/* Card 5: Red Flags */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="w-12 h-12 rounded-xl bg-deep-maroon/5 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-semibold">flag</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-charcoal-text">5. Recognize Red Flags</h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Watch out for inconsistent behaviors that might indicate dishonesty or suspicious motives.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs md:text-sm">
                <li>Reluctance to do phone calls, video calls, or meet in person after a reasonable amount of time.</li>
                <li>Profiles that show highly contradictory details or sound too good to be true.</li>
                <li>Pushy behavior, attempts to make you feel guilty, or rushing you into marriage commitments.</li>
              </ul>
            </div>
          </div>

          {/* Reporting Info Block */}
          <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div>
              <h3 className="font-bold text-charcoal-text text-sm md:text-base mb-1">Help Us Keep The Platform Safe</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-lg">
                If you encounter any suspicious profiles, fraudulent behaviors, or disrespectful communications, please report the profile directly or contact our safety desk.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenReport}
              className="px-6 py-2.5 bg-deep-maroon hover:bg-primary text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 text-center shadow-md shadow-deep-maroon/20 hover:shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">report</span>
              <span>Report Profile</span>
            </button>
          </div>

        </div>
      </div>

      {/* Login Prompt Modal (for non-logged in users) */}
      {showLoginPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Login Required to Report</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                To prevent spam and protect our community, only verified registered members can submit profile safety reports.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLoginPromptModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginPromptModal(false);
                  navigate('/login');
                }}
                className="px-6 py-2 text-xs font-bold text-white bg-deep-maroon hover:bg-primary rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Login to Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Report Profile Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-left animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">report</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Report Profile / Safety Grievance</h3>
                  <p className="text-[11px] text-slate-500">Confidential trust &amp; safety review</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReportModal}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {submittedSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">Safety Report Received</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Thank you for keeping Bharat Marriage safe. Our trust &amp; safety team has received your report against{' '}
                  <strong className="text-slate-900 font-bold">{selectedReportedUser?.full_name || searchText}</strong> and will investigate promptly.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-6 py-2 bg-deep-maroon text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-primary transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
                {/* Profile Search & Selection Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Search &amp; Select Reported Profile <span className="text-rose-500">*</span>
                  </label>

                  {selectedReportedUser ? (
                    /* Selected User Snapshot Card */
                    <div className="flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-rose-50/40 animate-fade-in">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getResolvedImageUrl(selectedReportedUser.photo, selectedReportedUser.gender)}
                          alt={selectedReportedUser.full_name}
                          className="w-11 h-11 rounded-full object-cover border border-rose-300 shadow-xs shrink-0"
                          onError={(e) => handleImageError(e, selectedReportedUser.gender)}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {selectedReportedUser.full_name}
                            </span>
                            <span className="text-[10px] font-mono font-semibold bg-white px-1.5 py-0.2 rounded border border-rose-200 text-deep-maroon">
                              {selectedReportedUser.profile_id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {[selectedReportedUser.gender, selectedReportedUser.district, selectedReportedUser.religion]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearSelectedUser}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    /* Search Input with Autocomplete Dropdown */
                    <div className="relative">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                          search
                        </span>
                        <input
                          type="text"
                          required
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Type Profile ID (e.g. BKLM01...) or Name to search..."
                          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon shadow-2xs"
                        />
                        {isSearching && (
                          <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-slate-400 text-[18px] animate-spin">
                            progress_activity
                          </span>
                        )}
                      </div>

                      {/* Dropdown Results */}
                      {searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                          {searchResults.map((p) => (
                            <button
                              key={p.profile_id}
                              type="button"
                              onClick={() => handleSelectUser(p)}
                              className="w-full p-2.5 text-left hover:bg-rose-50/50 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <img
                                src={getResolvedImageUrl(p.photo, p.gender)}
                                alt={p.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                onError={(e) => handleImageError(e, p.gender)}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">{p.full_name}</span>
                                  <span className="text-[10px] font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700">
                                    {p.profile_id}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {[p.gender, p.district, p.religion].filter(Boolean).join(' • ')}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nature of Violation / Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon"
                  >
                    <option value="Fake Profile / Stolen Photos">Fake Profile / Stolen Photos</option>
                    <option value="Financial Scam / Asking for Money">Financial Scam / Asking for Money</option>
                    <option value="Inappropriate / Abusive Behaviour">Inappropriate / Abusive Behaviour</option>
                    <option value="Already Married / Misrepresenting Status">Already Married / Misrepresenting Status</option>
                    <option value="Commercial Solicitation / Spam">Commercial Solicitation / Spam</option>
                    <option value="Other Safety Concern">Other Safety Concern</option>
                  </select>
                </div>

                {/* Reporter Verified Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">Reporting as:</span>{' '}
                    <span>{user?.full_name} ({user?.profile_id})</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Verified User
                  </span>
                </div>

                {/* Details Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Incident Description &amp; Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe what occurred, any specific messages, dates, or reasons for concern..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon"
                  ></textarea>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseReportModal}
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || (!selectedReportedUser && !searchText.trim())}
                    className="px-5 py-2 bg-deep-maroon hover:bg-primary text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Submit Safety Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
