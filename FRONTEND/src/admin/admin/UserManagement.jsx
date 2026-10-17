import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import AddUserModal from '../../../components/admin/AddUserModal';
import PhotoViewerModal from '../../../components/admin/PhotoViewerModal';
import { downloadProfilePDF } from '../../utils/profilePdfGenerator';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Local drawer state for tracking changes before Save
  const [drawerVerified, setDrawerVerified] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [demographics, setDemographics] = useState({ hindu: 0, muslim: 0, christian: 0, other: 0 });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [photoActionLoading, setPhotoActionLoading] = useState(null);
  const [photoViewer, setPhotoViewer] = useState({
    isOpen: false,
    initialIndex: 0,
    photos: []
  });
  const [rejectPhotoModal, setRejectPhotoModal] = useState({
    isOpen: false,
    profileId: null,
    slot: null,
    reason: 'Photo does not meet quality standards or guidelines.'
  });

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const handleApprovePhoto = async (profileId, slot = 'all') => {
    setPhotoActionLoading(`approve-${slot}`);
    try {
      await axiosInstance.post(`/admin/customers/${profileId}/photos/approve`, { slot });
      showToast('Photo(s) approved and published successfully.');
      fetchCustomers(true);
      if (selectedUser && selectedUser.id === profileId) {
        setSelectedUser(prev => ({
          ...prev,
          photo_1_status: slot === 'photo_1' || slot === 'all' ? 'APPROVED' : prev.photo_1_status,
          photo_2_status: slot === 'photo_2' || slot === 'all' ? 'APPROVED' : prev.photo_2_status,
          photo_3_status: slot === 'photo_3' || slot === 'all' ? 'APPROVED' : prev.photo_3_status,
          photo_4_status: slot === 'photo_4' || slot === 'all' ? 'APPROVED' : prev.photo_4_status,
          hasPendingPhotos: false
        }));
        setPhotoViewer(prev => ({
          ...prev,
          photos: prev.photos.map(p => (p.slot === slot || slot === 'all' ? { ...p, status: 'APPROVED' } : p))
        }));
      }
    } catch (err) {
      console.error('Error approving photo:', err);
      showToast(err.response?.data?.error || 'Failed to approve photo', 'error');
    } finally {
      setPhotoActionLoading(null);
    }
  };

  const openRejectPhotoModal = (profileId, slot) => {
    setRejectPhotoModal({
      isOpen: true,
      profileId,
      slot,
      reason: 'Photo does not meet quality standards or guidelines.'
    });
  };

  const handleConfirmRejectPhoto = async () => {
    const { profileId, slot, reason } = rejectPhotoModal;
    if (!profileId || !slot) return;

    setPhotoActionLoading(`reject-${slot}`);
    setRejectPhotoModal(prev => ({ ...prev, isOpen: false }));

    try {
      await axiosInstance.post(`/admin/customers/${profileId}/photos/reject`, { slot, reason });
      showToast('Photo rejected successfully.');
      fetchCustomers(true);
      if (selectedUser && selectedUser.id === profileId) {
        setSelectedUser(prev => ({
          ...prev,
          photo_1_status: slot === 'photo_1' || slot === 'all' ? 'REJECTED' : prev.photo_1_status,
          photo_2_status: slot === 'photo_2' || slot === 'all' ? 'REJECTED' : prev.photo_2_status,
          photo_3_status: slot === 'photo_3' || slot === 'all' ? 'REJECTED' : prev.photo_3_status,
          photo_4_status: slot === 'photo_4' || slot === 'all' ? 'REJECTED' : prev.photo_4_status,
          photoRejectionReason: reason
        }));
        setPhotoViewer(prev => ({
          ...prev,
          photos: prev.photos.map(p => (p.slot === slot || slot === 'all' ? { ...p, status: 'REJECTED' } : p))
        }));
      }
    } catch (err) {
      console.error('Error rejecting photo:', err);
      showToast(err.response?.data?.error || 'Failed to reject photo', 'error');
    } finally {
      setPhotoActionLoading(null);
    }
  };

  const [sendingReminderEmail, setSendingReminderEmail] = useState(false);

  const handleSendPhotoReminder = async (profileId, userEmail) => {
    if (!profileId) return;
    setSendingReminderEmail(true);
    try {
      const res = await axiosInstance.post(`/admin/customers/${profileId}/send-profile-reminder`);
      showToast(res.data?.message || `Reminder email sent successfully to ${userEmail || 'user'}!`);
    } catch (err) {
      console.error('Error sending profile reminder:', err);
      showToast(err.response?.data?.error || 'Failed to send reminder email', 'error');
    } finally {
      setSendingReminderEmail(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'ACTIVE').toUpperCase();
    switch (s) {
      case 'ACTIVE': return { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'check_circle', label: 'Active' };
      case 'DEACTIVATED': return { color: 'bg-rose-50 border-rose-200 text-rose-700', icon: 'cancel', label: 'Deactivated' };
      case 'INACTIVE': return { color: 'bg-rose-50 border-rose-200 text-rose-700', icon: 'cancel', label: 'Inactive' };
      case 'BLOCKED': return { color: 'bg-amber-50 border-amber-200 text-amber-700', icon: 'block', label: 'Blocked' };
      case 'BANNED': return { color: 'bg-red-100 border-red-300 text-red-800', icon: 'cancel', label: 'Banned' };
      case 'FREEZED': return { color: 'bg-sky-50 border-sky-200 text-sky-700', icon: 'ac_unit', label: 'Freezed' };
      case 'REPORTED': return { color: 'bg-orange-50 border-orange-200 text-orange-700', icon: 'warning', label: 'Reported' };
      case 'PENDING_DELETE': return { color: 'bg-rose-100 border-rose-300 text-rose-800', icon: 'delete_sweep', label: 'Pending Deletion' };
      case 'DELETED': return { color: 'bg-slate-100 border-slate-300 text-slate-800', icon: 'delete_forever', label: 'Deleted' };
      default: return { color: 'bg-rose-50 border-rose-200 text-rose-700', icon: 'cancel', label: s };
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const fetchCustomers = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      if (!isPolling) setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (genderFilter !== 'All') params.append('gender', genderFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      params.append('page', currentPage);
      params.append('limit', 10);
      
      const adminFranchise = localStorage.getItem('adminFranchise');
      if (adminFranchise) params.append('franchise_id', adminFranchise);
      
      const response = await axiosInstance.get(`/admin/customers?${params.toString()}`);
      
      const mappedUsers = response.data.customers.map(user => {
        const cleanDistrict = user.district ? user.district.replace(/^\d+-/, '').trim() : '';
        const cleanPlace = user.place ? user.place.trim() : '';
        
        const locArr = [];
        if (cleanPlace) locArr.push(cleanPlace);
        if (cleanDistrict && cleanDistrict.toLowerCase() !== cleanPlace.toLowerCase()) {
          locArr.push(cleanDistrict);
        }
        if (user.state) locArr.push(user.state.trim());

        const locationStr = locArr.length > 0 ? locArr.join(', ') : "Location Not Provided";

        return {
          id: user.profile_id,
          profile_id: user.profile_id,
          name: user.full_name,
          full_name: user.full_name,
          gender: user.gender === 'Female' ? 'Bride' : user.gender === 'Male' ? 'Groom' : user.gender,
          dob: user.dob,
          age: calculateAge(user.dob),
          height: user.height || "N/A",
          religion: user.religion || "N/A",
          caste: user.caste || "N/A", 
          star: user.star || "",
          rasi: user.rasi || "",
          starRasi: [user.star, user.rasi].filter(Boolean).join(' / ') || 'N/A',
          phone: (user.country_code ? user.country_code + ' ' : '') + (user.mobile_number || ''),
          mobile_number: user.mobile_number,
          country_code: user.country_code,
          email: user.email_address || '',
          email_address: user.email_address || '',
          education: user.education || "N/A",
          profession: user.profession || "N/A",
          place: cleanPlace,
          district: cleanDistrict,
          state: user.state,
          pincode: user.pincode,
          house_name: user.house_name,
          street_locality: user.street_locality,
          post_office: user.post_office,
          address: [user.house_name, user.street_locality, user.post_office, cleanPlace, (cleanDistrict && cleanDistrict.toLowerCase() !== cleanPlace.toLowerCase() ? cleanDistrict : ''), user.state, user.pincode].filter(Boolean).join(', ') || locationStr,
          location: locationStr,
          image: user.photo_1 || (user.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png'),
          photo_1: user.photo_1,
          photo_1_status: user.photo_1_status || 'APPROVED',
          photo_2: user.photo_2,
          photo_2_status: user.photo_2_status || 'APPROVED',
          photo_3: user.photo_3,
          photo_3_status: user.photo_3_status || 'APPROVED',
          photo_4: user.photo_4,
          photo_4_status: user.photo_4_status || 'APPROVED',
          hasPendingPhotos: !!user.has_pending_photos || [user.photo_1_status, user.photo_2_status, user.photo_3_status, user.photo_4_status].includes('PENDING'),
          photoRejectionReason: user.photo_rejection_reason || '',
          verified: user.verification === 'VERIFIED',
          premium: user.plan && user.plan !== 'FREE',
          planName: user.plan || "FREE",
          status: user.status || "Active",
          online: !!user.is_online,
          reports: user.reports || [],
          reported: Boolean(user.has_reports || (user.reports && user.reports.length > 0) || (user.status && user.status.toUpperCase() === 'REPORTED')),
          reportReason: user.reports && user.reports.length > 0 
            ? (user.reports[0].reason + (user.reports[0].details ? ` - ${user.reports[0].details}` : ''))
            : (user.status === 'Reported' ? "User reported by community" : "Active Community Report"),
          bio: "Bio information is currently not fetched."
        };
      });
      
      setUsers(
        mappedUsers.sort((a, b) => {
          if (a.hasPendingPhotos && !b.hasPendingPhotos) return -1;
          if (!a.hasPendingPhotos && b.hasPendingPhotos) return 1;
          if (a.reported && !b.reported) return -1;
          if (!a.reported && b.reported) return 1;
          return a.name.localeCompare(b.name);
        })
      );
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.total);
      }
      
      if (response.data.demographics) {
        setDemographics(response.data.demographics);
      }
      
      setSelectedUser(prevSelected => {
        if (prevSelected) {
          const updated = mappedUsers.find(u => u.id === prevSelected.id);
          if (updated) {
            // Only update if there's an actual change to prevent unnecessary re-renders
            if (updated.hasActiveSession !== prevSelected.hasActiveSession || updated.online !== prevSelected.online) {
              return { ...prevSelected, online: updated.online, hasActiveSession: updated.hasActiveSession };
            }
          }
        }
        return prevSelected;
      });
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter, genderFilter, currentPage]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchCustomers(true);
    }, 15000);
    return () => clearInterval(pollInterval);
  }, [searchQuery, statusFilter, genderFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, genderFilter]);

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setDrawerVerified(user.verified);
    setDrawerStatus('');
  };

  const handleSaveDrawerChanges = async () => {
    try {
      const statusToSave = drawerStatus || selectedUser.status;
      await axiosInstance.put(`/admin/customers/${selectedUser.id}`, {
        verification: drawerVerified,
        status: statusToSave
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, verified: drawerVerified, status: statusToSave } : u));
      setSelectedUser(null);
      showToast('Changes saved');
    } catch (err) {
      console.error('Failed to save user changes:', err);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save changes. Please try again.',
        onConfirm: null
      });
    }
  };

  const handleToggleVerificationInTable = async (id, currentVerified) => {
    try {
      const newVerifiedStatus = !currentVerified;
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: newVerifiedStatus } : u));
      await axiosInstance.put(`/admin/customers/${id}`, {
        verification: newVerifiedStatus
      });
    } catch (err) {
      console.error('Failed to toggle verification:', err);
      // Revert optimistic update
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: currentVerified } : u));
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Verification Failed',
        message: 'Failed to update verification status. Please try again.',
        onConfirm: null
      });
    }
  };

  const handleForceLogout = (id, name) => {
    setAlertModal({
      isOpen: true,
      type: 'confirm',
      title: 'Force Logout',
      message: `Are you sure you want to forcefully log out ${name}? This will instantly end their active session.`,
      onConfirm: async () => {
        setAlertModal({ isOpen: false });
        try {
          await axiosInstance.post(`/admin/customers/force-logout/${id}`);
          setUsers(prev => prev.map(u => u.id === id ? { ...u, online: false, hasActiveSession: false } : u));
          if (selectedUser && selectedUser.id === id) {
            setSelectedUser({ ...selectedUser, online: false, hasActiveSession: false });
          }
          showToast('User logged out.');
        } catch (err) {
          console.error('Failed to force logout:', err);
          setAlertModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to force log out user. Please try again.',
            onConfirm: null
          });
        }
      }
    });
  };

  const handleOpenAddUserModal = () => {
    setShowAddUserModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
            User Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review matrimonial registrations, verify profiles, handle reports, and manage account statuses.
          </p>
        </div>
        <button
          onClick={handleOpenAddUserModal}
          className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 self-start active:scale-95 border border-white/10 select-none"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add New User
        </button>
      </div>

      {/* Demographics Metrics - Users by Religion */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 min-w-0">
          <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                  Hindu Users
              </span>
              <div className="flex items-center justify-between gap-1 mt-2">
                  <p className="text-sm sm:text-xl font-black text-orange-600">{demographics.hindu.toLocaleString()}</p>
              </div>
          </div>
          <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                  Muslim Users
              </span>
              <div className="flex items-center justify-between gap-1 mt-2">
                  <p className="text-sm sm:text-xl font-black text-emerald-600">{demographics.muslim.toLocaleString()}</p>
              </div>
          </div>
          <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                  Christian Users
              </span>
              <div className="flex items-center justify-between gap-1 mt-2">
                  <p className="text-sm sm:text-xl font-black text-blue-600">{demographics.christian.toLocaleString()}</p>
              </div>
          </div>
          <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                  Other Users
              </span>
              <div className="flex items-center justify-between gap-1 mt-2">
                  <p className="text-sm sm:text-xl font-black text-slate-600">{demographics.other.toLocaleString()}</p>
              </div>
          </div>
      </div>

      {/* Filter and search control board */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-700">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-lg leading-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-surface-variant rounded-xl py-1.5 pl-10 pr-4 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-soft-gray/40"
            placeholder="Search by Name, ID, location, or job..."
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 flex-1 min-w-[120px] justify-between sm:justify-start">
            <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="border border-surface-variant rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none flex-1 sm:flex-initial"
            >
              <option value="All">All Genders</option>
              <option value="Bride">Brides (Female)</option>
              <option value="Groom">Grooms (Male)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[120px] justify-between sm:justify-start">
            <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-surface-variant rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none flex-1 sm:flex-initial"
            >
              <option value="All">All Profiles</option>
              <option value="Pending Photo Review">Under Review (Photos)</option>
              <option value="Reported Accounts">Reported Accounts</option>
              <option value="Active">Active</option>
              <option value="Deactivated">Deactivated</option>
              <option value="Blocked">Blocked</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[800px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold text-[10px]">User ID</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">Profile</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">Details</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">Verification</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">Plan</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">Status</th>
                <th className="py-3.5 px-4 font-semibold text-[10px]">Online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined animate-spin text-3xl mb-1 block">autorenew</span>
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-rose-500 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block">people_outline</span>
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => handleOpenDetails(user)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    title="Click to view details"
                  >
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{user.id}</span>
                        {user.hasPendingPhotos && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-amber-500 text-white animate-pulse" title="Uploaded photo awaiting admin review">
                            Photo Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-800">{user.name}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p>{user.age} Yrs &bull; {user.height}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{user.religion} - {user.caste}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVerificationInTable(user.id, user.verified);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-0.5 cursor-pointer border ${
                          user.verified 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                        title="Toggle verification status"
                      >
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {user.verified ? 'verified' : 'pending'}
                        </span>
                        {user.verified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                        user.premium
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {user.planName && user.planName !== 'FREE' ? user.planName : (user.premium ? 'Premium' : 'Free Silver')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const badge = getStatusBadge(user.status);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${badge.color}`}>
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        user.online 
                          ? 'text-emerald-700' 
                          : 'text-slate-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${user.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
                        {user.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200/60 flex items-center justify-between bg-slate-50/30 rounded-b-2xl">
          <span className="text-xs text-deep-maroon font-semibold">
            Showing <span className="font-bold">{users.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to <span className="font-bold">{Math.min(currentPage * 10, totalUsers)}</span> of <span className="font-bold">{totalUsers}</span> users
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-deep-maroon hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-deep-maroon px-2">Page {currentPage} of {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-deep-maroon hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out Drawer Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedUser(null)}
            className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
          ></div>

          {/* Drawer content card */}
          <div className="w-full max-w-full sm:max-w-md md:max-w-lg bg-white h-full relative z-10 shadow-2xl flex flex-col justify-between animate-slide-in overflow-hidden border-l border-slate-200 text-left">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedUser.id}</span>
                {(() => {
                  const currentStatus = drawerStatus || selectedUser.status;
                  const badge = getStatusBadge(currentStatus);
                  return (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-sm text-[8px] font-black uppercase border ${badge.color}`}>
                      <span className="material-symbols-outlined text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                      {badge.label}
                    </span>
                  );
                })()}

                {/* Verified / Unverified Interactive Toggle Badge */}
                <button
                  type="button"
                  onClick={() => setDrawerVerified(prev => !prev)}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    drawerVerified
                      ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                  }`}
                  title="Click to toggle Verified / Unverified"
                >
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {drawerVerified ? 'verified' : 'gpp_bad'}
                  </span>
                  <span>{drawerVerified ? 'VERIFIED' : 'UNVERIFIED'}</span>
                </button>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 sm:space-y-6">
              {/* Profile image and banner */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                <div
                  onClick={() => {
                    if (selectedUser.photo_1 || selectedUser.image) {
                      const photoList = [
                        { slot: 'photo_1', url: selectedUser.photo_1 || selectedUser.image, status: selectedUser.photo_1_status, label: 'Primary Photo' },
                        { slot: 'photo_2', url: selectedUser.photo_2, status: selectedUser.photo_2_status, label: 'Photo 2' },
                        { slot: 'photo_3', url: selectedUser.photo_3, status: selectedUser.photo_3_status, label: 'Photo 3' },
                        { slot: 'photo_4', url: selectedUser.photo_4, status: selectedUser.photo_4_status, label: 'Photo 4' }
                      ].filter(p => !!p.url);
                      setPhotoViewer({
                        isOpen: true,
                        initialIndex: 0,
                        photos: photoList
                      });
                    }
                  }}
                  className="relative group cursor-pointer shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                  title="Click to view large photo"
                >
                  <img
                    src={selectedUser.image}
                    alt={selectedUser.name}
                    className="w-20 h-24 sm:w-24 sm:h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-xl">zoom_in</span>
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-1.5 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                    {selectedUser.name}
                    {drawerVerified && (
                      <span className="material-symbols-outlined text-emerald-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedUser.gender} &bull; {selectedUser.age} Yrs &bull; {selectedUser.height}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-slate-400 text-xs">location_on</span>
                    {selectedUser.location}
                  </p>
                  <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-slate-400 text-[13px]">mail</span>
                      {selectedUser.email || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-slate-400 text-[13px]">call</span>
                      {selectedUser.phone || 'N/A'}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wide ${
                      selectedUser.premium
                        ? 'bg-heritage-gold/15 border-heritage-gold/20 text-heritage-gold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {selectedUser.planName && selectedUser.planName !== 'FREE' ? selectedUser.planName : (selectedUser.premium ? 'Premium' : 'Free Silver')}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                      selectedUser.online 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${selectedUser.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {selectedUser.online ? 'Online' : 'Offline'}
                    </span>
                    {selectedUser.reports && selectedUser.reports.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border bg-rose-50 border-rose-200 text-rose-700 uppercase tracking-wide" title="View in Reported Profiles tab">
                        <span className="material-symbols-outlined text-[10px]">flag</span>
                        {selectedUser.reports.length} {selectedUser.reports.length === 1 ? 'Report' : 'Reports'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Verification & Moderation (At Top Before About Profile) */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">verified</span>
                      <span>Uploaded Photos & Verification</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Review and approve photos before publishing to public searches.</p>
                  </div>
                  {selectedUser.hasPendingPhotos && (
                    <button
                      onClick={() => handleApprovePhoto(selectedUser.id, 'all')}
                      disabled={photoActionLoading === 'approve-all'}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[13px]">done_all</span>
                      <span>Approve All</span>
                    </button>
                  )}
                </div>

                {/* When User Has Incomplete Profile / No Photos: Show Profile Completion Email Reminder Banner */}
                {(!selectedUser.photo_1 && !selectedUser.photo_2 && !selectedUser.photo_3 && !selectedUser.photo_4) && (
                  <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-950">Incomplete Profile Details & Photos</p>
                        <p className="text-[10.5px] text-amber-800 leading-tight">
                          Send an email reminder encouraging this user to complete their profile details, horoscope, and photos for better partner matching.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendPhotoReminder(selectedUser.id, selectedUser.email)}
                      disabled={sendingReminderEmail}
                      className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {sendingReminderEmail ? 'progress_activity' : 'send'}
                      </span>
                      <span>{sendingReminderEmail ? 'Sending Email...' : 'Send Profile Reminder Email'}</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { slot: 'photo_1', url: selectedUser.photo_1, status: selectedUser.photo_1_status, label: 'Primary Photo' },
                    { slot: 'photo_2', url: selectedUser.photo_2, status: selectedUser.photo_2_status, label: 'Photo 2' },
                    { slot: 'photo_3', url: selectedUser.photo_3, status: selectedUser.photo_3_status, label: 'Photo 3' },
                    { slot: 'photo_4', url: selectedUser.photo_4, status: selectedUser.photo_4_status, label: 'Photo 4' }
                  ].map((item) => (
                    <div key={item.slot} className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-2 shadow-2xs">
                      {/* Photo Thumbnail */}
                      <div 
                        onClick={() => {
                          if (item.url) {
                            const photoList = [
                              { slot: 'photo_1', url: selectedUser.photo_1, status: selectedUser.photo_1_status, label: 'Primary Photo' },
                              { slot: 'photo_2', url: selectedUser.photo_2, status: selectedUser.photo_2_status, label: 'Photo 2' },
                              { slot: 'photo_3', url: selectedUser.photo_3, status: selectedUser.photo_3_status, label: 'Photo 3' },
                              { slot: 'photo_4', url: selectedUser.photo_4, status: selectedUser.photo_4_status, label: 'Photo 4' }
                            ].filter(p => !!p.url);
                            const activeIdx = photoList.findIndex(p => p.slot === item.slot);
                            setPhotoViewer({
                              isOpen: true,
                              initialIndex: activeIdx >= 0 ? activeIdx : 0,
                              photos: photoList
                            });
                          }
                        }}
                        className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border border-slate-200/80 ${item.url ? 'cursor-pointer group' : ''}`}
                        title={item.url ? "Click to view large photo" : ""}
                      >
                        {item.url ? (
                          <>
                            <img src={item.url} alt={item.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            {/* Hover zoom overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                              <span className="p-1 rounded-full bg-white/20 backdrop-blur-xs material-symbols-outlined text-lg">zoom_in</span>
                              <span className="text-[8.5px] font-bold tracking-wider uppercase">View Large</span>
                            </div>
                            <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase tracking-wider shadow-md border z-10 ${
                              item.status === 'PENDING' 
                                ? 'bg-amber-500 text-white border-amber-300 animate-pulse' 
                                : item.status === 'APPROVED' 
                                ? 'bg-emerald-600 text-white border-emerald-400' 
                                : 'bg-rose-600 text-white border-rose-400'
                            }`}>
                              {item.status === 'PENDING' ? 'Under Review' : item.status || 'APPROVED'}
                            </span>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                            <span className="material-symbols-outlined text-xl opacity-60">no_photography</span>
                            <span className="text-[9px] font-bold">Empty Slot</span>
                          </div>
                        )}
                      </div>

                      {/* Label & Actions */}
                      <div className="w-full space-y-1.5 mt-auto">
                        <p className="text-[10px] font-bold text-slate-700 text-center truncate">
                          {item.label}
                        </p>

                        {item.url ? (
                          item.status === 'PENDING' ? (
                            <div className="grid grid-cols-2 gap-1.5 w-full h-7">
                              <button
                                onClick={() => handleApprovePhoto(selectedUser.id, item.slot)}
                                disabled={photoActionLoading === `approve-${item.slot}`}
                                className="h-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
                                title="Approve Photo"
                              >
                                <span className="material-symbols-outlined text-[16px] leading-none">check</span>
                              </button>

                              <button
                                onClick={() => openRejectPhotoModal(selectedUser.id, item.slot)}
                                disabled={photoActionLoading === `reject-${item.slot}`}
                                className="h-full rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                                title="Reject Photo"
                              >
                                <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                              </button>
                            </div>
                          ) : item.status === 'APPROVED' ? (
                            <div className="flex items-center gap-1 w-full h-7">
                              <div className="flex-1 h-full px-1 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1 min-w-0">
                                <span className="material-symbols-outlined text-[13px] text-emerald-600 leading-none shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                <span className="truncate">Approved</span>
                              </div>
                              <button
                                onClick={() => openRejectPhotoModal(selectedUser.id, item.slot)}
                                disabled={photoActionLoading === `reject-${item.slot}`}
                                className="h-full px-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                                title="Reject this photo"
                              >
                                <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 w-full h-7">
                              <div className="flex-1 h-full px-1 rounded-lg text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 min-w-0">
                                <span className="material-symbols-outlined text-[13px] text-rose-600 leading-none shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                <span className="truncate">Rejected</span>
                              </div>
                              <button
                                onClick={() => handleApprovePhoto(selectedUser.id, item.slot)}
                                disabled={photoActionLoading === `approve-${item.slot}`}
                                className="h-full px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                                title="Re-approve this photo"
                              >
                                <span className="material-symbols-outlined text-[14px] leading-none">check</span>
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="w-full h-7 px-1 rounded-lg text-[9.5px] font-medium text-slate-400 bg-slate-100/70 border border-slate-200/50 flex items-center justify-center">
                            <span>No Upload</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Bio */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">About Profile</h4>
                <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{selectedUser.bio}"
                </p>
              </div>

              {/* Personal Details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Religion</span>
                    <span className="font-bold text-slate-700">{selectedUser.religion}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Caste</span>
                    <span className="font-bold text-slate-700">{selectedUser.caste}</span>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Education & Career</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Education</span>
                    <span className="font-bold text-slate-700 truncate block">{selectedUser.education}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Profession</span>
                    <span className="font-bold text-slate-700 truncate block">{selectedUser.profession}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-2.5 justify-end items-center">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDownloadingPDF(true);
                    showToast('Generating profile PDF...');
                    await downloadProfilePDF(selectedUser);
                    showToast('Profile PDF downloaded successfully!');
                  } catch (err) {
                    console.error('PDF error:', err);
                    showToast('Failed to generate PDF.', 'error');
                  } finally {
                    setDownloadingPDF(false);
                  }
                }}
                disabled={downloadingPDF}
                className="w-full sm:w-auto min-w-[195px] px-3.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-600/60 hover:border-emerald-600 text-emerald-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-75"
              >
                <span className={`material-symbols-outlined text-[15px] ${downloadingPDF ? 'animate-spin text-emerald-600' : ''}`}>
                  {downloadingPDF ? 'progress_activity' : 'download'}
                </span>
                <span>{downloadingPDF ? 'Generating PDF...' : 'Download Profile Details'}</span>
              </button>

              {selectedUser.hasActiveSession && (
                <button
                  onClick={() => handleForceLogout(selectedUser.id, selectedUser.name)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-250 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Force Logout
                </button>
              )}

              {/* Send Photo Reminder Button (Only shown if user has NOT uploaded any photos) */}
              {(!selectedUser.photo_1 && !selectedUser.photo_2 && !selectedUser.photo_3 && !selectedUser.photo_4) && selectedUser.email && (
                <button
                  type="button"
                  onClick={() => handleSendPhotoReminder(selectedUser.id, selectedUser.email)}
                  disabled={sendingReminderEmail}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 hover:border-amber-400 text-amber-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Send email reminder to add photos & details"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {sendingReminderEmail ? 'progress_activity' : 'forward_to_inbox'}
                  </span>
                  <span>{sendingReminderEmail ? 'Sending...' : 'Send Profile Reminder Email'}</span>
                </button>
              )}

              {/* Verified / Unverified Toggle Action Button */}
              <button
                type="button"
                onClick={() => setDrawerVerified(prev => !prev)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shrink-0 ${
                  drawerVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                }`}
                title="Toggle verification status"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {drawerVerified ? 'verified' : 'gpp_bad'}
                </span>
                <span>{drawerVerified ? 'Verified' : 'Unverified'}</span>
              </button>

              <div className="w-full sm:w-auto">
                {(() => {
                  const actualStatus = (selectedUser.status || '').toUpperCase();
                  const currentDisplayStatus = (drawerStatus || actualStatus).toUpperCase();
                  
                  return (
                    <select
                      value={drawerStatus}
                      onChange={(e) => setDrawerStatus(e.target.value)}
                      className="w-full border border-slate-350 rounded-xl py-1.5 px-3 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled className="hidden">Action</option>
                      
                      {currentDisplayStatus === 'DEACTIVATED' ? (
                        <option value="Active">Activate</option>
                      ) : (
                        <option value="Deactivated">Deactivate</option>
                      )}

                      {currentDisplayStatus === 'FREEZED' ? (
                        <option value="Active">Unfreeze</option>
                      ) : (
                        <option value="Freezed">Freeze</option>
                      )}
                    </select>
                  );
                })()}
              </div>

              <button
                onClick={handleSaveDrawerChanges}
                disabled={!(drawerVerified !== selectedUser.verified || (drawerStatus !== '' && drawerStatus.toUpperCase() !== (selectedUser.status || '').toUpperCase()))}
                className={`w-full sm:w-auto px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                  (drawerVerified !== selectedUser.verified || (drawerStatus !== '' && drawerStatus.toUpperCase() !== (selectedUser.status || '').toUpperCase()))
                    ? 'bg-deep-maroon hover:bg-primary cursor-pointer active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed opacity-70'
                }`}
              >
                <span className="material-symbols-outlined text-xs">save</span>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Photo Rejection Modal */}
      {rejectPhotoModal.isOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setRejectPhotoModal({ ...rejectPhotoModal, isOpen: false })}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-scale-up overflow-hidden border border-slate-200 text-left">
            <div className="p-5 border-b border-slate-100 flex items-start gap-3.5 bg-slate-50/70">
              <div className="h-10 w-10 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <span className="material-symbols-outlined text-2xl">no_photography</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">Reject Uploaded Photo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please provide a reason. The user will be notified to upload a compliant photo.</p>
              </div>
              <button
                onClick={() => setRejectPhotoModal({ ...rejectPhotoModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Quick Reason Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Blurry or low resolution',
                    'Face not clearly visible',
                    'Group or landscape photo',
                    'Watermark or border present',
                    'Inappropriate content'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectPhotoModal(prev => ({ ...prev, reason: preset }))}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        rejectPhotoModal.reason === preset
                          ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Rejection Reason / Moderator Note
                </label>
                <textarea
                  rows={3}
                  value={rejectPhotoModal.reason}
                  onChange={(e) => setRejectPhotoModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none bg-slate-50/40"
                  placeholder="Enter rejection reason..."
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectPhotoModal({ ...rejectPhotoModal, isOpen: false })}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectPhoto}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert/Confirm Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
          ></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 animate-scale-up overflow-hidden border border-slate-100">
            <div className="p-6 text-center">
              {alertModal.type === 'confirm' && (
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-50 mb-4 border border-rose-100">
                  <span className="material-symbols-outlined text-rose-500 text-3xl">warning</span>
                </div>
              )}
              {alertModal.type === 'success' && (
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 mb-4 border border-emerald-100">
                  <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
                </div>
              )}
              {alertModal.type === 'error' && (
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 mb-4 border border-amber-100">
                  <span className="material-symbols-outlined text-amber-500 text-3xl">error</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-800 mb-2">{alertModal.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{alertModal.message}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-center gap-3 border-t border-slate-100/60">
              {alertModal.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={alertModal.onConfirm}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-600 transition-colors shadow-rose-500/20"
                  >
                    Confirm Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                  className="px-8 py-2 bg-deep-maroon text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary transition-colors shadow-deep-maroon/20"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal 
        isOpen={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)} 
        onSuccess={(msg) => {
          showToast(msg);
          fetchCustomers();
        }}
        onError={(msg) => {
          setAlertModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: msg,
            onConfirm: null
          });
        }}
      />

      {/* Photo Preview Modal */}
      <PhotoViewerModal
        isOpen={photoViewer.isOpen}
        onClose={() => setPhotoViewer(prev => ({ ...prev, isOpen: false }))}
        photos={photoViewer.photos}
        initialIndex={photoViewer.initialIndex}
        userName={selectedUser?.name}
        userCode={selectedUser?.user_code || selectedUser?.profileId}
        onApprove={selectedUser ? (slot) => handleApprovePhoto(selectedUser.id, slot) : null}
        onReject={selectedUser ? (slot) => openRejectPhotoModal(selectedUser.id, slot) : null}
        actionLoading={photoActionLoading}
      />

      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed bottom-6 right-6 z-[70] animate-slide-up flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border bg-slate-800 border-slate-700 text-white">
          <span className={`material-symbols-outlined ${toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
