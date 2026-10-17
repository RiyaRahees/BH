import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { getDocumentUrl } from '../../utils/imageUtils';

export default function FranchisePartnershipRequests() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Details Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reject reason state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Pin Code assignment override
  const [assignedPinsInput, setAssignedPinsInput] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/franchise-partnership-requests');
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching franchise requests:', err);
      setError('Failed to load franchise partnership requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenDetails = async (req) => {
    setSelectedRequest(req);
    setDetailedData(null);
    setShowRejectModal(false);
    setRejectReason('');

    try {
      setDetailsLoading(true);
      const response = await axiosInstance.get(`/admin/franchise-partnership-requests/${req.id || req.request_id}/details`);
      setDetailedData(response.data);

      // Pre-fill pin codes if verification submitted
      const ver = response.data.verification;
      if (ver) {
        let pins = [];
        try {
          pins = typeof ver.preferred_pincodes === 'string' ? JSON.parse(ver.preferred_pincodes) : (ver.preferred_pincodes || []);
        } catch {
          pins = [];
        }
        setAssignedPinsInput(Array.isArray(pins) ? pins.join(', ') : '');
      } else if (req.pincode) {
        setAssignedPinsInput(req.pincode);
      }
    } catch (err) {
      console.error('Failed to load verification details:', err);
      toast.error('Failed to load full verification details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // STAGE 1: Initial Approve & Send Verification Link
  const handleInitialApprove = async () => {
    if (!selectedRequest || isActionLoading) return;
    try {
      setIsActionLoading(true);
      const response = await axiosInstance.post(
        `/admin/franchise-partnership-requests/${selectedRequest.id || selectedRequest.request_id}/initial-approve`
      );
      toast.success(response.data.message || 'Verification link sent to applicant.');
      setRequests(prev =>
        prev.map(r => (r.id === selectedRequest.id || r.request_id === selectedRequest.request_id ? { ...r, status: 'VERIFICATION_PENDING' } : r))
      );
      setSelectedRequest(prev => ({ ...prev, status: 'VERIFICATION_PENDING' }));
      if (detailedData) {
        setDetailedData(prev => ({
          ...prev,
          request: { ...prev.request, status: 'VERIFICATION_PENDING' }
        }));
      }
    } catch (err) {
      console.error('Initial approval error:', err);
      toast.error(err.response?.data?.error || 'Failed to process initial approval.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // STAGE 2: Final Approve & Verify (Creates Franchise Account & Dispatches Credentials)
  const handleFinalApprove = async () => {
    if (!selectedRequest || isActionLoading) return;
    try {
      setIsActionLoading(true);
      const customPins = assignedPinsInput
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const response = await axiosInstance.post(
        `/admin/franchise-partnership-requests/${selectedRequest.id || selectedRequest.request_id}/final-approve`,
        { assignedPinCodes: customPins }
      );

      toast.success(response.data.message || 'Franchise account created and credentials dispatched.');
      setRequests(prev =>
        prev.map(r => (r.id === selectedRequest.id || r.request_id === selectedRequest.request_id ? { ...r, status: 'APPROVED' } : r))
      );
      setSelectedRequest(prev => ({ ...prev, status: 'APPROVED' }));
      if (detailedData) {
        setDetailedData(prev => ({
          ...prev,
          request: { ...prev.request, status: 'APPROVED' },
          verification: prev.verification ? { ...prev.verification, status: 'APPROVED' } : null
        }));
      }
    } catch (err) {
      console.error('Final approval error:', err);
      toast.error(err.response?.data?.error || 'Failed to process final approval.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // REJECT Application
  const handleReject = async () => {
    if (!selectedRequest || isActionLoading) return;
    try {
      setIsActionLoading(true);
      const response = await axiosInstance.post(
        `/admin/franchise-partnership-requests/${selectedRequest.id || selectedRequest.request_id}/reject`,
        { reason: rejectReason }
      );
      toast.success(response.data.message || 'Application rejected.');
      setRequests(prev =>
        prev.map(r => (r.id === selectedRequest.id || r.request_id === selectedRequest.request_id ? { ...r, status: 'REJECTED' } : r))
      );
      setSelectedRequest(prev => ({ ...prev, status: 'REJECTED' }));
      setShowRejectModal(false);
      setRejectReason('');
      if (detailedData) {
        setDetailedData(prev => ({
          ...prev,
          request: { ...prev.request, status: 'REJECTED' }
        }));
      }
    } catch (err) {
      console.error('Rejection error:', err);
      toast.error(err.response?.data?.error || 'Failed to reject application.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this franchise request and all associated records?')) return;
    try {
      await axiosInstance.delete(`/admin/franchise-partnership-requests/${id}`);
      setRequests(prev => prev.filter(req => req.id !== id && req.request_id !== id));
      if (selectedRequest && (selectedRequest.id === id || selectedRequest.request_id === id)) {
        setSelectedRequest(null);
      }
      toast.success('Request deleted successfully');
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error('Failed to delete request.');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      req.request_id?.toLowerCase().includes(query) ||
      req.name?.toLowerCase().includes(query) ||
      req.email?.toLowerCase().includes(query) ||
      req.phone?.toLowerCase().includes(query) ||
      req.district?.toLowerCase().includes(query) ||
      req.pincode?.toLowerCase().includes(query) ||
      req.location?.toLowerCase().includes(query) ||
      req.message?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || req.status?.toUpperCase() === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const pendingCount = requests.filter(r => (r.status?.toUpperCase() || 'PENDING') === 'PENDING').length;
  const verPendingCount = requests.filter(r => r.status?.toUpperCase() === 'VERIFICATION_PENDING').length;
  const verSubmittedCount = requests.filter(r => r.status?.toUpperCase() === 'VERIFICATION_SUBMITTED').length;
  const approvedCount = requests.filter(r => r.status?.toUpperCase() === 'APPROVED').length;

  const renderStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 border border-amber-200 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Initial Pending
          </span>
        );
      case 'VERIFICATION_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-50 border border-sky-200 text-sky-700">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Verification Sent
          </span>
        );
      case 'VERIFICATION_SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-50 border border-purple-200 text-purple-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>
            Verification Submitted
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Approved & Active
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 border border-rose-200 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-50 border border-slate-200 text-slate-700">
            {s}
          </span>
        );
    }
  };

  // Safe JSON Form Data parser
  const getParsedFormData = () => {
    if (!detailedData?.verification?.form_data) return null;
    try {
      return typeof detailedData.verification.form_data === 'string'
        ? JSON.parse(detailedData.verification.form_data)
        : detailedData.verification.form_data;
    } catch {
      return null;
    }
  };

  const getParsedDocuments = () => {
    if (!detailedData?.verification?.documents) return {};
    try {
      return typeof detailedData.verification.documents === 'string'
        ? JSON.parse(detailedData.verification.documents)
        : detailedData.verification.documents;
    } catch {
      return {};
    }
  };

  const parsedForm = getParsedFormData();
  const parsedDocs = getParsedDocuments();

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-deep-maroon">verified</span>
            Franchise Onboarding & KYC Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage two-stage partner applications: Initial Review &rarr; Verification Form &rarr; Final Account Activation.
          </p>
        </div>

        {/* Stats summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending: {pendingCount}
          </div>
          <div className="bg-sky-50 border border-sky-200 text-sky-800 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Verification Sent: {verPendingCount}
          </div>
          <div className="bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            Ready for Review: {verSubmittedCount}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Approved: {approvedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, email, phone, district, pincode..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white text-slate-800"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'PENDING', label: 'Initial Pending' },
            { key: 'VERIFICATION_PENDING', label: 'Verification Sent' },
            { key: 'VERIFICATION_SUBMITTED', label: 'Ready for Review' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'REJECTED', label: 'Rejected' }
          ].map(st => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-white text-deep-maroon shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-3xl animate-spin mb-2 block">sync</span>
            Loading franchise requests...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 font-semibold">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">
            <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">inbox</span>
            No franchise partnership requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">REQ ID</th>
                  <th className="py-3.5 px-4">APPLICANT</th>
                  <th className="py-3.5 px-4">DISTRICT</th>
                  <th className="py-3.5 px-4">PIN CODE</th>
                  <th className="py-3.5 px-4">CONTACT DETAILS</th>
                  <th className="py-3.5 px-4">DATE</th>
                  <th className="py-3.5 px-4">WORKFLOW STATUS</th>
                  <th className="py-3.5 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRequests.map(req => {
                  const displayDistrict = req.district || (req.location ? req.location.split('-')[0].trim() : 'N/A');
                  const displayPincode = req.pincode || (req.location && req.location.includes('-') ? req.location.split('-')[1].trim() : 'N/A');

                  return (
                    <tr key={req.id || req.request_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {req.request_id || `FPR${String(req.id).padStart(4, '0')}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div>
                          <p className="text-slate-800 font-bold">{req.name}</p>
                          {req.applicant_type && (
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              ({req.applicant_type})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 border border-purple-100 text-purple-700">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {displayDistrict}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-700 font-mono">
                          {displayPincode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-semibold">{req.phone}</p>
                        <p className="text-[10px] text-slate-400">{req.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(req.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(req)}
                            className={`px-3 py-1 font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                              req.status?.toUpperCase() === 'VERIFICATION_SUBMITTED'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">description</span>
                            View Full Form
                          </button>

                          <button
                            onClick={() => handleDelete(req.id || req.request_id)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Application"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
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

      {/* COMPREHENSIVE VIEW FULL FORM & VERIFICATION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => setSelectedRequest(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-3xl relative z-10 text-left animate-fade-in max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-heritage-gold block">
                  Franchise Application Full Form Review
                </span>
                <h3 className="font-bold text-base flex items-center gap-2 mt-0.5">
                  <span>{selectedRequest.request_id || `FPR${String(selectedRequest.id).padStart(4, '0')}`}</span>
                  <span>•</span>
                  <span>{selectedRequest.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700 flex-1">
              
              {/* Status Header Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Application Status</span>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Application Date</span>
                  <span className="font-semibold text-slate-700">
                    {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {detailsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl animate-spin mb-2 block text-deep-maroon">sync</span>
                  Fetching application details...
                </div>
              ) : !detailedData?.verification || !parsedForm ? (
                /* INITIAL ENQUIRY VIEW (ONLY FIELDS SUBMITTED BY THE USER) */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">contact_mail</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        Franchise Enquiry Details
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                        <p className="font-bold text-slate-800 text-sm">{selectedRequest.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                        <p className="font-semibold text-slate-800">{selectedRequest.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                        <p className="font-semibold text-slate-800">{selectedRequest.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">District</p>
                        <p className="font-bold text-deep-maroon">{selectedRequest.district || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">PIN Code</p>
                        <p className="font-mono font-bold text-blue-700">{selectedRequest.pincode || 'N/A'}</p>
                      </div>
                      {selectedRequest.location && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                          <p className="font-semibold text-slate-800">{selectedRequest.location}</p>
                        </div>
                      )}
                      {selectedRequest.message && (
                        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-200/60">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Additional Message</p>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200 mt-1">{selectedRequest.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* SECTION 1: APPLICANT / ENTITY PROFILE */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">corporate_fare</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        1. {detailedData?.verification?.applicant_type === 'individual' ? 'Individual Consultant Details' : 'Organization Details'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      {detailedData?.verification?.applicant_type === 'individual' ? (
                        <>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                            <p className="font-bold text-slate-800">{parsedForm?.fullName || selectedRequest.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">DOB & Gender</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.dob || 'N/A'} ({parsedForm?.gender || 'N/A'})</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Aadhaar Number</p>
                            <p className="font-mono font-semibold text-slate-800">{parsedForm?.aadharNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">PAN Number</p>
                            <p className="font-mono font-semibold text-slate-800 uppercase">{parsedForm?.panNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Occupation</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.occupation || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Education</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.education || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Current Work</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.currentWork || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Experience</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.previousExperience || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Expected Start Date</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.expectedStartDate || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Organization Name</p>
                            <p className="font-bold text-slate-800">{parsedForm?.orgName || selectedRequest.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Organization Type</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.orgType || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Registration / CIN No.</p>
                            <p className="font-mono font-semibold text-slate-800">{parsedForm?.regNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">GST Number</p>
                            <p className="font-mono font-semibold text-slate-800 uppercase">{parsedForm?.gstNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">PAN Number</p>
                            <p className="font-mono font-semibold text-slate-800 uppercase">{parsedForm?.panNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Establishment Date</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.dateOfEstablishment || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Nature of Business</p>
                            <p className="font-semibold text-slate-800">{parsedForm?.natureOfBusiness || 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Company Website</p>
                            <p className="font-semibold text-slate-800 truncate">{parsedForm?.companyWebsite || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: OFFICE / RESIDENTIAL ADDRESS & CONTACT */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">location_on</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        2. Office / Contact Address
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Full Address</p>
                        <p className="font-semibold text-slate-800">{parsedForm?.address || selectedRequest.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">District</p>
                        <p className="font-bold text-deep-maroon">{parsedForm?.district || selectedRequest.district || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">State</p>
                        <p className="font-semibold text-slate-800">{parsedForm?.state || 'Kerala'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Office / Local PIN Code</p>
                        <p className="font-mono font-bold text-blue-700">{parsedForm?.pincode || selectedRequest.pincode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Primary Phone / Mobile</p>
                        <p className="font-semibold text-slate-800">{parsedForm?.contactPhone || parsedForm?.mobileNumber || parsedForm?.officeNumber || selectedRequest.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Official / Registered Email</p>
                        <p className="font-semibold text-slate-800">{parsedForm?.officialEmail || parsedForm?.email || selectedRequest.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: FRANCHISE LOCATION PREFERENCES */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">map</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        3. Franchise Location Preferences
                      </h4>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Preferred District</p>
                          <p className="font-bold text-deep-maroon">{parsedForm?.preferredDistrict || selectedRequest.district || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Landmark</p>
                          <p className="font-semibold text-slate-800">{parsedForm?.landmark || parsedForm?.preferredArea || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Proposed Center Location</p>
                          <p className="font-semibold text-slate-800">{parsedForm?.proposedLocation || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Preferred PIN Codes Badges */}
                      <div className="pt-2 border-t border-slate-200/60">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Preferred Territory PIN Codes:
                        </p>
                        {(() => {
                          let pins = [];
                          if (parsedForm?.preferredPincodes) {
                            pins = Array.isArray(parsedForm.preferredPincodes) ? parsedForm.preferredPincodes : [parsedForm.preferredPincodes];
                          } else if (detailedData?.verification?.preferred_pincodes) {
                            try {
                              pins = typeof detailedData.verification.preferred_pincodes === 'string'
                                ? JSON.parse(detailedData.verification.preferred_pincodes)
                                : detailedData.verification.preferred_pincodes;
                            } catch {
                              pins = [];
                            }
                          } else if (selectedRequest.pincode) {
                            pins = [selectedRequest.pincode];
                          }
                          pins = Array.isArray(pins) ? pins.filter(Boolean) : [];

                          return pins.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {pins.map(pin => (
                                <span key={pin} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold text-[11px] rounded-md shadow-2xs">
                                  {pin}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">No specific PIN codes selected.</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: AUTHORIZED PERSON DETAILS (FOR ORG) */}
                  {detailedData?.verification?.applicant_type !== 'individual' && parsedForm?.contactName && (
                    <div>
                      <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                        <span className="material-symbols-outlined text-sm text-deep-maroon">badge</span>
                        <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                          4. Authorized Person Details
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Name</p>
                          <p className="font-bold text-slate-800">{parsedForm.contactName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Designation</p>
                          <p className="font-semibold text-slate-800">{parsedForm.contactDesignation || 'Director / Manager'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Contact Phone</p>
                          <p className="font-semibold text-slate-800">{parsedForm.contactPhone || selectedRequest.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Contact Email</p>
                          <p className="font-semibold text-slate-800 truncate">{parsedForm.contactEmail || selectedRequest.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 5: BANK DETAILS */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">account_balance</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        {detailedData?.verification?.applicant_type === 'individual' ? '4.' : '5.'} Bank Details
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Bank Name</p>
                        <p className="font-semibold text-slate-800">{parsedForm?.bankName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Account Holder</p>
                        <p className="font-semibold text-slate-800">{parsedForm?.accountHolder || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Account Number</p>
                        <p className="font-mono font-semibold text-slate-800">{parsedForm?.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">IFSC Code</p>
                        <p className="font-mono font-semibold text-slate-800 uppercase">{parsedForm?.ifscCode || 'N/A'}</p>
                      </div>
                      {parsedForm?.branch && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Branch</p>
                          <p className="font-semibold text-slate-800">{parsedForm.branch}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 6: UPLOADED DOCUMENTS */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">attach_file</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        {detailedData?.verification?.applicant_type === 'individual' ? '5.' : '6.'} Uploaded KYC Documents
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(parsedDocs).map(([docKey, docInfo]) => (
                        <div key={docKey} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="material-symbols-outlined text-xl text-deep-maroon shrink-0">
                              {docInfo.mimetype?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                            </span>
                            <div className="truncate">
                              <p className="font-bold text-slate-800 capitalize text-[11px] truncate">
                                {docKey.replace('File', '').replace(/([A-Z])/g, ' $1')}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {docInfo.originalName || docInfo.filename} {docInfo.size ? `(${(docInfo.size / 1024).toFixed(1)} KB)` : ''}
                              </p>
                            </div>
                          </div>
                          <a
                            href={getDocumentUrl(docInfo.path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-deep-maroon hover:text-deep-maroon text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0 ml-2 flex items-center gap-1 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            View Document
                          </a>
                        </div>
                      ))}
                      {Object.keys(parsedDocs).length === 0 && (
                        <div className="col-span-2 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-[11px]">
                          No uploaded verification documents found for this request.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

                  {/* SECTION 7: WORKFLOW ACTIONS & PIN ALLOTMENT */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">verified</span>
                      <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                        Review & Approval Actions
                      </h4>
                    </div>

                    {/* STAGE 1: INITIAL APPROVE (IF STATUS IS PENDING AND NO VERIFICATION DATA YET) */}
                    {selectedRequest.status?.toUpperCase() === 'PENDING' && !detailedData?.verification && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                        <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                          <strong>Initial Approve:</strong> Changes status to <em>Verification Sent</em> and emails the applicant the link to complete the Franchise Registration Form. <strong>(No franchise login credentials will be created at this stage.)</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleInitialApprove}
                            disabled={isActionLoading}
                            className="px-4 py-2 bg-deep-maroon hover:bg-primary text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                            {isActionLoading ? 'Processing...' : 'Initial Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectModal(true)}
                            disabled={isActionLoading}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STAGE 2: FINAL APPROVE (WHEN VERIFICATION FORM IS SUBMITTED) */}
                    {(detailedData?.verification || selectedRequest.status?.toUpperCase() === 'VERIFICATION_SUBMITTED') && selectedRequest.status?.toUpperCase() !== 'APPROVED' && selectedRequest.status?.toUpperCase() !== 'REJECTED' && (
                      <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-3">
                        <p className="text-[11px] text-purple-900 font-medium leading-relaxed">
                          <strong>Final Approve:</strong> Creates and activates the official <strong>bm_franchise</strong> account, generates the Franchise ID & temporary password, assigns territory PIN code(s), and dispatches credentials with login URL to the partner.
                        </p>

                        <div>
                          <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
                            Assigned Territory PIN Code(s) (Comma Separated) *
                          </label>
                          <input
                            type="text"
                            value={assignedPinsInput}
                            onChange={(e) => setAssignedPinsInput(e.target.value)}
                            placeholder="e.g. 682001, 682002, 683101"
                            className="w-full h-8 px-3 text-xs border border-purple-200 rounded-lg focus:outline-none focus:border-deep-maroon bg-white text-slate-800 font-mono"
                          />
                          <span className="text-[10px] text-purple-700 block mt-0.5">
                            Customer access will be strictly restricted to these PIN code(s).
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleFinalApprove}
                            disabled={isActionLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            {isActionLoading ? 'Activating Account...' : 'Final Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectModal(true)}
                            disabled={isActionLoading}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* IF VERIFICATION PENDING AND NO FORM SUBMITTED YET */}
                    {selectedRequest.status?.toUpperCase() === 'VERIFICATION_PENDING' && !detailedData?.verification && (
                      <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                        <p className="text-[11px] text-sky-900 font-medium">
                          Initial approval email sent. Waiting for the applicant to submit the completed registration form.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleInitialApprove}
                            disabled={isActionLoading}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Resend Initial Approval Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectModal(true)}
                            disabled={isActionLoading}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* APPROVED STATE NOTICE */}
                    {selectedRequest.status?.toUpperCase() === 'APPROVED' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Franchise account is active and credentials have been dispatched.</span>
                      </div>
                    )}

                    {/* REJECT MODAL SUB-VIEW */}
                    {showRejectModal && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-fade-in">
                        <p className="text-[11px] font-bold text-rose-900">Enter Rejection Reason / Admin Remarks:</p>
                        <textarea
                          rows="2"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Territory already allotted or incomplete KYC documents..."
                          className="w-full p-2 text-xs border border-rose-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-rose-400"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleReject}
                            disabled={isActionLoading}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {isActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectModal(false)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 4: AUDIT TRAIL */}
                  {detailedData?.auditLogs && detailedData.auditLogs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-100">
                        <span className="material-symbols-outlined text-sm text-slate-400">history</span>
                        <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">
                          Audit Trail & Activity Log
                        </h4>
                      </div>
                      <div className="space-y-1.5">
                        {detailedData.auditLogs.map(log => (
                          <div key={log.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] flex items-start justify-between">
                            <div>
                              <span className="font-bold text-slate-700 uppercase mr-2 font-mono">[{log.action}]</span>
                              <span className="text-slate-600">{log.details}</span>
                            </div>
                            <span className="text-slate-400 whitespace-nowrap ml-3">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 shrink-0">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
