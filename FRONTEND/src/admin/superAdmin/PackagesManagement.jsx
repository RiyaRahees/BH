import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

const ALL_AVAILABLE_FEATURES = [
  "Profile Listing",
  "Browse Profiles",
  "View Photos & Horoscopes",
  "Detailed Profile Info",
  "Direct Chat & Messaging",
  "View Contact Numbers",
  "Download Horoscope",
  "Premium Profile Badge",
  "Video Calling"
];
export default function PackagesManagement() {
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null); // For edit modal
  const [editingFields, setEditingFields] = useState({
    name: '',
    price: 0,
    duration: '',
    status: '',
    features: []
  });
  const [selectedFeatureToAdd, setSelectedFeatureToAdd] = useState('');
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axiosInstance.get('/admin/plans');
        setPackages(response.data.plans);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch packages:', err);
        setError('Failed to load packages. Please try again.');
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleOpenEdit = (pkg) => {
    setSelectedPackage(pkg);
    setEditingFields({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      status: pkg.status,
      features: [...pkg.features]
    });
    // Find initial feature to select from dropdown
    const remaining = ALL_AVAILABLE_FEATURES.filter(f => !pkg.features.includes(f));
    setSelectedFeatureToAdd(remaining[0] || '');
  };

  const handleUpdateField = (field, value) => {
    setEditingFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFeature = () => {
    if (!selectedFeatureToAdd) return;
    const nextFeatures = [...editingFields.features, selectedFeatureToAdd];
    setEditingFields(prev => ({
      ...prev,
      features: nextFeatures
    }));
    
    // Set next available feature as selected
    const remaining = ALL_AVAILABLE_FEATURES.filter(f => !nextFeatures.includes(f));
    setSelectedFeatureToAdd(remaining[0] || '');
  };

  const handleRemoveFeature = (index) => {
    const removedFeature = editingFields.features[index];
    const nextFeatures = editingFields.features.filter((_, idx) => idx !== index);
    
    setEditingFields(prev => ({
      ...prev,
      features: nextFeatures
    }));

    // Default dropdown selection to the removed one if nothing was selectable
    if (!selectedFeatureToAdd) {
      setSelectedFeatureToAdd(removedFeature);
    }
  };

  const handleSavePackage = async () => {
    if (!editingFields.name.trim() || editingFields.price < 0) {
      toast.error("Please enter a valid package name and price.");
      return;
    }
    
    try {
      const response = await axiosInstance.put(`/admin/plans/${selectedPackage.id}`, {
        name: editingFields.name,
        price: editingFields.price,
        duration: editingFields.duration,
        status: editingFields.status,
        features: editingFields.features
      });
      
      const updatedPlan = response.data.plan;
      setPackages(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
      setSelectedPackage(null);
      toast.success("Package updated successfully!");
    } catch (err) {
      console.error('Failed to update package:', err);
      toast.error('Failed to update package. Please try again.');
    }
  };

  // Features not yet added to editing package
  const remainingFeatures = ALL_AVAILABLE_FEATURES.filter(
    f => !editingFields.features.includes(f)
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
          Packages & Pricing
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure subscription tier rates, durations, and manage functional features for candidates.
        </p>
      </div>

      {/* Package cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div 
            key={pkg.id} 
            className="bg-white rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between overflow-hidden relative"
          >
            {/* Package Header Accent color by price */}
            <div className={`h-1.5 ${
              pkg.price >= 1000 
                ? 'bg-heritage-gold' 
                : pkg.price >= 600
                ? 'bg-deep-maroon'
                : pkg.price >= 400
                ? 'bg-rose-400'
                : 'bg-slate-300'
            }`}></div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              {/* Plan Metadata */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">{pkg.name}</h3>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{pkg.id}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${
                    pkg.status === 'Active'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : 'bg-rose-50 border-rose-100 text-rose-700'
                  }`}>
                    {pkg.status}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Valid: {/^\d+$/.test(String(pkg.duration).trim()) ? `${pkg.duration} Days` : String(pkg.duration).includes('Month') ? `${parseInt(pkg.duration, 10) * 28} Days` : pkg.duration}
                  </span>
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-800">
                  {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                </span>
                {pkg.price > 0 && (
                  <span className="text-[10px] text-slate-455 font-bold">
                    / {/^\d+$/.test(String(pkg.duration).trim()) ? `${pkg.duration} Days` : String(pkg.duration).includes('Month') ? `${parseInt(pkg.duration, 10) * 28} Days` : pkg.duration}
                  </span>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-2 flex-1">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Included Features:</h4>
                <ul className="space-y-1.5 text-xs text-slate-655 font-semibold">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-sm leading-none shrink-0 pt-0.5">
                        check_circle
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(pkg)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-xl text-xs font-bold text-charcoal-text cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Edit Plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit plan modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedPackage(null)}
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
          ></div>

          {/* Modal Container */}
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden border border-slate-200 flex flex-col justify-between animate-scale-up max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Edit subscription details</h3>
                <p className="text-[10px] text-slate-455 mt-0.5">Editing {selectedPackage.id}</p>
              </div>
              <button 
                onClick={() => setSelectedPackage(null)}
                className="text-slate-400 hover:text-slate-655 cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 flex-1">
              
              {/* Name & Pricing Row */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-450 font-bold">Package Name</label>
                  <input
                    type="text"
                    value={editingFields.name}
                    onChange={(e) => handleUpdateField('name', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-450 font-bold">Pricing (₹)</label>
                  <input
                    type="number"
                    value={editingFields.price}
                    onChange={(e) => handleUpdateField('price', parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                  />
                </div>
              </div>

              {/* Duration & Status Row */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-455 font-bold">Plan Duration</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                      className="w-full flex items-center justify-between border border-slate-200 rounded-lg p-2 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon text-left cursor-pointer"
                    >
                      <span>
                        {editingFields.duration ? 
                          (editingFields.duration / 28) + ' Month' + (editingFields.duration / 28 > 1 ? 's' : '') 
                          : 'Select Duration'}
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-lg">
                        {isDurationDropdownOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    
                    {isDurationDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setIsDurationDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {[...Array(12)].map((_, i) => (
                            <button
                              key={i + 1}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 font-medium text-slate-700"
                              onClick={() => {
                                handleUpdateField('duration', (i + 1) * 28);
                                setIsDurationDropdownOpen(false);
                              }}
                            >
                              {i + 1} Month{i + 1 > 1 ? 's' : ''}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 font-medium text-slate-700"
                            onClick={() => {
                              handleUpdateField('duration', 24 * 28);
                              setIsDurationDropdownOpen(false);
                            }}
                          >
                            24 Months
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-455 font-bold">Plan Status</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full flex items-center justify-between border border-slate-200 rounded-lg p-2 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon text-left cursor-pointer"
                    >
                      <span className={editingFields.status === 'Active' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {editingFields.status || 'Select Status'}
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-lg">
                        {isStatusDropdownOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {isStatusDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setIsStatusDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 font-bold text-emerald-600 border-b border-slate-50"
                            onClick={() => {
                              handleUpdateField('status', 'Active');
                              setIsStatusDropdownOpen(false);
                            }}
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 font-bold text-rose-600"
                            onClick={() => {
                              handleUpdateField('status', 'Inactive');
                              setIsStatusDropdownOpen(false);
                            }}
                          >
                            Inactive
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Features List Section */}
              <div className="space-y-3 pt-3 border-t border-slate-150/60">
                <label className="text-[10px] uppercase text-slate-455 font-bold block">Plan Features</label>
                
                {/* Feature Add Dropdown Selection */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      disabled={remainingFeatures.length === 0}
                      onClick={() => setIsFeatureDropdownOpen(!isFeatureDropdownOpen)}
                      className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-deep-maroon text-left cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">
                        {remainingFeatures.length === 0 ? 'All features added' : (selectedFeatureToAdd || 'Select a feature')}
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-lg">
                        {isFeatureDropdownOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {isFeatureDropdownOpen && remainingFeatures.length > 0 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setIsFeatureDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {remainingFeatures.map((feature, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0 font-medium text-slate-700 truncate"
                              onClick={() => {
                                setSelectedFeatureToAdd(feature);
                                setIsFeatureDropdownOpen(false);
                              }}
                            >
                              {feature}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleAddFeature}
                    disabled={!selectedFeatureToAdd}
                    className="px-4 py-1.5 bg-deep-maroon text-white font-bold rounded-lg text-xs hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>

                {/* Features List items */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/20 max-h-[180px] overflow-y-auto">
                  {editingFields.features.length === 0 ? (
                    <p className="p-4 text-center text-slate-400 font-semibold italic">No features registered in this tier.</p>
                  ) : (
                    editingFields.features.map((feature, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-white font-medium">
                        <span className="text-slate-650 truncate">{feature}</span>
                        <button
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer flex items-center p-0.5"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedPackage(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-650 hover:bg-slate-100 bg-white rounded-lg font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePackage}
                className="px-4 py-1.5 bg-deep-maroon hover:bg-primary text-white rounded-lg font-bold cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">save</span>
                Save Plan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
