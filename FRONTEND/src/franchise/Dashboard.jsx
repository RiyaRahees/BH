import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useToast } from '../context/ToastContext';
import AddUserModal from '../../components/admin/AddUserModal';
import PhotoViewerModal from '../../components/admin/PhotoViewerModal';
import { downloadProfilePDF } from '../utils/profilePdfGenerator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FranchiseAdsManager from './FranchiseAdsManager';

export default function FranchiseDashboard() {
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [franchiseData, setFranchiseData] = useState(null);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    bannedUsers: 0,
    inactiveUsers: 0,
    reportedUsers: 0,
    monthlyRevenue: '₹0',
    rawRevenue: 0,
    recentLogs: []
  });

  // Customer Management state
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerGender, setCustomerGender] = useState('All');
  const [customerStatus, setCustomerStatus] = useState('All');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [demographics, setDemographics] = useState({ hindu: 0, muslim: 0, christian: 0, other: 0 });

  // Drawer and Moderation states
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerVerified, setDrawerVerified] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
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

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsPlan, setPaymentsPlan] = useState('All');
  const [paymentsReligion, setPaymentsReligion] = useState('All');
  const [paymentsStartDate, setPaymentsStartDate] = useState('');
  const [paymentsEndDate, setPaymentsEndDate] = useState('');
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsTotalRevenue, setPaymentsTotalRevenue] = useState('₹0');

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

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setDrawerVerified(user.verified);
    setDrawerStatus('');
  };

  const handleSaveDrawerChanges = async () => {
    try {
      const statusToSave = drawerStatus || (selectedUser.reported ? 'Reported' : selectedUser.status);
      await axiosInstance.put(`/franchise/customers/${selectedUser.id}`, {
        verification: drawerVerified,
        status: statusToSave
      });
      setCustomers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, verified: drawerVerified, status: statusToSave } : u));
      setSelectedUser(null);
      toast.success('Changes saved successfully');
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
      setCustomers(prev => prev.map(u => u.id === id ? { ...u, verified: newVerifiedStatus } : u));
      await axiosInstance.put(`/franchise/customers/${id}`, {
        verification: newVerifiedStatus
      });
      toast.success(newVerifiedStatus ? 'Profile verified' : 'Profile unverified');
    } catch (err) {
      console.error('Failed to toggle verification:', err);
      setCustomers(prev => prev.map(u => u.id === id ? { ...u, verified: currentVerified } : u));
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
          await axiosInstance.post(`/franchise/customers/force-logout/${id}`);
          setCustomers(prev => prev.map(u => u.id === id ? { ...u, online: false, hasActiveSession: false } : u));
          if (selectedUser && selectedUser.id === id) {
            setSelectedUser({ ...selectedUser, online: false, hasActiveSession: false });
          }
          toast.success('User logged out.');
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

  const handleApprovePhoto = async (profileId, slot = 'all') => {
    setPhotoActionLoading(`approve-${slot}`);
    try {
      await axiosInstance.post(`/franchise/customers/${profileId}/photos/approve`, { slot });
      toast.success('Photo(s) approved and published successfully.');
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
      toast.error(err.response?.data?.error || 'Failed to approve photo');
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
      await axiosInstance.post(`/franchise/customers/${profileId}/photos/reject`, { slot, reason });
      toast.success('Photo rejected successfully.');
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
      toast.error(err.response?.data?.error || 'Failed to reject photo');
    } finally {
      setPhotoActionLoading(null);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/franchise/dashboard');
      setFranchiseData(response.data.franchise);
      setMetrics(response.data.metrics || {});
    } catch (error) {
      console.error('Error fetching franchise dashboard metrics:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        toast.error('Failed to load franchise dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async (isPolling = false) => {
    try {
      if (!isPolling) setCustomerLoading(true);
      const params = new URLSearchParams({
        page: customerPage,
        limit: 10,
        search: customerSearch,
        gender: customerGender,
        status: customerStatus
      });
      const response = await axiosInstance.get(`/franchise/customers?${params.toString()}`);
      
      const rawCustomers = response.data.customers || [];
      const mappedUsers = rawCustomers.map(user => {
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
          id: user.profile_id || `BM${user.id}`,
          profile_id: user.profile_id || `BM${user.id}`,
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
          hasActiveSession: !!user.has_active_session,
          reported: Boolean(user.has_reports || (user.reports && user.reports.length > 0) || (user.status && user.status.toUpperCase() === 'REPORTED')),
          reportReason: user.reports && user.reports.length > 0 
            ? (user.reports[0].reason + (user.reports[0].details ? ` - ${user.reports[0].details}` : ''))
            : (user.status === 'Reported' ? "User reported by community" : "Active Community Report"),
          reports: user.reports || [],
          bio: "Registered profile in assigned territory."
        };
      });

      setCustomers(mappedUsers);
      setCustomerTotal(response.data.total || 0);
      setCustomerTotalPages(response.data.totalPages || 1);
      setDemographics(response.data.demographics || { hindu: 0, muslim: 0, christian: 0, other: 0 });
    } catch (error) {
      console.error('Error fetching territory customers:', error);
      if (!isPolling) toast.error('Failed to load territory customer profiles.');
    } finally {
      if (!isPolling) setCustomerLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const params = new URLSearchParams({
        page: paymentsPage,
        limit: 10,
        search: paymentsSearch,
        plan: paymentsPlan,
        religion: paymentsReligion,
        startDate: paymentsStartDate,
        endDate: paymentsEndDate
      });
      // Clean up empty params
      for (const [key, value] of Array.from(params.entries())) {
        if (!value || value === 'All' || value === 'All Plans' || value === 'All Religions') {
          params.delete(key);
        }
      }
      const response = await axiosInstance.get(`/franchise/payments?${params.toString()}`);
      setPayments(response.data.payments || []);
      setPaymentsTotal(response.data.total || 0);
      setPaymentsTotalPages(response.data.totalPages || 1);
      setPaymentsTotalRevenue(response.data.totalRevenue || '₹0');
    } catch (error) {
      console.error('Error fetching territory payments:', error);
      toast.error('Failed to load territory payments.');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isFranchiseLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/franchise/login');
      return;
    }
    fetchDashboardMetrics();
  }, [navigate]);

  useEffect(() => {
    fetchCustomers();
  }, [customerPage, customerGender, customerStatus]);

  // Re-fetch payments whenever these filter dependencies change
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [paymentsPage, paymentsPlan, paymentsReligion, paymentsStartDate, paymentsEndDate]);

  // Tab change effect
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab]);

  const handleDownloadReport = () => {
    if (payments.length === 0) {
      toast.error("No data available to download.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text("Territory Payments & Revenue Report", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      doc.setFontSize(10);
      doc.text(`Total Revenue: ${paymentsTotalRevenue}`, 14, 38);
      doc.text(`Total Transactions: ${paymentsTotal}`, 14, 44);

      const tableColumn = ["Txn ID", "Member", "Plan", "Amount (INR)", "Date", "Status"];
      const tableRows = [];

      payments.forEach(txn => {
        const rowData = [
          `TXN-${txn.id}`,
          `${txn.full_name || 'Customer'}\n(${txn.profile_id})`,
          txn.new_plan || 'N/A',
          `Rs. ${txn.payable_amount || '0'}`,
          txn.created_at ? new Date(txn.created_at).toISOString().slice(0, 10) : 'N/A',
          'SUCCESS'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [136, 19, 55], textColor: 255 },
      });

      doc.save(`franchise_revenue_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate report PDF.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isFranchiseLoggedIn');
    localStorage.removeItem('franchiseToken');
    localStorage.removeItem('franchiseData');
    toast.success('Logged out successfully');
    navigate('/franchise/login');
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diffInMs = new Date() - new Date(dateString);
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours < 24) {
      return diffInHours <= 0 ? 'Just now' : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return diffInDays === 1 ? 'Yesterday' : `${diffInDays} days ago`;
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'customers', label: 'Customer Management', icon: 'group' },
    { id: 'payments', label: 'Payments & Revenue', icon: 'payments' },
    { id: 'pincodes', label: 'Assigned Pin Codes', icon: 'mark_as_unread' },
    { id: 'ads', label: 'Ads Manager', icon: 'campaign' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 text-left font-sans">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container (Exact Super Admin Desk Structure) */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-60 sm:w-64 flex flex-col justify-between z-40 transform lg:transform-none transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto flex-1 scrollbar-hidden">
          {/* Top Branding Section */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-deep-maroon text-xl sm:text-2xl font-bold">
                admin_panel_settings
              </span>
              <span className="font-display-lg font-bold text-xs sm:text-sm tracking-wide text-slate-800 uppercase">
                CONTROL DESK
              </span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Profile Mini Card */}
          <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-deep-maroon/5 flex items-center justify-center border-2 border-deep-maroon/10 shrink-0">
              <span className="material-symbols-outlined text-deep-maroon text-lg sm:text-xl">
                supervisor_account
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate" title={franchiseData?.owner}>
                {franchiseData?.owner || 'Franchise Partner'}
              </p>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                <span className="inline-block px-1.5 py-0.5 rounded-full bg-heritage-gold/15 text-heritage-gold text-[7px] sm:text-[8px] font-bold tracking-wider uppercase border border-heritage-gold/10 font-mono">
                  {franchiseData?.franchise_id || 'Territory Desk'}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Approved & Active
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 sm:p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer text-left select-none ${
                    isActive
                      ? 'bg-deep-maroon text-white shadow-sm border border-deep-maroon/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-deep-maroon border border-transparent'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base sm:text-lg leading-none ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/40 rounded-lg text-[10px] sm:text-[11px] font-bold text-rose-700 transition-all cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-xs sm:text-sm">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60 sm:lg:pl-64">
        {/* Top Header Bar */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800 cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-deep-maroon rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
              Franchise Desk &bull; {franchiseData?.location || 'Assigned Territory'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
              <span className="material-symbols-outlined text-xs text-deep-maroon">location_on</span>
              <span>{franchiseData?.pin_codes?.length || 0} Pincode(s) Assigned</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Approved & Active
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-spin mb-3 block text-deep-maroon">
                sync
              </span>
              <p className="text-sm font-semibold">Loading Franchise Portal...</p>
            </div>
          ) : activeTab === 'dashboard' ? (
            /* ================= DASHBOARD TAB (EXACT SUPER ADMIN DESK STYLE) ================= */
            <div className="space-y-6 min-w-0 w-full">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Welcome, {franchiseData?.owner || 'Franchise Partner'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Territory operations and matchmaking overview for <strong>{franchiseData?.name}</strong> ({franchiseData?.location || 'Assigned Area'}).
                </p>
              </div>

              {/* Exact 5 Metrics Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 min-w-0 w-full">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Users</span>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-3">
                    {metrics.activeUsers.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Blocked Users</span>
                    <span className="material-symbols-outlined text-lg">block</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 mt-3">
                    {metrics.blockedUsers.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Banned Users</span>
                    <span className="material-symbols-outlined text-lg">cancel</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-rose-600 mt-3">
                    {metrics.bannedUsers.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Inactive Users</span>
                    <span className="material-symbols-outlined text-lg">ac_unit</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-blue-600 mt-3">
                    {metrics.inactiveUsers.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Territory Revenue</span>
                    <span className="material-symbols-outlined text-lg text-emerald-600">payments</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-deep-maroon mt-3">
                    {metrics.monthlyRevenue}
                  </p>
                </div>
              </div>

              {/* Recent Activity Log in Territory */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-xs text-left">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Recent Territory Activity</span>
                  <span className="text-[10px] font-semibold text-slate-400">Assigned Pincodes Only</span>
                </h2>

                {metrics.recentLogs && metrics.recentLogs.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {metrics.recentLogs.map((log, index) => (
                      <div key={index} className="py-3 flex items-center justify-between text-xs gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{log.message}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatTimeAgo(log.date)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.type || 'Activity'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No recent activity recorded in your territory yet.
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'customers' ? (
            /* ================= CUSTOMER MANAGEMENT TAB (Exact Super Admin User Management Parity) ================= */
            <div className="space-y-6 text-left w-full">
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

                <div className="flex flex-wrap items-center gap-3">
                  {/* Demographics count pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                      Total: {customerTotal}
                    </span>
                    <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                      Hindu: {demographics.hindu}
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Muslim: {demographics.muslim}
                    </span>
                    <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                      Christian: {demographics.christian}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-white/10 select-none shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add New User
                  </button>
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
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    }}
                    className="w-full border border-slate-200 rounded-xl py-1.5 pl-10 pr-4 text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-slate-400"
                    placeholder="Search by Name, ID, location, or job..."
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[120px] justify-between sm:justify-start">
                    <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">GENDER:</span>
                    <select
                      value={customerGender}
                      onChange={(e) => {
                        setCustomerGender(e.target.value);
                        setCustomerPage(1);
                      }}
                      className="border border-slate-200 rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none flex-1 sm:flex-initial cursor-pointer"
                    >
                      <option value="All">All Genders</option>
                      <option value="Bride">Brides (Female)</option>
                      <option value="Groom">Grooms (Male)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 min-w-[120px] justify-between sm:justify-start">
                    <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">STATUS:</span>
                    <select
                      value={customerStatus}
                      onChange={(e) => {
                        setCustomerStatus(e.target.value);
                        setCustomerPage(1);
                      }}
                      className="border border-slate-200 rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none flex-1 sm:flex-initial cursor-pointer"
                    >
                      <option value="All">All Profiles</option>
                      <option value="Pending Photo Review">Under Review (Photos)</option>
                      <option value="Reported Accounts">Reported Accounts</option>
                      <option value="Active">Active</option>
                      <option value="Deactivated">Deactivated</option>
                      <option value="Banned">Banned</option>
                      <option value="Freezed">Freezed</option>
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
                        <th className="py-3.5 px-4 font-semibold text-[10px]">USER ID</th>
                        <th className="py-3.5 px-4 font-semibold text-[10px]">PROFILE</th>
                        <th className="py-3.5 px-4 font-semibold text-[10px]">DETAILS</th>
                        <th className="py-3.5 px-4 font-semibold text-[10px]">VERIFICATION</th>
                        <th className="py-3.5 px-4 font-semibold text-[10px]">PLAN</th>
                        <th className="py-3.5 px-4 font-semibold text-[10px]">STATUS</th>
                        <th className="py-3.5 px-4 font-semibold text-[10px]">ONLINE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customerLoading && customers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                            <span className="material-symbols-outlined animate-spin text-3xl mb-1 block">autorenew</span>
                            Loading users...
                          </td>
                        </tr>
                      ) : customers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                            <span className="material-symbols-outlined text-3xl mb-1 block">people_outline</span>
                            No matching users found in your territory.
                          </td>
                        </tr>
                      ) : (
                        customers.map((user) => (
                          <tr 
                            key={user.id} 
                            onClick={() => handleOpenDetails(user)}
                            className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${user.reported ? 'bg-amber-50/15' : ''}`}
                            title="Click to view details"
                          >
                            <td className="py-3 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{user.id}</span>
                                {user.hasPendingPhotos && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-amber-500 text-white animate-pulse" title="Uploaded photo awaiting review">
                                    PHOTO REVIEW
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
                                {user.verified ? 'VERIFIED' : '... UNVERIFIED'}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                                user.premium
                                  ? 'bg-amber-50 border-amber-100 text-amber-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}>
                                {user.planName && user.planName !== 'FREE' ? user.planName.toUpperCase() : (user.premium ? 'PREMIUM' : 'FREE SILVER')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {(() => {
                                const badge = getStatusBadge(user.status);
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${badge.color}`}>
                                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                                    {badge.label.toUpperCase()}
                                  </span>
                                );
                              })()}
                              {user.reported && (
                                <span 
                                  className="ml-1.5 inline-flex items-center text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-sm"
                                  title={`Reported: ${user.reportReason}`}
                                >
                                  ⚠️ Reported
                                </span>
                              )}
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
                    Showing <span className="font-bold">{customers.length > 0 ? (customerPage - 1) * 10 + 1 : 0}</span> to <span className="font-bold">{Math.min(customerPage * 10, customerTotal)}</span> of <span className="font-bold">{customerTotal}</span> territory users
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                      disabled={customerPage === 1}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-deep-maroon hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-deep-maroon px-2">Page {customerPage} of {customerTotalPages || 1}</span>
                    <button
                      onClick={() => setCustomerPage(p => Math.min(customerTotalPages, p + 1))}
                      disabled={customerPage === customerTotalPages || customerTotalPages === 0}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-deep-maroon hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'payments' ? (
            /* ================= PAYMENTS & REVENUE TAB ================= */
            <div className="space-y-6 text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-deep-maroon">payments</span>
                    Territory Payments & Revenue
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Subscription upgrades and payment transactions generated from your assigned pincodes.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
                  <span className="material-symbols-outlined text-base">savings</span>
                  <span>Total Territory Revenue: {paymentsTotalRevenue}</span>
                </div>
              </div>

              {/* Filters exact UI as Super Admin */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-4 text-xs font-semibold text-slate-700 w-full max-w-full">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 w-full">
                  <div className="relative w-full sm:max-w-[280px]">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-lg leading-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={paymentsSearch}
                      onChange={(e) => {
                        setPaymentsSearch(e.target.value);
                        setPaymentsPage(1);
                      }}
                      className="w-full border border-slate-200 rounded-xl py-1.5 pl-10 pr-4 text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-slate-400"
                      placeholder="Search by Txn, member, plan..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-fit">
                    <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">Plan:</span>
                    <select
                      value={paymentsPlan}
                      onChange={(e) => {
                        setPaymentsPlan(e.target.value);
                        setPaymentsPage(1);
                      }}
                      className="border border-slate-200 rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none w-full sm:w-[120px] text-[11px]"
                    >
                      <option value="All">All Plans</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Diamond">Diamond</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-fit">
                    <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">Religion:</span>
                    <select
                      value={paymentsReligion}
                      onChange={(e) => {
                        setPaymentsReligion(e.target.value);
                        setPaymentsPage(1);
                      }}
                      className="border border-slate-200 rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none w-full sm:w-[120px] text-[11px]"
                    >
                      <option value="All">All Religions</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Christian">Christian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-fit">
                    <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
                      <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">From:</span>
                      <input
                        type="date"
                        value={paymentsStartDate}
                        onChange={(e) => {
                          setPaymentsStartDate(e.target.value);
                          setPaymentsPage(1);
                        }}
                        className="border border-slate-200 rounded-lg py-1 px-1.5 w-full sm:w-[110px] min-w-0 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none text-[11px]"
                      />
                    </div>

                    <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
                      <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">To:</span>
                      <input
                        type="date"
                        value={paymentsEndDate}
                        onChange={(e) => {
                          setPaymentsEndDate(e.target.value);
                          setPaymentsPage(1);
                        }}
                        className="border border-slate-200 rounded-lg py-1 px-1.5 w-full sm:w-[110px] min-w-0 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none text-[11px]"
                      />
                    </div>

                    {(paymentsStartDate || paymentsEndDate) && (
                      <button
                        onClick={() => {
                          setPaymentsStartDate('');
                          setPaymentsEndDate('');
                          setPaymentsPage(1);
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer shrink-0"
                        type="button"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="w-full sm:w-fit px-4 py-1.5 bg-deep-maroon hover:bg-primary text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm text-xs shrink-0 self-stretch sm:self-end"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  Download Report
                </button>
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                {paymentsLoading ? (
                  <div className="py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl animate-spin mb-2 block">sync</span>
                    Loading territory payments...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">receipt_long</span>
                    No payment transactions recorded in your territory.
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
                    <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Txn ID</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Member</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Plan Name</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Amount</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Method</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Date</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Reference ID</th>
                          <th className="py-3.5 px-4 font-semibold text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {payments.map((txn) => (
                          <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800">TXN-{txn.id}</td>
                            <td className="py-3.5 px-4">
                              <div>
                                <p className="font-bold text-slate-800">{txn.full_name || 'Customer'}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{txn.profile_id}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">{txn.new_plan || 'DIAMOND'}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">₹{txn.payable_amount || '0'}</td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700">
                                RAZORPAY
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {txn.created_at ? new Date(txn.created_at).toISOString().slice(0,10) : 'Invalid Date'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-[10px] text-slate-450 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {txn.payment_id || txn.order_id || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border bg-emerald-50 border-emerald-100 text-emerald-700">
                                SUCCESS
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Payments Pagination */}
                {paymentsTotalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
                    <span className="text-slate-500">
                      Page <strong>{paymentsPage}</strong> of <strong>{paymentsTotalPages}</strong>
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        disabled={paymentsPage <= 1}
                        onClick={() => setPaymentsPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        disabled={paymentsPage >= paymentsTotalPages}
                        onClick={() => setPaymentsPage(prev => Math.min(paymentsTotalPages, prev + 1))}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ads' ? (
            <FranchiseAdsManager franchiseData={franchiseData} />
          ) : (
            /* ================= ASSIGNED PIN CODES TAB ================= */
            <div className="space-y-6 text-left w-full max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-deep-maroon">mark_as_unread</span>
                  Assigned Territory Pin Codes
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  List of postal pincodes assigned to your franchise license for exclusive user and matrimonial management.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Franchise Reference</span>
                    <span className="font-mono text-base font-black text-deep-maroon">{franchiseData?.franchise_id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Territory / District</span>
                    <span className="font-bold text-slate-800 text-sm">{franchiseData?.location || 'Kerala'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Active Assigned Pincodes ({franchiseData?.pin_codes?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {franchiseData?.pin_codes && franchiseData.pin_codes.length > 0 ? (
                      franchiseData.pin_codes.map((pc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-900 font-mono text-sm font-bold shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-blue-600 text-base">pin_drop</span>
                          <span>{pc}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No specific pincodes assigned yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-deep-maroon text-sm">info</span>
                    Territory Exclusivity Policy
                  </p>
                  All profiles registered with the above postal pincodes automatically link to your franchise dashboard for tracking, verification, and payment reporting.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide-out Drawer Panel (Super Admin Feature Parity) */}
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
                  const currentStatus = drawerStatus || (selectedUser.reported ? 'Reported' : selectedUser.status);
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
                        ? 'bg-amber-500/15 border-amber-500/20 text-amber-700'
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
                  </div>
                </div>
              </div>

              {selectedUser.reported && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2">
                  <span className="material-symbols-outlined text-lg shrink-0">warning</span>
                  <div>
                    <p className="font-bold">Reported Account</p>
                    <p className="text-[11px] text-amber-700/90 mt-0.5">{selectedUser.reportReason}</p>
                  </div>
                </div>
              )}

              {/* Photo Verification & Moderation */}
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

              {/* Personal Details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal & Horoscope</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Religion</span>
                    <span className="font-bold text-slate-700">{selectedUser.religion}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Caste</span>
                    <span className="font-bold text-slate-700">{selectedUser.caste}</span>
                  </div>
                  {selectedUser.star && (
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Star (Nakshatra)</span>
                      <span className="font-bold text-slate-700">{selectedUser.star}</span>
                    </div>
                  )}
                  {selectedUser.rasi && (
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 block mb-0.5 uppercase tracking-wide">Rasi</span>
                      <span className="font-bold text-slate-700">{selectedUser.rasi}</span>
                    </div>
                  )}
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

              {/* Address Details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Territory & Address</h4>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <p className="font-medium text-slate-700">{selectedUser.address}</p>
                  {selectedUser.pincode && (
                    <p className="text-[11px] text-blue-700 font-mono font-bold">Postal Pincode: {selectedUser.pincode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-2.5 justify-end items-center">
              <button
                onClick={async () => {
                  try {
                    setDownloadingPDF(true);
                    toast.success('Generating profile PDF...');
                    await downloadProfilePDF(selectedUser);
                    toast.success('Profile PDF downloaded successfully!');
                  } catch (err) {
                    console.error('PDF error:', err);
                    toast.error('Failed to generate PDF.');
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
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={alertModal.onConfirm}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-600 transition-colors shadow-rose-500/20 cursor-pointer"
                  >
                    Confirm Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                  className="px-8 py-2 bg-deep-maroon text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary transition-colors shadow-deep-maroon/20 cursor-pointer"
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
          toast.success(msg);
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
    </div>
  );
}
