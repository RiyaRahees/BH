import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';

export default function ReportManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true' || window.location.pathname.includes('/super-admin');
      const adminFranchise = !isSuperAdmin ? localStorage.getItem('adminFranchise') : null;
      let url = '/admin/customers/reports/all';
      if (adminFranchise && adminFranchise !== 'HEAD_OFFICE' && adminFranchise !== 'null' && adminFranchise !== 'undefined' && adminFranchise !== 'All' && adminFranchise !== 'ALL') {
        url += `?franchise_id=${adminFranchise}`;
      }
      const response = await axiosInstance.get(url);
      setReports(response.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
      setMessage({ type: 'error', text: 'Failed to load report logs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (profileId, newStatus) => {
    setActionLoading(`status-${profileId}`);
    setMessage({ type: '', text: '' });
    try {
      await axiosInstance.put(`/admin/customers/${profileId}`, { status: newStatus });
      setMessage({ type: 'success', text: `User ${profileId} status updated to ${newStatus}.` });
      fetchReports();
    } catch (err) {
      console.error('Failed to update status', err);
      setMessage({ type: 'error', text: 'Failed to update user status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissReport = async (reportId) => {
    setActionLoading(`dismiss-${reportId}`);
    setMessage({ type: '', text: '' });
    try {
      await axiosInstance.delete(`/admin/customers/reports/${reportId}`);
      setMessage({ type: 'success', text: 'Report closed and dismissed successfully.' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, report_status: 'DISMISSED' } : r));
      fetchReports();
    } catch (err) {
      console.error('Failed to dismiss report', err);
      setMessage({ type: 'error', text: 'Failed to dismiss report.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Filter logic
  const filteredReports = reports.filter(rep => {
    const matchesSearch = 
      (rep.reported_profile_id && rep.reported_profile_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rep.reported_name && rep.reported_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rep.reporter_profile_id && rep.reporter_profile_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rep.reporter_name && rep.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesReason = filterReason === 'All' || rep.reason === filterReason;
    const matchesStatus = filterStatus === 'All' || rep.report_status === filterStatus;

    return matchesSearch && matchesReason && matchesStatus;
  });

  const getAccountBadgeClass = (status) => {
    const s = (status || 'ACTIVE').toUpperCase();
    switch (s) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DEACTIVATED': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'BLOCKED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BANNED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REPORTED': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">report</span>
            Reported Profiles Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review community reports submitted by users, inspect violations, and manage account statuses.
          </p>
        </div>

        <button 
          onClick={fetchReports}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh Reports
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
          message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">{message.type === 'error' ? 'error' : 'check_circle'}</span>
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="cursor-pointer text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{reports.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined">flag</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {reports.filter(r => r.report_status !== 'DISMISSED').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dismissed Reports</p>
            <p className="text-2xl font-black text-slate-500 mt-1">
              {reports.filter(r => r.report_status === 'DISMISSED').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by profile ID or name..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Reason:</span>
            <select 
              value={filterReason} 
              onChange={(e) => setFilterReason(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Reasons</option>
              <option value="Fake Profile / Impersonation">Fake Profile</option>
              <option value="Inappropriate Photos or Content">Inappropriate Photos</option>
              <option value="Harassment or Abusive Behavior">Harassment</option>
              <option value="Scam, Money Request or Commercial Spam">Scam / Spam</option>
              <option value="Incorrect or Misleading Information">Incorrect Info</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-2xs">
          <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
          <p className="text-xs font-bold text-slate-500 mt-2">Loading report records...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-slate-300">shield</span>
          <p className="text-sm font-bold text-slate-700">No profile reports found</p>
          <p className="text-xs text-slate-400">There are currently no community reports matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((rep) => (
            <div 
              key={rep.id} 
              className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs flex flex-col md:flex-row gap-5 justify-between ${
                rep.report_status === 'DISMISSED' ? 'opacity-70 border-slate-200' : 'border-rose-100 hover:border-rose-200'
              }`}
            >
              {/* Reported User & Report Body */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img 
                      src={rep.reported_photo || (rep.reported_gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png')} 
                      alt="Reported Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800">{rep.reported_name || 'User Profile'}</h3>
                      <span className="text-xs font-mono font-semibold text-slate-400">({rep.reported_profile_id})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getAccountBadgeClass(rep.reported_account_status)}`}>
                        {rep.reported_account_status || 'ACTIVE'}
                      </span>
                      {rep.report_status === 'DISMISSED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1 shadow-2xs">
                          <span className="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span>
                          Closed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reported by: <span className="font-bold text-slate-700">{rep.reporter_name || 'User'}</span> <span className="font-mono text-slate-400">({rep.reporter_profile_id})</span>
                    </p>
                  </div>
                </div>

                <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200/60">
                      {rep.reason}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {new Date(rep.created_at).toLocaleDateString()} {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {rep.details ? (
                    <p className="text-xs text-slate-700 italic leading-relaxed font-medium">
                      "{rep.details}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No additional details provided by reporter.</p>
                  )}
                </div>

                {/* User Appeal Section */}
                {rep.appeal_status === 'APPEALED' ? (
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/80 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                        <span className="material-symbols-outlined text-[13px]">gavel</span>
                        User Appeal Submitted
                      </span>
                      {rep.appealed_at && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {new Date(rep.appealed_at).toLocaleDateString()} {new Date(rep.appealed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 text-xs text-slate-800 font-medium leading-relaxed">
                      <span className="font-bold text-indigo-900 block mb-0.5 text-[11px]">Reported User's Appeal Explanation:</span>
                      "{rep.appeal_message}"
                    </div>
                  </div>
                ) : rep.appeal_status === 'ACCEPTED' ? (
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                      <span className="font-bold">Report Acknowledged:</span>
                      <span className="text-emerald-700">The reported user acknowledged and accepted this report.</span>
                    </div>
                    {rep.appealed_at && (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {new Date(rep.appealed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-1">
                    <span className="material-symbols-outlined text-[14px]">pending</span>
                    <span>No appeal submitted by reported user yet.</span>
                  </div>
                )}
              </div>

              {/* Admin Actions Panel */}
              <div className="flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 shrink-0 min-w-[210px]">
                {rep.report_status === 'DISMISSED' ? (
                  <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs h-full min-h-[130px] animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs">
                      <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Report Closed</span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-600 bg-slate-200/70 border border-slate-300/60 mt-1">
                      Dismissed
                    </span>
                    <p className="text-[10.5px] text-slate-400 font-medium mt-1 leading-tight">
                      No further action required
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Take Action</p>
                      <p className="text-[11px] font-medium text-slate-500">Update reported account status:</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        disabled={actionLoading === `status-${rep.reported_profile_id}`}
                        onClick={() => handleUpdateStatus(rep.reported_profile_id, 'BLOCKED')}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">block</span>
                        <span>Block Account</span>
                      </button>

                      <button
                        disabled={actionLoading === `status-${rep.reported_profile_id}`}
                        onClick={() => handleUpdateStatus(rep.reported_profile_id, 'BANNED')}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        <span>Ban Account</span>
                      </button>

                      <button
                        disabled={actionLoading === `dismiss-${rep.id}`}
                        onClick={() => handleDismissReport(rep.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 mt-1"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-400">
                          {actionLoading === `dismiss-${rep.id}` ? 'hourglass_top' : 'clear'}
                        </span>
                        <span>{actionLoading === `dismiss-${rep.id}` ? 'Closing...' : 'Dismiss Report'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
