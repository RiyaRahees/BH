import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

export default function CasteManagement() {
  const toast = useToast();
  const [castes, setCastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReligion, setSelectedReligion] = useState('All');
  
  // Form state for adding caste
  const [newReligion, setNewReligion] = useState('Hindu');
  const [newCasteName, setNewCasteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCastes = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/castes');
      setCastes(response.data.castes || []);
    } catch (error) {
      console.error('Failed to fetch castes:', error);
      toast.error('Failed to load castes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCastes();
  }, []);

  const handleAddCaste = async (e) => {
    e.preventDefault();
    if (!newCasteName.trim()) {
      toast.error('Please enter a caste name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/admin/castes', {
        religion: newReligion,
        caste_name: newCasteName.trim()
      });
      toast.success(response.data.message || 'Caste added successfully!');
      setNewCasteName('');
      fetchCastes();
    } catch (error) {
      console.error('Error adding caste:', error);
      toast.error(error.response?.data?.error || 'Failed to add caste');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCaste = async (id, casteName) => {
    if (!window.confirm(`Are you sure you want to delete '${casteName}'?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/castes/${id}`);
      toast.success(`Caste '${casteName}' deleted`);
      setCastes(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting caste:', error);
      toast.error('Failed to delete caste');
    }
  };

  const filteredCastes = selectedReligion === 'All'
    ? castes
    : castes.filter(c => c.religion === selectedReligion);

  const religionStats = {
    Hindu: castes.filter(c => c.religion === 'Hindu').length,
    Muslim: castes.filter(c => c.religion === 'Muslim').length,
    Christian: castes.filter(c => c.religion === 'Christian').length,
    Other: castes.filter(c => c.religion === 'Other').length,
  };

  return (
    <div className="space-y-6 text-left min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-deep-maroon">category</span>
          Caste & Community Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage castes and communities available for users during profile registration and updates.
        </p>
      </div>

      {/* Grid: Add Form + Quick Filter Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Caste Form Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="material-symbols-outlined text-deep-maroon text-lg">add_circle</span>
            Add New Caste
          </h2>

          <form onSubmit={handleAddCaste} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Select Religion</label>
              <select
                value={newReligion}
                onChange={(e) => setNewReligion(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
              >
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Christian">Christian</option>
                <option value="Other">Other / General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Caste / Community Name</label>
              <input
                type="text"
                value={newCasteName}
                onChange={(e) => setNewCasteName(e.target.value)}
                placeholder="e.g. Nair, Roman Catholic, Sunni..."
                className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon placeholder-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>{isSubmitting ? 'Adding...' : 'Add Caste'}</span>
            </button>
          </form>
        </div>

        {/* Stats & Filter Bar */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Caste Counts by Religion
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-800">Hindu</span>
                <p className="text-lg font-black text-amber-900 mt-0.5">{religionStats.Hindu}</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Muslim</span>
                <p className="text-lg font-black text-emerald-900 mt-0.5">{religionStats.Muslim}</p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold uppercase text-blue-800">Christian</span>
                <p className="text-lg font-black text-blue-900 mt-0.5">{religionStats.Christian}</p>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-700">Other</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{religionStats.Other}</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 mr-2">Filter Religion:</span>
            {['All', 'Hindu', 'Muslim', 'Christian', 'Other'].map(rel => (
              <button
                key={rel}
                onClick={() => setSelectedReligion(rel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedReligion === rel
                    ? 'bg-deep-maroon text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rel}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Castes List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Castes List ({filteredCastes.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">Showing {selectedReligion} Castes</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            Loading castes list...
          </div>
        ) : filteredCastes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No castes found for {selectedReligion}. Add one using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Caste / Community Name</th>
                  <th className="py-3 px-4">Religion</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCastes.map((c, index) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-semibold">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c.caste_name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        c.religion === 'Hindu' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        c.religion === 'Muslim' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        c.religion === 'Christian' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {c.religion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCaste(c.id, c.caste_name)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Caste"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
