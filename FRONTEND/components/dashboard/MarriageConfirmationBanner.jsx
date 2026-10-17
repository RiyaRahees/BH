import React, { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useToast } from '../../src/context/ToastContext';
import { getResolvedImageUrl, handleImageError } from '../../src/utils/imageUtils';

export default function MarriageConfirmationBanner() {
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const toast = useToast();

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('/users/marriage-confirmation-requests');
      if (response.data?.success) {
        setRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching marriage confirmation requests:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (requestId, action) => {
    setLoadingId(requestId);
    try {
      const response = await axiosInstance.post(`/users/marriage-confirmation-requests/${requestId}/respond`, {
        action
      });
      if (action === 'ACCEPT') {
        toast.success(response.data?.message || 'Marriage match confirmed! Congratulations!');
      } else {
        toast.info(response.data?.message || 'Marriage match request declined.');
      }
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
    } catch (err) {
      console.error('Error responding to marriage confirmation:', err);
      toast.error(err.response?.data?.error || 'Failed to respond to marriage confirmation request.');
    } finally {
      setLoadingId(null);
    }
  };

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4 mb-6">
      {requests.map((req) => (
        <div 
          key={req.request_id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all text-left"
        >
          {/* Header Strip */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-deep-maroon"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Partner Marriage Confirmation
              </h3>
            </div>
            <span className="text-[10px] font-semibold bg-rose-50 text-deep-maroon px-2 py-0.5 rounded-full border border-rose-100">
              Pending Verification
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Requester Profile Snapshot */}
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={getResolvedImageUrl(req.requester_photo, req.requester_gender)}
                alt={req.requester_name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                onError={(e) => handleImageError(e, req.requester_gender)}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 truncate">{req.requester_name}</span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    {req.requester_profile_id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {[req.requester_gender, req.requester_district, req.requester_religion].filter(Boolean).join(' • ')}
                </p>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  Identified you as their partner on Bharat Marriage. Do you confirm this union?
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleRespond(req.request_id, 'REJECT')}
                disabled={loadingId === req.request_id}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingId === req.request_id ? 'Updating...' : 'Decline'}
              </button>

              <button
                type="button"
                onClick={() => handleRespond(req.request_id, 'ACCEPT')}
                disabled={loadingId === req.request_id}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-deep-maroon hover:bg-deep-maroon/90 shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                {loadingId === req.request_id ? 'Confirming...' : 'Accept Match'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
