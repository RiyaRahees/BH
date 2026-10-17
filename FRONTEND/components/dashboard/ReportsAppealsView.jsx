import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../src/utils/axiosInstance';
import { getResolvedImageUrl, handleImageError } from '../../src/utils/imageUtils';

export default function ReportsAppealsView() {
  const navigate = useNavigate();
  const [receivedReports, setReceivedReports] = useState([]);
  const [sentReports, setSentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Main Section Toggle: 'SENT' (Reports I Filed) or 'RECEIVED' (Reports Against Me)
  const [mainTab, setMainTab] = useState('SENT');

  // Sub-filter tab state
  const [sentSubTab, setSentSubTab] = useState('ALL'); // 'ALL', 'APPEALED', 'ACCEPTED', 'PENDING'
  const [receivedSubTab, setReceivedSubTab] = useState('ACTION_REQUIRED'); // 'ACTION_REQUIRED', 'UNDER_APPEAL', 'ACKNOWLEDGED', 'ALL'

  // Appeal Modal state (for Received reports)
  const [selectedReportForAppeal, setSelectedReportForAppeal] = useState(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState('');

  // Confirmation dialog for accepting (for Received reports)
  const [confirmAcceptReport, setConfirmAcceptReport] = useState(null);
  const [acceptingLoading, setAcceptingLoading] = useState(false);

  // Confirmation dialog for withdrawing (for Sent reports)
  const [confirmWithdrawReport, setConfirmWithdrawReport] = useState(null);
  const [withdrawingLoading, setWithdrawingLoading] = useState(false);

  // Success notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchMyReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/users/my-reports');
      const rec = res.data.received_reports || res.data.reports || [];
      const snt = res.data.sent_reports || [];
      setReceivedReports(rec);
      setSentReports(snt);

      // Default to the tab that has active items
      if (snt.length > 0 && rec.length === 0) {
        setMainTab('SENT');
      } else if (rec.length > 0 && snt.length === 0) {
        setMainTab('RECEIVED');
      }
    } catch (err) {
      console.error('Failed to fetch user reports:', err);
      setError('Could not load your report history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleOpenAppealModal = (report) => {
    setSelectedReportForAppeal(report);
    setAppealMessage('');
    setAppealError('');
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!appealMessage.trim()) {
      setAppealError('Please enter an explanation for your appeal.');
      return;
    }
    if (appealMessage.trim().length < 10) {
      setAppealError('Please provide a more detailed explanation (at least 10 characters).');
      return;
    }

    setSubmittingAppeal(true);
    setAppealError('');
    try {
      await axiosInstance.post(`/users/my-reports/${selectedReportForAppeal.id}/appeal`, {
        action: 'APPEAL',
        appeal_message: appealMessage.trim()
      });
      showToast('Your appeal has been submitted successfully! The admin team will review it shortly.');
      setSelectedReportForAppeal(null);
      fetchMyReports();
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setAppealError(err.response?.data?.error || 'Failed to submit appeal. Please try again.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleConfirmAccept = async () => {
    if (!confirmAcceptReport) return;
    setAcceptingLoading(true);
    try {
      await axiosInstance.post(`/users/my-reports/${confirmAcceptReport.id}/appeal`, {
        action: 'ACCEPT'
      });
      showToast('Report acknowledged and accepted.');
      setConfirmAcceptReport(null);
      fetchMyReports();
    } catch (err) {
      console.error('Error accepting report:', err);
      showToast(err.response?.data?.error || 'Failed to accept report.', 'error');
    } finally {
      setAcceptingLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!confirmWithdrawReport) return;
    setWithdrawingLoading(true);
    try {
      await axiosInstance.delete(`/users/my-reports/${confirmWithdrawReport.id}/withdraw`);
      showToast('Your report has been withdrawn successfully.');
      setConfirmWithdrawReport(null);
      fetchMyReports();
    } catch (err) {
      console.error('Error withdrawing report:', err);
      showToast(err.response?.data?.error || 'Failed to withdraw report.', 'error');
    } finally {
      setWithdrawingLoading(false);
    }
  };

  // Metrics for Received Reports
  const receivedPendingCount = receivedReports.filter(r => !r.appeal_status || r.appeal_status === 'NONE').length;
  const receivedAppealedCount = receivedReports.filter(r => r.appeal_status === 'APPEALED').length;
  const receivedAcceptedCount = receivedReports.filter(r => r.appeal_status === 'ACCEPTED').length;

  // Metrics for Sent Reports
  const sentAppealedCount = sentReports.filter(r => r.appeal_status === 'APPEALED').length;
  const sentAcceptedCount = sentReports.filter(r => r.appeal_status === 'ACCEPTED').length;
  const sentPendingCount = sentReports.filter(r => !r.appeal_status || r.appeal_status === 'NONE').length;

  // Filtered lists
  const filteredSentReports = sentReports.filter(r => {
    if (sentSubTab === 'APPEALED') return r.appeal_status === 'APPEALED';
    if (sentSubTab === 'ACCEPTED') return r.appeal_status === 'ACCEPTED';
    if (sentSubTab === 'PENDING') return !r.appeal_status || r.appeal_status === 'NONE';
    return true;
  });

  const filteredReceivedReports = receivedReports.filter(r => {
    if (receivedSubTab === 'ACTION_REQUIRED') return !r.appeal_status || r.appeal_status === 'NONE';
    if (receivedSubTab === 'UNDER_APPEAL') return r.appeal_status === 'APPEALED';
    if (receivedSubTab === 'ACKNOWLEDGED') return r.appeal_status === 'ACCEPTED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-charcoal-text">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-bounce-in ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="material-symbols-outlined text-base">
            {toastMessage.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-deep-maroon/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  Reports & Appeals Center
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Track reports you submitted and manage profile notices
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-2xl leading-relaxed">
              Review status updates on profiles you have reported, see opposite member appeals, or respond to any moderation notices issued to your account.
            </p>
          </div>

          <button
            onClick={fetchMyReports}
            className="self-start md:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Refresh Reports</span>
          </button>
        </div>

        {/* Primary View Selector: Reports Sent vs Reports Against Me */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setMainTab('SENT')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'SENT'
                ? 'bg-deep-maroon text-white shadow-md shadow-deep-maroon/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">flag</span>
            <span>Reports Submitted by Me ({sentReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('RECEIVED')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'RECEIVED'
                ? 'bg-deep-maroon text-white shadow-md shadow-deep-maroon/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">notification_important</span>
            <span>Reports Against Me ({receivedReports.length})</span>
            {receivedPendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Sub-Metrics Grid Filters */}
        {mainTab === 'SENT' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
            <button
              type="button"
              onClick={() => setSentSubTab('ALL')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                sentSubTab === 'ALL'
                  ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200/60 hover:bg-slate-100'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Sent</p>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{sentReports.length}</p>
            </button>

            <button
              type="button"
              onClick={() => setSentSubTab('APPEALED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                sentSubTab === 'APPEALED'
                  ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm'
                  : 'bg-indigo-50/50 border-indigo-200/60 hover:bg-indigo-50'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Appealed by User</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-800 mt-1">{sentAppealedCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setSentSubTab('ACCEPTED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                sentSubTab === 'ACCEPTED'
                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm'
                  : 'bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-50'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Acknowledged</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">{sentAcceptedCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setSentSubTab('PENDING')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                sentSubTab === 'PENDING'
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                  : 'bg-amber-50/50 border-amber-200/60 hover:bg-amber-50'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Under Review</p>
              <p className="text-xl sm:text-2xl font-black text-amber-800 mt-1">{sentPendingCount}</p>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
            <button
              type="button"
              onClick={() => setReceivedSubTab('ACTION_REQUIRED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                receivedSubTab === 'ACTION_REQUIRED'
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                  : 'bg-amber-50/50 border-amber-200/60 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Action Required</p>
                {receivedPendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                )}
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-800 mt-1">{receivedPendingCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setReceivedSubTab('UNDER_APPEAL')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                receivedSubTab === 'UNDER_APPEAL'
                  ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm'
                  : 'bg-indigo-50/50 border-indigo-200/60 hover:bg-indigo-50'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Under Appeal</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-800 mt-1">{receivedAppealedCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setReceivedSubTab('ACKNOWLEDGED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                receivedSubTab === 'ACKNOWLEDGED'
                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm'
                  : 'bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-50'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Acknowledged</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">{receivedAcceptedCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setReceivedSubTab('ALL')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                receivedSubTab === 'ALL'
                  ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200/60 hover:bg-slate-100'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Received</p>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{receivedReports.length}</p>
            </button>
          </div>
        )}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-3xl text-deep-maroon">progress_activity</span>
          <p className="text-xs font-bold text-slate-500 mt-3">Loading report history...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-rose-100 shadow-sm flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-rose-500">error</span>
          <p className="text-sm font-bold text-slate-800">{error}</p>
          <button
            onClick={fetchMyReports}
            className="px-4 py-2 bg-deep-maroon text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : mainTab === 'SENT' ? (
        /* SECTION 1: REPORTS SUBMITTED BY USER */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reports Submitted by You ({filteredSentReports.length})
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              Showing {filteredSentReports.length} of {sentReports.length} reports
            </span>
          </div>

          {filteredSentReports.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                <span className="material-symbols-outlined text-3xl">flag</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-1">No Reports Submitted</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                You have not filed any reports against members in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSentReports.map((rep) => {
                const isAppealed = rep.appeal_status === 'APPEALED';
                const isAccepted = rep.appeal_status === 'ACCEPTED';
                const isResolved = rep.status === 'RESOLVED';
                const isDismissed = rep.status === 'DISMISSED';

                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 transition-all shadow-sm flex flex-col gap-4"
                  >
                    {/* Reported Member Header Card */}
                    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getResolvedImageUrl(rep.reported_photo, rep.reported_gender || 'Female')}
                          alt={rep.reported_name || 'Reported Profile'}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                          onError={(e) => handleImageError(e, rep.reported_gender || 'Female')}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            Reported Member: <span className="text-deep-maroon font-extrabold">{rep.reported_name || 'Bharath Member'}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                              {rep.reported_profile_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate(`/profile/${rep.reported_profile_id}`)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View Profile</span>
                              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 self-start sm:self-auto shrink-0 bg-white px-3 py-1 rounded-xl border border-slate-200/60">
                        <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                        <span>Filed on {new Date(rep.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Stated Reason & Status Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">flag</span>
                          <span>{rep.reason}</span>
                        </span>

                        {/* Admin Resolution Status */}
                        {isResolved ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>Action Taken by Admin</span>
                          </span>
                        ) : isDismissed ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">cancel</span>
                            <span>Dismissed</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>Under Admin Review</span>
                          </span>
                        )}

                        {/* Opposite User Response Status */}
                        {isAppealed && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">gavel</span>
                            <span>Opposite User Appealed</span>
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            <span>Opposite User Acknowledged</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setConfirmWithdrawReport(rep)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                        title="Withdraw this report"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Withdraw Report</span>
                      </button>
                    </div>

                    {/* Stated Details */}
                    {rep.details && (
                      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Your Submitted Remarks
                        </p>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                          "{rep.details}"
                        </p>
                      </div>
                    )}

                    {/* Opposite User Appeal Statement Card */}
                    {isAppealed && (
                      <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-indigo-600 text-base">gavel</span>
                            <span>Opposite Member Submitted an Explanation Appeal</span>
                          </span>
                          {rep.appealed_at && (
                            <span className="text-[10px] text-indigo-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                              Appealed on {new Date(rep.appealed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 text-xs text-slate-800 font-medium leading-relaxed">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block mb-1">
                            Opposite User's Statement:
                          </span>
                          "{rep.appeal_message || 'Explanation submitted to admin.'}"
                        </div>
                      </div>
                    )}

                    {isAccepted && (
                      <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-600 text-sm">task_alt</span>
                          <span>The opposite member reviewed and acknowledged this report notice.</span>
                        </span>
                        {rep.appealed_at && (
                          <span className="text-[10px] text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                            {new Date(rep.appealed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SECTION 2: REPORTS AGAINST ME */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reports Against You ({filteredReceivedReports.length})
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              Showing {filteredReceivedReports.length} of {receivedReports.length} reports
            </span>
          </div>

          {filteredReceivedReports.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-1">Your Profile is in Good Standing!</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                No community reports or violation notices have been filed against your profile.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReceivedReports.map((rep) => {
                const isActionRequired = !rep.appeal_status || rep.appeal_status === 'NONE';
                const isAppealed = rep.appeal_status === 'APPEALED';
                const isAccepted = rep.appeal_status === 'ACCEPTED';

                return (
                  <div
                    key={rep.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-sm flex flex-col gap-4.5 ${
                      isActionRequired
                        ? 'border-amber-200/90 ring-2 ring-amber-400/10'
                        : isAppealed
                        ? 'border-indigo-100'
                        : 'border-slate-100 opacity-95'
                    }`}
                  >
                    {/* Top Header: Reporter Info Card + Timestamp */}
                    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getResolvedImageUrl(rep.reporter_photo, rep.reporter_gender || 'Female')}
                          alt={rep.reporter_name || 'Reporter'}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                          onError={(e) => handleImageError(e, rep.reporter_gender || 'Female')}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            Reported by: <span className="text-deep-maroon font-extrabold">{rep.reporter_name || 'Bharath Member'}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                              {rep.reporter_profile_id || 'ID Hidden'}
                            </span>
                            {rep.reporter_profile_id && (
                              <button
                                type="button"
                                onClick={() => navigate(`/profile/${rep.reporter_profile_id}`)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>View Profile</span>
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 self-start sm:self-auto shrink-0 bg-white px-3 py-1 rounded-xl border border-slate-200/50">
                        <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                        <span>{new Date(rep.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Reason & Status Pills */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">flag</span>
                          <span>{rep.reason}</span>
                        </span>

                        {isActionRequired && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                            <span>Action Required</span>
                          </span>
                        )}
                        {isAppealed && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">hourglass_top</span>
                            <span>Appeal Under Review</span>
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            <span>Report Acknowledged</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reporter's Stated Reason / Details Box */}
                    <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">chat_bubble</span>
                        <span>Reporter's Stated Remarks</span>
                      </p>
                      {rep.details ? (
                        <p className="text-xs sm:text-sm text-slate-700 italic font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                          "{rep.details}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-100">
                          No additional commentary submitted by reporter.
                        </p>
                      )}
                    </div>

                    {/* Action Section */}
                    {isActionRequired ? (
                      <div className="bg-gradient-to-r from-amber-50/60 via-amber-50/40 to-rose-50/30 p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-amber-600 text-base">help</span>
                            <span>Your Right to Appeal</span>
                          </p>
                          <p className="text-[11px] text-amber-800 leading-snug">
                            You can acknowledge this report or submit an explanation appeal to our admin moderation team.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setConfirmAcceptReport(rep)}
                            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            Accept Warning
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAppealModal(rep)}
                            className="px-4 py-2.5 bg-gradient-to-r from-deep-maroon to-primary hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-deep-maroon/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            <span>Submit Appeal</span>
                          </button>
                        </div>
                      </div>
                    ) : isAppealed ? (
                      <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200/80 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-indigo-600 text-base">hourglass_top</span>
                            <span>Your Appeal is Under Admin Review</span>
                          </span>
                          {rep.appealed_at && (
                            <span className="text-[10px] text-indigo-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                              Submitted {new Date(rep.appealed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed font-medium">
                          <span className="font-extrabold text-indigo-900 block mb-1 text-[10px] uppercase tracking-wider">
                            Your Explanation to Admin:
                          </span>
                          "{rep.appeal_message}"
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-lg">task_alt</span>
                          <span>You acknowledged and accepted this report.</span>
                        </div>
                        {rep.appealed_at && (
                          <span className="text-[10px] text-emerald-600 font-medium bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                            {new Date(rep.appealed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Appeal Submission Modal */}
      {selectedReportForAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg relative z-10 animate-scale-up overflow-hidden">
            <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-heritage-gold text-xl">gavel</span>
                <h3 className="font-bold text-sm sm:text-base uppercase tracking-wide">
                  Appeal Profile Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportForAppeal(null)}
                className="text-white/80 hover:text-white cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitAppeal} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Allegation Being Appealed</p>
                  <span className="text-[10px] font-mono text-slate-400">ID: #{selectedReportForAppeal.id}</span>
                </div>
                <p className="text-xs font-extrabold text-rose-700">{selectedReportForAppeal.reason}</p>
                {selectedReportForAppeal.reporter_name && (
                  <p className="text-[11px] text-slate-500">Reported by: <span className="font-bold text-slate-700">{selectedReportForAppeal.reporter_name}</span> ({selectedReportForAppeal.reporter_profile_id})</p>
                )}
                {selectedReportForAppeal.details && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 mt-1">"{selectedReportForAppeal.details}"</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Appeal Explanation & Supporting Context *
                </label>
                <textarea
                  rows={4}
                  required
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="Clearly explain why this report is inaccurate, provide context, or clarify any misunderstanding for our moderation team..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon focus:bg-white text-slate-800 leading-relaxed font-medium transition-all"
                />
                <div className="flex justify-between items-center mt-1.5 px-0.5">
                  <span className="text-[10px] text-slate-400">Be concise, respectful, and factual.</span>
                  <span className={`text-[10px] font-bold ${appealMessage.length < 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {appealMessage.length} characters
                  </span>
                </div>
              </div>

              {appealError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{appealError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReportForAppeal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2.5 rounded-xl bg-deep-maroon hover:bg-primary text-white text-xs font-bold transition-all shadow-md shadow-deep-maroon/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {submittingAppeal ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      <span>Submitting Appeal...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Submit Appeal to Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Accepting Report */}
      {confirmAcceptReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 animate-scale-up text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-2xl">help</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Acknowledge this Report?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                By accepting, you acknowledge this community report without filing a dispute. It will be marked as resolved with your acknowledgement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAcceptReport(null)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acceptingLoading}
                onClick={handleConfirmAccept}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {acceptingLoading ? 'Accepting...' : 'Yes, Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Withdrawing a Sent Report */}
      {confirmWithdrawReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 animate-scale-up text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Withdraw this Report?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to withdraw your report against <strong className="text-slate-700">{confirmWithdrawReport.reported_name || confirmWithdrawReport.reported_profile_id}</strong>? This action will cancel and remove the report notice.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmWithdrawReport(null)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawingLoading}
                onClick={handleConfirmWithdraw}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {withdrawingLoading ? 'Withdrawing...' : 'Yes, Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
