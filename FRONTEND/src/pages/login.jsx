import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const identifier = event.target.loginId.value;
    const password = event.target.password.value;

    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/login', { identifier, password });

      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }

      const { accessToken, user } = response.data || {};
      
      if (!accessToken || !user) {
        throw new Error(response.data?.message || 'Invalid response from server. Are you sure the API is running and accessible?');
      }
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('isLoggedIn', 'true');
      login(user);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login Error:', error);
      
      const status = error.response?.status;
      const message = error.response?.data?.error || error.response?.data?.message || '';
      
      if (status === 403 && message.toLowerCase().includes('banned')) {
        navigate('/banned');
      } else {
        setErrorModal({ isOpen: true, message: message || error.message || 'Invalid email or password. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf9] px-4 pt-24 pb-8 sm:pt-28 md:px-margin-desktop flex items-center justify-center fade-in">
      <section className="mx-auto flex w-full max-w-[340px] flex-col sm:max-w-[380px]">
        <Link to="/" className="mb-6 flex justify-center">
          <img src="/newlogo1.png" alt="Bharath Marriage" className="h-12 w-auto object-contain" />
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
          <div className="mb-4 text-center sm:mb-5">
            <h1 className="font-display-lg text-xl text-charcoal-text sm:text-2xl">Login</h1>
            <p className="mt-0.5 text-[10px] text-soft-gray sm:mt-1 sm:text-[11px]">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <div>
              <label htmlFor="loginId" className="mb-1 block text-[9px] font-semibold text-charcoal-text sm:text-[10px]">
                Email or mobile number
              </label>
              <input
                id="loginId"
                type="text"
                required
                placeholder="Enter email or mobile"
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-charcoal-text outline-none transition placeholder:text-soft-gray/55 focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon sm:h-9 sm:text-xs"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-[9px] font-semibold text-charcoal-text sm:text-[10px]">
                Password
              </label>
              <div className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 transition focus-within:border-deep-maroon focus-within:ring-1 focus-within:ring-deep-maroon sm:h-9">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  className="min-w-0 flex-1 border-none bg-transparent text-[11px] text-charcoal-text outline-none placeholder:text-soft-gray/55 sm:text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-soft-gray transition hover:bg-slate-50 hover:text-charcoal-text sm:h-7 sm:w-7"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[10px] font-semibold text-deep-maroon hover:text-primary sm:text-[11px]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-8 w-full rounded-md bg-deep-maroon text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.99] sm:h-9 sm:text-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] text-soft-gray sm:mt-5 sm:text-[11px]">
            New here?{' '}
            <Link to="/#register" className="font-semibold text-deep-maroon hover:text-primary">
              Create account
            </Link>
          </p>
        </div>
      </section>

      {/* Custom Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 fade-in">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setErrorModal({ isOpen: false, message: '' })}
          ></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 animate-scale-up overflow-hidden border border-slate-100">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 mb-4 border border-amber-100">
                <span className="material-symbols-outlined text-amber-500 text-3xl">error</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{errorModal.message}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-center border-t border-slate-100/60">
              <button
                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                className="px-8 py-2 bg-deep-maroon text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary transition-colors shadow-deep-maroon/20 w-full"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
