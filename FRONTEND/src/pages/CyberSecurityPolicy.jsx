import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function CyberSecurityPolicy() {
  const sections = [
    {
      num: '1',
      title: 'Cyber Security Framework',
      content: (
        <p className="text-slate-700">
          <strong>bharathmarriage.com</strong> implements standard technical and organizational security controls to protect server infrastructure against unauthorized access, SQL injections, brute-force intrusions, and data corruption. However, users acknowledge that transmission over the internet cannot be 100% secure, and the Platform disclaims liability for sophisticated cyber-attacks, zero-day vulnerabilities, or interception beyond reasonable administrative control.
        </p>
      )
    },
    {
      num: '2',
      title: 'User Security Best Practices & Anti-Fraud Warnings',
      content: (
        <ul className="space-y-2.5 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold text-base leading-none mt-1">•</span>
            <span>
              <strong>Never Share Confidential Credentials:</strong> Never share login credentials, passwords, Card PINs, bank OTPs, or UPI access codes with anyone, including individuals claiming to represent bharathmarriage.com.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold text-base leading-none mt-1">•</span>
            <span>
              <strong>Strict Prohibition of Financial Demands:</strong> The Platform strictly prohibits money transfers, loans, or financial transactions between members. Any member requesting money or financial aid must be reported to the Grievance Officer immediately.
            </span>
          </li>
        </ul>
      )
    },
    {
      num: '3',
      title: 'IT Act Intermediary Compliance & Grievance Redressal Mechanism',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">
            In accordance with the <strong>Information Technology Act, 2000</strong>, and <strong>Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, the contact details of the Grievance Redressal Officer are as follows:
          </p>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 md:p-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs md:text-sm">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Platform:</span>
                <span className="font-bold text-slate-800">bharathmarriage.com</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Designation:</span>
                <span className="font-bold text-slate-800">Grievance &amp; Compliance Officer</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Official Email:</span>
                <a href="mailto:grievance@bharathmarriage.com" className="font-bold text-deep-maroon hover:underline">
                  grievance@bharathmarriage.com
                </a>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Legal Jurisdiction:</span>
                <span className="font-bold text-slate-800">Kerala, India</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span><strong>Acknowledgement:</strong> Within 24 hours of receipt</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-sm">done_all</span>
                <span><strong>Resolution:</strong> Within 15 days from receipt</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-20">
      <Helmet>
        <title>Data Privacy & Cyber Security Policy | bharathmarriage.com</title>
        <meta
          name="description"
          content="Data Privacy & Cyber Security Policy for bharathmarriage.com."
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
            <span className="text-slate-400">Data Privacy &amp; Cyber Security Policy</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 border-b border-slate-200/80 pb-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm text-emerald-700">security</span>
            <span>Cyber Security &amp; Compliance</span>
          </div>
          <h1 className="font-display-lg text-2xl md:text-3xl lg:text-4xl text-charcoal-text font-bold leading-tight mb-2">
            Data Privacy &amp; Cyber Security Policy
          </h1>
          <p className="text-deep-maroon font-semibold text-sm md:text-base">
            Cyber Security, Intermediary Due Diligence &amp; Consent Statement – bharathmarriage.com
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 md:p-10 space-y-8">
          {sections.map((sec) => (
            <div key={sec.num} className="space-y-3 border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <h2 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center text-xs font-bold shrink-0">
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
