import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const sections = [
    {
      num: '1',
      title: 'Scope & Application',
      content: (
        <p className="text-slate-700">
          This Privacy Policy details how <strong>bharathmarriage.com</strong> collects, processes, stores, and transfers your personal data in compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>, and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>.
        </p>
      )
    },
    {
      num: '2',
      title: 'Information We Collect',
      content: (
        <ul className="space-y-2.5 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              <strong>Identity & Demographic Data:</strong> Name, date of birth, gender, religion, caste, marital status, photograph, voice/video clips, horoscope, education, income, and family background.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              <strong>Contact Details:</strong> Phone number, email address, physical address, and government-issued ID proofs submitted for optional or mandatory verification.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              <strong>Technical & Log Data:</strong> IP address, browser type, device identifiers, ISP details, timestamps, and page interactions.
            </span>
          </li>
        </ul>
      )
    },
    {
      num: '3',
      title: 'Lawful Basis & Permitted Disclosures',
      content: (
        <div className="space-y-2.5">
          <p className="text-slate-800 font-medium">
            By submitting data to <strong>bharathmarriage.com</strong>, you provide unambiguous, affirmative consent for the Platform to:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
              <span>Display your information to other members for matchmaking.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
              <span>Share your information with affiliated business entities, marketing associates, technology infrastructure providers, and sister ventures for related matrimonial, event, and community services.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
              <span>Disclose information to authorized law enforcement agencies, cyber cells, and statutory authorities pursuant to lawful orders or notices under Indian law.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      num: '4',
      title: 'Data Retention & Erasure',
      content: (
        <p className="text-slate-700">
          We retain personal data for the duration required to provide services, prevent fraud, enforce agreements, and comply with statutory obligations. Users may submit deletion requests, which will be honored subject to legitimate legal compliance, dispute resolution, and security exceptions.
        </p>
      )
    }
  ];

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-20">
      <Helmet>
        <title>Privacy Policy | Privacy Policy & Data Processing Notice – bharathmarriage.com</title>
        <meta
          name="description"
          content="Privacy Policy and Data Processing Notice for bharathmarriage.com."
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
            <span className="text-slate-400">Privacy Policy</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 border-b border-slate-200/80 pb-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-900 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm text-sky-700">shield_lock</span>
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="font-display-lg text-2xl md:text-3xl lg:text-4xl text-charcoal-text font-bold leading-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-deep-maroon font-semibold text-sm md:text-base">
            Privacy Policy & Data Processing Notice – bharathmarriage.com
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 md:p-10 space-y-8">
          {sections.map((sec) => (
            <div key={sec.num} className="space-y-3 border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <h2 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/60 flex items-center justify-center text-xs font-bold shrink-0">
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
