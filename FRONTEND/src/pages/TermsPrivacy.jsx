import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function TermsPrivacy() {
  const sections = [
    {
      num: '1',
      title: 'Platform Overview & Intermediary Status',
      content: (
        <div className="space-y-3">
          <p>
            <strong>bharathmarriage.com</strong> ("Platform", "Website", "We", "Us", "Our") is an online matchmaking intermediary facilitating matchmaking services across various communities, religions, and castes in Kerala and beyond.
          </p>
          <div className="p-3.5 bg-amber-50/70 border-l-4 border-deep-maroon rounded-r-xl text-slate-800 text-xs md:text-sm font-medium">
            <strong>bharathmarriage.com</strong> functions solely as an <strong>"Intermediary"</strong> as defined under Section 2(1)(w) of the Information Technology Act, 2000, and claims complete statutory exemption from liability under Section 79 of the IT Act.
          </div>
        </div>
      )
    },
    {
      num: '2',
      title: 'Absolute User Responsibility & Representation of Truthfulness',
      content: (
        <ul className="space-y-2.5 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              Every user ("User", "Member", "You") uploading, publishing, or transmitting data, photos, documents, or personal credentials explicitly certifies and warrants that all information provided is true, authentic, complete, and legally valid.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              The User assumes sole and absolute civil, criminal, and financial liability for any false statement, misrepresentation, fraud, bigamy, impersonation, obscenity, defamation, or breach of any third-party rights or applicable Indian laws.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              The owners, promoters, directors, and operators of <strong>bharathmarriage.com</strong> bear zero liability or obligation to independently verify the veracity of user-generated content and are entirely indemnified by the user against any governmental inquiry, police complaint, litigation, or damages.
            </span>
          </li>
        </ul>
      )
    },
    {
      num: '3',
      title: 'Commercial Usage & Data Visibility Consent',
      content: (
        <ul className="space-y-2.5 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              You acknowledge and accept that <strong>bharathmarriage.com</strong> is a public matrimonial platform. By submitting your information, you grant the Platform an irrevocable, transferable, worldwide, royalty-free license to display, host, and distribute your profile data to other registered members.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-deep-maroon font-bold text-base leading-none mt-1">•</span>
            <span>
              You expressly consent to <strong>bharathmarriage.com</strong> utilizing your data for business operations, analytics, algorithmic match recommendations, internal marketing, promotions, and sharing with affiliated/allied service providers and sister entities without restriction or claims of infringement.
            </span>
          </li>
        </ul>
      )
    },
    {
      num: '4',
      title: 'Code of Conduct & Prohibited Activities',
      content: (
        <div className="space-y-2.5">
          <p className="font-semibold text-slate-800">Users shall not:</p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold text-base leading-none mt-1">•</span>
              <span>Post sexually explicit, abusive, harassing, defamatory, communally provocative, or anti-national content.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold text-base leading-none mt-1">•</span>
              <span>Solicit money, loans, gifts, donations, or engage in commercial exploitation/fraudulent schemes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold text-base leading-none mt-1">•</span>
              <span>Scrape, reverse-engineer, deploy automated spiders/bots, or compromise the digital infrastructure of bharathmarriage.com.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      num: '5',
      title: 'Indemnification',
      content: (
        <p className="text-slate-700">
          You agree to defend, indemnify, and hold harmless <strong>bharathmarriage.com</strong>, its owners, founders, directors, employees, and affiliates from and against any claims, losses, costs, liabilities, penalties, and legal expenses arising out of your breach of these Terms, submission of inaccurate data, or violation of any Indian law.
        </p>
      )
    },
    {
      num: '6',
      title: 'Jurisdiction & Dispute Resolution',
      content: (
        <p className="text-slate-700">
          These Terms are governed strictly by the laws of India. Any legal proceedings, actions, or disputes arising out of or related to <strong>bharathmarriage.com</strong> shall be subject to the exclusive jurisdiction of the competent courts in <strong>Kerala, India</strong>.
        </p>
      )
    }
  ];

  return (
    <div className="bg-[#fcfbfa] min-h-screen pt-24 md:pt-32 pb-20">
      <Helmet>
        <title>Terms and Conditions | Terms of Use & Service Agreement – bharathmarriage.com</title>
        <meta
          name="description"
          content="Terms and Conditions Terms of Use & Service Agreement for bharathmarriage.com."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Breadcrumb / Back to Registration */}
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
            <span className="text-slate-400">Terms & Conditions</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 border-b border-slate-200/80 pb-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm text-amber-700">gavel</span>
            <span>Legal Agreement</span>
          </div>
          <h1 className="font-display-lg text-2xl md:text-3xl lg:text-4xl text-charcoal-text font-bold leading-tight mb-2">
            Terms and Conditions
          </h1>
          <p className="text-deep-maroon font-semibold text-sm md:text-base">
            Terms of Use & Service Agreement – bharathmarriage.com
          </p>
        </div>

        {/* Content Card with Only the Requested 6 Clauses */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 md:p-10 space-y-8">
          {sections.map((sec) => (
            <div key={sec.num} className="space-y-3 border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <h2 className="font-bold text-slate-900 text-base md:text-lg flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-deep-maroon border border-amber-200/60 flex items-center justify-center text-xs font-bold shrink-0">
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
