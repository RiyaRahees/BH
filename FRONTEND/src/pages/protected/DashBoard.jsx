import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MyHomeView from '../../../components/dashboard/MyHomeView';
import MyProfileView from '../../../components/dashboard/MyProfileView';
import PartnerPreferencesView from '../../../components/dashboard/PartnerPreferencesView';
import ManagePhotosView from '../../../components/dashboard/ManagePhotosView';
import InboxView from '../../../components/dashboard/InboxView';
import ShortlistsView from '../../../components/dashboard/ShortlistsView';
import InterestsView from '../../../components/dashboard/InterestsView';
import SettingsView from '../../../components/dashboard/SettingsView';
import MyPlanView from '../../../components/dashboard/MyPlanView';
import ReportsAppealsView from '../../../components/dashboard/ReportsAppealsView';
import MarriageConfirmationBanner from '../../../components/dashboard/MarriageConfirmationBanner';
import MarriageRequestsView from '../../../components/dashboard/MarriageRequestsView';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { getResolvedImageUrl, handleImageError } from '../../utils/imageUtils';

const menuItems = [
  { icon: 'dashboard', label: 'My Home' },
  { icon: 'account_circle', label: 'My Profile' },
  { icon: 'photo_library', label: 'Manage Photos' },
  { icon: 'diversity_1', label: 'Partner Preferences' },
  { icon: 'chat', label: 'Inbox Messages' },
  { icon: 'volunteer_activism', label: 'Express Interests' },
  { icon: 'favorite', label: 'Marriage Requests' },
  { icon: 'stars', label: 'Favourite' },
  { icon: 'card_membership', label: 'My Plan' },
  { icon: 'gavel', label: 'Reports & Appeals' },
  { icon: 'settings', label: 'Account Settings' },
];

const formatRegisteredDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatMemberSince = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

