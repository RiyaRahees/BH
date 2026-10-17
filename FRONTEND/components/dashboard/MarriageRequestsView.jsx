import React, { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useToast } from '../../src/context/ToastContext';
import { getResolvedImageUrl, handleImageError } from '../../src/utils/imageUtils';
import LoadingSpinner from '../LoadingSpinner';

export default function MarriageRequestsView({ onCountChange }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'rejected'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmModalData, setConfirmModalData] = useState(null); // { request, action: 'ACCEPT' | 'REJECT' }
  const toast = useToast();

  const fetchRequests = async (tab = activeTab) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/users/marriage-confirmation-requests?tab=${tab}`);
      if (response.data?.success) {
        setRequests(response.data.requests || []);
      }

      // Also get pending count for tab badge
      if (tab !== 'pending') {
        const pendingRes = await axiosInstance.get('/users/marriage-confirmation-requests?tab=pending');
        if (pendingRes.data?.success) {
          setPendingCount(pendingRes.data.requests?.length || 0);
        }
      } else {
        setPendingCount(response.data.requests?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching marriage requests:', err);
      toast.error('Failed to load marriage requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const handleOpenConfirm = (request, action) => {
    setConfirmModalData({ request, action });
  };

  const handleCloseConfirm = () => {
    if (!actionLoadingId) {
      setConfirmModalData(null);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!confirmModalData) return;
    const { request, action } = confirmModalData;
    setActionLoadingId(request.request_id);

    try {
      const response = await axiosInstance.post(`/users/marriage-confirmation-requests/${request.request_id}/respond`, {
        action
      });
      if (action === 'ACCEPT') {
        toast.success(response.data?.message || 'Marriage match confirmed! Congratulations on your union!');
      } else {
        toast.info(response.data?.message || 'Marriage match request declined.');
      }
      
      setConfirmModalData(null);
      // Refresh current view and notify dashboard
      await fetchRequests(activeTab);
      if (onCountChange) {
        onCountChange();
      }
    } catch (err) {
      console.error('Error responding to marriage confirmation:', err);
      toast.error(err.response?.data?.error || 'Failed to update request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      <section className="rounded-2xl border border-slate-200/70 bg-white p-5 md:p-6 shadow-xs">
        
        {/* Header Strip */}
        <div className="mb-6 border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-deep-maroon"></span>
              <h2 className="text-base md:text-lg font-bold text-charcoal-text uppercase tracking-wide">
                Marriage Requests
              </h2>
            </div>
            <p className="text-xs text-soft-gray mt-1">
              Review and manage marriage match confirmation requests from registered partners.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl shrink-0 self-start sm:self-auto gap-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-deep-maroon shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Requests</span>
              {pendingCount > 0 && (
                <span className="bg-deep-maroon text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('accepted')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'accepted'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Confirmed</span>
              <span className="text-xs">💍</span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Declined</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-400 font-medium">Loading marriage requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-deep-maroon mb-3 shadow-xs">
              <span className="material-symbols-outlined text-[32px]">favorite</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {activeTab === 'pending'
                ? 'No Pending Marriage Requests'
                : activeTab === 'accepted'
                ? 'No Confirmed Marriage Matches Yet'
                : 'No Declined Requests'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md">
              {activeTab === 'pending'
                ? 'When a partner mentions you as their spouse upon account closure or success story submission, it will appear here for your confirmation.'
                : activeTab === 'accepted'
                ? 'Partners with whom you have confirmed marriage matches will be archived here.'
                : 'Any declined marriage match confirmation requests will appear here for your reference.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => {
              const isPending = req.partner_confirmation_status === 'PENDING';
              const isAccepted = req.partner_confirmation_status === 'ACCEPTED';
              const isRejected = req.partner_confirmation_status === 'REJECTED';

              return (
                <div
                  key={req.request_id}
                  className={`rounded-2xl border transition-all p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs ${
                    isAccepted
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : isRejected
                      ? 'border-slate-200 bg-slate-50/50 opacity-80'
                      : 'border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-rose-50/20 hover:border-amber-400'
                  }`}
                >
                  {/* Left: Partner Profile Snapshot */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={getResolvedImageUrl(req.requester_photo, req.requester_gender)}
                        alt={req.requester_name}
                        className={`w-16 h-16 rounded-full object-cover border-2 shadow-xs ${
                          isAccepted ? 'border-emerald-400' : 'border-amber-300'
                        }`}
                        onError={(e) => handleImageError(e, req.requester_gender)}
                      />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-deep-maroon text-white flex items-center justify-center text-xs shadow-xs">
                        💍
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm md:text-base font-bold text-slate-900 truncate">
                          {req.requester_name}
                        </h3>
                        <span className="text-[11px] font-mono bg-white border border-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-md">
                          {req.requester_profile_id}
                        </span>

                        {isPending && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                            Awaiting Your Confirmation
                          </span>
                        )}
                        {isAccepted && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Match Confirmed
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            Declined
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        {[req.requester_gender, req.requester_district, req.requester_religion]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {isAccepted
                          ? `You confirmed marriage with ${req.requester_name}.`
                          : isRejected
                          ? `You declined the marriage confirmation request with ${req.requester_name}.`
                          : `Mentioned you as their married partner on Bharat Marriage. Please confirm if this is accurate.`}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap">
                        <span>Requested on {formatDate(req.created_at)}</span>
                        {req.allow_advertisement ? (
                          <span className="text-emerald-700 font-medium">
                            • Agreed to feature in Success Stories & Ads 🎉
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 w-full md:w-auto flex items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/60 justify-end">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(req, 'REJECT')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
                        >
                          Decline
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(req, 'ACCEPT')}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-deep-maroon to-primary hover:opacity-95 shadow-md shadow-deep-maroon/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">favorite</span>
                          <span>Accept & Confirm</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-xs font-medium text-slate-500">
                        {isAccepted ? 'Confirmed on ' + formatDate(req.partner_responded_at) : 'Declined'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modal Popup */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  confirmModalData.action === 'ACCEPT' ? 'bg-rose-50 text-deep-maroon' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {confirmModalData.action === 'ACCEPT' ? 'favorite' : 'close'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {confirmModalData.action === 'ACCEPT' ? 'Confirm Marriage Match' : 'Decline Marriage Request'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {confirmModalData.action === 'ACCEPT' ? 'Verify partner marriage union' : 'Decline partner confirmation'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseConfirm}
                disabled={Boolean(actionLoadingId)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Partner Snapshot Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-3.5">
                <img
                  src={getResolvedImageUrl(confirmModalData.request.requester_photo, confirmModalData.request.requester_gender)}
                  alt={confirmModalData.request.requester_name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                  onError={(e) => handleImageError(e, confirmModalData.request.requester_gender)}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{confirmModalData.request.requester_name}</span>
                    <span className="text-[10px] font-mono bg-white border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      {confirmModalData.request.requester_profile_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {[confirmModalData.request.requester_gender, confirmModalData.request.requester_district, confirmModalData.request.requester_religion]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
              </div>

              {/* Message Prompt */}
              {confirmModalData.action === 'ACCEPT' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Are you sure you want to confirm that you got married to{' '}
                    <strong className="text-slate-900 font-bold">{confirmModalData.request.requester_name}</strong>?
                  </p>

                  {/* 3 Days Deactivation Warning Box */}
                  <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">warning</span>
                    <div className="text-[11px] text-amber-900 space-y-0.5 leading-relaxed">
                      <p className="font-bold">Account Deactivation Notice</p>
                      <p>
                        Once confirmed, your matrimonial profile will be <strong>deactivated in 3 days</strong> to conclude your matchmaking search.
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 rounded-xl p-2.5 leading-relaxed flex items-center gap-2">
                    <span className="text-sm">🎉</span>
                    <span>Your mutual match will be recorded as a verified success story!</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  Are you sure you want to decline the marriage confirmation request from{' '}
                  <strong className="text-slate-900 font-bold">{confirmModalData.request.requester_name}</strong>?
                </p>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseConfirm}
                disabled={Boolean(actionLoadingId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={Boolean(actionLoadingId)}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  confirmModalData.action === 'ACCEPT'
                    ? 'bg-gradient-to-r from-deep-maroon to-primary hover:opacity-95 shadow-deep-maroon/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {actionLoadingId ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">
                      {confirmModalData.action === 'ACCEPT' ? 'check_circle' : 'delete'}
                    </span>
                    <span>
                      {confirmModalData.action === 'ACCEPT' ? 'Yes, Confirm Marriage' : 'Yes, Decline Request'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
