import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import SuperAdminSidebar from '../../../components/admin/SuperAdminSidebar';
import StaffManagment from './StaffManagment';
import UserManagement from './UserManagement';
import PackagesManagement from './PackagesManagement';
import FranchiseManagement from './Franchise Management';
import HeadFranchise from './Headfranchise';
import PaymentRevenue from './PaymentRevenue';
import SystemSetting from './SystemSetting';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalStaffs: 0,
        monthlyRevenue: '₹0'
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await axiosInstance.get('/admin/dashboard/metrics');
                setMetrics(response.data);
            } catch (error) {
                console.error('Error fetching metrics', error);
            }
        };
        fetchMetrics();
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
                                <div className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">New staff member added: Shanu V. R.</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">By Super Admin &bull; 2 hours ago</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md shrink-0">Staff</span>
                                </div>
                                
                                <div className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">Subscription plan pricing updated: Premium Gold</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">By Super Admin &bull; Yesterday</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md shrink-0">Finance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return <UserManagement />;
            case 'staff':
                return <StaffManagment />;
            case 'packages':
                return <PackagesManagement />;
            case 'franchise':
                return <FranchiseManagement />;
            case 'head-franchise':
                return <HeadFranchise />;
            case 'payments':
                return <PaymentRevenue />;
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
                {/* Top Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Toggle Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="text-xs font-bold text-deep-maroon bg-deep-maroon/5 border border-deep-maroon/10 px-2 py-0.5 rounded-md uppercase tracking-widest hidden sm:inline-block">
                            Super Admin Mode
                        </span>
                    </div>

                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 rounded-full flex items-center gap-1.5 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live Session</span>
                    </div>
                </header>

                {/* Content View Container */}
                <main className="p-6 sm:p-8 flex-1 text-left w-full min-w-0 max-w-full overflow-x-hidden">
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
}