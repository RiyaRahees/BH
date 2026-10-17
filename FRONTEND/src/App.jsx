import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import UserLayout from '../layouts/userlayout';
import Home from './pages/Home';
import Search from './pages/Search';
import Login from './pages/login';
import Dashboard from './pages/protected/DashBoard';
import ProfileDetails from './pages/protected/ProfileDetail';
import Porutham from './pages/Porutham';
import Muhurtham from './pages/Muhurtham';
import Contact from './pages/contact';
import Packages from './pages/Packages';
import ForgotPassword from './pages/ForgotPassword';
import PasswordSent from './pages/PasswordSent';
import Banned from './pages/Banned';
import TermsPrivacy from './pages/TermsPrivacy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import Disclaimer from './pages/Disclaimer';
import CyberSecurityPolicy from './pages/CyberSecurityPolicy';
import SuccessStories from './pages/SuccessStories';
import SafetyTips from './pages/SafetyTips';
import AdvertiseWithUs from './pages/AdvertiseWithUs';

// Admin / Super Admin Page Imports
import SuperAdminLogin from './admin/superAdmin/Login';
import SuperAdminDashboard from './admin/superAdmin/DashBoard';
import AdminLogin from './admin/admin/Login';
import AdminDashboard from './admin/admin/Dashbord';

// Franchise Page Imports
import FranchiseLogin from './franchise/Login';
import FranchiseRegister from './franchise/Register';
import FranchiseVerification from './franchise/FranchiseVerification';
import FranchiseDashboard from './franchise/Dashboard';
import FranchiseTerms from './franchise/FranchiseTerms';

import { useSettings } from './context/SettingsContext';
import MaintenanceMode from '../components/MaintenanceMode';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        // Delay slightly to allow the DOM to render
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

function SuperAdminProtectedRoute({ children }) {
  const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
  const adminRole = localStorage.getItem('adminRole');
  
  if (!isAdminLoggedIn || adminRole !== 'superadmin') {
    return <Navigate to="/super-admin/login" replace />;
  }
  return children;
}

function FranchiseProtectedRoute({ children }) {
  const isFranchiseLoggedIn = localStorage.getItem('isFranchiseLoggedIn') === 'true';
  if (!isFranchiseLoggedIn) {
    return <Navigate to="/franchise/login" replace />;
  }
  return children;
}

function UserProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const { settings } = useSettings();
  const isAdminPath = location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/admin');
  const isFranchisePath = location.pathname.startsWith('/franchise');

  useEffect(() => {
    // Prevent right-click context menu on images
    const handleContextMenu = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // Prevent inspection, save, and screenshot hotkeys
    const handleKeyDown = (e) => {
      // F10, F11, F12 (Common shortcut keys for screen capturing / dev tools)
      if (['F10', 'F11', 'F12'].includes(e.key)) {
        e.preventDefault();
        return;
      }
      
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Developer Tools / Console / Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        return;
      }
      
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key)) {
        e.preventDefault();
        return;
      }
      
      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && ['S', 's'].includes(e.key)) {
        e.preventDefault();
        return;
      }

      // Ctrl+P / Cmd+P (Print Page / Print to PDF)
      if ((e.ctrlKey || e.metaKey) && ['P', 'p'].includes(e.key)) {
        e.preventDefault();
        return;
      }

      // PrintScreen key (Windows screenshot)
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard as a deterrent
        e.preventDefault();
      }

      // Mac screenshot shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
      }
    };

    // Prevent dragging images to save them
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  const routeContent = (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public / User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-sent" element={<PasswordSent />} />
        <Route path="/banned" element={<Banned />} />
        <Route path="/dashboard" element={<UserProtectedRoute><Dashboard /></UserProtectedRoute>} />
        <Route path="/profile/:profileId" element={<UserProtectedRoute><ProfileDetails /></UserProtectedRoute>} />
        <Route path="/porutham" element={<Porutham />} />
        <Route path="/muhurtham" element={<Muhurtham />} />
        <Route path='/contact-us' element={<Contact/>}/>
        <Route path='/packages' element={<Packages/>}/>
        <Route path="/terms-privacy" element={<TermsPrivacy />} />
        <Route path="/terms" element={<TermsPrivacy />} />
        <Route path="/terms-of-use" element={<TermsPrivacy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/refund-and-cancellation" element={<RefundPolicy />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/cyber-security" element={<CyberSecurityPolicy />} />
        <Route path="/security" element={<CyberSecurityPolicy />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/safety-tips" element={<SafetyTips />} />
        <Route path="/advertise" element={<AdvertiseWithUs />} />
        <Route path="/advertise-with-us" element={<AdvertiseWithUs />} />

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route 
          path="/super-admin/dashboard" 
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboard />
            </SuperAdminProtectedRoute>
          } 
        />

        {/* Standard Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Franchise Partner Routes */}
        <Route path="/franchise" element={<Navigate to="/franchise/dashboard" replace />} />
        <Route path="/franchise/login" element={<FranchiseLogin />} />
        <Route path="/franchise/register" element={<FranchiseRegister />} />
        <Route path="/franchise/register/:token" element={<FranchiseRegister />} />
        <Route path="/franchise/verification/:token" element={<FranchiseRegister />} />
        <Route path="/franchise/terms" element={<FranchiseTerms />} />
        <Route path="/franchise-terms" element={<FranchiseTerms />} />
        <Route 
          path="/franchise/dashboard" 
          element={
            <FranchiseProtectedRoute>
              <FranchiseDashboard />
            </FranchiseProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );

  if (isAdminPath || isFranchisePath) {
    return routeContent;
  }

  if (settings?.maintenanceMode) {
    return (
      <>
        <MaintenanceMode />
        <div className="opacity-0 pointer-events-none hidden">
          {routeContent}
        </div>
      </>
    );
  }

  return (
    <UserLayout>
      {routeContent}
    </UserLayout>
  );
}

export default App;
