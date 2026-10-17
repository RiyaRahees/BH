import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import axiosInstance from '../../src/utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { COUNTRY_CODES } from '../../src/utils/countryCodes';

export default function SettingsView() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    email: user?.email_address || '',
    countryCode: user?.country_code || '+91',
    phone: user?.mobile_number || '',
    visibility: 'visible',
    matchAlerts: true,
    weeklyDigest: false,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  // Password Reset States
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const [isResetSaved, setIsResetSaved] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Status, Deletion & Exit Survey States
  const [statusModalOpen, setStatusModalOpen] = useState(false); // For reactivation
  const [closureModalOpen, setClosureModalOpen] = useState(false); // For deactivation & deletion
  const [closureType, setClosureType] = useState('DEACTIVATE'); // 'DEACTIVATE' | 'DELETE'
  const [isProcessingClosure, setIsProcessingClosure] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [feedbackData, setFeedbackData] = useState({
    isMarried: '', // 'yes' | 'no'
    foundViaPlatform: '', // 'yes' | 'no'
    partnerId: '',
    allowAdvertisement: true, // boolean consent
    marriageSource: 'Through Family & Relatives',
    reason: '',
    feedback: ''
  });

  // Partner Search States
  const [partnerSearchText, setPartnerSearchText] = useState('');
  const [partnerSearchResults, setPartnerSearchResults] = useState([]);
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDeactivated = String(user?.status || '').toUpperCase() === 'DEACTIVATED';

  const initialEmail = user?.email_address || '';
  const initialCountryCode = user?.country_code || '+91';
  const initialPhone = user?.mobile_number || '';
  const isFormChanged = settings.email.trim() !== initialEmail.trim() || settings.phone.trim() !== initialPhone.trim() || settings.countryCode !== initialCountryCode;

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        email: user.email_address || '',
        countryCode: user.country_code || '+91',
        phone: user.mobile_number || '',
      }));
    }
  }, [user]);

  // Debounced partner lookup
  useEffect(() => {
    if (!partnerSearchText || partnerSearchText.trim().length < 2 || selectedPartner) {
      setPartnerSearchResults([]);
      setIsSearchingPartner(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPartner(true);
      try {
        const response = await axiosInstance.get(`/users/lookup-partner?query=${encodeURIComponent(partnerSearchText.trim())}`);
        if (response.data?.success) {
          const filtered = (response.data.results || []).filter(r => r.profile_id !== user?.profile_id);
          setPartnerSearchResults(filtered);
        }
      } catch (err) {
        console.error('Error looking up partner:', err);
      } finally {
        setIsSearchingPartner(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [partnerSearchText, selectedPartner, user?.profile_id]);

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner);
    setFeedbackData(prev => ({ ...prev, partnerId: partner.profile_id }));
    setPartnerSearchText(partner.profile_id);
    setPartnerSearchResults([]);
    setValidationError('');
  };

  const handleClearSelectedPartner = () => {
    setSelectedPartner(null);
    setFeedbackData(prev => ({ ...prev, partnerId: '' }));
    setPartnerSearchText('');
    setPartnerSearchResults([]);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (passwordData.oldPassword === passwordData.newPassword) {
      const msg = "New password cannot be the same.";
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const msg = "Passwords do not match";
      setConfirmPasswordError(msg);
      toast.error(msg);
      return;
    }

    const profileId = user?.profile_id || user?.id;
    try {
      await axiosInstance.put(`/users/profile/${profileId}/reset-password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setIsResetSaved(true);
      toast.success("Password changed successfully. Redirecting to login...");
      
      // Perform logout and redirect after a short delay
      setTimeout(async () => {
        try {
          await axiosInstance.post('/auth/logout');
        } catch (err) {
          console.error('Error calling logout API', err);
        }
        logout();
        navigate('/login');
      }, 3500);
      
    } catch (err) {
      console.error('Error resetting password:', err);
      const errMsg = err.response?.data?.field === 'oldPassword' || err.response?.data?.error === 'Incorrect old password'
        ? 'Incorrect password'
        : (err.response?.data?.error || 'Failed to reset password');
      setPasswordError(errMsg);
      toast.error(errMsg);
    }
  };

  // Open exit survey for deactivation
  const handleOpenDeactivate = () => {
    setClosureType('DEACTIVATE');
    setSelectedPartner(null);
    setPartnerSearchText('');
    setPartnerSearchResults([]);
    setFeedbackData({
      isMarried: '',
      foundViaPlatform: '',
      partnerId: '',
      allowAdvertisement: true,
      marriageSource: 'Through Family & Relatives',
      reason: '',
      feedback: ''
    });
    setValidationError('');
    setClosureModalOpen(true);
  };

  // Open exit survey for permanent deletion
  const handleOpenDelete = () => {
    setClosureType('DELETE');
    setSelectedPartner(null);
    setPartnerSearchText('');
    setPartnerSearchResults([]);
    setFeedbackData({
      isMarried: '',
      foundViaPlatform: '',
      partnerId: '',
      allowAdvertisement: true,
      marriageSource: 'Through Family & Relatives',
      reason: '',
      feedback: ''
    });
    setValidationError('');
    setClosureModalOpen(true);
  };

  // Reactivate profile handler (for already deactivated users)
  const handleReactivateProfile = async () => {
    setIsProcessingClosure(true);
    setError(null);
    const profileId = user?.profile_id || user?.id;
    try {
      const response = await axiosInstance.put(`/users/profile/${profileId}/status`, {
        status: 'ACTIVE'
      });
      if (updateUser) {
        updateUser({ ...user, status: 'ACTIVE' });
      }
      setStatusModalOpen(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success(response.data?.message || 'Profile activated successfully');
    } catch (err) {
      console.error('Error activating profile:', err);
      const errMsg = err.response?.data?.error || 'Failed to activate profile';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsProcessingClosure(false);
    }
  };

  // Helper to determine if the confirmation button should be disabled
  const isClosureSubmitDisabled = () => {
    if (isProcessingClosure) return true;
    if (!feedbackData.isMarried) return true;
    if (feedbackData.isMarried === 'yes') {
      if (!feedbackData.foundViaPlatform) return true;
      if (feedbackData.foundViaPlatform === 'yes' && !feedbackData.partnerId.trim()) return true;
      return false;
    }
    if (feedbackData.isMarried === 'no') {
      if (!feedbackData.reason) return true;
      return false;
    }
    return true;
  };

  // Submit exit survey & confirm Deactivation or Deletion
  const handleConfirmClosure = async () => {
    setValidationError('');

    // Validation
    if (!feedbackData.isMarried) {
      setValidationError('Please indicate whether your marriage is fixed / completed.');
      return;
    }

    if (feedbackData.isMarried === 'yes') {
      if (!feedbackData.foundViaPlatform) {
        setValidationError('Please select whether you found your partner through Bharat Marriage.');
        return;
      }
      if (feedbackData.foundViaPlatform === 'yes' && !feedbackData.partnerId.trim()) {
        setValidationError("Please enter or select your partner's Bharat Marriage Profile ID.");
        return;
      }
    } else if (feedbackData.isMarried === 'no') {
      if (!feedbackData.reason) {
        setValidationError('Please select the reason for deactivating/deleting your profile.');
        return;
      }
    }

    setIsProcessingClosure(true);
    const profileId = user?.profile_id || user?.id;

    const formData = new FormData();
    formData.append('isMarried', feedbackData.isMarried === 'yes');
    formData.append('foundViaPlatform', feedbackData.foundViaPlatform === 'yes');
    formData.append('partnerId', feedbackData.partnerId.trim());
    formData.append('allowAdvertisement', feedbackData.allowAdvertisement);
    formData.append('marriageSource', feedbackData.marriageSource);
    
    const reasonValue = feedbackData.isMarried === 'yes' 
      ? (feedbackData.foundViaPlatform === 'yes' ? 'Married through Bharat Marriage' : `Married (${feedbackData.marriageSource})`)
      : feedbackData.reason;
    formData.append('reason', reasonValue);
    formData.append('feedback', feedbackData.feedback);

    if (feedbackData.allowAdvertisement && feedbackData.couplePhotos) {
      feedbackData.couplePhotos.forEach(photo => {
        formData.append('couplePhotos', photo);
      });
    }

    try {
      if (closureType === 'DEACTIVATE') {
        formData.append('status', 'DEACTIVATED');
        const response = await axiosInstance.put(`/users/profile/${profileId}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(response.data?.message || 'Profile deactivation requested successfully.');
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      } else {
        const response = await axiosInstance.put(`/users/profile/${profileId}/delete-request`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(response.data?.message || 'Account deletion requested successfully.');
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error(`Error during account ${closureType.toLowerCase()}:`, err);
      const errMsg = err.response?.data?.error || `Failed to process request. Please try again.`;
      toast.error(errMsg);
      setValidationError(errMsg);
      setIsProcessingClosure(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormChanged) return;
    setError(null);
    setIsSubmitting(true);
    const profileId = user?.profile_id || user?.id;
    try {
      await axiosInstance.put(`/users/profile/${profileId}/settings`, {
        email: settings.email,
        country_code: settings.countryCode,
        phone: settings.phone,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      if (updateUser) {
        updateUser({ ...user, email_address: settings.email, country_code: settings.countryCode, mobile_number: settings.phone });
      }
      toast.success("Account settings updated successfully!");
    } catch (err) {
      console.error('Error updating settings:', err);
      const errMsg = err.response?.data?.error || 'Failed to update settings';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-6 shadow-none md:shadow-sm text-left">
        <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-deep-maroon"></span>
              Account Settings
            </h2>
            <p className="text-[11px] text-soft-gray mt-1">Manage credentials, privacy options, and notification settings.</p>
          </div>
          {isSaved && (
            <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full flex items-center gap-1 animate-fade-in">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Settings Updated!
            </div>
          )}
          {error && (
            <div className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-3 py-1 rounded-full flex items-center gap-1 animate-fade-in">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Security & Credentials */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon">Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Mobile Number</label>
                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/50 focus-within:ring-1 focus-within:ring-deep-maroon">
                  <select
                    value={settings.countryCode}
                    onChange={(e) => setSettings({ ...settings, countryCode: e.target.value })}
                    className="bg-transparent border-r border-slate-200 text-charcoal-text text-xs py-2 px-2 focus:outline-none focus:ring-0 cursor-pointer font-medium"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full bg-transparent py-2 px-3 text-xs text-charcoal-text focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Reset Sub-section */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal-text mb-3">Change Password</h4>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Old Password</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, oldPassword: e.target.value });
                        setPasswordError(null);
                      }}
                      className={`w-full border ${passwordError ? 'border-red-400 focus:ring-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-deep-maroon bg-slate-50/50'} rounded-lg py-2 pl-3 pr-10 text-xs text-charcoal-text focus:outline-none focus:ring-1`}
                      placeholder="Enter old password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">{showOldPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {passwordError && <p className="text-[10px] text-red-500 mt-1 font-semibold">{passwordError}</p>}
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Confirm New Password</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                          setConfirmPasswordError(null);
                        }}
                        className={`w-full border ${confirmPasswordError ? 'border-red-400 focus:ring-red-500 bg-red-50/30' : 'border-slate-200 focus:ring-deep-maroon bg-slate-50/50'} rounded-lg py-2 pl-3 pr-10 text-xs text-charcoal-text focus:outline-none focus:ring-1`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[16px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword || isResetSaved}
                      className="bg-deep-maroon disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all active:scale-[0.98] text-[11px] whitespace-nowrap"
                    >
                      Reset
                    </button>
                  </div>
                  {confirmPasswordError && <p className="text-[10px] text-red-500 mt-1 font-semibold">{confirmPasswordError}</p>}
                </div>
              </div>
            </div>
          </div>





          {/* Section 2: Account Status & Deactivation */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-maroon mb-3">Account Status</h3>
            
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Current Status:</span>
                  {isDeactivated ? (
                    <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                      Deactivated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isDeactivated 
                    ? 'Your profile is currently hidden from recommendations, search results, and match lists.' 
                    : 'Your profile is active and visible to potential matches and recommendations.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => isDeactivated ? setStatusModalOpen(true) : handleOpenDeactivate()}
                disabled={isProcessingClosure}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 ${
                  isDeactivated
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                }`}
              >
                {isDeactivated ? 'Activate Profile' : 'Deactivate Profile'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700">Delete Account</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenDelete}
                disabled={isProcessingClosure}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer active:scale-95"
              >
                Permanently Delete
              </button>
            </div>
          </div>

          <div className="pt-4 text-right">
            <button
              type="submit"
              disabled={!isFormChanged || isSubmitting}
              className={`font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all text-xs uppercase tracking-wider ${
                isFormChanged && !isSubmitting
                  ? 'bg-deep-maroon hover:bg-primary text-white cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </section>

      {/* Reactivate Confirmation Modal (Only for activating deactivated profile) */}
      {statusModalOpen && isDeactivated && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isProcessingClosure && setStatusModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-emerald-100 text-emerald-600">
                <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Activate Profile?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Your profile will become visible again to potential matches. You will start appearing in search results and recommendations.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  disabled={isProcessingClosure}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReactivateProfile}
                  disabled={isProcessingClosure}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-70 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                >
                  {isProcessingClosure ? 'Activating...' : 'Yes, Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Survey / Questionnaire Modal for Deactivation & Deletion */}
      {closureModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => !isProcessingClosure && setClosureModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-8 text-left z-10 border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between ${closureType === 'DELETE' ? 'bg-gradient-to-r from-rose-700 to-rose-900' : 'bg-gradient-to-r from-[#5B132B] to-[#7B1D3A]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    {closureType === 'DELETE' ? 'delete_forever' : 'person_off'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {closureType === 'DELETE' ? 'Permanently Delete Account' : 'Deactivate Profile'}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    Please answer a few quick questions before proceeding
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => !isProcessingClosure && setClosureModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body / Questions */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">error</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Question 1: Is marriage over/fixed? */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Is your marriage fixed or completed? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackData({ ...feedbackData, isMarried: 'yes', reason: '' });
                      setValidationError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      feedbackData.isMarried === 'yes'
                        ? 'border-deep-maroon bg-deep-maroon/5 ring-1 ring-deep-maroon text-deep-maroon'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      feedbackData.isMarried === 'yes' ? 'bg-deep-maroon text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold">Yes, Marriage Fixed / Married</div>
                      <div className="text-[10px] text-slate-500">I have found my life partner</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackData({ ...feedbackData, isMarried: 'no', foundViaPlatform: '', partnerId: '' });
                      setValidationError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      feedbackData.isMarried === 'no'
                        ? 'border-deep-maroon bg-deep-maroon/5 ring-1 ring-deep-maroon text-deep-maroon'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      feedbackData.isMarried === 'no' ? 'bg-deep-maroon text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">person_search</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold">No, Not Yet</div>
                      <div className="text-[10px] text-slate-500">Taking a break or other reason</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Question 2 (IF MARRIED = YES) */}
              {feedbackData.isMarried === 'yes' && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      2. Did you find your partner through Bharat Marriage? <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackData({ ...feedbackData, foundViaPlatform: 'yes' });
                          setValidationError('');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          feedbackData.foundViaPlatform === 'yes'
                            ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 text-emerald-800'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          feedbackData.foundViaPlatform === 'yes' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold">Yes, through Bharat Marriage</div>
                          <div className="text-[10px] text-slate-500">Found on our website</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackData({ ...feedbackData, foundViaPlatform: 'no', partnerId: '' });
                          setValidationError('');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          feedbackData.foundViaPlatform === 'no'
                            ? 'border-slate-700 bg-slate-100 ring-1 ring-slate-700 text-slate-800'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          feedbackData.foundViaPlatform === 'no' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">public</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold">No, from somewhere else</div>
                          <div className="text-[10px] text-slate-500">Found through other sources</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* If found through Bharat Marriage -> Search Partner + Partner ID + Advertisement Consent */}
                  {feedbackData.foundViaPlatform === 'yes' && (
                    <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <span className="text-base">🎉</span>
                        <span>Congratulations on your match!</span>
                      </div>

                      {/* Partner Search / Selection Box */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-slate-800 mb-1">
                          Search Partner by Name or ID <span className="text-rose-500">*</span>
                        </label>

                        {selectedPartner ? (
                          <div className="flex items-center justify-between p-3 bg-white border-2 border-emerald-500/80 rounded-xl shadow-xs animate-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3 min-w-0">
                              {selectedPartner.photo ? (
                                <img
                                  src={selectedPartner.photo}
                                  alt={selectedPartner.full_name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-300">
                                  {selectedPartner.full_name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                              )}
                              <div className="text-left min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 truncate">{selectedPartner.full_name}</span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                                    {selectedPartner.profile_id}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {[selectedPartner.gender, selectedPartner.district, selectedPartner.religion].filter(Boolean).join(' • ')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearSelectedPartner}
                              className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold px-2.5 py-1 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 shrink-0 cursor-pointer ml-2"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center border border-amber-300 bg-white rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500/40">
                              <span className="material-symbols-outlined text-slate-400 text-[18px] mr-2">search</span>
                              <input
                                type="text"
                                value={partnerSearchText}
                                onChange={(e) => {
                                  setPartnerSearchText(e.target.value);
                                  setFeedbackData(prev => ({ ...prev, partnerId: e.target.value }));
                                  setValidationError('');
                                }}
                                placeholder="Search by Partner Name or ID (e.g. BM100234 or Name)"
                                className="w-full text-xs text-charcoal-text bg-transparent focus:outline-none"
                              />
                              {isSearchingPartner && (
                                <span className="material-symbols-outlined text-amber-500 text-[18px] animate-spin">progress_activity</span>
                              )}
                              {partnerSearchText && (
                                <button
                                  type="button"
                                  onClick={handleClearSelectedPartner}
                                  className="text-slate-400 hover:text-slate-600 ml-1.5"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              )}
                            </div>

                            {/* Dropdown Live Results with small user thumbnail */}
                            {partnerSearchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150">
                                {partnerSearchResults.map((p) => (
                                  <div
                                    key={p.profile_id}
                                    onClick={() => handleSelectPartner(p)}
                                    className="p-2.5 flex items-center gap-3 hover:bg-amber-50 cursor-pointer transition-colors"
                                  >
                                    {p.photo ? (
                                      <img
                                        src={p.photo}
                                        alt={p.full_name}
                                        className="w-8 h-8 rounded-full object-cover border border-amber-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                                        {p.full_name?.charAt(0)?.toUpperCase() || 'P'}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800 truncate">{p.full_name}</span>
                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                          {p.profile_id}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 truncate">
                                        {[p.gender, p.district, p.religion].filter(Boolean).join(' • ')}
                                      </p>
                                    </div>
                                    <span className="material-symbols-outlined text-amber-600 text-[18px]">add_circle</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-[10px] text-amber-800/80 mt-1">
                              Search by name or type your partner's ID directly.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Advertisement / Success Story Consent Question */}
                      <div className="pt-2 border-t border-amber-200/60">
                        <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                          Can we feature your success story in our advertisements & promotions?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            feedbackData.allowAdvertisement
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name="allow_advertisement"
                              checked={feedbackData.allowAdvertisement === true}
                              onChange={() => setFeedbackData(prev => ({ ...prev, allowAdvertisement: true }))}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Yes, you may feature us 🎉</span>
                          </label>
                          <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            !feedbackData.allowAdvertisement
                              ? 'border-slate-600 bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name="allow_advertisement"
                              checked={feedbackData.allowAdvertisement === false}
                              onChange={() => setFeedbackData(prev => ({ ...prev, allowAdvertisement: false }))}
                              className="text-slate-600 focus:ring-slate-500"
                            />
                            <span>No, keep it private</span>
                          </label>
                        </div>
                      </div>

                      {feedbackData.allowAdvertisement && (
                        <div className="pt-2 border-t border-amber-200/60">
                          <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                            Upload Couple Photos (Optional, Max 2 photos)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              if (files.length > 2 || (feedbackData.couplePhotos?.length || 0) + files.length > 2) {
                                toast.error('You can only upload up to 2 photos');
                                return;
                              }
                              setFeedbackData(prev => ({ ...prev, couplePhotos: [...(prev.couplePhotos || []), ...files] }));
                            }}
                            className="block w-full text-xs text-slate-700
                              border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/50 hover:bg-amber-100/50
                              transition-colors p-2 cursor-pointer
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-xs file:font-bold
                              file:bg-amber-200 file:text-amber-900
                              hover:file:bg-amber-300 file:cursor-pointer shadow-sm"
                          />
                          {feedbackData.couplePhotos && feedbackData.couplePhotos.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {feedbackData.couplePhotos.map((photo, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200">
                                  <img src={URL.createObjectURL(photo)} alt="couple" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => setFeedbackData(prev => ({
                                      ...prev,
                                      couplePhotos: prev.couplePhotos.filter((_, i) => i !== idx)
                                    }))}
                                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-0.5"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">close</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Share your experience or wishes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={feedbackData.feedback}
                          onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                          placeholder="Tell us a few words about how you met or your feedback..."
                          className="w-full border border-amber-200/80 bg-white rounded-lg py-2 px-3 text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* If found from elsewhere -> Source field */}
                  {feedbackData.foundViaPlatform === 'no' && (
                    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Where did you find your partner?
                        </label>
                        <select
                          value={feedbackData.marriageSource}
                          onChange={(e) => setFeedbackData({ ...feedbackData, marriageSource: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon font-medium"
                        >
                          <option value="Through Family & Relatives">Through Family & Relatives</option>
                          <option value="Other Matrimony Website / App">Other Matrimony Website / App</option>
                          <option value="Direct Proposal / Acquaintance">Direct Proposal / Acquaintance</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Other Source">Other Source</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Any suggestions for Bharat Marriage? (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={feedbackData.feedback}
                          onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                          placeholder="Tell us how we could improve our services..."
                          className="w-full border border-slate-200 bg-white rounded-lg py-2 px-3 text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Question 2 (IF MARRIED = NO) */}
              {feedbackData.isMarried === 'no' && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      2. Please let us know the reason for leaving: <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-1.5">
                      {[
                        'Taking a temporary break from search',
                        'Not getting relevant or sufficient match recommendations',
                        'Privacy concerns or unwanted contacts',
                        'Pricing or membership plan related reasons',
                        'Technical difficulties or website experience',
                        'Other reasons'
                      ].map((r) => (
                        <label
                          key={r}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            feedbackData.reason === r
                              ? 'border-deep-maroon bg-deep-maroon/5 font-semibold text-deep-maroon'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="closure_reason"
                            checked={feedbackData.reason === r}
                            onChange={() => {
                              setFeedbackData({ ...feedbackData, reason: r });
                              setValidationError('');
                            }}
                            className="text-deep-maroon focus:ring-deep-maroon"
                          />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tell us how we can improve for you (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackData.feedback}
                      onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                      placeholder="Your feedback helps us make Bharat Marriage better..."
                      className="w-full border border-slate-200 bg-white rounded-lg py-2 px-3 text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Grace Period Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-3 items-start text-amber-900 text-[11px] leading-relaxed">
                <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">info</span>
                <div>
                  <strong>3-Day Grace Period:</strong>{' '}
                  {closureType === 'DELETE' ? (
                    <span>
                      Your account will be hidden immediately and scheduled for permanent deletion in <strong>3 days</strong>. If you change your mind, simply log in again within 3 days to cancel this request.
                    </span>
                  ) : (
                    <span>
                      Your profile will be hidden immediately from all members. If you change your mind, simply log in within <strong>3 days</strong> to cancel this deactivation request.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end items-center">
              <button
                type="button"
                onClick={() => !isProcessingClosure && setClosureModalOpen(false)}
                disabled={isProcessingClosure}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClosure}
                disabled={isClosureSubmitDisabled()}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                  isClosureSubmitDisabled()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/50'
                    : closureType === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer'
                    : 'bg-deep-maroon hover:bg-primary text-white shadow-deep-maroon/20 cursor-pointer'
                }`}
              >
                {isProcessingClosure ? 'Processing...' : closureType === 'DELETE' ? 'Yes, Permanently Delete' : 'Yes, Deactivate Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shadcn-style Toast Notification */}
      {isResetSaved && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex items-start gap-3 w-[320px]">
            <span className="material-symbols-outlined text-emerald-500 mt-0.5">check_circle</span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Password Changed</h4>
              <p className="text-xs text-slate-500 mt-1">Your password has been successfully updated. Please login again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Floating Bar */}
      {isFormChanged && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl py-3 px-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-max max-w-[90vw]">
            <div className="flex items-center gap-2 text-white shrink-0">
              <span className="material-symbols-outlined text-amber-400">info</span>
              <span className="text-sm font-semibold">You have unsaved changes</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    email: initialEmail,
                    phone: initialPhone,
                  }));
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Discard
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-deep-maroon hover:bg-primary transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
