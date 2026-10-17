import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';

export default function SuperAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axiosInstance.post('/auth/admin-login', { 
        identifier: username, 
        password 
      });

      if (response.data.accessToken) {
        localStorage.setItem('adminAccessToken', response.data.accessToken);
        localStorage.setItem('adminRole', 'superadmin');
        localStorage.setItem('isAdminLoggedIn', 'true');
        navigate('/super-admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-rose-50/20 to-amber-50/10 px-4">
      <div className="w-full max-w-md bg-paper-white rounded-2xl shadow-xl border border-surface-variant/40 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-deep-maroon to-primary p-6 text-center text-white relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-heritage-gold"></div>
          <div className="flex justify-center mb-2 mt-2">
            <span className="material-symbols-outlined text-4xl text-heritage-gold" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <h2 className="text-xl font-display-lg font-bold tracking-wide">Super Admin Portal</h2>
          <p className="text-xs text-white/80 font-body-sm mt-1">Bharath Marriage Control Desk</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="flex items-center gap-2.5 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-shake">
                <span className="material-symbols-outlined text-lg text-rose-500 flex-shrink-0">error</span>
                <span className="flex-1">{error}</span>
              </div>
            )}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-charcoal-text/70 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-soft-gray text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if(error) setError(''); }}
                  className="w-full border border-surface-variant rounded-xl py-2 pl-10 pr-4 text-xs font-body-sm bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-charcoal-text/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-soft-gray text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if(error) setError(''); }}
                  className="w-full border border-surface-variant rounded-xl py-2 pl-10 pr-10 text-xs font-body-sm bg-white text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-soft-gray/40"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray text-lg hover:text-charcoal-text transition-colors cursor-pointer"
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 uppercase tracking-wider text-center cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Login Securely</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/franchise/login')}
              className="w-full group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 text-amber-900 text-xs font-bold transition-all duration-300 shadow-2xs cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-lg text-amber-700">
                storefront
              </span>
              <span>Switch to Franchise Partner Portal</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="w-full group flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-rose-50/70 hover:border-deep-maroon/35 text-slate-700 hover:text-deep-maroon text-xs font-bold transition-all duration-300 shadow-2xs hover:shadow-sm cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-lg text-deep-maroon group-hover:rotate-180 transition-transform duration-500">
                swap_horiz
              </span>
              <span>Switch to Staff Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
