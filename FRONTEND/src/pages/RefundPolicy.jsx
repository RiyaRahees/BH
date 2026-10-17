import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
  const sections = [
    {
      num: '1',
      title: 'Absolute Non-Refundable Policy',
      content: (
        <div className="space-y-3">
          <ul className="space-y-2.5 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold text-base leading-none mt-1">•</span>
              <span>
                <strong>All payments, subscription fees, and transaction charges</strong> made to <strong>bharathmarriage.com</strong> are strictly non-refundable and non-transferable under any circumstance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold text-base leading-none mt-1">•</span>
              <span>
                Matrimonial platform access is an <strong>immediate, consumable digital service</strong>. The moment payment is processed, platform privileges, profile visibility, access to matchmaking databases, and automated analytical tools are provisioned immediately, constituting full consumption of the service.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold text-base leading-none mt-1">•</span>
              <span>
                Furthermore, our operational workflow incurs substantial non-recoverable verification, cloud hosting, and third-party gateway operational costs immediately upon registration. Consequently, voluntary cancellation, profile deactivation, early marriage settlement, lack of desired responses, or personal disinterest shall not qualify for any refund (partial or whole).
              </span>
            </li>
          </ul>
        </div>
      )
    },
    {
      num: '2',
      title: 'Sole Exception for Refund Eligibility',
      content: (
        <div className="space-y-3">
          <p className="text-slate-800 font-medium">
            A user shall be eligible for a refund solely and exclusively if:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
              <span>
                A technical failure originating entirely from the internal servers of <strong>bharathmarriage.com</strong> permanently prevents the completion of the user's registration and account approval, <strong>and</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
              <span>
                <strong>bharathmarriage.com</strong> fails to deliver backend service access within <strong>14 business days</strong> of formal written notice from the user.
              </span>
            </li>
          </ul>
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-600 italic">
            Any approved refund under this sole exception shall be processed via the original payment method within standard banking turnaround timelines, minus statutory payment gateway convenience charges.
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-20">
      <Helmet>
        <title>Refund & Cancellation Policy | bharathmarriage.com</title>
        <meta
          name="description"
          content="Refund, Cancellation & Payment Policy for bharathmarriage.com."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            to="/#register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-maroon hover:text-primary bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs transition-all hover:shadow-xs group"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span>Back to Registration</span>
          </Link>

          <div className="text-xs text-soft-gray flex items-center gap-1.5">
            <Link to="/" className="hover:text-deep-maroon transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[10px] text-slate-300">chevron_right</span>
            <span className="text-slate-400">Refund & Cancellation Policy</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 border-b border-slate-200/80 pb-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-900 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm text-rose-700">receipt_long</span>
            <span>Payment & Cancellation Terms</span>
          </div>
          <h1 className="font-display-lg text-2xl md:text-3xl lg:text-4xl text-charcoal-text font-bold leading-tight mb-2">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-deep-maroon font-semibold text-sm md:text-base">
            Refund, Cancellation &amp; Payment Policy – bharathmarriage.com
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 md:p-10 space-y-8">
          {sections.map((sec) => (
            <div key={sec.num} className="space-y-3 border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <h2 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/60 flex items-center justify-center text-xs font-bold shrink-0">
                  {sec.num}
                </span>
                <span>{sec.num}. {sec.title}</span>
              </h2>
              <div className="text-xs md:text-sm leading-relaxed text-slate-700 pl-0 md:pl-9">
                {sec.content}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
