import React, { useState, useEffect } from 'react';
import {
  getStoredAds,
  saveStoredAds,
  getStoredAdTiers,
  saveStoredAdTiers,
  resetAdTiersToDefaults,
  INITIAL_AD_TIERS,
} from '../../data/staticAds';
import AdPlacementPreviewModal from '../../components/AdPlacementPreviewModal';

// ─── Tier accent colours (one per tier) ──────────────────────────────────────
const TIER_META = {
  LEADERBOARD: {
    icon: 'leaderboard',
    gradient: 'from-amber-50 to-amber-100/60',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    accent: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  INFEED_CARD: {
    icon: 'view_agenda',
    gradient: 'from-sky-50 to-sky-100/60',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-800',
    accent: 'text-sky-700',
    dot: 'bg-sky-400',
  },
  SIDEBAR: {
    icon: 'space_dashboard',
    gradient: 'from-violet-50 to-violet-100/60',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-800',
    accent: 'text-violet-700',
    dot: 'bg-violet-400',
  },
};

// ─── Placement Plans & Pricing Tab ──────────────────────────────────────────
function PlansTab() {
  const [tiers, setTiers] = useState(() => getStoredAdTiers());
  const [editingTier, setEditingTier] = useState(null); // key like 'LEADERBOARD'
  const [previewTier, setPreviewTier] = useState(null);
  const [form, setForm] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [hasCustom, setHasCustom] = useState(false);

  // Detect if tiers have been customised vs defaults
  useEffect(() => {
    const defaultKeys = Object.keys(INITIAL_AD_TIERS);
    const current = getStoredAdTiers();
    const isCustom = defaultKeys.some(
      (k) =>
        current[k].monthlyPrice !== INITIAL_AD_TIERS[k].monthlyPrice ||
        current[k].weeklyPrice !== INITIAL_AD_TIERS[k].weeklyPrice ||
        current[k].description !== INITIAL_AD_TIERS[k].description ||
        current[k].idealFor !== INITIAL_AD_TIERS[k].idealFor
    );
    setHasCustom(isCustom);
  }, [tiers]);

  const openEdit = (key) => {
    setEditingTier(key);
    setForm({ ...tiers[key] });
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const monthly = Number(form.monthlyPrice);
    const weekly = Number(form.weeklyPrice);
    if (isNaN(monthly) || monthly < 1) {
      alert('Monthly price must be a valid positive number.');
      return;
    }
    if (isNaN(weekly) || weekly < 1) {
      alert('Weekly price must be a valid positive number.');
      return;
    }
    const updated = {
      ...tiers,
      [editingTier]: {
        ...tiers[editingTier],
        monthlyPrice: monthly,
        weeklyPrice: weekly,
        description: form.description || tiers[editingTier].description,
        idealFor: form.idealFor || tiers[editingTier].idealFor,
      },
    };
    saveStoredAdTiers(updated);
    setTiers(updated);
    setEditingTier(null);
    setSuccessMsg(`"${INITIAL_AD_TIERS[editingTier]?.name}" pricing updated successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all ad tier prices and descriptions back to factory defaults? This cannot be undone.'
      )
    ) {
      resetAdTiersToDefaults();
      setTiers(getStoredAdTiers());
      setSuccessMsg('Ad tier pricing reset to factory defaults.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const tierKeys = Object.keys(INITIAL_AD_TIERS);

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-deep-maroon/5 border border-deep-maroon/15">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-deep-maroon text-xl mt-0.5">
            price_change
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Ad Placement Plan Pricing
            </p>
            <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
              Configure the rates displayed to public advertisers on the
              "Advertise With Us" page and to franchise partners. Changes take
              effect immediately site-wide.
            </p>
          </div>
        </div>
        {hasCustom && (
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset to Defaults
          </button>
        )}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {successMsg}
          </span>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tierKeys.map((key) => {
          const tier = tiers[key];
          const meta = TIER_META[key] || TIER_META.LEADERBOARD;
          const isCustomised =
            tier.monthlyPrice !== INITIAL_AD_TIERS[key].monthlyPrice ||
            tier.weeklyPrice !== INITIAL_AD_TIERS[key].weeklyPrice;

          return (
            <div
              key={key}
              className={`relative rounded-2xl border bg-gradient-to-br ${meta.gradient} ${meta.border} p-5 flex flex-col gap-4 shadow-xs hover:shadow-md transition-shadow`}
            >
              {/* Custom pricing indicator */}
              {isCustomised && (
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-deep-maroon text-white">
                  Custom
                </span>
              )}

              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.badge}`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {meta.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight">
                    {tier.name}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-slate-500">
                    {tier.badge}
                  </p>
                </div>
              </div>

              {/* Dimensions */}
              <div className="text-[11px] text-slate-600 bg-white/70 rounded-lg px-3 py-2 border border-white/80">
                <span className="font-semibold text-slate-500">Dimensions: </span>
                {tier.dimensions}
              </div>

              {/* Pricing display */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Monthly Rate</span>
                  <span className={`font-extrabold text-base ${meta.accent}`}>
                    ₹{Number(tier.monthlyPrice).toLocaleString()}
                    <span className="text-[10px] font-semibold text-slate-400 ml-0.5">/ mo</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Weekly Rate</span>
                  <span className="font-bold text-sm text-slate-700">
                    ₹{Number(tier.weeklyPrice).toLocaleString()}
                    <span className="text-[10px] font-semibold text-slate-400 ml-0.5">/ wk</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Quarterly (15% off)</span>
                  <span className="font-bold text-sm text-emerald-700">
                    ₹{Math.round(Number(tier.monthlyPrice) * 3 * 0.85).toLocaleString()}
                    <span className="text-[10px] font-semibold text-slate-400 ml-0.5">/ 3 mo</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3 border-t border-black/5 pt-3">
                {tier.description}
              </p>

              {/* Ideal For */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ideal For:
                </span>
                <p className="text-xs text-slate-700 font-medium mt-0.5 line-clamp-2">
                  {tier.idealFor}
                </p>
              </div>

              {/* Action buttons: Preview and Edit */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPreviewTier(key)}
                  className="py-2 px-3 rounded-xl border border-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-deep-maroon shadow-2xs"
                  title="See how this ad renders on the live site"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(key)}
                  className="py-2 px-3 rounded-xl border border-deep-maroon/20 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-deep-maroon text-white hover:bg-primary shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Pricing
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Default Pricing Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-slate-500">table_chart</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Default Pricing Reference
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600 text-left">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ad Placement / Tier</th>
                <th className="py-3 px-4">Dimensions</th>
                <th className="py-3 px-4">Default Monthly</th>
                <th className="py-3 px-4">Default Weekly</th>
                <th className="py-3 px-4">Current Monthly</th>
                <th className="py-3 px-4">Current Weekly</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tierKeys.map((key) => {
                const def = INITIAL_AD_TIERS[key];
                const cur = tiers[key];
                const priceChanged =
                  cur.monthlyPrice !== def.monthlyPrice ||
                  cur.weeklyPrice !== def.weeklyPrice;
                return (
                  <tr key={key} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{def.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{key}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{def.dimensions}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      ₹{def.monthlyPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      ₹{def.weeklyPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-deep-maroon">
                      ₹{Number(cur.monthlyPrice).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-deep-maroon">
                      ₹{Number(cur.weeklyPrice).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {priceChanged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Default
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${TIER_META[editingTier]?.badge}`}
                >
                  {editingTier} Placement
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  Edit Pricing &amp; Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Info Note */}
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px]">
              <span className="font-bold">Note:</span> Updated prices will be instantly reflected on
              the public Advertise With Us page and in the Franchise Ads Manager.
            </div>

            {/* Pricing Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Monthly Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={form.monthlyPrice}
                    onChange={(e) => handleFormChange('monthlyPrice', e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default: ₹{INITIAL_AD_TIERS[editingTier]?.monthlyPrice?.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Weekly Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={form.weeklyPrice}
                    onChange={(e) => handleFormChange('weeklyPrice', e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default: ₹{INITIAL_AD_TIERS[editingTier]?.weeklyPrice?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Live Quarterly Calculation */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="font-bold">Quarterly Rate (auto): </span>
              ₹{Math.round(Number(form.monthlyPrice || 0) * 3 * 0.85).toLocaleString()}
              <span className="text-emerald-600 ml-1">(15% discount applied)</span>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Placement Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon transition-all resize-none"
              />
            </div>

            {/* Ideal For */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Best Suited For (Advertiser Types)
              </label>
              <input
                type="text"
                value={form.idealFor}
                onChange={(e) => handleFormChange('idealFor', e.target.value)}
                placeholder="e.g. Wedding Jewellers, Mandapams, Caterers"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setForm({ ...INITIAL_AD_TIERS[editingTier] });
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reset This Plan
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-deep-maroon hover:bg-primary shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placement Live-Site Preview Modal */}
      <AdPlacementPreviewModal
        isOpen={Boolean(previewTier)}
        tierKey={previewTier}
        onClose={() => setPreviewTier(null)}
      />
    </div>
  );
}

// ─── Main AdsManagement Component ────────────────────────────────────────────
export default function AdsManagement() {
  // ── Top-level section tabs ───────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('moderation'); // 'moderation' | 'plans'

  // ── Ad Requests State ────────────────────────────────────────────────────
  const [ads, setAds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('APPROVED'); // Defaults to Active Ads, requests in PENDING tab
  const [selectedAd, setSelectedAd] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Load live tiers so the table column shows the current pricing
  const [liveTiers, setLiveTiers] = useState(() => getStoredAdTiers());

  useEffect(() => {
    setAds(getStoredAds());
  }, []);

  // Keep liveTiers in sync after Super Admin edits in PlansTab
  useEffect(() => {
    const handleStorage = () => setLiveTiers(getStoredAdTiers());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleUpdateStatus = (adId, newStatus) => {
    const updated = ads.map((a) => {
      if (a.id === adId) {
        return {
          ...a,
          status: newStatus,
          badge:
            newStatus === 'APPROVED'
              ? a.badge === 'NEW APPLICANT'
                ? 'SPONSORED VENDOR'
                : a.badge
              : a.badge,
          reviewedAt: new Date().toISOString(),
        };
      }
      return a;
    });
    setAds(updated);
    saveStoredAds(updated);
    if (selectedAd && selectedAd.id === adId) {
      setSelectedAd((prev) => ({ ...prev, status: newStatus }));
    }
    const label =
      newStatus === 'APPROVED'
        ? 'resumed & active live on site'
        : newStatus === 'PAUSED'
        ? 'paused and taken offline'
        : newStatus === 'REJECTED'
        ? 'rejected'
        : newStatus.toLowerCase();
    setActionSuccessMsg(`Advertisement successfully ${label}!`);
    setTimeout(() => setActionSuccessMsg(''), 3500);
  };

  const requestPause = (ad) => {
    setConfirmDialog({
      ad,
      type: 'PAUSE',
      title: 'Pause Advertisement Campaign?',
      subtitle: `Are you sure you want to pause "${ad.businessName}"?`,
      description:
        'This campaign will be temporarily paused and taken offline from public search and banners. You can resume it at any time with one click.',
      confirmText: 'Yes, Pause Campaign',
      confirmColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: 'pause_circle',
      iconBg: 'bg-amber-100 text-amber-700',
      onConfirm: () => {
        handleUpdateStatus(ad.id, 'PAUSED');
        setConfirmDialog(null);
      },
    });
  };

  const requestReject = (ad) => {
    setConfirmDialog({
      ad,
      type: 'REJECT',
      title: 'Reject Ad Submission?',
      subtitle: `Are you sure you want to reject "${ad.businessName}"?`,
      description:
        'This placement will not go live and will be moved to the Rejected tab. You can review and approve it later at any time from the Rejected tab.',
      confirmText: 'Yes, Reject Request',
      confirmColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: 'cancel',
      iconBg: 'bg-rose-100 text-rose-700',
      onConfirm: () => {
        handleUpdateStatus(ad.id, 'REJECTED');
        setConfirmDialog(null);
      },
    });
  };

  const requestResume = (ad) => {
    setConfirmDialog({
      ad,
      type: 'RESUME',
      title: 'Resume Advertisement Campaign?',
      subtitle: `Publish "${ad.businessName}" back to the live site?`,
      description: `This advertisement will immediately go back live in its designated ${liveTiers[ad.tier]?.name || ad.tier} placement slot.`,
      confirmText: 'Yes, Resume Live',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: 'play_arrow',
      iconBg: 'bg-emerald-100 text-emerald-700',
      onConfirm: () => {
        handleUpdateStatus(ad.id, 'APPROVED');
        setConfirmDialog(null);
      },
    });
  };

  const requestApprove = (ad) => {
    setConfirmDialog({
      ad,
      type: 'APPROVE',
      title: 'Approve & Publish Advertisement?',
      subtitle: `Approve "${ad.businessName}" and publish it live?`,
      description: `This advertisement will be approved and placed live immediately in its designated ${liveTiers[ad.tier]?.name || ad.tier} placement slot.`,
      confirmText: 'Yes, Approve & Publish',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: 'check_circle',
      iconBg: 'bg-emerald-100 text-emerald-700',
      onConfirm: () => {
        handleUpdateStatus(ad.id, 'APPROVED');
        setConfirmDialog(null);
      },
    });
  };

  const handleDeleteAd = (adId) => {
    if (window.confirm('Are you sure you want to delete this ad request?')) {
      const updated = ads.filter((a) => a.id !== adId);
      setAds(updated);
      saveStoredAds(updated);
      if (selectedAd && selectedAd.id === adId) setSelectedAd(null);
      setActionSuccessMsg('Advertisement record removed.');
      setTimeout(() => setActionSuccessMsg(''), 3500);
    }
  };

  const pendingCount = ads.filter((a) => a.status === 'PENDING').length;
  const approvedCount = ads.filter((a) => a.status === 'APPROVED').length;
  const pausedCount = ads.filter((a) => a.status === 'PAUSED').length;
  const rejectedCount = ads.filter((a) => a.status === 'REJECTED').length;

  const filteredAds = ads.filter((ad) => {
    if (activeFilter === 'ALL') return true;
    return ad.status === activeFilter;
  });

  const totalRevenue = ads
    .filter((a) => a.status === 'APPROVED')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalClicks = ads
    .filter((a) => a.status === 'APPROVED')
    .reduce((sum, a) => sum + (Number(a.clicks) || 0), 0);
  const totalImpressions = ads
    .filter((a) => a.status === 'APPROVED')
    .reduce((sum, a) => sum + (Number(a.impressions) || 0), 0);
  const overallCtr = totalImpressions > 0 
    ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%' 
    : '4.4%';

  const SECTION_TABS = [
    {
      key: 'moderation',
      label: 'Ad Requests & Moderation',
      icon: 'campaign',
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      key: 'plans',
      label: 'Placement Plans & Pricing',
      icon: 'price_change',
      badge: null,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Advertisement &amp; Sponsorship Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review incoming ad placement requests from Kerala wedding vendors, approve creatives, and
            manage ad plan pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
            <span className="material-symbols-outlined text-sm">campaign</span>
            {pendingCount} Pending Review
          </span>
        </div>
      </div>

      {/* ── Summary Metric Cards (always visible) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Submissions
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{ads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Awaiting Approval
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Active Approved Ads
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200 bg-sky-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
              Total Ad Clicks
            </p>
            <span className="material-symbols-outlined text-[15px] text-sky-600">ads_click</span>
          </div>
          <p className="text-2xl font-bold text-sky-900 mt-1">
            {totalClicks.toLocaleString()}
          </p>
          <p className="text-[10px] text-sky-600 mt-0.5 font-medium">
            Active campaign clicks
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs col-span-2 md:col-span-1">
          <p className="text-[11px] font-semibold text-deep-maroon uppercase tracking-wider">
            Est. Ad Revenue
          </p>
          <p className="text-2xl font-bold text-deep-maroon mt-1">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Top-Level Section Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSection(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 font-bold text-xs whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px ${
              activeSection === tab.key
                ? 'border-deep-maroon text-deep-maroon'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            {tab.badge !== null && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: Ad Requests & Moderation                                    */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'moderation' && (
        <div className="space-y-4">
          {actionSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {actionSuccessMsg}
              </span>
              <button
                onClick={() => setActionSuccessMsg('')}
                className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Status Filter Sub-tabs */}
          <div className="flex items-center gap-2 pb-1 overflow-x-auto">
            {[
              { key: 'APPROVED', label: 'Active Ads', count: approvedCount, icon: 'verified' },
              {
                key: 'PENDING',
                label: 'Pending Requests',
                count: pendingCount,
                icon: 'pending_actions',
                isPending: true,
              },
              {
                key: 'PAUSED',
                label: 'Paused Ads',
                count: pausedCount,
                icon: 'pause_circle',
              },
              {
                key: 'REJECTED',
                label: 'Rejected',
                count: rejectedCount,
                icon: 'cancel',
              },
              { key: 'ALL', label: 'All Ads Log', count: ads.length, icon: 'history' },
            ].map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-deep-maroon text-white shadow-xs'
                      : tab.isPending && pendingCount > 0
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.isPending && pendingCount > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clean, Non-Congested Ads Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-[30%]">Advertiser &amp; Creative</th>
                    <th className="py-2.5 px-2.5 w-[22%]">Placement</th>
                    <th className="py-2.5 px-2 w-[11%]">Clicks</th>
                    <th className="py-2.5 px-2.5 w-[12%]">Plan &amp; Fee</th>
                    <th className="py-2.5 px-2 w-[10%]">Status</th>
                    <th className="py-2.5 px-3 w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-1">
                          <span className="material-symbols-outlined text-3xl text-slate-300">
                            {activeFilter === 'PENDING' ? 'task_alt' : 'campaign'}
                          </span>
                          <p className="font-semibold text-slate-600">
                            {activeFilter === 'PENDING'
                              ? 'No pending ad requests'
                              : activeFilter === 'PAUSED'
                              ? 'No paused advertisements'
                              : activeFilter === 'REJECTED'
                              ? 'No rejected advertisements'
                              : `No ads found under ${activeFilter.toLowerCase()}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {activeFilter === 'PENDING'
                              ? 'All incoming vendor submissions have been moderated.'
                              : activeFilter === 'PAUSED'
                              ? 'Any campaigns you temporarily pause will appear here.'
                              : activeFilter === 'REJECTED'
                              ? 'Rejected requests appear here and can be approved later.'
                              : 'Check other status tabs or add a new campaign.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Business & Creative Thumbnail */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {ad.creativeUrl ? (
                              <div
                                onClick={() => setSelectedAd(ad)}
                                className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-deep-maroon/30 transition-all shadow-2xs"
                                title="Click to view ad creative"
                              >
                                <img
                                  src={ad.creativeUrl}
                                  alt={ad.businessName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                <span className="material-symbols-outlined text-[15px]">image</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div
                                onClick={() => setSelectedAd(ad)}
                                className="font-bold text-slate-900 text-[11px] truncate hover:text-deep-maroon cursor-pointer transition-colors"
                                title={ad.businessName}
                              >
                                {ad.businessName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-slate-400 truncate">
                                <span>{ad.category || 'Vendor'}</span>
                                {ad.submittedBy && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 text-[8.5px] shrink-0">
                                      {ad.submittedBy}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier / Slot */}
                        <td className="py-2.5 px-2.5">
                          <div className="font-semibold text-slate-800 text-[11px] truncate" title={liveTiers[ad.tier]?.name || ad.tier}>
                            {liveTiers[ad.tier]?.name || ad.tier}
                          </div>
                          <div className="text-[9.5px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                            <span className="truncate">
                              {ad.slot === 'SEARCH_INFEED'
                                ? 'In-Feed'
                                : ad.slot === 'SEARCH_TOP'
                                ? 'Top Leaderboard'
                                : 'Sidebar'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-deep-maroon font-medium truncate">
                              {ad.targetingMode === 'ALL_KERALA' || !ad.targetDistricts
                                ? 'All Kerala'
                                : ad.targetDistricts[0]}
                            </span>
                          </div>
                        </td>

                        {/* Clicks (Only click count, no views, no CTR) */}
                        <td className="py-2.5 px-2">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-100 text-sky-900 font-bold text-[10.5px]">
                            <span className="material-symbols-outlined text-[13px] text-sky-600">
                              ads_click
                            </span>
                            <span>{(ad.clicks || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="py-2.5 px-2.5">
                          <div className="font-bold text-deep-maroon text-[11px]">
                            ₹{(ad.amount || liveTiers[ad.tier]?.monthlyPrice || 0).toLocaleString()}
                          </div>
                          <div className="text-[9.5px] text-slate-400 mt-0.5">
                            {ad.duration || '1 Month'}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              ad.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ad.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : ad.status === 'PAUSED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {ad.status === 'APPROVED'
                              ? 'Active'
                              : ad.status === 'PENDING'
                              ? 'Pending'
                              : ad.status === 'PAUSED'
                              ? 'Paused'
                              : 'Rejected'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {ad.status === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAd(ad)}
                                  className="px-2 py-0.5 bg-deep-maroon hover:bg-primary text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer shadow-xs"
                                >
                                  Review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(ad.id, 'APPROVED')}
                                  title="Approve & Publish Ad"
                                  className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[17px]">
                                    check_circle
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestReject(ad)}
                                  title="Reject Ad"
                                  className="p-0.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[17px]">
                                    cancel
                                  </span>
                                </button>
                              </>
                            ) : ad.status === 'APPROVED' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAd(ad)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestPause(ad)}
                                  title="Pause Campaign"
                                  className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[13px]">
                                    pause_circle
                                  </span>
                                  <span>Pause</span>
                                </button>
                              </>
                            ) : ad.status === 'PAUSED' ? (
                              /* PAUSED: Show Resume button */
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAd(ad)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestResume(ad)}
                                  title="Resume Campaign"
                                  className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[13px]">
                                    play_arrow
                                  </span>
                                  <span>Resume</span>
                                </button>
                              </>
                            ) : (
                              /* REJECTED: Show Approve button (can be approved later!) */
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAd(ad)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestApprove(ad)}
                                  title="Approve & Publish Ad"
                                  className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[13px]">
                                    check_circle
                                  </span>
                                  <span>Approve</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: Placement Plans & Pricing                                   */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'plans' && <PlansTab />}

      {/* ── View / Review Modal (Moderation) ── */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
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
                title="Close"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs text-slate-600">
              {/* ── Creative Preview ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-deep-maroon">
                      photo_library
                    </span>
                    Uploaded Ad Creative / Artwork
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {liveTiers[selectedAd.tier]?.dimensions || selectedAd.tier}
                  </span>
                </div>

                {selectedAd.creativeUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2 shadow-inner">
                      <img
                        src={selectedAd.creativeUrl}
                        alt={selectedAd.businessName}
                        className="max-h-56 w-auto max-w-full object-contain rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] px-0.5">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Creative file uploaded &amp; ready
                      </span>
                      <a
                        href={selectedAd.creativeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-deep-maroon hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Open Full Creative</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-white text-center space-y-1">
                    <span className="material-symbols-outlined text-2xl text-slate-400">
                      image_not_supported
                    </span>
                    <p className="text-xs font-bold text-slate-700">No Custom Graphic Uploaded</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      The advertiser did not attach a custom artwork file. A standardized brand card
                      will be used.
                    </p>
                  </div>
                )}
              </div>

              {/* Ad Copy */}
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Ad Title / Headline:</span>
                <p className="font-semibold text-slate-800 text-sm">{selectedAd.title}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Ad Copy / Tagline:</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedAd.tagline}
                </p>
              </div>

              {/* Ad Performance Analytics Card */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-sky-600">
                      ads_click
                    </span>
                    Ad Engagement
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    selectedAd.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedAd.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {selectedAd.status === 'APPROVED' ? 'Active Tracking' : 'Awaiting Publication'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-sky-100 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block">Total User Clicks</span>
                    <span className="text-[10px] text-slate-400">Total clicks on this campaign creative</span>
                  </div>
                  <span className="text-xl font-black text-sky-900 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-sky-600">ads_click</span>
                    {(selectedAd.clicks || 0).toLocaleString()}
                  </span>
                </div>
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

              {selectedAd.notes && (
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">
                    Special Instructions:
                  </span>
                  <p className="text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    &ldquo;{selectedAd.notes}&rdquo;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400">Contact Person:</span>
                  <div className="font-bold text-slate-700">{selectedAd.contactPerson}</div>
                </div>
                <div>
                  <span className="text-slate-400">Phone / WhatsApp:</span>
                  <div className="font-bold text-slate-700">{selectedAd.phone}</div>
                </div>
                <div>
                  <span className="text-slate-400">Target Region:</span>
                  <div className="font-bold text-deep-maroon">
                    {selectedAd.targetingMode === 'ALL_KERALA' || !selectedAd.targetDistricts
                      ? 'All Kerala (Statewide)'
                      : selectedAd.targetDistricts.join(', ')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Placement Slot:</span>
                  <div className="font-bold text-slate-700">{selectedAd.slot}</div>
                </div>
                <div>
                  <span className="text-slate-400">Calculated Fee:</span>
                  <div className="font-bold text-deep-maroon">
                    ₹{(selectedAd.amount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Submission Date:</span>
                  <div className="font-bold text-slate-700">
                    {new Date(selectedAd.requestedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Submission Origin:</span>
                  <div className="font-bold text-slate-700">
                    {selectedAd.submittedBy ? (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-mono text-[10px]">
                        Franchise: {selectedAd.submittedBy}
                        {selectedAd.franchiseName ? ` (${selectedAd.franchiseName})` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-600">Direct Public Advertiser</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => handleDeleteAd(selectedAd.id)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Delete Request
              </button>
              <div className="flex items-center gap-2">
                {selectedAd.status === 'APPROVED' ? (
                  <button
                    type="button"
                    onClick={() => requestPause(selectedAd)}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">pause_circle</span>
                    Pause Campaign
                  </button>
                ) : selectedAd.status === 'PENDING' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => requestReject(selectedAd)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Reject Submission
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedAd.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve &amp; Publish Ad
                    </button>
                  </>
                ) : selectedAd.status === 'PAUSED' ? (
                  /* PAUSED: Resume button */
                  <button
                    type="button"
                    onClick={() => requestResume(selectedAd)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Resume &amp; Publish Ad
                  </button>
                ) : (
                  /* REJECTED: Approve button (can be approved later!) */
                  <button
                    type="button"
                    onClick={() => requestApprove(selectedAd)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve &amp; Publish Ad
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal (for Pause, Reject, Resume) ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in text-left">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${confirmDialog.iconBg}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmDialog.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {confirmDialog.subtitle}
                </p>
              </div>
            </div>

            {/* Ad summary pill */}
            {confirmDialog.ad && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                {confirmDialog.ad.creativeUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-900">
                    <img
                      src={confirmDialog.ad.creativeUrl}
                      alt={confirmDialog.ad.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                    <span className="material-symbols-outlined text-base">campaign</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {confirmDialog.ad.businessName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {liveTiers[confirmDialog.ad.tier]?.name || confirmDialog.ad.tier} •{' '}
                    {confirmDialog.ad.duration || '1 Month'}
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${confirmDialog.confirmColor}`}
              >
                <span className="material-symbols-outlined text-sm">{confirmDialog.icon}</span>
                <span>{confirmDialog.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
