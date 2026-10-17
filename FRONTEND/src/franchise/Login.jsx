import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useToast } from '../context/ToastContext';

export default function FranchiseLogin() {
  const toast = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your Franchise ID / Email and Password.');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/franchise/login', {
        identifier: identifier.trim(),
        password: password
      });

      const { token, franchise } = response.data;
      localStorage.setItem('isFranchiseLoggedIn', 'true');
      localStorage.setItem('franchiseToken', token);
      localStorage.setItem('franchiseData', JSON.stringify(franchise));

      toast.success(`Welcome back, ${franchise.owner || franchise.name}!`);
      navigate('/franchise/dashboard');
    } catch (error) {
      console.error('Franchise login error:', error);
      setErrorMessage(
        error.response?.data?.error || 'Invalid credentials or inactive account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      toast.error('Please enter your Franchise ID or Registered Email.');
      return;
    }

    try {
      setForgotLoading(true);
      const response = await axiosInstance.post('/franchise/forgot-password', {
        identifier: forgotIdentifier.trim()
      });
      toast.success(response.data.message || 'New password sent to registered email.');
      setForgotMode(false);
      setForgotIdentifier('');
    } catch (error) {
      console.error('Forgot password error:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to send password reset.';
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-amber-50/30 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-deep-maroon/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-heritage-gold/10 blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/70 overflow-hidden relative z-10 animate-fade-in">
        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-deep-maroon to-primary p-6 sm:p-8 text-center text-white relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-3xl text-heritage-gold">
              storefront
            </span>
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-white/10 text-heritage-gold text-[10px] font-extrabold uppercase tracking-widest border border-white/10 mb-1">
            Partner Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Franchise Portal</h1>
          <p className="text-xs text-white/80 mt-1 font-medium">
            Sign in to manage matrimonial profiles and district operations
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-shake text-left">
              <span className="material-symbols-outlined text-rose-500 text-base shrink-0">error</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {!forgotMode ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Franchise ID or Registered Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. BM-KKD-001 or name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setErrorMessage('');
                    }}
                    className="text-xs font-bold text-deep-maroon hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your franchise password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-deep-maroon hover:bg-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">login</span>
                    Sign In to Franchise Portal
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500">
                  Want to start a franchise?{' '}
                  <Link
                    to="/franchise/register"
                    className="font-bold text-deep-maroon hover:underline inline-flex items-center gap-0.5"
                  >
                    Apply for Registration
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            /* Forgot Password Mode */
            <form onSubmit={handleForgotPassword} className="space-y-4 text-left animate-fade-in">
              <div className="bg-amber-50 border border-amber-200/70 p-3 rounded-xl text-amber-900 text-xs font-medium">
                Enter your <strong>Franchise ID</strong> (e.g. BM-KKD-001) or <strong>Registered Email</strong> to receive a new temporary login password.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Franchise ID or Registered Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. BM-KKD-001 or email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 px-4 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">sync</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">send</span>
                      Send Password
                    </>
                  )}
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
