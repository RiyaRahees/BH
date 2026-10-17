import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Disclaimer() {
  const points = [
    {
      title: 'No Warranty of Accuracy',
      icon: 'fact_check',
      content: (
        <p>
          Profiles on <strong>bharathmarriage.com</strong> are self-published by independent users. The Platform and its owners make no warranties, express or implied, regarding the authenticity, character, criminal history, financial solvency, health, or marital eligibility of any user.
        </p>
      )
    },
    {
      title: 'Mandatory Independent Due Diligence',
      icon: 'security',
      content: (
        <p>
          Users and their guardians must exercise independent discretion and conduct thorough offline verification, character checks, and background investigations before entering into any matrimonial or financial commitment.
        </p>
      )
    },
    {
      title: 'No Guarantee of Match/Marriage',
      icon: 'handshake',
      content: (
        <p>
          <strong>bharathmarriage.com</strong> is an introductory technology directory, not an employment agency or matrimonial guarantor. We make no guarantee regarding the frequency of matches, success rates, or marriage solemnization.
        </p>
      )
    },
    {
      title: 'Limitation of Liability',
      icon: 'gavel',
      content: (
        <p>
          Under no circumstances shall <strong>bharathmarriage.com</strong>, its owners, or developers be liable for direct, indirect, punitive, or consequential damages resulting from user interactions, fraud, emotional distress, extortion, or marital disputes arising out of connections made via the platform.
        </p>
      )
    }
  ];

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-20">
      <Helmet>
        <title>Disclaimer | Platform & Matchmaking Disclaimer – bharathmarriage.com</title>
        <meta
          name="description"
          content="Platform & Matchmaking Disclaimer for bharathmarriage.com."
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
            <span className="text-slate-400">Disclaimer</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 border-b border-slate-200/80 pb-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm text-amber-700">warning</span>
            <span>Legal Disclaimer</span>
          </div>
          <h1 className="font-display-lg text-2xl md:text-3xl lg:text-4xl text-charcoal-text font-bold leading-tight mb-2">
            Disclaimer
          </h1>
          <p className="text-deep-maroon font-semibold text-sm md:text-base">
            Platform &amp; Matchmaking Disclaimer – bharathmarriage.com
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 md:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {points.map((pt, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <h2 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-deep-maroon text-lg shrink-0">{pt.icon}</span>
                  <span>{pt.title}</span>
                </h2>
                <div className="text-xs md:text-sm leading-relaxed text-slate-600">
                  {pt.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