export default function Dashboard() {
  const { user } = useAuth();
  console.log("Current User Object in Dashboard:", user);
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getTabFromParam = (param) => {
    switch (param) {
      case 'profile':
        return 'My Profile';
      case 'preferences':
        return 'Partner Preferences';
      case 'photos':
        return 'Manage Photos';
      case 'inbox':
        return 'Inbox Messages';
      case 'interests':
      case 'express-interests':
        return 'Express Interests';
      case 'marriage':
      case 'marriage-requests':
      case 'partner-requests':
        return 'Marriage Requests';
      case 'shortlists':
      case 'favourite':
        return 'Favourite';
      case 'plan':
        return 'My Plan';
      case 'reports':
      case 'appeals':
      case 'reports-appeals':
        return 'Reports & Appeals';
      case 'settings':
        return 'Account Settings';
      default:
        return 'My Home';
    }
  };

  const [activeItem, setActiveItem] = useState(() => getTabFromParam(tabParam));
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingInterestsCount, setPendingInterestsCount] = useState(0);
  const [activeReportsCount, setActiveReportsCount] = useState(0);
  const [pendingMarriageCount, setPendingMarriageCount] = useState(0);

  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const fetchNotificationCounts = async () => {
    try {
      // 1. Unread chat conversations
      const chatRes = await axiosInstance.get('/users/chats/conversations');
      const dbChats = chatRes.data.conversations || [];
      const totalUnread = dbChats.reduce((sum, c) => sum + Number(c.unread || 0), 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      // quiet catch
    }

    try {
      // 2. Pending received interests
      const intRes = await axiosInstance.get('/users/interests?type=received');
      const receivedList = intRes.data.interests || [];
      const pendingInt = receivedList.filter(i => (i.status || '').toLowerCase() === 'pending').length;
      setPendingInterestsCount(pendingInt);
    } catch (err) {
      // quiet catch
    }

    try {
      // 3. Active community reports against current user
      const repRes = await axiosInstance.get('/users/my-reports');
      const myReports = repRes.data.reports || [];
      const activeReps = myReports.filter(r => (r.status || '').toUpperCase() !== 'DISMISSED').length;
      setActiveReportsCount(activeReps);
    } catch (err) {
      // quiet catch
    }

    try {
      // 4. Pending marriage partner confirmation requests
      const marRes = await axiosInstance.get('/users/marriage-confirmation-requests');
      const requests = marRes.data.requests || [];
      setPendingMarriageCount(requests.length);
    } catch (err) {
      // quiet catch
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    const interval = setInterval(fetchNotificationCounts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleProfileUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (tabParam) {
      setActiveItem(getTabFromParam(tabParam));
    }
  }, [tabParam]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeItem]);

  useEffect(() => {
    if (user?.profile_id) {
      axiosInstance.get(`/users/profile/${user.profile_id}/completion`)
        .then(res => {
          setCompletionPercentage(res.data.percentage);
        })
        .catch(err => console.error('Failed to fetch completion percentage', err));
    }
  }, [user?.profile_id, activeItem, updateTrigger]);

  const renderActiveContent = () => {
    switch (activeItem) {
      case 'My Home':
        return <MyHomeView />;
      case 'My Profile':
        return <MyProfileView onProfileUpdate={handleProfileUpdate} onNext={() => setActiveItem('Manage Photos')} />;
      case 'Manage Photos':
        return <ManagePhotosView onProfileUpdate={handleProfileUpdate} onNext={() => setActiveItem('Partner Preferences')} />;
      case 'Partner Preferences':
        return <PartnerPreferencesView onProfileUpdate={handleProfileUpdate} />;
      case 'Inbox Messages':
        return null;
      case 'Express Interests':
        return <InterestsView />;
      case 'Marriage Requests':
        return <MarriageRequestsView onCountChange={fetchNotificationCounts} />;
      case 'Favourite':
        return <ShortlistsView />;
      case 'My Plan':
        return <MyPlanView />;
      case 'Reports & Appeals':
        return <ReportsAppealsView />;
      case 'Account Settings':
        return <SettingsView />;
      default:
        return <MyHomeView />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/20 to-amber-50/10 text-charcoal-text ${
      activeItem === 'Inbox Messages' ? 'pt-20 md:pt-24 pb-2' : 'pt-24 md:pt-28 pb-16'
    }`}>
      <Helmet>
                    <title>Verified Bride & Groom Matches in Kerala | Bharath Marriage</title>
                    <meta
                      name="description"
                      content="Browse verified bride and groom profiles and discover compatible matrimonial matches across Kerala."
                    />
                  </Helmet>
      <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop w-full">
        
        {/* Mobile Horizontal Tabs Selector */}
        <div className="md:hidden relative mb-4 pb-2 border-b border-slate-100 flex items-center w-full">
          {canScrollLeft && (
            <button 
              onClick={() => scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              className="absolute left-[-16px] z-10 w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-md shadow-[2px_0_10px_rgba(0,0,0,0.1)] rounded-r-full text-slate-700 border border-slate-200 border-l-0 hover:bg-slate-50 transition-all active:scale-95"
              aria-label="Scroll left"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-2 overflow-x-auto scrollbar-hidden shrink-0 w-full scroll-smooth"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveItem(item.label)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                  activeItem === item.label
                    ? 'bg-deep-maroon text-white border-transparent'
                    : 'bg-white border border-slate-200 text-charcoal-text/80 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] leading-none">{item.icon}</span>
                <span>{item.label}</span>
                {item.label === 'Inbox Messages' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
                    {unreadCount}
                  </span>
                )}
                {item.label === 'Express Interests' && pendingInterestsCount > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
                    {pendingInterestsCount}
                  </span>
                )}
                {item.label === 'Reports & Appeals' && activeReportsCount > 0 && (
                  <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
                    {activeReportsCount}
                  </span>
                )}
                {item.label === 'Marriage Requests' && pendingMarriageCount > 0 && (
                  <span className="bg-deep-maroon text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
                    {pendingMarriageCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button 
              onClick={() => scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="absolute right-[-16px] z-10 w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-md shadow-[-2px_0_10px_rgba(0,0,0,0.1)] rounded-l-full text-slate-700 border border-slate-200 border-r-0 hover:bg-slate-50 transition-all active:scale-95"
              aria-label="Scroll right"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          
          {/* LEFT COLUMN: Sidebar */}
          <aside className="flex flex-col gap-4 md:gap-6 md:sticky md:top-24 md:self-start">
            
            {/* User Profile Mini-Details Card */}
            <div className="rounded-xl border border-slate-200/60 bg-white p-4 md:p-5 shadow-sm flex flex-row md:flex-col items-center gap-5 md:gap-0 text-left md:text-center">
              
              <div className="flex flex-col items-center shrink-0">
                
                {/* Visual Profile Circular Ring */}
                <div className="relative md:mb-3 flex items-center justify-center">
                  <svg className="w-[76px] h-[76px] md:w-24 md:h-24 transform -rotate-90" viewBox="0 0 96 96">
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="42" 
                      className="text-slate-100" 
                      strokeWidth="6" 
                      fill="transparent" 
                      stroke="currentColor"
                    />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="42" 
                      className="text-deep-maroon" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray="264" 
                      strokeDashoffset={264 - (completionPercentage / 100) * 264}
                      strokeLinecap="round"
                      stroke="currentColor"
                    />
                  </svg>
                  
                  {/* User Avatar Image inside the Ring */}
                  <div className="absolute w-[58px] h-[58px] md:w-[76px] md:h-[76px] rounded-full overflow-hidden border-2 border-white shadow-inner bg-slate-50 flex items-center justify-center">
                    <img
                      src={getResolvedImageUrl(user?.photo_1, user?.gender)}
                      alt="Logged in user"
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, user?.gender)}
                    />
                  </div>

                  {/* Percentage Badge */}
                  <span className="absolute -bottom-1.5 bg-heritage-gold text-white text-[9px] font-bold py-0.5 px-2 md:px-2.5 rounded-full shadow-sm border-[1.5px] md:border-2 border-white">
                    {completionPercentage}%
                  </span>

                  {/* Diamond Premium Badge (Desktop Only on Avatar) */}
                  {user?.plan?.toUpperCase() === 'DIAMOND' && (
                    <span className="hidden md:flex absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-heritage-gold text-white text-[8px] font-bold py-0.5 px-2 rounded-full shadow-md border-2 border-white items-center gap-0.5 z-10" title="Diamond Premium Member">
                      <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
                      DIAMOND
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-center w-full">
                <h2 className="text-sm md:text-base font-bold text-charcoal-text mt-0 md:mt-2 flex items-center justify-start md:justify-center gap-1.5">
                  <span>{user?.full_name || user?.email_address || 'Member'}</span>
                  {user?.plan?.toUpperCase() === 'DIAMOND' && (
                    <span className="hidden md:inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-300 shadow-xs" title="Diamond Premium Member">
                      <span className="material-symbols-outlined text-[12px] text-amber-600">workspace_premium</span>
                      Diamond
                    </span>
                  )}
                </h2>
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <p className="text-[10px] font-semibold text-soft-gray uppercase tracking-wider">ID: {user?.profile_id || 'BKLH000000006'}</p>
                  
                  {/* Diamond Badge on Mobile (near ID) */}
                  {user?.plan?.toUpperCase() === 'DIAMOND' && (
                    <span className="md:hidden inline-flex items-center justify-center gap-1 bg-amber-100 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-300 shadow-xs w-max" title="Diamond Premium Member">
                      <span className="material-symbols-outlined text-[12px] text-amber-600">workspace_premium</span>
                      Diamond Plan
                    </span>
                  )}
                </div>
                
                <div className="hidden md:block mt-2 text-[10px] text-slate-500 space-y-0.5">
                  <p><span className="font-semibold text-slate-400">Registered:</span> {formatRegisteredDate(user?.created_at)}</p>
                  <p><span className="font-semibold text-slate-400">Member Since:</span> {formatMemberSince(user?.created_at)}</p>
                </div>

                {/* Red Status Badge — ONLY rendered when status is DEACTIVATED */}
                {String(user?.status || '').toUpperCase() === 'DEACTIVATED' && (
                  <div className="mt-2.5 inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    Deactivated
                  </div>
                )}
                
                <div className="hidden md:flex mt-4 w-full border-t border-slate-100 pt-3 justify-between items-center text-xs">
                  <span className="text-soft-gray font-medium">Profile Strength</span>
                  <button 
                    onClick={() => setActiveItem('My Profile')} 
                    className="font-bold text-deep-maroon hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    Edit Profile
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Options */}
            <div className="hidden md:block rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm">
              <nav className="space-y-1 text-left">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveItem(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      activeItem === item.label
                        ? 'bg-deep-maroon/5 text-deep-maroon border-l-4 border-deep-maroon rounded-l-none'
                        : 'text-charcoal-text/80 hover:bg-slate-50 hover:text-deep-maroon'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="material-symbols-outlined text-[18px] leading-none">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.label === 'Inbox Messages' && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                    {item.label === 'Express Interests' && pendingInterestsCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                        {pendingInterestsCount}
                      </span>
                    )}
                    {item.label === 'Reports & Appeals' && activeReportsCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                        {activeReportsCount}
                      </span>
                    )}
                    {item.label === 'Marriage Requests' && pendingMarriageCount > 0 && (
                      <span className="bg-deep-maroon text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                        {pendingMarriageCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Membership/Upgrade Box */}
            {user?.plan?.toUpperCase() === 'DIAMOND' ? (
              <div className="hidden md:block rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-500 via-amber-600 to-heritage-gold p-4 text-white shadow-md text-left relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-3 translate-y-3">
                  <span className="material-symbols-outlined text-[100px] text-white">workspace_premium</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-[22px] text-yellow-100">workspace_premium</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-100">VIP Membership</span>
                </div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1">
                  <span>Diamond Plan Active</span>
                  <span className="material-symbols-outlined text-[16px] text-yellow-200">verified</span>
                </h4>
                <p className="text-[10px] text-white/90 leading-normal mt-1 mb-3">
                  You have unlocked all top-tier features including HD Video Calling, Unmasked Contacts, Direct Chat & Downloads.
                </p>
                <button 
                  onClick={() => setActiveItem('My Plan')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold py-1.5 rounded-lg border border-white/30 backdrop-blur-xs transition-all uppercase tracking-wider text-center cursor-pointer"
                >
                  View Plan Benefits
                </button>
              </div>
            ) : (
              <div className="hidden md:block rounded-xl border border-slate-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-5 shadow-sm text-left relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                  <span className="material-symbols-outlined text-[120px] text-heritage-gold">stars</span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="material-symbols-outlined text-[24px] text-heritage-gold">workspace_premium</span>
                  <span className="text-xs font-bold text-heritage-gold uppercase tracking-wider">Premium Access</span>
                </div>
                <h4 className="text-sm font-bold text-charcoal-text">Upgrade Membership</h4>
                <p className="text-[10px] text-soft-gray leading-normal mt-1 mb-4">
                  Unlock matching profiles, view direct phone numbers, initiate direct chat, and highlight your profile.
                </p>
                <button 
                  onClick={() => navigate('/packages')}
                  className="w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white text-[10px] font-bold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 uppercase tracking-wider text-center cursor-pointer"
                >
                  Upgrade Now
                </button>
              </div>
            )}

          </aside>

          {/* RIGHT COLUMN: Main Dashboard Content */}
          <main className="min-w-0 flex flex-col text-left">
            <InboxView hidden={activeItem !== 'Inbox Messages'} />
            {activeItem !== 'Inbox Messages' && renderActiveContent()}
          </main>
          
        </div>

      </div>

    </div>
  );
}
