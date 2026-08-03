import React, { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';


export default function ManagePhotosView({ onProfileUpdate }) {
  const { user, updateUser } = useAuth();
  const profileId = user?.profile_id;
  const [photos, setPhotos] = useState([
    { id: 'photo_1', url: '', isPrimary: true },
    { id: 'photo_2', url: '', isPrimary: false },
    { id: 'photo_3', url: '', isPrimary: false },
    { id: 'photo_4', url: '', isPrimary: false },
  ]);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  useEffect(() => {
    if (profileId) {
      axiosInstance.get(`/users/profile/${profileId}/photos`)
        .then(response => {
          const dbPhotos = response.data.photos;
          setPhotos([
            { id: 'photo_1', url: dbPhotos.photo_1 || '', isPrimary: true },
            { id: 'photo_2', url: dbPhotos.photo_2 || '', isPrimary: false },
            { id: 'photo_3', url: dbPhotos.photo_3 || '', isPrimary: false },
            { id: 'photo_4', url: dbPhotos.photo_4 || '', isPrimary: false },
          ]);
        })
        .catch(err => console.error("Failed to fetch photos:", err));
    }
  }, [profileId]);

  const handleFileUpload = async (slotId, file) => {
    if (!file || !profileId) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('slot', slotId);

    try {
      const response = await axiosInstance.post(`/users/profile/${profileId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newPhotoUrl = response.data.photoUrl;

      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === slotId
            ? { ...photo, url: newPhotoUrl }
            : photo
        )
      );

      // If updating the primary photo, update the global context so Navbars reflect it!
      if (slotId === 'photo_1' && updateUser) {
        updateUser({ ...user, photo_1: newPhotoUrl });
      }
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error("Failed to upload photo:", error);
    }
  };

  const confirmDeletePhoto = async () => {
    const slotId = photoToDelete;
    if (!profileId || !slotId) return;

    setPhotoToDelete(null); // Close modal

    try {
      await axiosInstance.delete(`/users/profile/${profileId}/photos/${slotId}`);
      setPhotos((prev) =>
        prev.map((photo) => (photo.id === slotId ? { ...photo, url: '' } : photo))
      );

      // Clear global context if primary photo is deleted
      if (slotId === 'photo_1' && updateUser) {
        updateUser({ ...user, photo_1: null });
      }
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-6 shadow-none md:shadow-sm text-left">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-maroon"></span>
            Manage Photos
          </h2>
          <p className="text-[11px] text-soft-gray mt-1">Upload up to 4 photos. Primary photo is shown as search display card.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative rounded-xl border border-dashed border-slate-200 aspect-[3/4] flex flex-col items-center justify-center bg-slate-50/50 overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                id={`photo-upload-${photo.id}`}
                className="hidden"
                onChange={(e) => {
                  handleFileUpload(photo.id, e.target.files?.[0]);
                  e.target.value = ''; // Reset value to allow uploading same file again
                }}
              />

              {photo.url ? (
                <>
                  <img src={photo.url} alt="Profile photo" className="w-full h-full object-cover" />
                  
                  {/* Single Centered Watermark overlay for preview */}
                  <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-40">
                    <span className="text-white font-bold tracking-wider drop-shadow-md -rotate-[20deg] whitespace-nowrap text-sm">
                      Bharath Marriage
                    </span>
                  </div>

                  {photo.isPrimary && (
                    <span className="absolute top-2 left-2 bg-deep-maroon text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow border border-white/20 uppercase tracking-wider">
                      Primary
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => document.getElementById(`photo-upload-${photo.id}`).click()}
                      className="bg-white hover:bg-slate-100 text-charcoal-text p-1.5 rounded-full shadow hover:scale-105 transition-all cursor-pointer"
                      title="Update Photo"
                    >
                      <span className="material-symbols-outlined text-base leading-none">edit</span>
                    </button>
                    <button
                      onClick={() => setPhotoToDelete(photo.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow hover:scale-105 transition-all cursor-pointer"
                      title="Delete Photo"
                    >
                      <span className="material-symbols-outlined text-base leading-none">delete</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center p-3 text-center">
                  <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">
                    add_a_photo
                  </span>

                  <label
                    htmlFor={`photo-upload-${photo.id}`}
                    className="text-[10px] font-bold text-deep-maroon hover:text-primary transition-colors cursor-pointer hover:underline"
                  >
                    Add Photo
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Shadcn-like Alert Dialog */}
      {photoToDelete && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setPhotoToDelete(null)}></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl border border-slate-100 w-full max-w-md p-6 pointer-events-auto text-left transform transition-all">
              <h3 className="text-lg font-semibold text-charcoal-text mb-2">Are you absolutely sure?</h3>
              <p className="text-sm text-soft-gray mb-6">
                This action cannot be undone. This will permanently delete your photo and remove it from our servers.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setPhotoToDelete(null)}
                  className="px-4 py-2 rounded-md text-sm font-semibold border border-slate-200 bg-white text-charcoal-text hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePhoto}
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
                >
                  Delete Photo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
