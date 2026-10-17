import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import AdminSidebar from '../../../components/admin/AdminSidebar';
import UserManagement from './UserManagement';
import PackagesManagement from './PackagesManagement';
import PaymentRevenue from './PaymentRevenue';
import ReportManagement from './ReportManagement';
import ContactMessages from './ContactMessages';
import FranchiseManagement from '../superAdmin/Franchise Management';
import FranchisePartnershipRequests from '../superAdmin/FranchisePartnershipRequests';
import HeadFranchise from '../superAdmin/Headfranchise';
import CasteManagement from '../superAdmin/CasteManagement';
import SystemSetting from '../superAdmin/SystemSetting';
import MarriageRequestsManagement from '../superAdmin/MarriageRequestsManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState('');
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    bannedUsers: 0,
    freezedUsers: 0,
    reportedUsers: 0,
    totalStaffs: 0,
    monthlyRevenue: '₹0',
    recentLogs: []
  });

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

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const userRole = localStorage.getItem('adminRole');
    
    if (!isLoggedIn || !userRole || userRole === 'superadmin') {
      // Redirect standard admin back to login if not logged in
      navigate('/admin/login');
      return;
    }
    setRole(userRole);

    const fetchMetrics = async () => {
      try {
        const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true' || window.location.pathname.includes('/super-admin');
        const adminFranchise = !isSuperAdmin ? localStorage.getItem('adminFranchise') : null;
        let url = '/admin/dashboard/metrics';
        if (adminFranchise && adminFranchise !== 'HEAD_OFFICE' && adminFranchise !== 'null' && adminFranchise !== 'undefined' && adminFranchise !== 'All' && adminFranchise !== 'ALL') {
          url += `?franchise_id=${adminFranchise}`;
        }
        const response = await axiosInstance.get(url);
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching metrics', error);
      }
    };

    fetchMetrics();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminAccessToken');
    navigate('/admin/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': {
        const roleUpper = (role || '').toUpperCase();
        const staffName = localStorage.getItem('adminName') || 'Staff Admin';
        const isFinanceOnly = roleUpper.includes('FINANCE') && !roleUpper.includes('FULL') && !roleUpper.includes('SUPER') && !roleUpper.includes('USER');

        if (!isFinanceOnly) {
          return (
            <div className="space-y-6 min-w-0 w-full">
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome, {staffName}!</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Matrimonial profiles database controls and account verifications.
                </p>
              </div>

              {/* User Team Stats */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 min-w-0 w-full">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
                    <span className="material-symbols-outlined text-lg">group</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 mt-3">{(metrics.totalUsers ?? 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Users</span>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-3">{(metrics.activeUsers ?? 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Blocked Users</span>
                    <span className="material-symbols-outlined text-lg">block</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 mt-3">{(metrics.blockedUsers ?? 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Banned Users</span>
                    <span className="material-symbols-outlined text-lg">cancel</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-rose-600 mt-3">{(metrics.bannedUsers ?? 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Inactive Users</span>
                    <span className="material-symbols-outlined text-lg">ac_unit</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-sky-600 mt-3">{(metrics.freezedUsers ?? 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reported Profiles</span>
                    <span className="material-symbols-outlined text-lg">report_problem</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-orange-600 mt-3">{(metrics.reportedUsers ?? 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs text-left min-w-0 mt-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
                  Recent Admin Log
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {metrics?.recentLogs && metrics.recentLogs.length > 0 ? (
                    metrics.recentLogs.map((log, index) => (
                      <div key={index} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{log.message}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">System &bull; {formatTimeAgo(log.date)}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                          log.type === 'Finance' ? 'bg-amber-50 text-amber-700' :
                          log.type === 'Staff' ? 'bg-slate-100 text-slate-600' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400">No recent activity</div>
                  )}
                </div>
              </div>

            </div>
          );
        } else {
          return (
            <div className="space-y-6 min-w-0 w-full">
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome, {staffName}!</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Configure subscription tiers, inspect payment logs, and check transactions.
                </p>
              </div>

              {/* Finance Team Stats */}
              <div className="grid gap-4 sm:grid-cols-2 min-w-0 w-full">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Paid Subscribers</span>
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-3">{metrics.activeSubscribers?.toLocaleString() || 0} Members</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 mt-3">{metrics.monthlyRevenue || '₹0'}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs text-left min-w-0 mt-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
                  Recent Admin Log
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {metrics?.recentLogs && metrics.recentLogs.length > 0 ? (
                    metrics.recentLogs.map((log, index) => (
                      <div key={index} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{log.message}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">System &bull; {formatTimeAgo(log.date)}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                          log.type === 'Finance' ? 'bg-amber-50 text-amber-700' :
                          log.type === 'Staff' ? 'bg-slate-100 text-slate-600' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400">No recent activity</div>
                  )}
                </div>
              </div>


            </div>
          );
        }
      }
      case 'users':
        return <UserManagement />;
      case 'marriage-requests':
        return <MarriageRequestsManagement />;
      case 'reports':
        return <ReportManagement />;
      case 'contacts':
        return <ContactMessages />;
      case 'packages':
        return <PackagesManagement />;
      case 'payments':
        return <PaymentRevenue />;
      case 'franchise':
        return <FranchiseManagement />;
      case 'franchise-requests':
        return <FranchisePartnershipRequests />;
      case 'head-franchise':
        return <HeadFranchise />;
      case 'castes':
        return <CasteManagement />;
      case 'settings':
        return <SystemSetting />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex w-full overflow-x-hidden">
      {/* Sidebar Component */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        role={role}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Mobile Menu Toggle (Only on small screens) */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center sticky top-0 z-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer transition-colors flex items-center"
            title="Open Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

        {/* Content View Container */}
        <main className="p-6 sm:p-8 flex-1 text-left w-full min-w-0 max-w-full overflow-x-hidden">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
