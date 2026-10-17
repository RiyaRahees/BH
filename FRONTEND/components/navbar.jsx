import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import axiosInstance from '../src/utils/axiosInstance';
import { getResolvedImageUrl, handleImageError } from '../src/utils/imageUtils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeState, setActiveState] = useState('Kerala');
  const [isMobileStateDropdownOpen, setIsMobileStateDropdownOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const isSolid = !isHomePage || scrolled;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // If the user object from AuthContext exists, they are logged in.
    setIsLoggedIn(Boolean(user));
  }, [location, user]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const res = await axiosInstance.get('/users/chats/conversations');
        const dbChats = res.data.conversations || [];
        const total = dbChats.reduce((sum, c) => sum + Number(c.unread || 0), 0);
        setUnreadCount(total);
      } catch (err) {
        // Silent catch
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('guestStar');
    sessionStorage.removeItem('guestStar');
    localStorage.removeItem('guestDob');
    sessionStorage.removeItem('guestDob');
    localStorage.removeItem('guestTob');
    sessionStorage.removeItem('guestTob');
    localStorage.removeItem('guestPob');
    sessionStorage.removeItem('guestPob');
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (isHomePage) {
      const element = document.getElementById('register');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#register');
    }
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isSolid
          ? 'bg-white shadow-md h-16 py-2'
          : 'bg-transparent shadow-none h-20'
        }`}>
        <div className="flex justify-between items-center px-4 lg:px-6 xl:px-10 h-full max-w-container-max mx-auto w-full gap-1.5 sm:gap-4">
          {/* Left: Logo & State Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center cursor-pointer relative h-9 sm:h-11 md:h-12">
              <img
                src={isSolid ? "/newlog2.png" : "/newlogo1.png"}
                alt="Bharath Marriage"
                className={`h-9 sm:h-11 md:h-12 w-auto max-w-[180px] sm:max-w-[220px] md:max-w-[260px] object-contain transition-all duration-300 ${!isSolid ? 'brightness-0 invert' : ''}`}
              />
            </Link>

            {/* Divider Line */}
            <div className={`hidden md:block h-6 w-[1px] ${isSolid ? 'bg-slate-200' : 'bg-white/20'}`}></div>

            {/* State Selection Dropdown Badge — Mobile Only */}
            <div className="md:hidden relative">
              <button
                onClick={() => setIsMobileStateDropdownOpen(!isMobileStateDropdownOpen)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all select-none ${isSolid
                    ? 'bg-deep-maroon/5 border-deep-maroon/20 text-deep-maroon hover:bg-deep-maroon/10'
                    : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
              >
                {/* Pin icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 shrink-0">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8.25 8.25 0 00-16.5 0c0 3.63 1.556 6.326 3.5 8.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span className="leading-none">{activeState}</span>
                {/* Chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${isMobileStateDropdownOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {isMobileStateDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMobileStateDropdownOpen(false)}></div>
                  <div className="absolute left-0 mt-1.5 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[55] text-left">
                    <button
                      onClick={() => { setActiveState('Kerala'); setIsMobileStateDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-charcoal-text hover:bg-slate-50 hover:text-deep-maroon cursor-pointer flex justify-between items-center"
                    >
                      <span>Kerala</span>
                      {activeState === 'Kerala' && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-deep-maroon">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-charcoal-text opacity-40 cursor-not-allowed flex justify-between items-center" disabled>
                      <span>Tamil Nadu</span>
                      <span className="text-[8px] font-medium opacity-70">Soon</span>
                    </button>
                    <button className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-charcoal-text opacity-40 cursor-not-allowed flex justify-between items-center" disabled>
                      <span>Karnataka</span>
                      <span className="text-[8px] font-medium opacity-70">Soon</span>
                    </button>
                  </div>
                </>
              )}
            </div>


            {/* State Selection Dropdown Badge — Desktop Only */}
            <div className="hidden md:block relative group/state">
              <button
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all select-none ${isSolid
                    ? 'bg-deep-maroon/5 border-deep-maroon/20 text-deep-maroon hover:bg-deep-maroon/10'
                    : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
              >
                {/* Pin icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 shrink-0">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8.25 8.25 0 00-16.5 0c0 3.63 1.556 6.326 3.5 8.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span className="leading-none">{activeState}</span>
                {/* Chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 shrink-0 transition-transform duration-200 group-hover/state:rotate-180">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown Items (visible on hover) */}
              <div className="absolute left-0 mt-1.5 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[55] opacity-0 invisible group-hover/state:opacity-100 group-hover/state:visible transition-all duration-200 text-left">
                <button
                  onClick={() => setActiveState('Kerala')}
                  className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-charcoal-text hover:bg-slate-50 hover:text-deep-maroon cursor-pointer flex justify-between items-center"
                >
                  <span>Kerala</span>
                  {activeState === 'Kerala' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-deep-maroon">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-charcoal-text opacity-40 cursor-not-allowed flex justify-between items-center" disabled>
                  <span>Tamil Nadu</span>
                  <span className="text-[8px] font-medium opacity-70">Soon</span>
                </button>
                <button className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-charcoal-text opacity-40 cursor-not-allowed flex justify-between items-center" disabled>
                  <span>Karnataka</span>
                  <span className="text-[8px] font-medium opacity-70">Soon</span>
                </button>
              </div>
            </div>

          </div>

          {/* Middle: Navigation Links (Desktop only) */}
          <div className="hidden lg:flex lg:gap-2.5 xl:gap-4 items-center shrink-0">
            <Link
              className={`font-semibold text-xs xl:text-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${isSolid ? 'text-charcoal-text hover:text-deep-maroon' : 'text-white/90 hover:text-white'
                }`}
              to="/"
            >
              Home
            </Link>
            <Link
              className={`font-semibold text-xs xl:text-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${isSolid ? 'text-charcoal-text hover:text-deep-maroon' : 'text-white/90 hover:text-white'
                }`}
              to="/packages"
            >
              Packages
            </Link>
            <Link
              className={`font-semibold text-xs xl:text-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${isSolid ? 'text-charcoal-text hover:text-deep-maroon' : 'text-white/90 hover:text-white'
                }`}
              to="/porutham"
            >
              Porutham
            </Link>
            <Link
              className={`font-semibold text-xs xl:text-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${isSolid ? 'text-charcoal-text hover:text-deep-maroon' : 'text-white/90 hover:text-white'
                }`}
              to="/muhurtham"
            >
              Muhurtham
            </Link>
            <a
              className={`font-semibold text-xs xl:text-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${isSolid ? 'text-charcoal-text hover:text-deep-maroon' : 'text-white/90 hover:text-white'
                }`}
              href="/contact-us"
            >
              Contact Us
            </a>
            <Link
              className={`font-semibold italic text-xs xl:text-sm whitespace-nowrap transition-all duration-300 active:scale-95 ${isSolid ? 'text-charcoal-text hover:text-deep-maroon' : 'text-white/90 hover:text-white'
                }`}
              to="/advertise"
            >
              Advertise
            </Link>
          </div>

          {/* Right: Search, Login, Register & Hamburger */}
          <div className="flex gap-1.5 sm:gap-2.5 items-center">
            {/* Search Icon Link (Visible on all sizes) */}
            <Link
              to="/search"
              className={`flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                isSolid ? 'text-charcoal-text hover:bg-slate-100' : 'text-white hover:bg-white/10'
              }`}
              title="Search Profiles"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">search</span>
            </Link>

            {isLoggedIn ? (
              /* Profile Dropdown */
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  title={`${user?.full_name || user?.email_address || 'Member'} ${user?.profile_id ? `(ID: ${user.profile_id})` : ''}`}
                  className="flex items-center gap-1 rounded-full hover:bg-slate-100 md:px-1.5 md:py-0.5 cursor-pointer relative"
                >
                  <div className="relative">
                    <img
                      src={getResolvedImageUrl(user?.photo_1, user?.gender)}
                      alt="Logged in user"
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full object-cover border border-slate-200 bg-slate-50"
                      onError={(e) => handleImageError(e, user?.gender)}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <span className={`material-symbols-outlined hidden text-[20px] md:inline-block ${isSolid ? 'text-charcoal-text' : 'text-white'
                    }`}>
                    keyboard_arrow_down
                  </span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-fade-in text-left">
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-charcoal-text">{user?.full_name || user?.email_address || 'Member'}</p>
                          {user?.plan?.toUpperCase() === 'DIAMOND' && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-300" title="Diamond Premium Member">
                              <span className="material-symbols-outlined text-[10px] text-amber-600">workspace_premium</span>
                              Diamond
                            </span>
                          )}
                        </div>
                        {user?.profile_id && <p className="text-[10px] text-soft-gray">ID: {user.profile_id}</p>}
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-charcoal-text hover:bg-slate-50 hover:text-deep-maroon"
                      >
                        <span className="material-symbols-outlined text-base">group</span>
                        Matches
                      </Link>
                      <Link
                        to="/dashboard?tab=inbox"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-charcoal-text hover:bg-slate-50 hover:text-deep-maroon"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">forum</span>
                          Inbox Messages
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/dashboard?tab=profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-charcoal-text hover:bg-slate-50 hover:text-deep-maroon"
                      >
                        <span className="material-symbols-outlined text-base">account_circle</span>
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard?tab=settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-charcoal-text hover:bg-slate-50 hover:text-deep-maroon"
                      >
                        <span className="material-symbols-outlined text-base">settings</span>
                        Settings
                      </Link>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Register Free Button */}
                <a
                  href="#register"
                  onClick={handleRegisterClick}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-deep-maroon hover:bg-primary text-white text-xs font-semibold rounded-lg shadow-md transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px] leading-none text-white">
                    person_add
                  </span>
                  Register
                </a>

                {/* Login Button */}
                <Link
                  to="/login"
                  className={`flex items-center gap-1 px-3 py-1.5 font-semibold text-[11px] sm:text-xs rounded-lg transition-all duration-200 active:scale-95 cursor-pointer shrink-0 border ${
                    isSolid
                      ? 'border-deep-maroon text-deep-maroon hover:bg-deep-maroon/5'
                      : 'border-white text-white hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] leading-none hidden sm:inline-block">
                    account_circle
                  </span>
                  Login
                </Link>

                {/* Demo Button — small pill, next to Login */}
                <button
                  onClick={() => setIsDemoOpen(true)}
                  title="Watch Demo"
                  className={`hidden lg:flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 cursor-pointer shrink-0 border ${
                    isSolid
                      ? 'bg-heritage-gold/10 border-heritage-gold/40 text-heritage-gold hover:bg-heritage-gold/20'
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}
                  >
                    play_circle
                  </span>
                  Demo
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden flex items-center justify-center p-1 rounded-lg transition-all duration-300 cursor-pointer ${isSolid ? 'text-charcoal-text hover:bg-slate-100' : 'text-white hover:bg-white/10'
                }`}
            >
              <span className="material-symbols-outlined text-[20px] leading-none">
                menu
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-50 lg:hidden transition-opacity duration-300 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Menu */}
          <div className="fixed top-0 right-0 h-full w-[260px] bg-white z-55 shadow-2xl flex flex-col lg:hidden animate-slide-in-right text-left">
            {/* Header with Branded Logo */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
              <div className="h-12 relative w-40">
                <img
                  src="/newlog2.png"
                  alt="Bharath Marriage Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="material-symbols-outlined text-[18px] text-charcoal-text hover:text-deep-maroon cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                close
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
              {/* Menu Links */}
              <div className="flex flex-col gap-1 shrink-0">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold text-charcoal-text hover:text-deep-maroon hover:bg-slate-50 text-xs py-2 px-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">home</span>
                  Home
                </Link>
                <Link
                  to="/packages"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold text-charcoal-text hover:text-deep-maroon hover:bg-slate-50 text-xs py-2 px-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">
                    workspace_premium
                  </span>
                  Packages
                </Link>
                <Link
                  to="/porutham"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold text-charcoal-text hover:text-deep-maroon hover:bg-slate-50 text-xs py-2 px-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">favorite</span>
                  Porutham
                </Link>
                <Link
                  to="/muhurtham"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold text-charcoal-text hover:text-deep-maroon hover:bg-slate-50 text-xs py-2 px-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">calendar_today</span>
                  Muhurtham
                </Link>
                <a
                  href="/contact-us"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold text-charcoal-text hover:text-deep-maroon hover:bg-slate-50 text-xs py-2 px-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">mail</span>
                  Contact Us
                </a>
                <Link
                  to="/advertise"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold italic text-charcoal-text hover:text-deep-maroon hover:bg-slate-50 text-xs py-2 px-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-500">campaign</span>
                  Advertise
                </Link>

              </div>

              {/* Search and State Selection (Mobile equivalents) */}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 shrink-0">
                <Link
                  to="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 bg-slate-50 text-charcoal-text text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-soft-gray leading-none">search</span>
                  <span>Search Profiles</span>
                </Link>

                {/* Demo Button — Mobile */}
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setIsDemoOpen(true); }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-heritage-gold/50 py-2 bg-amber-50/50 text-heritage-gold text-xs font-semibold hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] leading-none">play_circle</span>
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Footer containing Auth (Login/Logout) */}
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
              {isLoggedIn ? (
                <button
                  className="flex items-center justify-center gap-2 w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs cursor-pointer active:scale-[0.98]"
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined text-[14px] leading-none text-white">logout</span>
                  Logout
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Register Free Button */}
                  <a
                    href="#register"
                    onClick={handleRegisterClick}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-deep-maroon hover:bg-primary text-white font-semibold rounded-lg shadow-sm transition-colors text-xs cursor-pointer active:scale-[0.98] text-center"
                  >
                    <span className="material-symbols-outlined text-[14px] leading-none text-white">person_add</span>
                    Register
                  </a>

                  {/* Login Button */}
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 text-charcoal-text font-semibold rounded-lg hover:bg-slate-50 transition-colors text-xs cursor-pointer active:scale-[0.98] text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[14px] leading-none">account_circle</span>
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Demo Video Modal ── */}
      {isDemoOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsDemoOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in">

              {/* Modal header */}
              <div className="flex items-center justify-between bg-charcoal-text px-5 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-heritage-gold"
                    style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                  >
                    play_circle
                  </span>
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Bharath Marriage — Platform Demo</span>
                </div>
                <button
                  onClick={() => setIsDemoOpen(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Close demo video"
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>

              {/* 16:9 YouTube iframe */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com"
                  title="Bharath Marriage Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

            </div>
          </div>
        </>
      )}
    </>
  );
}
