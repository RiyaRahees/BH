import { Link } from 'react-router-dom';

export default function PasswordSent() {
  return (
    <div className="min-h-screen bg-[#fbfaf9] px-4 pt-24 pb-8 sm:pt-28 md:px-margin-desktop flex items-center justify-center fade-in">
      <section className="mx-auto flex w-full max-w-[340px] flex-col sm:max-w-[380px]">
        <Link to="/" className="mb-6 flex justify-center">
          <img src="/newlogo1.png" alt="Bharath Marriage" className="h-12 w-auto object-contain" />
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 text-center">
          <div className="mb-4 flex justify-center">
            <span className="material-symbols-outlined text-4xl text-green-500 sm:text-5xl">
              mark_email_read
            </span>
          </div>
          
          <h1 className="mb-2 font-display-lg text-xl text-charcoal-text sm:text-2xl">
            Password Sent!
          </h1>
          
          <p className="mb-6 text-[11px] text-soft-gray sm:text-xs leading-relaxed">
            A new password has been sent to your email.
          </p>

          <Link
            to="/login"
            className="flex h-8 w-full items-center justify-center rounded-md bg-deep-maroon text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.99] sm:h-9 sm:text-xs"
          >
            Back to Login
          </Link>
        </div>
      </section>
    </div>
  );
}
