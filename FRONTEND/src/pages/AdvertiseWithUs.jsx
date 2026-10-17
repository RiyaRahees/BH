import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AD_TIERS, getStoredAds, saveStoredAds } from '../data/staticAds';
import { useSettings } from '../context/SettingsContext';

const KERALA_DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

export default function AdvertiseWithUs() {
  const { settings } = useSettings();
  const supportEmail = settings?.supportEmail || 'support@bharathmarriage.com';
  const contactPhone = settings?.contactPhone || '+91 98450 12345';

  const [selectedTier, setSelectedTier] = useState('INFEED_CARD');
  const [duration, setDuration] = useState('monthly'); // 'weekly' | 'monthly' | 'quarterly'
  const [targetingMode, setTargetingMode] = useState('ALL_KERALA'); // 'ALL_KERALA' | 'SPECIFIC_DISTRICTS'
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    websiteUrl: '',
    notes: '',
  });

  const [creativePreview, setCreativePreview] = useState(null);
  const [creativeFileName, setCreativeFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeTierConfig = AD_TIERS[selectedTier];

  const getCalculatedPrice = () => {
    if (!activeTierConfig) return 0;
    if (duration === 'weekly') return activeTierConfig.weeklyPrice;
    if (duration === 'monthly') return activeTierConfig.monthlyPrice;
    if (duration === 'quarterly') return Math.round(activeTierConfig.monthlyPrice * 3 * 0.85); // 15% discount
    return activeTierConfig.monthlyPrice;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreativeFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCreativePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDistrict = (districtName) => {
    setSelectedDistricts((prev) =>
      prev.includes(districtName)
        ? prev.filter((d) => d !== districtName)
        : [...prev, districtName]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (targetingMode === 'SPECIFIC_DISTRICTS' && selectedDistricts.length === 0) {
      alert('Please select at least one district or choose "All Kerala".');
      return;
    }

    setIsSubmitting(true);

    const newAdRequest = {
      id: `ad-req-${Date.now()}`,
      tier: selectedTier,
      slot: selectedTier === 'LEADERBOARD' ? 'SEARCH_TOP' : selectedTier === 'INFEED_CARD' ? 'SEARCH_INFEED' : 'SEARCH_SIDEBAR',
      businessName: formData.businessName,
      title: formData.businessName,
      tagline: formData.notes || `Sponsored advertisement by ${formData.businessName}`,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email,
      targetUrl: formData.websiteUrl || 'https://www.google.com',
      targetingMode,
      targetDistricts: targetingMode === 'ALL_KERALA' ? ['All Kerala'] : selectedDistricts,
      notes: formData.notes,
      creativeUrl: creativePreview,
      status: 'PENDING',
      duration: duration === 'weekly' ? '1 Week' : duration === 'monthly' ? '1 Month' : '3 Months',
      amount: getCalculatedPrice(),
      requestedAt: new Date().toISOString(),
      badge: 'NEW APPLICANT'
    };

    try {
      const existing = getStoredAds();
      saveStoredAds([newAdRequest, ...existing]);
    } catch (err) {
      console.error('Failed to store ad submission:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 600);
  };

  return (
    <div className="w-full flex flex-col bg-[#fbfaf9] text-charcoal-text min-h-screen">
      <Helmet>
        <title>Advertise With Us | Bharath Marriage Kerala</title>
        <meta
          name="description"
          content="Promote your wedding venue, bridal jewellery, catering, or photography to thousands of verified Kerala families on Bharath Marriage."
        />
      </Helmet>

      {/* ── 1. HERO BANNER (Matches Contact Us / Packages Style) ── */}
      <section className="relative bg-gradient-to-br from-primary via-deep-maroon to-[#6b0030] pt-28 pb-14 md:pt-36 md:pb-16 overflow-hidden">
        {/* Decorative background dots & soft glow */}
        <div className="absolute inset-0 opacity-10 hero-pattern pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-heritage-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <span className="inline-flex items-center gap-2 font-label-caps text-[10px] tracking-[0.2em] text-heritage-gold font-semibold uppercase mb-4">
            <span className="w-8 h-px bg-heritage-gold/50" />
            Business &amp; Sponsorships
            <span className="w-8 h-px bg-heritage-gold/50" />
          </span>

          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4">
            Advertise With <span className="text-heritage-gold">Bharath Marriage</span>
          </h1>

          <p className="max-w-2xl mx-auto text-white/80 text-sm md:text-base leading-relaxed">
            Reach thousands of prospective brides, grooms, and high-intent families across all 14 Kerala districts during their wedding preparation milestone.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto mt-8">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-heritage-gold">10,000+</div>
              <div className="text-[11px] text-white/80 font-medium mt-0.5">Active Monthly Visitors</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-heritage-gold">14</div>
              <div className="text-[11px] text-white/80 font-medium mt-0.5">Kerala Districts Covered</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-heritage-gold">100%</div>
              <div className="text-[11px] text-white/80 font-medium mt-0.5">Verified Matrimonial Intent</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-heritage-gold">3 Formats</div>
              <div className="text-[11px] text-white/80 font-medium mt-0.5">High-CTR Placements</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. AD FORMATS & TIERS (Clean White Card Layout) ── */}
      <section className="py-14 md:py-18 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="font-label-caps text-[10px] tracking-widest text-heritage-gold font-semibold uppercase">
              PLANS &amp; PRICING
            </span>
            <h2 className="font-display-lg text-2xl md:text-3xl text-charcoal-text">
              Select Your Ad Placement &amp; Size
            </h2>
            <p className="text-soft-gray text-xs sm:text-sm max-w-xl mx-auto">
              Choose the ad format that fits your brand. Each tier is strategically positioned to engage users naturally while they browse matches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(AD_TIERS).map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative flex flex-col justify-between bg-white ${
                    isSelected
                      ? 'border-2 border-deep-maroon shadow-lg ring-4 ring-deep-maroon/5 scale-[1.02]'
                      : 'border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-deep-maroon text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-3 rounded-full shadow-xs">
                      Selected Tier
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/8 px-2.5 py-1 rounded-md inline-block mb-3">
                      {tier.badge}
                    </span>
                    <h3 className="text-lg font-bold text-charcoal-text mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-soft-gray leading-relaxed mb-4">
                      {tier.description}
                    </p>

                    <div className="space-y-2.5 py-3 border-y border-slate-100 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Target Size:</span>
                        <span className="font-semibold text-slate-800">{tier.dimensions}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Monthly Rate:</span>
                        <span className="font-bold text-deep-maroon text-sm">₹{tier.monthlyPrice.toLocaleString()} / mo</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Weekly Rate:</span>
                        <span className="font-medium text-slate-700">₹{tier.weeklyPrice.toLocaleString()} / wk</span>
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Best Suited For:</span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">{tier.idealFor}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-deep-maroon text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ Selected for Booking' : 'Select Format'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── 3. BOOKING FORM (Premium Clean White Container) ── */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 md:p-10 relative overflow-hidden">
            {submitted ? (
              <div className="text-center py-8 space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold border border-emerald-200">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-charcoal-text">Ad Request Submitted!</h3>
                <p className="text-sm text-soft-gray leading-relaxed">
                  Thank you, <strong className="text-charcoal-text">{formData.contactPerson || formData.businessName}</strong>. Your sponsorship request for the <strong className="text-deep-maroon">{activeTierConfig?.name}</strong> slot has been submitted to our administrative team.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5 text-left">
                  <div>• <span className="text-slate-400">Selected Format:</span> <strong className="text-slate-800">{activeTierConfig?.name}</strong> ({activeTierConfig?.dimensions})</div>
                  <div>• <span className="text-slate-400">Target Region:</span> <strong className="text-slate-800">{targetingMode === 'ALL_KERALA' ? 'All Kerala (Statewide)' : selectedDistricts.join(', ')}</strong></div>
                  <div>• <span className="text-slate-400">Duration:</span> <strong className="text-slate-800">{duration === 'weekly' ? '1 Week' : duration === 'monthly' ? '1 Month' : '3 Months'}</strong></div>
                  <div>• <span className="text-slate-400">Estimated Amount:</span> <strong className="text-deep-maroon font-bold">₹{getCalculatedPrice().toLocaleString()}</strong></div>
                  <div>• <span className="text-slate-400">Phone:</span> <strong className="text-slate-800">{formData.phone}</strong></div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={`https://wa.me/919845012345?text=${encodeURIComponent(
                      `Hi Bharath Marriage, I have submitted an ad booking request for *${formData.businessName || 'My Business'}* (${activeTierConfig?.name}). Please connect with me.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    Connect on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ businessName: '', contactPerson: '', phone: '', email: '', websiteUrl: '', notes: '' });
                      setCreativePreview(null);
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Header with Duration Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-charcoal-text">Ad Slot Booking Form</h3>
                    <p className="text-xs text-soft-gray mt-0.5">
                      Enter your vendor contact information and banner preferences below.
                    </p>
                  </div>

                  {/* Duration Toggle Buttons */}
                  <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDuration('weekly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        duration === 'weekly'
                          ? 'bg-white text-deep-maroon shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('monthly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        duration === 'monthly'
                          ? 'bg-white text-deep-maroon shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('quarterly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        duration === 'quarterly'
                          ? 'bg-white text-deep-maroon shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3 Months (15% Off)
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Business / Brand Name *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      required
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="e.g. Malabar Heritage Gold"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-charcoal-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-charcoal-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Phone Number / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 98470 12345"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-charcoal-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. contact@business.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-charcoal-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Website or Instagram Page URL
                    </label>
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com or social link"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-charcoal-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon transition-all bg-white"
                    />
                  </div>

                  {/* Banner Creative Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Ad Banner Creative ({activeTierConfig?.dimensions})
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="ad-creative-file"
                        className="hidden"
                      />
                      <label
                        htmlFor="ad-creative-file"
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-deep-maroon bg-slate-50 hover:bg-slate-100/70 cursor-pointer text-xs text-slate-600 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">
                          {creativeFileName || 'Upload image banner (JPG, PNG)...'}
                        </span>
                        <span className="px-2.5 py-1 bg-white border border-slate-200 font-bold text-deep-maroon rounded text-[11px] shrink-0 shadow-2xs">
                          Choose File
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Live Image Preview */}
                {creativePreview && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-deep-maroon">Uploaded Creative Preview:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCreativePreview(null);
                          setCreativeFileName('');
                        }}
                        className="text-rose-600 hover:underline cursor-pointer text-[11px] font-medium"
                      >
                        Remove Image
                      </button>
                    </div>
                    <div className="max-h-40 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-center">
                      <img
                        src={creativePreview}
                        alt="Creative Preview"
                        className="max-h-36 object-contain rounded"
                      />
                    </div>
                  </div>
                )}

                {/* ── TARGET REGION SELECTOR (Two Options: All Kerala vs Specific Districts) ── */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Target Region Preference *
                    </label>
                    <p className="text-xs text-soft-gray mb-3">
                      Choose whether you want your advertisement shown across all Kerala districts or targeted only to specific districts.
                    </p>

                    {/* The 2 Primary Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: All Kerala */}
                      <div
                        onClick={() => {
                          setTargetingMode('ALL_KERALA');
                          setSelectedDistricts([]);
                        }}
                        className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all flex items-start gap-3 ${
                          targetingMode === 'ALL_KERALA'
                            ? 'border-deep-maroon bg-deep-maroon/5 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          targetingMode === 'ALL_KERALA'
                            ? 'border-deep-maroon bg-deep-maroon text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {targetingMode === 'ALL_KERALA' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-charcoal-text flex items-center gap-1.5">
                            <span>All Kerala</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Statewide
                            </span>
                          </div>
                          <p className="text-[11px] text-soft-gray mt-0.5 leading-relaxed">
                            Show ad to visitors and matches across all 14 Kerala districts for maximum reach.
                          </p>
                        </div>
                      </div>

                      {/* Option 2: Specific Districts */}
                      <div
                        onClick={() => setTargetingMode('SPECIFIC_DISTRICTS')}
                        className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all flex items-start gap-3 ${
                          targetingMode === 'SPECIFIC_DISTRICTS'
                            ? 'border-deep-maroon bg-deep-maroon/5 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          targetingMode === 'SPECIFIC_DISTRICTS'
                            ? 'border-deep-maroon bg-deep-maroon text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {targetingMode === 'SPECIFIC_DISTRICTS' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-charcoal-text flex items-center gap-1.5">
                            <span>Select Specific Districts</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Targeted
                            </span>
                          </div>
                          <p className="text-[11px] text-soft-gray mt-0.5 leading-relaxed">
                            Target your ad specifically to families searching in chosen local districts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* District Selection Chips (Displayed when Option 2 is active) */}
                  {targetingMode === 'SPECIFIC_DISTRICTS' && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                          Choose Target Districts ({selectedDistricts.length} selected):
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDistricts([...KERALA_DISTRICTS])}
                            className="text-[10px] font-semibold text-deep-maroon hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300 text-xs">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedDistricts([])}
                            className="text-[10px] font-semibold text-slate-500 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                        {KERALA_DISTRICTS.map((district) => {
                          const isChecked = selectedDistricts.includes(district);
                          return (
                            <label
                              key={district}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleDistrict(district);
                              }}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none ${
                                isChecked
                                  ? 'bg-deep-maroon text-white border-deep-maroon shadow-2xs font-bold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                                isChecked ? 'bg-white text-deep-maroon border-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked ? '✓' : ''}
                              </span>
                              <span className="truncate">{district}</span>
                            </label>
                          );
                        })}
                      </div>

                      {selectedDistricts.length === 0 && (
                        <p className="text-[11px] text-amber-700 italic pt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Please select at least one district above.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Additional Instructions Textarea */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Additional Notes / Special Instructions (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows="2"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="e.g. Please run our creative during weekends or special festival dates..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-charcoal-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon transition-all bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Form Footer with Pricing & Submit */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-soft-gray block">Estimated Total:</span>
                    <span className="text-2xl font-bold text-deep-maroon">
                      ₹{getCalculatedPrice().toLocaleString()}
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        / {duration}
                      </span>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-deep-maroon hover:bg-primary text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin text-base">⏳</span> Submitting Request...
                      </>
                    ) : (
                      <>
                        <span>Submit Ad Booking Request</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── 4. DIRECT CONTACT / CORPORATE PARTNERSHIPS ── */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left shadow-xs">
            <div>
              <h4 className="text-base font-bold text-charcoal-text">
                Need a Custom Package or Multi-District Sponsorship?
              </h4>
              <p className="text-xs text-soft-gray mt-0.5">
                Our advertising desk is available 6 days a week to assist with annual brand partnerships and featured placements.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={`tel:${contactPhone}`}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-charcoal-text font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>{contactPhone}</span>
              </a>
              <a
                href={`mailto:${supportEmail}?subject=Ad%20Sponsorship%20Inquiry`}
                className="px-4 py-2 rounded-xl bg-deep-maroon text-white hover:bg-primary font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">mail</span>
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
