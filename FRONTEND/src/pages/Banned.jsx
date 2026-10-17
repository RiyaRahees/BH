import { Link } from 'react-router-dom';

export default function Banned() {
  return (
    <div className="min-h-screen bg-[#fbfaf9] px-4 pt-24 pb-8 sm:pt-28 md:px-margin-desktop flex items-center justify-center fade-in">
      <section className="mx-auto flex w-full max-w-[380px] flex-col">
        <Link to="/" className="mb-8 flex justify-center">
          <img src="/newlogo1.png" alt="Bharath Marriage" className="h-12 w-auto object-contain" />
        </Link>

        <div className="rounded-xl border border-rose-100 bg-white p-6 sm:p-8 shadow-sm text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 mb-5 border border-rose-100">
            <span className="material-symbols-outlined text-rose-500 text-3xl">block</span>
          </div>
          
          <h1 className="font-display-lg text-xl text-charcoal-text sm:text-2xl mb-2">Account Banned</h1>
          <p className="text-xs sm:text-sm text-soft-gray leading-relaxed mb-6">
            Your account has been permanently restricted from accessing Bharath Marriage services due to a violation of our terms of service or community guidelines.
          </p>
          
          <div className="space-y-3">
            <Link 
              to="/contact-us"
              className="flex items-center justify-center h-10 w-full rounded-md bg-deep-maroon text-xs font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.99]"
            >
              Contact Support
            </Link>
            
            <Link 
              to="/"
              className="flex items-center justify-center h-10 w-full rounded-md border border-slate-200 bg-white text-xs font-semibold text-charcoal-text transition hover:bg-slate-50"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
