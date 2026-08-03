import React, { useState, useEffect } from 'react';
import ProfileCard from '../ProfileCard';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';

export default function ShortlistsView() {
  const [shortlists, setShortlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavourites = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/users/favourites');
        setShortlists(res.data.favourites);
      } catch (err) {
        console.error("Failed to load favourites:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchFavourites();
    }
  }, [user]);

  const removeShortlist = async (id) => {
    try {
      await axiosInstance.delete(`/users/profile/${id}/favourites`);
      setShortlists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to remove favourite", err);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-5 shadow-none md:shadow-sm text-left">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-maroon"></span>
            Favourite Profiles ({shortlists.length})
          </h2>
          <p className="text-[11px] text-soft-gray mt-1">Quickly view or contact profiles you have favorited for later consideration.</p>
        </div>

        {loading ? (
           <div className="text-center py-12 text-xs text-soft-gray">Loading favourites...</div>
        ) : shortlists.length === 0 ? (
          <div className="text-center py-12 text-xs text-soft-gray">
            <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">favorite_border</span>
            <p>You haven't favorited any profiles yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-2">
            {shortlists.map((profile) => (
              <div key={profile.id} className="relative group/shortlist">
                <ProfileCard profile={profile} fullWidth />
                
                {/* Remove button overlay */}
                <button
                  onClick={() => removeShortlist(profile.id)}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black transition-colors shadow cursor-pointer"
                  title="Remove from favourites"
                >
                  <span className="material-symbols-outlined text-sm leading-none">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
