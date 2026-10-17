import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

export default function AdminLogin() {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = username.trim().toLowerCase();
    
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/admin/staff/login', {
        email: cleanUser,
        password: password
      });
      
      const staff = response.data.staff;
      
      let mappedRole = staff.role || 'Staff Admin';
      
      localStorage.setItem('adminRole', mappedRole);
      localStorage.setItem('adminName', staff.name || '');
      localStorage.setItem('adminFranchise', staff.franchise || '');
      localStorage.setItem('adminPermissions', JSON.stringify(staff.permissions || []));
      localStorage.setItem('isAdminLoggedIn', 'true');
      if (response.data.accessToken) {
        localStorage.setItem('adminAccessToken', response.data.accessToken);
      }
      toast.success(`Welcome back, ${staff.name}!`);
      navigate('/admin/dashboard');
      
    } catch (error) {
      console.warn("API login failed", error);
      setLoginError(error.response?.data?.error || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter your staff email');
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await axiosInstance.post('/admin/staff/forgot-password', {
        email: cleanEmail
      });
      toast.success(response.data.message || 'If your email is registered, we have sent a new password.');
      setForgotPasswordMode(false);
      setForgotEmail('');
    } catch (error) {
      console.error('Forgot Password Error', error);
      toast.error(error.response?.data?.error || 'Failed to send reset email.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-rose-50/20 to-amber-50/10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-deep-maroon to-primary p-6 text-center text-white relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-heritage-gold"></div>
          <div className="flex justify-center mb-2 mt-2">
            <span className="material-symbols-outlined text-4xl text-heritage-gold" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-wide">Staff Admin Portal</h2>
          <p className="text-xs text-white/80 mt-1">Bharath Marriage Management Desk</p>
        </div>

        <div className="p-6 sm:p-8">
          {!forgotPasswordMode ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {loginError && (
                <div className="flex items-center gap-2.5 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-shake">
                  <span className="material-symbols-outlined text-lg text-rose-500 flex-shrink-0">error</span>
                  <span className="flex-1">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Staff Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if(loginError) setLoginError(''); }}
                    className="w-full border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-soft-gray/40 font-semibold"
                    placeholder="Enter staff email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotPasswordMode(true); setLoginError(''); }}
                    className="text-[10px] sm:text-xs font-semibold text-deep-maroon hover:text-primary transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if(loginError) setLoginError(''); }}
                    className="w-full border border-slate-200 rounded-xl py-2 pl-10 pr-10 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-soft-gray/40 font-semibold"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 uppercase tracking-wider text-center flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-98'}`}
              >
                <span>{isLoading ? 'Logging In...' : 'Login Securely'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-700">Reset Staff Password</h3>
                <p className="text-xs text-slate-500 mt-1">Enter your registered staff email address to receive a temporary password.</p>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Staff Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-soft-gray/40 font-semibold"
                    placeholder="Enter staff email"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className={`w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 uppercase tracking-wider text-center flex items-center justify-center gap-2 ${isForgotLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-98'}`}
                >
                  <span>{isForgotLoading ? 'Sending...' : 'Send Reset Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForgotPasswordMode(false)}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-3 px-4 rounded-xl transition-all duration-300 uppercase tracking-wider text-center cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Footer Copyright */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400 font-medium">
            <span>Bharat Marriage &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
