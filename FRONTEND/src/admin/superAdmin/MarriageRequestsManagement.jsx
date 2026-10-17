import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { getResolvedImageUrl, handleImageError } from '../../utils/imageUtils';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function MarriageRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0, ads_eligible: 0, featured_ads: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const toast = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/marriage-requests?tab=${activeTab}&search=${encodeURIComponent(searchTerm)}`);
      if (res.data?.success) {
        setRequests(res.data.requests || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Error loading admin marriage requests:', err);
      toast.error('Failed to load marriage requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRequests();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [activeTab, searchTerm]);

  const handleToggleAds = async (item) => {
    const isEligible = item.partner_confirmation_status === 'ACCEPTED' && item.allow_advertisement;
    if (!item.is_featured_for_ads && !isEligible) {
      toast.error('Cannot feature for ads: Partner must accept the match and give advertisement consent.');
      return;
    }

    setTogglingId(item.request_id);
    const newStatus = !item.is_featured_for_ads;
    try {
      const res = await axiosInstance.patch(`/admin/marriage-requests/${item.request_id}/featured-ads`, {
        isFeatured: newStatus
      });
      toast.success(res.data?.message || (newStatus ? 'Profile set as featured for ads' : 'Profile removed from featured ads'));
      setRequests(prev => prev.map(r => r.request_id === item.request_id ? { ...r, is_featured_for_ads: newStatus } : r));
      setMetrics(prev => ({
        ...prev,
        featured_ads: newStatus ? Number(prev.featured_ads || 0) + 1 : Math.max(0, Number(prev.featured_ads || 0) - 1)
      }));
    } catch (err) {
      console.error('Error toggling featured ads:', err);
      toast.error(err.response?.data?.error || 'Failed to update advertisement status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this marriage request record?')) return;
    try {
      await axiosInstance.delete(`/admin/marriage-requests/${requestId}`);
      toast.success('Record deleted successfully');
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
    } catch (err) {
      console.error('Error deleting record:', err);
      toast.error('Failed to delete record');
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 min-w-0 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-deep-maroon text-2xl">favorite</span>
            <span>Marriage Requests & Success Stories</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review partner marriage confirmations and toggle verified couples for promotional advertisements.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID or email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon shadow-2xs"
          />
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Requests</span>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{metrics.total || 0}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pending Response</span>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{metrics.pending || 0}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Confirmed Matches</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{metrics.accepted || 0}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Ads Consent Given</span>
          <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">{metrics.ads_eligible || 0}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon">Featured for Ads</span>
          <p className="text-xl sm:text-2xl font-black text-deep-maroon mt-1">{metrics.featured_ads || 0}</p>
        </div>
      </div>

      {/* Tab Filter Strip */}
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hidden gap-1 text-xs font-bold">
        {[
          { id: 'all', label: 'All Requests', count: metrics.total },
          { id: 'pending', label: 'Pending Confirmation', count: metrics.pending },
          { id: 'accepted', label: 'Confirmed Matches', count: metrics.accepted },
          { id: 'ads_eligible', label: 'Ads Eligible', count: metrics.ads_eligible },
          { id: 'featured_ads', label: 'Featured for Ads 🎉', count: metrics.featured_ads },
          { id: 'rejected', label: 'Declined', count: metrics.rejected }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-white text-deep-maroon shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeTab === tab.id ? 'bg-deep-maroon/10 text-deep-maroon' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-400">Loading marriage requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">favorite</span>
            <p className="font-bold text-sm text-slate-700">No Marriage Requests Found</p>
            <p className="text-xs text-slate-400 mt-0.5">No records matching the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Requester (User A)</th>
                  <th className="py-3 px-4">Selected Partner (User B)</th>
                  <th className="py-3 px-4">Partner Confirmation</th>
                  <th className="py-3 px-4">Ads Consent</th>
                  <th className="py-3 px-4">Feature for Ads</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((r) => {
                  const isAccepted = r.partner_confirmation_status === 'ACCEPTED';
                  const isPending = r.partner_confirmation_status === 'PENDING';
                  const isRejected = r.partner_confirmation_status === 'REJECTED';
                  const isAdsEligible = isAccepted && r.allow_advertisement;

                  return (
                    <tr key={r.request_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Requester */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getResolvedImageUrl(r.requester_photo, r.requester_gender)}
                            alt={r.requester_name || r.requester_profile_id}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            onError={(e) => handleImageError(e, r.requester_gender)}
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{r.requester_name || 'N/A'}</span>
                              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                                {r.requester_profile_id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {[r.requester_gender, r.requester_district, r.requester_religion].filter(Boolean).join(' • ')}
                            </div>
                            {r.requester_phone && (
                              <div className="text-[10px] text-slate-400">{r.requester_phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Partner */}
                      <td className="py-3.5 px-4">
                        {r.partner_profile_id ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={getResolvedImageUrl(r.partner_photo, r.partner_gender)}
                              alt={r.partner_name || r.partner_profile_id}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                              onError={(e) => handleImageError(e, r.partner_gender)}
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{r.partner_name || 'N/A'}</span>
                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                                  {r.partner_profile_id}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {[r.partner_gender, r.partner_district, r.partner_religion].filter(Boolean).join(' • ')}
                              </div>
                              {r.partner_phone && (
                                <div className="text-[10px] text-slate-400">{r.partner_phone}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No partner ID specified</span>
                        )}
                      </td>

                      {/* Confirmation Status */}
                      <td className="py-3.5 px-4">
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            Confirmed
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Pending Response
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            Declined
                          </span>
                        )}
                      </td>

                      {/* Ads Consent */}
                      <td className="py-3.5 px-4">
                        {r.allow_advertisement ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                            <span className="text-xs">🎉</span>
                            Consent Granted
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Private</span>
                        )}
                      </td>

                      {/* Featured for Ads Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <label className={`relative inline-flex items-center cursor-pointer select-none ${
                            !isAdsEligible && !r.is_featured_for_ads ? 'opacity-50 cursor-not-allowed' : ''
                          }`}>
                            <input
                              type="checkbox"
                              checked={Boolean(r.is_featured_for_ads)}
                              disabled={togglingId === r.request_id || (!isAdsEligible && !r.is_featured_for_ads)}
                              onChange={() => handleToggleAds(r)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deep-maroon"></div>
                          </label>
                          <span className={`text-[11px] font-bold ${r.is_featured_for_ads ? 'text-deep-maroon' : 'text-slate-400'}`}>
                            {r.is_featured_for_ads ? 'Featured ON' : 'OFF'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDetails(r)}
                            title="View Feedback & Details"
                            className="p-1.5 text-slate-500 hover:text-deep-maroon hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.request_id)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-left p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-deep-maroon">celebration</span>
                <span>Marriage Submission Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Requester</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedDetails.requester_name} ({selectedDetails.requester_profile_id})</p>
                  <p className="text-slate-500">{selectedDetails.requester_phone || selectedDetails.requester_email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Partner</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedDetails.partner_name || 'N/A'} ({selectedDetails.partner_profile_id})</p>
                  <p className="text-slate-500">{selectedDetails.partner_phone || selectedDetails.partner_email}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700">Account Action:</span>
                <span className="ml-2 font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">{selectedDetails.action_type}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700">Marriage Source:</span>
                <span className="ml-2 text-slate-800">{selectedDetails.marriage_source || (selectedDetails.found_via_platform ? 'Bharat Marriage Platform' : 'Other')}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700">Partner Confirmation Status:</span>
                <span className="ml-2 font-bold text-slate-900">{selectedDetails.partner_confirmation_status}</span>
                {selectedDetails.partner_responded_at && (
                  <span className="ml-1 text-slate-400">({formatDate(selectedDetails.partner_responded_at)})</span>
                )}
              </div>

              <div>
                <span className="font-bold text-slate-700">Advertisement & Social Media Consent:</span>
                <span className={`ml-2 font-bold ${selectedDetails.allow_advertisement ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {selectedDetails.allow_advertisement ? 'Yes, Granted 🎉' : 'No, Keep Private'}
                </span>
              </div>

              {selectedDetails.reason && (
                <div>
                  <span className="font-bold text-slate-700">Reason:</span>
                  <p className="text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">{selectedDetails.reason}</p>
                </div>
              )}

              {selectedDetails.feedback && (
                <div>
                  <span className="font-bold text-slate-700">User Experience / Feedback:</span>
                  <p className="text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">{selectedDetails.feedback}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
