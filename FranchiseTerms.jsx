import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function FranchiseTerms() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 text-xs py-6 px-3 sm:px-6 print:p-0 print:bg-white print-container">
      <Helmet>
        <title>Franchise Terms and Conditions / Franchise Agreement | Bharath Marriage</title>
        <meta
          name="description"
          content="This Franchise Agreement constitutes a legally binding contract between Bharathmarriage.com and the Franchisee."
        />
      </Helmet>

      {/* Print-specific stylesheet to eliminate whitespace gaps and ensure seamless page flow */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 14mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            background: transparent !important;
            min-height: auto !important;
          }
          .print-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .print-title-card {
            padding: 0 0 8px 0 !important;
            margin-bottom: 10px !important;
            border: none !important;
            border-bottom: 2px solid #0f172a !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            text-align: center !important;
            background: transparent !important;
          }
          .print-title-card h2 {
            font-size: 14pt !important;
            line-height: 1.25 !important;
            color: #0f172a !important;
            margin: 0 !important;
          }
          .print-preamble-card {
            padding: 8px 12px !important;
            margin-bottom: 10px !important;
            border-radius: 6px !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #f8fafc !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-preamble-card .space-y-4 {
            gap: 4px !important;
          }
          .print-sections-wrapper {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .print-section-card {
            padding: 8px 12px !important;
            margin-bottom: 0 !important;
            border-radius: 6px !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-section-header {
            padding-bottom: 5px !important;
            margin-bottom: 6px !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .print-section-badge {
            width: 20px !important;
            height: 20px !important;
            font-size: 10px !important;
            border-radius: 4px !important;
          }
          .print-section-title {
            font-size: 11.5px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
          }
          .print-section-content {
            gap: 5px !important;
            font-size: 10px !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto print-wrapper">

        {/* Top Header / Navigation Bar (Hidden in Print) */}
        <div className="no-print bg-white border border-slate-200/90 rounded-xl px-4 py-3.5 mb-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <Link to="/" className="hover:text-deep-maroon transition-colors">Bharath Marriage</Link>
                <span>•</span>
                <span className="text-deep-maroon font-bold">Partner Desk</span>
                <span>•</span>
                <span>Franchise Agreement</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Franchise Terms and Conditions
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200/90 transition-colors cursor-pointer shadow-2xs"
              title="Print legal agreement copy or save as PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Agreement</span>
            </button> */}

            <Link
              to="/franchise/register"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-deep-maroon hover:bg-primary rounded-lg transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Register</span>
            </Link>

            <Link
              to="/franchise/login"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-deep-maroon transition-colors"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>Partner Login</span>
            </Link>
          </div>
        </div>

        {/* Breadcrumbs (Hidden in Print) */}
        <div className="no-print flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 px-1">
          <Link to="/" className="hover:text-deep-maroon transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <Link to="/franchise/register" className="hover:text-deep-maroon transition-colors">Franchise Register</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-slate-700 font-semibold">Franchise Terms and Conditions</span>
        </div>

        {/* Hero Document Title Card */}
        <div className="print-title-card bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 mb-6 shadow-xs relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight uppercase">
              FRANCHISE TERMS AND CONDITIONS / FRANCHISE AGREEMENT
            </h2>
          </div>
        </div>

        {/* Formal Legal Preamble & Parties Section */}
        <div className="print-preamble-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 mb-6 shadow-xs">
          <div className="text-xs text-slate-700 leading-relaxed space-y-4">
            <p>
              This Franchise Agreement (the <strong className="text-slate-900">&quot;Agreement&quot;</strong>) constitutes a legally binding contract between <strong className="text-slate-900">Bharathmarriage.com</strong> (hereinafter referred to as the <strong className="text-slate-900">&quot;Company&quot;</strong>, which expression shall, unless repugnant to the context, include its legal heirs, successors, representatives, administrators, and assigns) of the <strong className="text-slate-900">FIRST PART</strong>;
            </p>

            <div className="text-center font-bold text-xs text-slate-500 uppercase tracking-wider py-1">
              AND
            </div>

            <p>
              The Applicant / Registered Entity applying for the pin-code-based franchise via digital verification or formal execution (hereinafter referred to as the <strong className="text-slate-900">&quot;Franchisee&quot;</strong>, which expression shall, unless repugnant to the context, include their heirs, successors, legal representatives, and permitted assigns) of the <strong className="text-slate-900">SECOND PART</strong>.
            </p>

            <div className="pt-2 border-t border-slate-100 text-slate-700">
              The Company and the Franchisee are hereinafter collectively referred to as the <strong className="text-slate-900">&quot;Parties&quot;</strong> and individually as a <strong className="text-slate-900">&quot;Party&quot;</strong>.
            </div>
          </div>
        </div>

        {/* Detailed Sections (1 through 9) */}
        <div className="print-sections-wrapper space-y-6">

          {/* ========================================================
              SECTION 1
             ======================================================== */}
          <div
            id="sec-1"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                1. Nature of the Portal and Franchise Appointment
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Portal Scope:</strong> Bharathmarriage.com is an online matrimonial matching platform created exclusively for genuine unmarried, legally divorced, or widowed individuals possessing valid mobile numbers, email addresses, and authentic identity verification.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Pin-Code Allocation:</strong> The Company appoints the Franchisee on a postal pin-code basis. As a general rule, only one Franchisee shall be allocated per specific postal pin-code. The Company, at its sole, absolute, and unfettered discretion, reserves the right to allot more than one pin-code to a single individual or entity.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Final Authority:</strong> The right to grant, withhold, renew, split, or modify any pin-code territory vests exclusively with the Company, whose decision shall be final and binding.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 2
             ======================================================== */}
          <div
            id="sec-2"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                2. Franchisee Onboarding, Due Diligence &amp; Acceptance
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  The Franchisee must register through the Company’s online portal and provide true, verifiable KYC documentation.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  The Company’s authorized screening committee retains the absolute right to evaluate, verify, accept, or summarily reject any franchise application without assigning reasons.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  Allocation of the franchise occurs strictly upon the Franchisee&apos;s explicit digital or physical acceptance of these Terms and Conditions.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 3
             ======================================================== */}
          <div
            id="sec-3"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                3. Administration &amp; Handling Charges (Non-Refundable Fee)
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Classification of Consideration:</strong> Any fee paid by the Franchisee upon onboarding or renewal is strictly an &quot;Administrative and Operational Handling Charge&quot;. The term &quot;Franchise Fee&quot; is merely a colloquial label adopted for transactional ease and administrative reference.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">No Security Deposit:</strong> Under no circumstances shall this payment be treated as a security deposit, earnest money, loan, or investment.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Strict Non-Refundability:</strong> This administrative handling charge is exhausted upon operational setup, technical licensing, backend onboarding, training, and portal configuration. It is 100% non-refundable and non-transferable under all circumstances, including premature termination, suspension, cessation of operations, or voluntary withdrawal by the Franchisee.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 4
             ======================================================== */}
          <div
            id="sec-4"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                4. Pricing Integrity and User Compliance
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Prescribed Fee Structure:</strong> The Franchisee shall strictly charge and collect only the exact registration fees and package charges explicitly fixed and published by the Company. Under no circumstances shall the Franchisee levy extra fees, cash commissions, hidden surcharges, or arbitrary service charges from any end-user.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Adherence to Platform Rules:</strong> The Franchisee is mandatorily bound by all rules, guidelines, code of conduct, terms of service, and privacy policies applicable to end-users of Bharathmarriage.com. Any action compromising the platform&apos;s reputation, safety, or legal standing shall trigger immediate action.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 5
             ======================================================== */}
          <div
            id="sec-5"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                5
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                5. Commission Payouts and Adjustments
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Settlement Schedule:</strong> All eligible incentives, referral fees, or commissions earned by the Franchisee shall be calculated on a monthly cycle and disbursed on a monthly payout basis (at the end of each calendar month) into the verified bank account provided by the Franchisee.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Right to Deductions and Set-Off:</strong> The Company reserves the unequivocal right to adjust, debit, deduct, or withhold from pending payouts any amounts arising from:
                  <ul className="mt-2 space-y-1.5 pl-4 list-disc marker:text-deep-maroon text-slate-600">
                    <li>Chargebacks, customer refunds, or cancellations caused by Franchisee deficiency.</li>
                    <li>Recoverable debts, statutory deductions (TDS), penalties, or administrative fines incurred due to Franchisee defaults.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 6
             ======================================================== */}
          <div
            id="sec-6"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                6
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                6. Termination, Default, and Cancellation Protocols
              </h3>
            </div>

            <div className="print-section-content space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Summary Termination for Misconduct:</strong> If the Franchisee commits any breach of this Agreement, engages in misrepresentation, fabricates user profiles, conducts unauthorized financial transactions, causes user harassment, or violates any regulatory norm, the Company shall terminate the franchise immediately without prior notice or cure period.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Voluntary Exit by Franchisee:</strong> If the Franchisee wishes to surrender the franchise:
                  <ul className="mt-2 space-y-1.5 pl-4 list-disc marker:text-deep-maroon text-slate-600">
                    <li>The Franchisee must submit a formal written notice via official Email to the Company.</li>
                    <li>The Franchisee must immediately acknowledge and confirm the transmission of such email notice via a WhatsApp communication to the Company’s designated compliance number.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Financial Settlement on Termination:</strong>
                  <ul className="mt-2 space-y-1.5 pl-4 list-disc marker:text-deep-maroon text-slate-600">
                    <li>The administrative handling charges remain non-refundable.</li>
                    <li>The Company shall disburse any legitimate pending monthly payouts strictly after deducting all pending adjustments, chargebacks, statutory levies, damages, or fines.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 7
             ======================================================== */}
          <div
            id="sec-7"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                7
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                7. Legal Relationship and Indemnification
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Principal-to-Principal:</strong> The relationship between the Company and the Franchisee is on a principal-to-principal basis. The Franchisee is an independent contractor. Nothing in this Agreement constitutes a partnership, agency, joint venture, or employer-employee relationship. The Franchisee has no authority to bind the Company to third parties.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Absolute Indemnification:</strong> The Franchisee agrees to defend, indemnify, and hold harmless Bharathmarriage.com, its directors, partners, officers, and technical operators from and against all legal claims, police complaints, consumer litigations, statutory penalties, damages, costs, and legal fees resulting from:
                  <ul className="mt-2 space-y-1.5 pl-4 list-disc marker:text-deep-maroon text-slate-600">
                    <li>The Franchisee&apos;s unauthorized acts, negligence, fraud, or violations of applicable laws.</li>
                    <li>Misuse of user personal data or collection of unapproved funds.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 8
             ======================================================== */}
          <div
            id="sec-8"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                8
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                8. Compliance with Indian Laws
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  The Franchisee covenants to comply with all applicable statutes, including the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, the Consumer Protection Act, 2019, and the Indian Contract Act, 1872.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  Any unauthorized sharing, leaking, or commercial exploitation of user biometric or demographic data shall subject the Franchisee to civil damages and criminal prosecution under Indian law.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 9
             ======================================================== */}
          <div
            id="sec-9"
            className="print-section-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs"
          >
            <div className="print-section-header flex items-center gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
              <div className="print-section-badge w-8 h-8 rounded-lg bg-deep-maroon text-white flex items-center justify-center font-bold text-sm shrink-0">
                9
              </div>
              <h3 className="print-section-title text-sm sm:text-base font-bold text-slate-900">
                9. Dispute Resolution and Exclusive Jurisdiction
              </h3>
            </div>

            <div className="print-section-content space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Amicable Settlement:</strong> All disputes, differences, or claims arising out of or in connection with this Agreement shall first be resolved through good-faith mutual negotiations.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon mt-1.5 shrink-0"></span>
                <div>
                  <strong className="text-slate-900">Exclusive Jurisdiction:</strong> The Parties expressly agree that the courts, forums, and police/administrative authorities situated in Thrissur, Kerala, India, shall have exclusive and sole jurisdiction to entertain, adjudicate, and resolve any suit, petition, criminal complaint, arbitration, or legal proceeding arising under or related to this Agreement, to the total exclusion of all other courts.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Footer */}
        <div className="mt-8 text-center text-[10px] text-slate-400 no-print">
          Bharath Marriage &copy; {new Date().getFullYear()} &bull; Regional Franchise Program &bull; All Rights Reserved
        </div>

      </div>
    </div>
  );
}
