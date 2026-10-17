import React, { useState, useEffect } from 'react';
import { getStoredAds, saveStoredAds, AD_TIERS } from '../data/staticAds';

const KERALA_DISTRICTS = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
  'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
  'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
];

const VENDOR_CATEGORIES = [
  'Kalyana Mandapam & Convention Centre',
  'Bridal Wear, Silks & Groom Coutures',
  'Wedding Jewellery & Gold Diamonds',
  'Traditional Sadya & Catering Services',
  'Wedding Photography & Cinematic Film',
  'Resorts & Backwater Destination Weddings',
  'Bridal Makeup & Styling Artists',
  'Stage Decor & Event Management',
  'Astrology & Porutham Services'
];

export default function FranchiseAdsManager({ franchiseData }) {
  const [ads, setAds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // New Ad Form State
  const [formTier, setFormTier] = useState('INFEED_CARD');
  const [formDuration, setFormDuration] = useState('monthly'); // 'weekly' | 'monthly' | 'quarterly'
  const [targetingMode, setTargetingMode] = useState('FRANCHISE_TERRITORY'); // 'FRANCHISE_TERRITORY' | 'ALL_KERALA' | 'SPECIFIC_DISTRICTS'
  const [selectedDistricts, setSelectedDistricts] = useState([franchiseData?.location || 'Ernakulam']);
  const [creativePreview, setCreativePreview] = useState(null);
  const [creativeFileName, setCreativeFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    category: VENDOR_CATEGORIES[0],
    title: '',
    tagline: '',
    targetUrl: '',
    contactPerson: '',
    phone: '',
    email: '',
    notes: ''
  });

  const franchiseId = franchiseData?.franchise_id || 'BM-FRANCHISE';

  const loadFranchiseAds = () => {
    const all = getStoredAds();
    // Filter ads submitted by this franchise or matching its ID
    const myAds = all.filter(
      (a) =>
        a.submittedBy === franchiseId ||
        a.submittedBy === franchiseData?.email ||
        (franchiseData?.location && a.location && a.location.toLowerCase().includes(franchiseData.location.toLowerCase())) ||
        // If this is BM-EKM-001 or BM-TSR-001, attach sample pending ad for demo
        (franchiseId.includes('EKM') && (a.id === 'ad-pending-01' || a.submittedBy === 'BM-EKM-001')) ||
        (franchiseId.includes('TSR') && (a.id === 'ad-pending-02' || a.submittedBy === 'BM-TSR-001'))
    );
    setAds(myAds);
  };

  useEffect(() => {
    loadFranchiseAds();
    const handleStorageChange = () => loadFranchiseAds();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [franchiseId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
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

  const getCalculatedPrice = () => {
    const tierConfig = AD_TIERS[formTier];
    if (!tierConfig) return 0;
    if (formDuration === 'weekly') return tierConfig.weeklyPrice;
    if (formDuration === 'quarterly') return Math.round(tierConfig.monthlyPrice * 3 * 0.85);
    return tierConfig.monthlyPrice;
  };

  const toggleDistrict = (district) => {
    setSelectedDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    );
  };

  const handleSubmitAd = (e) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      alert('Please enter the Business Name.');
      return;
    }

    setIsSubmitting(true);

    const slot =
      formTier === 'LEADERBOARD'
        ? 'SEARCH_TOP'
        : formTier === 'INFEED_CARD'
        ? 'SEARCH_INFEED'
        : 'SEARCH_SIDEBAR';

    const targetDistrictsList =
      targetingMode === 'ALL_KERALA'
        ? ['All Kerala (Statewide)']
        : targetingMode === 'FRANCHISE_TERRITORY'
        ? [franchiseData?.location || 'Franchise Territory']
        : selectedDistricts.length > 0
        ? selectedDistricts
        : ['All Kerala (Statewide)'];

    const newAd = {
      id: `ad-franchise-${Date.now()}`,
      tier: formTier,
      slot,
      businessName: formData.businessName.trim(),
      category: formData.category,
      title: formData.title.trim() || formData.businessName.trim(),
      tagline: formData.tagline.trim() || `Exclusive offerings from ${formData.businessName.trim()}`,
      targetUrl: formData.targetUrl.trim() || 'https://www.google.com',
      contactPerson: formData.contactPerson.trim() || franchiseData?.owner || 'Franchise Representative',
      phone: formData.phone.trim() || franchiseData?.mobile_number || '',
      email: formData.email.trim() || franchiseData?.email || '',
      targetingMode,
      targetDistricts: targetDistrictsList,
      notes: formData.notes.trim(),
      creativeUrl: creativePreview || '/ad_jewellery.jpg', // Fallback to realistic demo banner if none uploaded
      status: 'PENDING',
      duration: formDuration === 'weekly' ? '1 Week' : formDuration === 'monthly' ? '1 Month' : '3 Months',
      amount: getCalculatedPrice(),
      requestedAt: new Date().toISOString(),
      badge: 'FRANCHISE VENDOR',
      submittedBy: franchiseId,
      franchiseName: franchiseData?.name || 'Local Franchise Desk',
      franchiseOwner: franchiseData?.owner || ''
    };

    try {
      const allAds = getStoredAds();
      saveStoredAds([newAd, ...allAds]);
      loadFranchiseAds();
      setIsSubmitting(false);
      setShowSubmitModal(false);
      // Reset form
      setFormData({
        businessName: '',
        category: VENDOR_CATEGORIES[0],
        title: '',
        tagline: '',
        targetUrl: '',
        contactPerson: '',
        phone: '',
        email: '',
        notes: ''
      });
      setCreativePreview(null);
      setCreativeFileName('');
      showToast('Advertisement submitted successfully! It has been forwarded to Super Admin for approval.');
    } catch (err) {
      console.error('Error submitting franchise ad:', err);
      setIsSubmitting(false);
      alert('Failed to save ad submission. Please try again.');
    }
  };

  const filteredAds = ads.filter((a) => {
    if (activeFilter === 'ALL') return true;
    return a.status === activeFilter;
  });

  const pendingCount = ads.filter((a) => a.status === 'PENDING').length;
  const approvedCount = ads.filter((a) => a.status === 'APPROVED').length;
  const totalVolume = ads.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  return (
    <div className="space-y-6 text-left w-full">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-maroon"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/10 px-2 py-0.5 rounded">
              Franchise Monetization Desk
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-deep-maroon text-2xl">campaign</span>
            Ads Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Submit commercial banners for wedding vendors in <strong>{franchiseData?.name || 'your territory'}</strong>.
            All submissions are reviewed and approved by Super Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>Submit New Ad</span>
        </button>
      </div>

      {/* ── Success Toast ── */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Submissions</span>
            <span className="material-symbols-outlined text-lg">featured_video</span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{ads.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Submitted via this portal</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Approval</span>
            <span className="material-symbols-outlined text-lg">pending_actions</span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</p>
          <p className="text-[10px] text-amber-600/80 mt-0.5">Under Super Admin review</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active &amp; Approved</span>
            <span className="material-symbols-outlined text-lg">verified</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{approvedCount}</p>
          <p className="text-[10px] text-emerald-600/80 mt-0.5">Currently live on site</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-deep-maroon">
            <span className="text-[10px] font-bold uppercase tracking-wider">Estimated Ad Volume</span>
            <span className="material-symbols-outlined text-lg">payments</span>
          </div>
          <p className="text-2xl font-black text-deep-maroon mt-2">₹{totalVolume.toLocaleString()}</p>
          <p className="text-[10px] text-deep-maroon/70 mt-0.5">Gross sponsorship value</p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: `All Ads (${ads.length})` },
          { key: 'PENDING', label: `Pending Review (${pendingCount})` },
          { key: 'APPROVED', label: `Active & Approved (${approvedCount})` },
          { key: 'REJECTED', label: 'Rejected' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-deep-maroon text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Ads Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Advertiser &amp; Creative</th>
                <th className="py-3 px-4">Placement / Tier</th>
                <th className="py-3 px-4">Target Region</th>
                <th className="py-3 px-4">Duration &amp; Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">campaign</span>
                      <p className="font-semibold text-slate-600">No advertisements submitted yet.</p>
                      <p className="text-[11px] text-slate-400">
                        Help local wedding vendors advertise their halls, jewellery, and photography to Bharath Marriage visitors.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-deep-maroon text-white rounded-lg text-xs font-bold hover:bg-primary transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Submit First Advertisement
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Business & Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {ad.creativeUrl ? (
                          <div
                            onClick={() => setSelectedAd(ad)}
                            className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-deep-maroon/30 transition-all"
                            title="Click to view ad creative"
                          >
                            <img src={ad.creativeUrl} alt={ad.businessName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <span className="material-symbols-outlined text-lg">image</span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 text-sm">
                            {ad.businessName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-[220px]">
                            {ad.tagline || ad.title}
                          </div>
                          {ad.category && (
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {ad.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tier / Slot */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {AD_TIERS[ad.tier]?.name || ad.tier}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Slot: <strong className="text-slate-600">{ad.slot}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {AD_TIERS[ad.tier]?.dimensions}
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-deep-maroon">
                        {ad.targetingMode === 'ALL_KERALA'
                          ? 'All Kerala (Statewide)'
                          : ad.targetDistricts
                          ? ad.targetDistricts.join(', ')
                          : franchiseData?.location || 'Territory'}
                      </span>
                    </td>

                    {/* Duration & Fee */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-deep-maroon text-sm">
                        ₹{(ad.amount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ad.duration || '1 Month'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ad.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ad.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {ad.status === 'APPROVED' ? 'Active & Approved' : ad.status === 'PENDING' ? 'Under Review' : 'Rejected'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAd(ad)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: SUBMIT NEW AD ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/10 px-2 py-0.5 rounded">
                  Franchise Ad Submission Form
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  Submit Local Vendor Advertisement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitAd} className="space-y-4 text-xs">
              {/* 1. Placement Format Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                  1. Select Ad Placement &amp; Format *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(AD_TIERS).map((tier) => {
                    const isSelected = formTier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setFormTier(tier.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-deep-maroon bg-deep-maroon/5 ring-2 ring-deep-maroon/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon">
                            {tier.id}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-deep-maroon text-sm">check_circle</span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs mt-1">{tier.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tier.dimensions}</p>
                        <div className="font-bold text-deep-maroon text-xs mt-2">
                          ₹{tier.monthlyPrice.toLocaleString()} / mo
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Business Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g. Cochin Palace Kalyana Mandapam"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Vendor Business Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon bg-white text-xs cursor-pointer"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Ad Copy & Destination Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Ad Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Kerala’s Grandest Air-Conditioned Mandapam"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Destination URL / WhatsApp Link *
                  </label>
                  <input
                    type="url"
                    required
                    name="targetUrl"
                    value={formData.targetUrl}
                    onChange={handleInputChange}
                    placeholder="https://... or https://wa.me/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tagline / Ad Copy Description *
                </label>
                <textarea
                  required
                  rows={2}
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="e.g. 2500 seating capacity, 400 vehicle parking, centralized AC, and traditional Kerala architecture."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon bg-white text-xs resize-none"
                />
              </div>

              {/* 4. Creative Artwork Upload */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-deep-maroon">add_photo_alternate</span>
                    Upload Banner Artwork Image (JPG, PNG)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Recommended: {AD_TIERS[formTier]?.dimensions}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:border-deep-maroon text-slate-700 rounded-xl font-bold cursor-pointer transition-all text-center shrink-0">
                    <span>Browse Creative File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-slate-500 truncate flex-1">
                    {creativeFileName || 'No custom file selected (Sample ready-made banner will be used)'}
                  </span>

                  {/* Quick sample pickers */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCreativePreview('/ad_mandapam.jpg')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Mandapam
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreativePreview('/ad_jewellery.jpg')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Jewellery
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreativePreview('/ad_saree.jpg')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Sarees
                    </button>
                  </div>
                </div>

                {creativePreview && (
                  <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-center max-h-40 overflow-hidden">
                    <img
                      src={creativePreview}
                      alt="Banner Preview"
                      className="max-h-36 w-auto max-w-full object-contain rounded"
                    />
                  </div>
                )}
              </div>

              {/* 5. Targeting, Duration & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                {/* Target Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Target Region Preference
                  </label>
                  <select
                    value={targetingMode}
                    onChange={(e) => setTargetingMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold cursor-pointer"
                  >
                    <option value="FRANCHISE_TERRITORY">
                      Franchise Territory ({franchiseData?.location || 'Local'})
                    </option>
                    <option value="ALL_KERALA">All Kerala (Statewide Reach)</option>
                    <option value="SPECIFIC_DISTRICTS">Select Specific Districts</option>
                  </select>

                  {targetingMode === 'SPECIFIC_DISTRICTS' && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-28 overflow-y-auto grid grid-cols-2 gap-1 text-[10px]">
                      {KERALA_DISTRICTS.map((d) => (
                        <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDistricts.includes(d)}
                            onChange={() => toggleDistrict(d)}
                            className="rounded text-deep-maroon"
                          />
                          <span>{d}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Duration &amp; Campaign Fee
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormDuration('weekly')}
                      className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border cursor-pointer ${
                        formDuration === 'weekly'
                          ? 'border-deep-maroon bg-deep-maroon text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDuration('monthly')}
                      className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border cursor-pointer ${
                        formDuration === 'monthly'
                          ? 'border-deep-maroon bg-deep-maroon text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDuration('quarterly')}
                      className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border cursor-pointer ${
                        formDuration === 'quarterly'
                          ? 'border-deep-maroon bg-deep-maroon text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      3 Months
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-[10px] text-slate-400">Total Campaign Value: </span>
                    <strong className="text-sm font-bold text-deep-maroon">
                      ₹{getCalculatedPrice().toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 6. Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Vendor Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder={franchiseData?.owner || 'Contact Name'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Vendor Contact Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={franchiseData?.mobile_number || '+91 98470 ...'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-deep-maroon hover:bg-primary text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>{isSubmitting ? 'Submitting...' : 'Submit for Super Admin Approval'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW AD DETAILS ── */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-deep-maroon bg-deep-maroon/10 px-2 py-0.5 rounded">
                  {selectedAd.tier} Placement
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  {selectedAd.businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAd(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              {/* Creative Artwork Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-deep-maroon">photo_library</span>
                    Uploaded Artwork Banner
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {AD_TIERS[selectedAd.tier]?.dimensions || selectedAd.tier}
                  </span>
                </div>

                {selectedAd.creativeUrl ? (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
                    <img
                      src={selectedAd.creativeUrl}
                      alt={selectedAd.businessName}
                      className="max-h-48 w-auto max-w-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-center text-slate-400">
                    No custom graphic file
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Headline &amp; Copy:</span>
                <p className="font-semibold text-slate-800">{selectedAd.title}</p>
                <p className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedAd.tagline}
                </p>
              </div>

              {selectedAd.targetUrl && (
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">Destination Link:</span>
                  <a
                    href={selectedAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-deep-maroon hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{selectedAd.targetUrl}</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400">Target Region:</span>
                  <div className="font-bold text-deep-maroon">
                    {selectedAd.targetDistricts ? selectedAd.targetDistricts.join(', ') : 'All Kerala'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Duration &amp; Fee:</span>
                  <div className="font-bold text-deep-maroon">
                    ₹{(selectedAd.amount || 0).toLocaleString()} ({selectedAd.duration})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Review Status:</span>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedAd.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedAd.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedAd.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Submission Date:</span>
                  <div className="font-bold text-slate-700">
                    {new Date(selectedAd.requestedAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAd(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
