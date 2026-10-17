import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

// Simple 6-digit Indian pincode check
const isValidPincode = (val) => /^\d{6}$/.test(val.trim());

export default function FranchiseManagement() {
  const toast = useToast();
  const [franchiseList, setFranchiseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/franchises');
      const formatted = response.data.map(item => ({
        id: item.franchise_id,
        name: item.name,
        owner: item.owner,
        location: item.location,
        phone: item.mobile_number,
        email: item.email,
        pincodes: typeof item.pin_codes === 'string' ? JSON.parse(item.pin_codes) : item.pin_codes,
        status: item.status === 'active' ? 'Active' : 'Inactive',
        user_count: item.user_count || 0
      }));
      setFranchiseList(formatted);
    } catch (error) {
      console.error('Error fetching franchises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // View pincodes modal state
  const [viewingFranchise, setViewingFranchise] = useState(null);

  // View franchise assigned users modal state
  const [viewingUsersFranchise, setViewingUsersFranchise] = useState(null);
  const [franchiseUsersList, setFranchiseUsersList] = useState([]);
  const [loadingFranchiseUsers, setLoadingFranchiseUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const handleViewFranchiseUsers = async (franchise) => {
    setViewingUsersFranchise(franchise);
    setUserSearchTerm('');
    setLoadingFranchiseUsers(true);
    try {
      const res = await axiosInstance.get(`/admin/franchises/${franchise.id}/users`);
      setFranchiseUsersList(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (err) {
      console.error('Error fetching franchise users:', err);
      toast.error('Failed to load franchise users');
      setFranchiseUsersList([]);
    } finally {
      setLoadingFranchiseUsers(false);
    }
  };

  // Delete confirmation modal state
  const [franchiseToDelete, setFranchiseToDelete] = useState(null);

  // Franchise Reports State (For Staff Submission & Super Admin Viewing)
  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true' || 
                       localStorage.getItem('adminRole') === 'superadmin' || 
                       window.location.pathname.includes('/super-admin');

  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showSubmitReportModal, setShowSubmitReportModal] = useState(false);
  const [showViewReportsModal, setShowViewReportsModal] = useState(false);

  // Submit Report form state
  const [reportFranchiseId, setReportFranchiseId] = useState('');
  const [reportType, setReportType] = useState('Monthly Performance Review');
  const [reportStatus, setReportStatus] = useState('Normal');
  const [reportSubject, setReportSubject] = useState('');
  const [reportMetrics, setReportMetrics] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // View Reports modal filter state
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportFilterFranchise, setReportFilterFranchise] = useState('All');
  const [reportFilterStatus, setReportFilterStatus] = useState('All');

  const fetchFranchiseReports = async () => {
    try {
      setLoadingReports(true);
      const res = await axiosInstance.get('/admin/franchises/reports');
      setReportsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching franchise reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchFranchiseReports();
  }, []);

  const handleOpenSubmitReportModal = (franchise = null) => {
    if (franchise) {
      setReportFranchiseId(franchise.id);
    } else if (franchiseList.length > 0) {
      setReportFranchiseId(franchiseList[0].id);
    } else {
      setReportFranchiseId('');
    }
    setReportType('Monthly Performance Review');
    setReportStatus('Normal');
    setReportSubject('');
    setReportMetrics('');
    setReportDescription('');
    setShowSubmitReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportFranchiseId) {
      toast.error('Please select a franchise');
      return;
    }
    if (!reportSubject.trim()) {
      toast.error('Please enter a report subject');
      return;
    }
    if (!reportDescription.trim()) {
      toast.error('Please enter report description');
      return;
    }

    const targetFranchise = franchiseList.find(f => f.id === reportFranchiseId);
    const staffName = localStorage.getItem('adminName') || 'Franchise Staff';
    const staffRole = localStorage.getItem('adminRole') || 'FRANCHISE MANAGER';

    setIsSubmittingReport(true);
    try {
      await axiosInstance.post('/admin/franchises/reports', {
        franchise_id: reportFranchiseId,
        franchise_name: targetFranchise ? targetFranchise.name : reportFranchiseId,
        staff_name: staffName,
        staff_id: staffRole,
        report_type: reportType,
        status: reportStatus,
        subject: reportSubject.trim(),
        metrics_notes: reportMetrics.trim(),
        description: reportDescription.trim()
      });

      toast.success('Franchise report submitted successfully!');
      setShowSubmitReportModal(false);
      fetchFranchiseReports();
    } catch (err) {
      console.error('Failed to submit report:', err);
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axiosInstance.delete(`/admin/franchises/reports/${reportId}`);
      toast.success('Report deleted successfully');
      setReportsList(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete report:', err);
      toast.error('Failed to delete report');
    }
  };

  const formatReportDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reportsList.filter((rep) => {
    const matchesSearch =
      !reportSearchTerm ||
      rep.subject?.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
      rep.franchise_name?.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
      rep.franchise_id?.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
      rep.staff_name?.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
      rep.description?.toLowerCase().includes(reportSearchTerm.toLowerCase());

    const matchesFranchise =
      reportFilterFranchise === 'All' || rep.franchise_id === reportFilterFranchise;

    const matchesStatus =
      reportFilterStatus === 'All' || rep.status === reportFilterStatus;

    return matchesSearch && matchesFranchise && matchesStatus;
  });

  // Form States
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Active');
  const [pincodes, setPincodes] = useState([]);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  const resetForm = () => {
    setName('');
    setOwner('');
    setLocation('');
    setPhone('');
    setEmail('');
    setStatus('Active');
    setPincodes([]);
    setPincodeInput('');
    setPincodeError('');
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (franchise) => {
    setIsEditing(true);
    setEditingId(franchise.id);
    setName(franchise.name);
    setOwner(franchise.owner);
    setLocation(franchise.location);
    setPhone(franchise.phone);
    setEmail(franchise.email);
    setStatus(franchise.status);
    setPincodes(franchise.pincodes || []);
    setPincodeInput('');
    setPincodeError('');
    setShowModal(true);
  };

  const handleDeleteFranchise = (id) => {
    setFranchiseToDelete(id);
  };

  const confirmDeleteFranchise = async () => {
    if (!franchiseToDelete) return;
    try {
      await axiosInstance.delete(`/admin/franchises/${franchiseToDelete}`);
      setFranchiseList(prev => prev.filter(item => item.id !== franchiseToDelete));
      toast.success('Franchise deleted successfully');
    } catch (error) {
      console.error('Error deleting franchise:', error);
      toast.error('Failed to delete franchise');
    } finally {
      setFranchiseToDelete(null);
    }
  };

  const handleAddPincode = () => {
    const val = pincodeInput.trim();
    if (!val) return;

    if (!isValidPincode(val)) {
      setPincodeError('Enter a valid 6-digit pincode.');
      return;
    }
    if (pincodes.includes(val)) {
      setPincodeError('This pincode is already added to this franchise.');
      return;
    }

    const isAssignedElsewhere = franchiseList.some(f => f.id !== editingId && f.pincodes.includes(val));
    if (isAssignedElsewhere) {
      setPincodeError('This pincode is already assigned to a franchise');
      return;
    }

    setPincodes(prev => [...prev, val]);
    setPincodeInput('');
    setPincodeError('');
  };

  const handlePincodeKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPincode();
    }
  };

  const handleRemovePincode = (code) => {
    setPincodes(prev => prev.filter(p => p !== code));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-add any pending pincode in the input field if the user forgot to click 'Add'
    let finalPincodes = [...pincodes];
    const val = pincodeInput.trim();
    if (val && isValidPincode(val) && !finalPincodes.includes(val)) {
      finalPincodes.push(val);
    }

    try {
      const payload = {
        name,
        owner,
        location,
        mobile_number: phone,
        email,
        pin_codes: finalPincodes,
        status: status.toLowerCase()
      };

      if (isEditing) {
        await axiosInstance.put(`/admin/franchises/${editingId}`, payload);
      } else {
        await axiosInstance.post('/admin/franchises', payload);
      }
      
      await fetchFranchises();
      setShowModal(false);
      toast.success(isEditing ? 'Franchise updated successfully' : 'Franchise created successfully');
    } catch (error) {
      console.error('Error saving franchise:', error);
      toast.error('Failed to save franchise');
    }
  };

  // Remove a pincode directly from the View modal (updates the live franchise record)
  const handleRemovePincodeFromView = async (franchiseId, code) => {
    try {
      const franchiseToUpdate = franchiseList.find(f => f.id === franchiseId);
      if (!franchiseToUpdate) return;
      
      const newPincodes = franchiseToUpdate.pincodes.filter(p => p !== code);
      
      const payload = {
        pin_codes: newPincodes
      };

      await axiosInstance.patch(`/admin/franchises/${franchiseId}/pincodes`, payload);
      
      setFranchiseList(prev => prev.map(item => {
        if (item.id === franchiseId) {
          return { ...item, pincodes: newPincodes };
        }
        return item;
      }));
      setViewingFranchise(prev => prev ? { ...prev, pincodes: newPincodes } : prev);
      toast.success('Pincode removed successfully');
    } catch (error) {
      console.error('Error updating pincodes:', error);
      toast.error('Failed to remove pincode');
    }
  };

  const activeCount = franchiseList.filter(f => f.status === 'Active').length;

  const sortedFranchiseList = [...franchiseList].sort((a, b) => a.name.localeCompare(b.name));
  const totalFranchises = sortedFranchiseList.length;
  const totalPages = Math.ceil(totalFranchises / 10);
  const paginatedFranchises = sortedFranchiseList.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6 min-w-0">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
            Franchise Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Onboard franchise partners and assign the pincodes they can manage users for.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* View Reports Button (Available for both Super Admin and Staff) */}
          <button
            type="button"
            onClick={() => {
              fetchFranchiseReports();
              setShowViewReportsModal(true);
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-3.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 select-none"
            title="View submitted franchise reports"
          >
            <span className="material-symbols-outlined text-base text-slate-500">assignment</span>
            <span>Franchise Reports</span>
            {reportsList.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-deep-maroon/10 text-deep-maroon rounded-full text-[10px] font-extrabold">
                {reportsList.length}
              </span>
            )}
          </button>

          {/* Submit Franchise Report (ONLY for Franchise Staff, NOT for Super Admin) */}
          {!isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleOpenSubmitReportModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-amber-500/20 select-none"
              title="Submit an operational or audit report"
            >
              <span className="material-symbols-outlined text-sm">rate_review</span>
              <span>Submit Report</span>
            </button>
          )}

          {/* Add Franchise Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-white/10 select-none"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Franchise
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 sm:p-4 shadow-xs flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base sm:text-xl">storefront</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Franchises</span>
            <span className="text-sm sm:text-xl font-black text-slate-800 truncate block">{franchiseList.length}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 sm:p-4 shadow-xs flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base sm:text-xl">verified</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Franchises</span>
            <span className="text-sm sm:text-xl font-black text-slate-800 truncate block">{activeCount}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 sm:p-4 shadow-xs flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base sm:text-xl">groups</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Users</span>
            <span className="text-sm sm:text-xl font-black text-slate-800 truncate block">
              {franchiseList.reduce((acc, f) => acc + (f.user_count || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Franchise ID</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Name</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Owner</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Location</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Contact</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Pin Codes</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Assigned Users</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px]">Status</th>
                <th className="py-3.5 px-2.5 font-semibold text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {franchiseList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block">storefront</span>
                    No franchises registered. Click "Add Franchise" to onboard one.
                  </td>
                </tr>
              ) : (
                paginatedFranchises.map((franchise) => (
                  <tr key={franchise.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200">
                          {franchise.id}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(franchise.id);
                            toast.success('ID copied!');
                          }}
                          className="text-slate-400 hover:text-deep-maroon transition-colors cursor-pointer flex items-center justify-center p-1 rounded hover:bg-slate-50"
                          title="Copy Franchise ID"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-2.5">
                      <span className="font-bold text-slate-800 block max-w-[150px] truncate capitalize" title={franchise.name}>
                        {franchise.name}
                      </span>
                    </td>
                    <td className="py-3 px-2.5">
                      <span className="block max-w-[120px] truncate capitalize" title={franchise.owner}>
                        {franchise.owner}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-slate-500">
                      <span className="block max-w-[130px] truncate capitalize" title={franchise.location}>
                        {franchise.location}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-slate-500">
                      <div className="min-w-0">
                        <p className="truncate max-w-[140px]" title={franchise.phone}>{franchise.phone}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]" title={franchise.email}>{franchise.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2.5">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {franchise.pincodes.length} {franchise.pincodes.length === 1 ? 'Code' : 'Codes'}
                        </span>
                        <button
                          onClick={() => setViewingFranchise(franchise)}
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-2.5">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          (franchise.user_count || 0) > 0 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100 font-extrabold' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {franchise.user_count || 0} {(franchise.user_count === 1) ? 'User' : 'Users'}
                        </span>
                        <button
                          onClick={() => handleViewFranchiseUsers(franchise)}
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-deep-maroon cursor-pointer transition-colors flex items-center gap-1"
                          title="View all users assigned to this franchise"
                        >
                          <span className="material-symbols-outlined text-[12px]">group</span>
                          View
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap ${
                        franchise.status === 'Active'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-rose-50 border-rose-100 text-rose-700'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${franchise.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {franchise.status}
                      </span>
                    </td>
                    <td className="py-3 px-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleOpenSubmitReportModal(franchise)}
                            className="p-1 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 cursor-pointer flex items-center transition-colors"
                            title="Submit Report for this Franchise"
                          >
                            <span className="material-symbols-outlined text-base">rate_review</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(franchise)}
                          className="p-1 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer flex items-center transition-colors"
                          title="Edit Franchise"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFranchise(franchise.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-rose-450 hover:text-rose-700 cursor-pointer flex items-center transition-colors"
                          title="Delete Franchise"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
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
            Showing <span className="font-bold">{paginatedFranchises.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to <span className="font-bold">{Math.min(currentPage * 10, totalFranchises)}</span> of <span className="font-bold">{totalFranchises}</span> franchises
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>

          <div className="bg-paper-white rounded-2xl shadow-xl border border-surface-variant/40 overflow-hidden w-full max-w-md relative z-10 animate-fade-in text-left max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm tracking-wide uppercase">
                {isEditing ? 'Edit Franchise Details' : 'Add New Franchise'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1">
                  Franchise Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="e.g. Bharath Marriage - Trivandrum"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1">
                  Owner / Partner Name
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="Enter owner's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="e.g. Trivandrum, Kerala"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="e.g. +91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="e.g. branch@bharathmarriage.com"
                  required
                />
              </div>

              {/* Pincode Assignment */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1">
                  Assigned Pin Codes
                </label>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Only users registered under these pincodes will be visible to this franchise.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => {
                      setPincodeInput(e.target.value.replace(/[^0-9]/g, ''));
                      if (pincodeError) setPincodeError('');
                    }}
                    onKeyDown={handlePincodeKeyDown}
                    className="flex-1 min-w-0 border border-surface-variant rounded-xl py-2 px-3 text-xs bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                    placeholder="e.g. 682001"
                  />
                  <button
                    type="button"
                    onClick={handleAddPincode}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-text font-bold rounded-xl text-xs cursor-pointer select-none shrink-0"
                  >
                    Add
                  </button>
                </div>
                {pincodeError && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">{pincodeError}</p>
                )}

                {pincodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 max-h-32 overflow-y-auto p-2 bg-slate-50/60 rounded-xl border border-slate-100">
                    {pincodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => handleRemovePincode(code)}
                          className="hover:text-rose-600 cursor-pointer flex items-center"
                          title="Remove pincode"
                        >
                          <span className="material-symbols-outlined text-[13px] leading-none">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-text/75 mb-1.5">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="fstatus"
                      value="Active"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                      className="accent-deep-maroon cursor-pointer"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="fstatus"
                      value="Inactive"
                      checked={status === 'Inactive'}
                      onChange={() => setStatus('Inactive')}
                      className="accent-deep-maroon cursor-pointer"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-text font-bold rounded-xl text-xs cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-deep-maroon hover:bg-primary text-white font-bold rounded-xl text-xs cursor-pointer select-none"
                >
                  {isEditing ? 'Save Changes' : 'Register Franchise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Pincodes Modal */}
      {viewingFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => setViewingFranchise(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>

          <div className="bg-paper-white rounded-2xl shadow-xl border border-surface-variant/40 overflow-hidden w-full max-w-sm relative z-10 animate-fade-in text-left max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-sm tracking-wide uppercase truncate">
                  Assigned Pin Codes
                </h3>
                <p className="text-[10px] text-white/80 truncate">{viewingFranchise.name}</p>
              </div>
              <button
                onClick={() => setViewingFranchise(null)}
                className="text-white/80 hover:text-white cursor-pointer flex items-center shrink-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {viewingFranchise.pincodes.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <span className="material-symbols-outlined text-3xl mb-1 block">location_off</span>
                  <p className="text-xs font-semibold">No pincodes assigned yet.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {viewingFranchise.pincodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px] text-blue-600 leading-none">location_on</span>
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setViewingFranchise(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-text font-bold rounded-xl text-xs cursor-pointer select-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Assigned Users Modal */}
      {viewingUsersFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setViewingUsersFranchise(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>

          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-2xl relative z-10 animate-fade-in text-left max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl">groups</span>
                <div>
                  <h3 className="font-bold text-sm tracking-wide uppercase truncate">
                    Assigned Users / Customers
                  </h3>
                  <p className="text-[11px] text-white/80 truncate">
                    {viewingUsersFranchise.name} ({viewingUsersFranchise.id}) {viewingUsersFranchise.location ? `• ${viewingUsersFranchise.location}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingUsersFranchise(null)}
                className="text-white/80 hover:text-white cursor-pointer flex items-center shrink-0 p-1 rounded-lg hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-base">search</span>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search assigned user by ID, name, phone, or location..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
              {userSearchTerm && (
                <button
                  onClick={() => setUserSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Users Table / List */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingFranchiseUsers ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-deep-maroon border-t-transparent"></div>
                  <p className="text-xs font-semibold">Loading assigned users...</p>
                </div>
              ) : franchiseUsersList.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 block">person_off</span>
                  <p className="text-xs font-bold text-slate-600">No users assigned to this franchise yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Users can be manually allocated from Pincode Allocation or covered by territory pincodes.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {franchiseUsersList
                    .filter(u => {
                      if (!userSearchTerm.trim()) return true;
                      const q = userSearchTerm.toLowerCase().trim();
                      return (
                        (u.userId && u.userId.toLowerCase().includes(q)) ||
                        (u.name && u.name.toLowerCase().includes(q)) ||
                        (u.phone && u.phone.toLowerCase().includes(q)) ||
                        (u.location && u.location.toLowerCase().includes(q)) ||
                        (u.pincode && u.pincode.toLowerCase().includes(q))
                      );
                    })
                    .map((user) => (
                      <div
                        key={user.userId || user.id}
                        className="p-3 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user.image || 'https://www.w3schools.com/howto/img_avatar.png'}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            onError={(e) => { e.target.src = 'https://www.w3schools.com/howto/img_avatar.png'; }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 truncate">{user.name}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                {user.userId}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-slate-400">call</span>
                                {user.phone || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                                {user.location || user.district || 'Kerala'} (PIN: {user.pincode})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            user.assignmentType === 'Direct Assignment'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {user.assignmentType}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Reg: {user.registeredOn}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Total: <span className="font-bold text-slate-800">{franchiseUsersList.length}</span> users
              </span>
              <button
                onClick={() => setViewingUsersFranchise(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-text font-bold rounded-xl text-xs cursor-pointer select-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog (Staff Management Design) */}
      {franchiseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => setFranchiseToDelete(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>
          <div className="bg-paper-white rounded-2xl shadow-xl border border-surface-variant/40 w-full max-w-sm relative z-10 p-6 animate-fade-in text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Remove Franchise</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to remove this franchise? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setFranchiseToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-text font-bold rounded-xl text-xs cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFranchise}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer select-none"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Franchise Report Modal (For Franchise Management Staff) */}
      {!isSuperAdmin && showSubmitReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => !isSubmittingReport && setShowSubmitReportModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl max-h-[92vh] flex flex-col relative z-10 animate-fade-in overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 to-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">rate_review</span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    Submit Franchise Report
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Operational assessment and status report for Super Admin review.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitReportModal(false)}
                disabled={isSubmittingReport}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReport} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Target Franchise Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Franchise <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportFranchiseId}
                  onChange={(e) => setReportFranchiseId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-semibold text-slate-800"
                  required
                >
                  <option value="" disabled>-- Choose a Franchise --</option>
                  {franchiseList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id}) - {f.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid: Report Type & Health Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Report Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-semibold text-slate-800"
                  >
                    <option value="Monthly Performance Review">Monthly Performance Review</option>
                    <option value="Field / Location Audit">Field / Location Audit</option>
                    <option value="Pincode Coverage & Issues">Pincode Coverage & Issues</option>
                    <option value="Revenue & Collections">Revenue & Collections</option>
                    <option value="General Operational Feedback">General Operational Feedback</option>
                    <option value="Escalation / Urgent Issue">Escalation / Urgent Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Operational Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-semibold text-slate-800"
                  >
                    <option value="Normal">Normal / Active</option>
                    <option value="Good">Good / Excellent</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Critical">Critical / Urgent Action</option>
                  </select>
                </div>
              </div>

              {/* Report Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Report Subject / Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reportSubject}
                  onChange={(e) => setReportSubject(e.target.value)}
                  placeholder="e.g. Kozhikode Center Monthly Customer Footfall & Verification Report"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-800"
                  required
                />
              </div>

              {/* Key Metrics / Quick Notes (Optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Key Metrics / Summary Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={reportMetrics}
                  onChange={(e) => setReportMetrics(e.target.value)}
                  placeholder="e.g. Walk-ins: 38 | Pincode Coverage: 100% | Escalations: 0"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-800"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Findings & Detailed Observations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe your operational audit, interactions with the franchise partner, issues noted, or recommendations for super admin review..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-800 resize-none leading-relaxed"
                  required
                ></textarea>
              </div>

              {/* Reporter Attribution Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-base text-slate-400">badge</span>
                  Reporting as: <strong className="text-slate-800">{localStorage.getItem('adminName') || 'Mhd Shahal'}</strong> ({localStorage.getItem('adminRole') || 'FRANCHISE MANAGER'})
                </span>
                <span className="text-[10px] text-slate-400">Time: Just now</span>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSubmitReportModal(false)}
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingReport ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Franchise Reports Viewer Modal (For Super Admin to view, and Staff to track) */}
      {showViewReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => setShowViewReportsModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl max-h-[92vh] flex flex-col relative z-10 animate-fade-in overflow-hidden text-left">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">assignment</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Franchise Operational Reports
                    </h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200">
                      {reportsList.length} Total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isSuperAdmin 
                      ? 'Review reports, audits, and performance summaries submitted by franchise staff.' 
                      : 'Audit records and reports submitted for super admin inspection.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowViewReportsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">search</span>
                <input
                  type="text"
                  value={reportSearchTerm}
                  onChange={(e) => setReportSearchTerm(e.target.value)}
                  placeholder="Search subject, franchise, staff..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-deep-maroon"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={reportFilterFranchise}
                  onChange={(e) => setReportFilterFranchise(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Franchises</option>
                  {franchiseList.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                  ))}
                </select>

                <select
                  value={reportFilterStatus}
                  onChange={(e) => setReportFilterStatus(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Normal">Normal</option>
                  <option value="Good">Good</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="Critical">Critical</option>
                </select>

                <button
                  type="button"
                  onClick={fetchFranchiseReports}
                  className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
                  title="Refresh Reports"
                >
                  <span className={`material-symbols-outlined text-base ${loadingReports ? 'animate-spin' : ''}`}>refresh</span>
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              {loadingReports ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl animate-spin mb-1 block">progress_activity</span>
                  <p className="text-xs font-semibold">Loading franchise reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Franchise Reports Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {reportsList.length === 0 
                      ? (isSuperAdmin 
                          ? 'No reports have been submitted by franchise management staff yet.' 
                          : 'You have not submitted any franchise reports yet. Click "Submit Report" to create one.')
                      : 'No reports match your search or filter criteria.'}
                  </p>
                </div>
              ) : (
                filteredReports.map((rep) => {
                  const isCritical = rep.status === 'Critical';
                  const isAttention = rep.status === 'Needs Attention';
                  const isGood = rep.status === 'Good';

                  return (
                    <div
                      key={rep.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs space-y-2.5 ${
                        isCritical
                          ? 'bg-rose-50/40 border-rose-200'
                          : isAttention
                          ? 'bg-amber-50/40 border-amber-200'
                          : isGood
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Meta Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {rep.franchise_id}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {rep.franchise_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {rep.report_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isAttention
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : isGood
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {rep.status}
                          </span>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteReport(rep.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Report"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subject */}
                      <h4 className="text-sm font-bold text-slate-800">
                        {rep.subject}
                      </h4>

                      {/* Metrics notes if provided */}
                      {rep.metrics_notes && (
                        <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-amber-600">analytics</span>
                          <span>Metrics: {rep.metrics_notes}</span>
                        </div>
                      )}

                      {/* Detailed Description */}
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                        {rep.description}
                      </p>

                      {/* Footer Attribution Line */}
                      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10.5px] text-slate-400">
                        <span>
                          Submitted by <strong className="text-slate-700">{rep.staff_name}</strong>
                          {rep.staff_id && ` (${rep.staff_id})`}
                        </span>
                        <span>{formatReportDate(rep.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {filteredReports.length} of {reportsList.length} reports
              </span>
              <button
                type="button"
                onClick={() => setShowViewReportsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer select-none transition-colors"
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