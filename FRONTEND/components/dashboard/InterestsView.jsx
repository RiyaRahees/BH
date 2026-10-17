import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import { getResolvedImageUrl, handleImageError } from '../../src/utils/imageUtils';

export default function InterestsView() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent' | 'mutual'
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchInterests = async (tab) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/users/interests?type=${tab}`);
      setInterests(res.data.interests || []);
    } catch (err) {
      console.error("Failed to load interests:", err);
      toast.showToast('Failed to load interests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInterests(activeTab);
    }
  }, [user, activeTab]);

  const handleRespond = async (interestId, action) => {
    setActionLoadingId(interestId);
    try {
      const res = await axiosInstance.post('/users/interests/respond', { interestId, action });
      toast.showToast(res.data.message || (action === 'accept' ? 'Interest accepted!' : 'Interest declined'), 'success');
      // Refresh list
      fetchInterests(activeTab);
    } catch (err) {
      console.error("Failed to respond to interest:", err);
      toast.showToast('Failed to respond to interest', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (interestId) => {
    setActionLoadingId(interestId);
    try {
      await axiosInstance.delete(`/users/interests/${interestId}`);
      toast.showToast('Interest removed', 'info');
      setInterests((prev) => prev.filter((item) => item.interest_id !== interestId));
    } catch (err) {
      console.error("Failed to delete interest:", err);
      toast.showToast('Failed to remove interest', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200/60 bg-white p-5 md:p-6 shadow-sm text-left">
        {/* Header Strip */}
        <div className="mb-6 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-deep-maroon"></span>
              Express Interests
            </h2>
            <p className="text-xs text-soft-gray mt-1">
              Manage interest requests sent, received, and mutual connections.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'received' ? 'bg-white text-deep-maroon shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Received Interests
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sent' ? 'bg-white text-deep-maroon shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sent Interests
            </button>
            <button
              onClick={() => setActiveTab('mutual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'mutual' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Mutual Interests</span>
              <span className="text-xs">❤️</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-16 text-xs text-soft-gray flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-deep-maroon border-t-transparent rounded-full animate-spin"></div>
            <span>Loading interests...</span>
          </div>
        ) : interests.length === 0 ? (
          <div className="text-center py-16 text-xs text-soft-gray flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">volunteer_activism</span>
            <p className="font-semibold text-slate-600 text-sm mb-1">
              {activeTab === 'received'
                ? 'No received interest requests'
                : activeTab === 'sent'
                ? 'No sent interest requests'
                : 'No mutual interests yet'}
            </p>
            <p className="text-slate-400 max-w-sm">
              {activeTab === 'received'
                ? 'When another member expresses interest in your profile, their request will appear here.'
                : activeTab === 'sent'
                ? 'Explore profiles in search or recommendations to send your first interest request.'
                : 'When a member returns your interest or accepts your request, they appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {interests.map((item) => {
              const isActioning = actionLoadingId === item.interest_id;

              return (
                <div
                  key={item.interest_id}
                  className="bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  {/* Top Profile Card Header & Details */}
                  <div className="flex gap-3.5 sm:gap-4 items-start">
                    {/* Avatar */}
                    <Link to={`/profile/${item.profile_id}`} className="shrink-0 relative">
                      <img
                        src={getResolvedImageUrl(item.photo_1, item.gender)}
                        alt={item.name}
                        onError={(e) => handleImageError(e, item.gender)}
                        className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border border-slate-200/80 bg-slate-50 shadow-2xs group-hover:scale-[1.02] transition-transform"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/profile/${item.profile_id}`}
                          className="font-bold text-sm sm:text-base text-slate-800 hover:text-deep-maroon transition-colors truncate"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                        
                        {activeTab === 'mutual' && (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/80 whitespace-nowrap">
                            Mutual Interest ❤️
                          </span>
                        )}
                        {activeTab === 'sent' && (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200/80 whitespace-nowrap">
                            Pending Response
                          </span>
                        )}
                        {activeTab === 'received' && (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200/80 whitespace-nowrap">
                            Received Interest
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                        {[
                          item.age ? `${item.age} yrs` : null,
                          item.height ? item.height : null,
                          item.religion ? item.religion : null
                        ].filter(Boolean).join(' • ') || 'Profile details'}
                      </p>

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">location_on</span>
                        <span className="truncate">
                          {item.city || item.district ? `${item.city || ''}${item.city && item.district ? ', ' : ''}${item.district || ''}` : 'Kerala'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action & Profile ID Bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                      {item.profile_id}
                    </span>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/profile/${item.profile_id}`}
                        className="text-xs font-bold text-slate-600 hover:text-deep-maroon hover:underline transition-colors"
                      >
                        View Profile
                      </Link>

                      {activeTab === 'received' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRespond(item.interest_id, 'decline')}
                            disabled={isActioning}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespond(item.interest_id, 'accept')}
                            disabled={isActioning}
                            className="px-3.5 py-1 rounded-lg bg-deep-maroon hover:bg-primary text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-50 transition-all"
                          >
                            <span>Accept</span>
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </button>
                        </div>
                      )}

                      {activeTab === 'sent' && (
                        <button
                          onClick={() => handleDelete(item.interest_id)}
                          disabled={isActioning}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Withdraw
                        </button>
                      )}

                      {activeTab === 'mutual' && (
                        <button
                          onClick={() => navigate(`/dashboard?tab=inbox`)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-[13px]">chat</span>
                          <span>Chat Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
