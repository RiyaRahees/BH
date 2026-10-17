import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import SuperAdminSidebar from '../../../components/admin/SuperAdminSidebar';
import StaffManagment from './StaffManagment';
import UserManagement from './UserManagement';
import ReportManagement from '../admin/ReportManagement';
import PackagesManagement from './PackagesManagement';
import FranchiseManagement from './Franchise Management';
import HeadFranchise from './Headfranchise';
import PaymentRevenue from './PaymentRevenue';
import SystemSetting from './SystemSetting';
import CasteManagement from './CasteManagement';
import ContactMessages from '../admin/ContactMessages';
import FranchisePartnershipRequests from './FranchisePartnershipRequests';
import MarriageRequestsManagement from './MarriageRequestsManagement';
import AdsManagement from './AdsManagement';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
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
        const fetchMetrics = async () => {
            try {
                const response = await axiosInstance.get('/admin/dashboard/metrics');
                setMetrics(response.data);
            } catch (error) {
                console.error('Error fetching metrics', error);
            }
        };
        
        fetchMetrics(); // Initial fetch
        const interval = setInterval(fetchMetrics, 30000); // Auto-refresh every 30 seconds
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Simple authentication check
        const role = localStorage.getItem('adminRole');
        const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

        if (!loggedIn || role !== 'superadmin') {
            navigate('/super-admin/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminRole');
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminAccessToken');
        navigate('/super-admin/login');
    };

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6 min-w-0">
                        <div className="mb-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome, Super Admin!</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                You have full system privileges to oversee matchmaking services.
                            </p>
                        </div>

                        {/* Quick Metrics — always 3-across, even on mobile.
                            Label sits alone on its own full-width line so it
                            always has room to wrap; icon moved down next to
                            the number instead of competing with the label. */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 min-w-0">
                            <div className="bg-white p-2.5 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                                    Total Users
                                </span>
                                <div className="flex items-center justify-between gap-1 mt-2 sm:mt-3">
                                    <p className="text-sm sm:text-2xl font-black text-slate-800">{metrics?.totalUsers?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            <div className="bg-white p-2.5 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                                    Staff Members
                                </span>
                                <div className="flex items-center justify-between gap-1 mt-2 sm:mt-3">
                                    <p className="text-sm sm:text-2xl font-black text-slate-800">{metrics?.totalStaffs || 0}</p>
                                </div>
                            </div>

                            <div className="bg-white p-2.5 sm:p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col min-w-0">
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-400 break-words">
                                    Monthly Revenue
                                </span>
                                <div className="flex items-center justify-between gap-1 mt-2 sm:mt-3">
                                    <p className="text-sm sm:text-2xl font-black text-emerald-600">{metrics?.monthlyRevenue || '₹0'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Simulated Recent Activity */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs text-left min-w-0">
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
            case 'users':
                return <UserManagement />;
            case 'marriage-requests':
                return <MarriageRequestsManagement />;
            case 'reports':
                return <ReportManagement />;
            case 'contacts':
                return <ContactMessages />;
            case 'staff':
                return <StaffManagment />;
            case 'packages':
                return <PackagesManagement />;
            case 'franchise':
                return <FranchiseManagement />;
            case 'franchise-requests':
                return <FranchisePartnershipRequests />;
            case 'ads':
                return <AdsManagement />;
            case 'head-franchise':
                return <HeadFranchise />;
            case 'payments':
                return <PaymentRevenue />;
            case 'settings':
                return <SystemSetting />;
            case 'castes':
                return <CasteManagement />;
            case 'content':
                return (
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs min-w-0">
                        <h2 className="text-lg font-bold text-slate-800">Website Content</h2>
                        <p className="text-xs text-slate-500 mt-1">Modify home pages, FAQ logs, testimonials, and contact terms.</p>
                        <div className="mt-8 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">web</span>
                            <p className="text-sm font-semibold">Static copy layouts and content managers will load here.</p>
                        </div>
                    </div>
                );
            case 'settings':
                return <SystemSetting />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex w-full overflow-x-hidden">
            {/* Sidebar Component */}
            <SuperAdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* Main Workspace Frame */}
            {/* min-w-0 is essential here: flex items default to min-width:auto,
          which lets them grow past the viewport to fit wide content (like
          the transactions table) instead of shrinking to fit the screen.
          Without it, overflow-x-hidden below has nothing to clip against
          because this box itself has already become too wide. */}
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