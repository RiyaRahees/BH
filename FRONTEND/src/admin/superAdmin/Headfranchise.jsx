import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';

export default function HeadFranchise() {
  const [users, setUsers] = useState([]);
  const [franchiseOptions, setFranchiseOptions] = useState([]);
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, title: '', message: '', type: 'success' });

  const showToast = (title, message, type = 'success') => {
    setToast({ isVisible: true, title, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, franRes] = await Promise.all([
        axiosInstance.get('/admin/head-franchise/requests'),
        axiosInstance.get('/admin/head-franchise/franchises').catch(() => axiosInstance.get('/admin/franchises'))
      ]);

      const fetchedUsers = Array.isArray(userRes.data) 
        ? userRes.data 
        : (userRes.data?.users || []);

      const activeFranchises = Array.isArray(franRes.data)
        ? franRes.data.filter(f => !f.status || f.status.toLowerCase() === 'active')
        : [];

      setUsers(fetchedUsers);
      setFranchiseOptions(activeFranchises);
    } catch (error) {
      console.error('Error fetching unassigned users:', error);
      showToast('Error', 'Failed to fetch unassigned users list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.userId && u.userId.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.pincode && u.pincode.toLowerCase().includes(q)) ||
      (u.location && u.location.toLowerCase().includes(q))
    );
  });

  const totalUnassignedCount = users.length;
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAssign = (user) => {
    setAssigningUser(user);
    setSelectedFranchiseId('');
  };

  const handleConfirmAssign = async () => {
    if (!selectedFranchiseId || !assigningUser) return;

    try {
      setSubmitting(true);
      const payload = {
        profile_id: assigningUser.userId || assigningUser.profile_id || assigningUser.id,
        franchise_id: selectedFranchiseId
      };

      await axiosInstance.post('/admin/head-franchise/assign', payload);

      const assignedFranchise = franchiseOptions.find(f => (f.franchise_id || f.id) === selectedFranchiseId);
      const franchiseName = assignedFranchise ? assignedFranchise.name : 'the selected franchise';

      // Immediately remove the assigned user from the local state
      const targetId = assigningUser.userId || assigningUser.profile_id || assigningUser.id;
      setUsers(prev => prev.filter(u => (u.userId || u.profile_id || u.id) !== targetId));

      showToast('Assigned Successfully', `${assigningUser.name || 'User'} has been assigned to ${franchiseName}.`);
      setAssigningUser(null);
      setSelectedFranchiseId('');
    } catch (error) {
      console.error('Error assigning user to franchise:', error);
      const errMsg = error.response?.data?.error || 'Failed to assign user. Please try again.';
      showToast('Assignment Failed', errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startIndex = filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
          Pincode Allocation
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Users who registered with a pincode outside any franchise's coverage land here. Assign their pincode to a franchise to route them.
        </p>
      </div>

      {/* Summary Card */}
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 sm:p-4 shadow-xs flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base sm:text-xl">calendar_month</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              TOTAL UNASSIGNED USERS
            </span>
            <span className="text-sm sm:text-xl font-black text-slate-800 truncate block">
              {totalUnassignedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 font-semibold text-[10px]">USER ID</th>
                <th className="py-3.5 px-3 font-semibold text-[10px]">NAME</th>
                <th className="py-3.5 px-3 font-semibold text-[10px]">PHONE</th>
                <th className="py-3.5 px-3 font-semibold text-[10px]">PINCODE</th>
                <th className="py-3.5 px-3 font-semibold text-[10px]">LOCATION</th>
                <th className="py-3.5 px-3 font-semibold text-[10px]">REGISTERED ON</th>
                <th className="py-3.5 px-3 font-semibold text-[10px]">STATUS</th>
                <th className="py-3.5 px-3 font-semibold text-[10px] text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block animate-spin">refresh</span>
                    Loading unassigned users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block">group_off</span>
                    No unassigned users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.userId || user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* 1. USER ID */}
                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {user.userId}
                    </td>

                    {/* 2. NAME / PROFILE */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.image || (user.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png')}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0"
                          onError={(e) => {
                            e.target.src = user.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png';
                          }}
                        />
                        <span className="font-semibold text-slate-800 truncate max-w-[130px]" title={user.name}>
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* 3. PHONE */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {user.phone || 'N/A'}
                    </td>

                    {/* 5. PINCODE */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {user.pincode || 'N/A'}
                    </td>

                    {/* 6. LOCATION */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {user.location || user.district || 'Kerala'}
                    </td>

                    {/* 7. REGISTERED ON */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {user.registeredOn || 'N/A'}
                    </td>

                    {/* 8. STATUS */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border bg-emerald-50 border-emerald-200 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>

                    {/* 9. ACTION */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAssign(user)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors bg-deep-maroon text-white hover:bg-primary cursor-pointer active:scale-95 shadow-xs select-none"
                      >
                        <span className="material-symbols-outlined text-[13px] leading-none">person_add</span>
                        <span>Assign</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 border-t border-slate-200/60 flex items-center justify-between bg-slate-50/30 rounded-b-2xl">
          <span className="text-xs text-deep-maroon font-semibold">
            Showing <span className="font-bold">{startIndex}</span> to <span className="font-bold">{endIndex}</span> of <span className="font-bold">{filteredUsers.length}</span> users
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-deep-maroon hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-deep-maroon px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-deep-maroon hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Assign User Modal (Matching screenshot target design) */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => !submitting && setAssigningUser(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>

          {/* Dialog Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-sm sm:max-w-md relative z-10 animate-fade-in text-left">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-deep-maroon text-xl">person_add</span>
                <h3 className="font-bold text-sm sm:text-base text-slate-800">
                  Assign User to Franchise
                </h3>
              </div>
              <button
                onClick={() => !submitting && setAssigningUser(null)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* User Details Box */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-deep-maroon text-base">person</span>
                  <span className="font-bold text-xs text-slate-700">User Details</span>
                </div>
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-slate-400 font-medium">Name</span>
                    <span className="font-bold text-slate-800">: {assigningUser.name}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-slate-400 font-medium">User ID</span>
                    <span className="font-bold text-slate-800">: {assigningUser.userId}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-slate-400 font-medium">Pincode</span>
                    <span className="font-bold text-slate-800">: {assigningUser.pincode}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-slate-400 font-medium">Location</span>
                    <span className="font-bold text-slate-800">: {assigningUser.location || assigningUser.district}</span>
                  </div>
                </div>
              </div>

              {/* Select Franchise */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-deep-maroon text-base">storefront</span>
                  <span className="font-bold text-xs text-slate-700">Select Franchise</span>
                </div>
                <select
                  value={selectedFranchiseId}
                  onChange={(e) => setSelectedFranchiseId(e.target.value)}
                  disabled={submitting}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon cursor-pointer font-medium"
                >
                  <option value="">Select an active franchise...</option>
                  {franchiseOptions.map((f) => (
                    <option key={f.franchise_id || f.id} value={f.franchise_id || f.id}>
                      {f.name} {f.location ? `(${f.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  disabled={!selectedFranchiseId || submitting}
                  className={`w-full py-2.5 px-4 font-bold rounded-xl text-xs flex items-center justify-center gap-2 select-none shadow-md transition-all ${
                    selectedFranchiseId && !submitting
                      ? 'bg-deep-maroon hover:bg-primary text-white cursor-pointer active:scale-98'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span className="material-symbols-outlined text-base leading-none">
                    {submitting ? 'hourglass_empty' : 'person_add'}
                  </span>
                  <span>{submitting ? 'Assigning...' : 'Assign'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
          <div className={`pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-lg relative group animate-in slide-in-from-top-full sm:slide-in-from-bottom-full bg-white ${
            toast.type === 'error' ? 'border-rose-200 text-rose-900' : 'border-slate-200 text-slate-900'
          }`}>
            <div className="grid gap-1">
              {toast.title && <div className="text-sm font-bold">{toast.title}</div>}
              {toast.message && <div className="text-xs opacity-90 text-slate-600">{toast.message}</div>}
            </div>
            <button
              onClick={() => setToast({ ...toast, isVisible: false })}
              className="absolute right-2 top-2 rounded-md p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}