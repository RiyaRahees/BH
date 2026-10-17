import React, { useState, useEffect } from 'react';
import { getStoredAds, saveStoredAds, AD_TIERS } from '../../data/staticAds';

export default function AdsManagement() {
  const [ads, setAds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [selectedAd, setSelectedAd] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    setAds(getStoredAds());
  }, []);

  const handleUpdateStatus = (adId, newStatus) => {
    const updated = ads.map(a => {
      if (a.id === adId) {
        return {
          ...a,
          status: newStatus,
          badge: newStatus === 'APPROVED' ? (a.badge === 'NEW APPLICANT' ? 'SPONSORED VENDOR' : a.badge) : a.badge,
          reviewedAt: new Date().toISOString()
        };
      }
      return a;
    });
    setAds(updated);
    saveStoredAds(updated);
    if (selectedAd && selectedAd.id === adId) {
      setSelectedAd(prev => ({ ...prev, status: newStatus }));
    }
    setActionSuccessMsg(`Advertisement request successfully marked as ${newStatus}!`);
    setTimeout(() => setActionSuccessMsg(''), 3500);
  };

  const handleDeleteAd = (adId) => {
    if (window.confirm('Are you sure you want to delete this ad request?')) {
      const updated = ads.filter(a => a.id !== adId);
      setAds(updated);
      saveStoredAds(updated);
      if (selectedAd && selectedAd.id === adId) {
        setSelectedAd(null);
      }
      setActionSuccessMsg('Advertisement record removed.');
      setTimeout(() => setActionSuccessMsg(''), 3500);
    }
  };

  const filteredAds = ads.filter(ad => {
    if (activeFilter === 'ALL') return true;
    return ad.status === activeFilter;
  });

  const pendingCount = ads.filter(a => a.status === 'PENDING').length;
  const approvedCount = ads.filter(a => a.status === 'APPROVED').length;
  const totalRevenue = ads
    .filter(a => a.status === 'APPROVED')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  return (
    <div className="space-y-6 text-left">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Advertisement & Sponsorship Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review incoming ad placement requests from Kerala wedding vendors, approve creatives, and monitor active sponsorships.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
            <span className="material-symbols-outlined text-sm">campaign</span> {pendingCount} Pending Review
          </span>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{ads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Awaiting Approval</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active Approved Ads</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-deep-maroon uppercase tracking-wider">Est. Ad Revenue</p>
          <p className="text-2xl font-bold text-deep-maroon mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {actionSuccessMsg}
          </span>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: `All Requests (${ads.length})` },
          { key: 'PENDING', label: `Pending (${pendingCount})` },
          { key: 'APPROVED', label: `Approved & Active (${approvedCount})` },
          { key: 'REJECTED', label: 'Rejected' },
        ].map(tab => (
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

      {/* ── Table & Content ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Advertiser & Creative</th>
                <th className="py-3 px-4">Placement / Tier</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Duration & Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No advertisements found under {activeFilter.toLowerCase()} status.
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Business & Creative Thumbnail */}
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
                          {ad.submittedBy && (
                            <span className="inline-block mt-1 ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Franchise: {ad.submittedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tier / Slot */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">
                        {AD_TIERS[ad.tier]?.name || ad.tier}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Slot: <strong className="text-slate-600">{ad.slot}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Region: <span className="font-semibold text-deep-maroon">
                          {ad.targetingMode === 'ALL_KERALA' || !ad.targetDistricts
                            ? 'All Kerala'
                            : ad.targetDistricts.join(', ')}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {ad.contactPerson || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {ad.phone}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {ad.email}
                      </div>
                    </td>

                    {/* Pricing */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-deep-maroon text-sm">
                        ₹{(ad.amount || AD_TIERS[ad.tier]?.monthlyPrice || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {ad.duration || '1 Month'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ad.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ad.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {ad.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAd(ad)}
                          title="View Details"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        {ad.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(ad.id, 'APPROVED')}
                            title="Approve & Publish Ad"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {ad.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(ad.id, 'REJECTED')}
                            title="Reject Ad"
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
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

      {/* ── View / Review Modal ── */}
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
              {/* ── Uploaded Creative Banner / Artwork Preview (Centerpiece) ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-deep-maroon">photo_library</span>
                    Uploaded Ad Creative / Artwork
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {AD_TIERS[selectedAd.tier]?.dimensions || selectedAd.tier}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
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
                    <span className="material-symbols-outlined text-2xl text-slate-400">image_not_supported</span>
                    <p className="text-xs font-bold text-slate-700">No Custom Graphic Uploaded</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      The advertiser did not attach a custom artwork file. A standardized high-contrast brand card with their title &amp; description will be used.
                    </p>
                  </div>
                )}
              </div>

              {/* Ad Copy / Tagline */}
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
                  <span className="text-slate-400 font-medium block mb-0.5">Special Instructions:</span>
                  <p className="text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    "{selectedAd.notes}"
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
                  <div className="font-bold text-deep-maroon">₹{(selectedAd.amount || 0).toLocaleString()}</div>
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

            {/* Action buttons inside modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => handleDeleteAd(selectedAd.id)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Delete Request
              </button>

              <div className="flex items-center gap-2">
                {selectedAd.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedAd.id, 'APPROVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve &amp; Publish Ad
                  </button>
                )}
                {selectedAd.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedAd.id, 'REJECTED')}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
