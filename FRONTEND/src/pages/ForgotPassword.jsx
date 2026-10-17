import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await axiosInstance.post('/auth/forgot-password', { email_address: email });
      navigate('/password-sent');
    } catch (err) {
      console.error('Forgot Password Error:', err);
      setError(err.response?.data?.error || 'Failed to request password reset. Please try again.');
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
            <h1 className="font-display-lg text-xl text-charcoal-text sm:text-2xl">Forgot Password</h1>
            <p className="mt-0.5 text-[10px] text-soft-gray sm:mt-1 sm:text-[11px]">
              Enter your email to receive a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-[9px] font-semibold text-charcoal-text sm:text-[10px]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your email"
                className={`h-8 w-full rounded-md border bg-white px-2.5 text-[11px] text-charcoal-text outline-none transition placeholder:text-soft-gray/55 sm:h-9 sm:text-xs ${
                  error ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon'
                }`}
              />
              {error && (
                <p className="mt-1 text-[10px] text-red-500 sm:text-[11px]">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-8 w-full rounded-md bg-deep-maroon text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.99] sm:h-9 sm:text-xs disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Sending...' : 'Send Password'}
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] text-soft-gray sm:mt-5 sm:text-[11px]">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-deep-maroon hover:text-primary">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
