import React, { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';

export default function ManagePhotosView({ onProfileUpdate }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const profileId = user?.profile_id;
  const [photos, setPhotos] = useState([
    { id: 'photo_1', url: '', status: 'APPROVED', isPrimary: true },
    { id: 'photo_2', url: '', status: 'APPROVED', isPrimary: false },
    { id: 'photo_3', url: '', status: 'APPROVED', isPrimary: false },
    { id: 'photo_4', url: '', status: 'APPROVED', isPrimary: false },
  ]);
  const [rejectionReason, setRejectionReason] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [activeMenuSlot, setActiveMenuSlot] = useState(null);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Close mobile action menu when clicking anywhere outside
  useEffect(() => {
    if (activeMenuSlot) {
      const handleGlobalClick = () => setActiveMenuSlot(null);
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [activeMenuSlot]);

  const loadPhotos = async (isManual = false) => {
    if (!profileId) return;
    if (isManual) setIsRefreshing(true);
    const startTime = Date.now();

    try {
      const response = await axiosInstance.get(`/users/profile/${profileId}/photos`);
      const dbPhotos = response.data.photos || {};
      const dbStatuses = response.data.statuses || {};
      const updatedPhotos = [
        { id: 'photo_1', url: dbPhotos.photo_1 || '', status: dbStatuses.photo_1 || 'APPROVED', isPrimary: true },
        { id: 'photo_2', url: dbPhotos.photo_2 || '', status: dbStatuses.photo_2 || 'APPROVED', isPrimary: false },
        { id: 'photo_3', url: dbPhotos.photo_3 || '', status: dbStatuses.photo_3 || 'APPROVED', isPrimary: false },
        { id: 'photo_4', url: dbPhotos.photo_4 || '', status: dbStatuses.photo_4 || 'APPROVED', isPrimary: false },
      ];
      setPhotos(updatedPhotos);
      setRejectionReason(response.data.rejectionReason || null);

      if (onProfileUpdate) {
        onProfileUpdate();
      }

      if (isManual) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 600) {
          await new Promise((res) => setTimeout(res, 600 - elapsed));
        }

        const uploadedPhotos = updatedPhotos.filter((p) => p.url);
        const pendingCount = uploadedPhotos.filter((p) => p.status === 'PENDING').length;
        const rejectedCount = uploadedPhotos.filter((p) => p.status === 'REJECTED').length;

        if (rejectedCount > 0) {
          toast.info(`Photo status checked: ${rejectedCount} photo(s) require re-upload.`);
        } else if (pendingCount > 0) {
          toast.info(`Photo status checked: ${pendingCount} photo(s) currently under moderation review.`);
        } else {
          toast.success('Photo status checked: Photos are up to date!');
        }
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      if (isManual) {
        toast.error('Failed to check photo status. Please try again.');
      }
    } finally {
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [profileId]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file || file.size <= 200 * 1024 || !file.type.startsWith('image/')) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileUpload = async (slotId, file) => {
    if (!file || !profileId) return;

    setUploadingSlot(slotId);

    try {
      const fileToUpload = await compressImage(file);

      const formData = new FormData();
      formData.append('photo', fileToUpload);
      formData.append('slot', slotId);

      const response = await axiosInstance.post(`/users/profile/${profileId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newPhotoUrl = response.data.photoUrl;

      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === slotId
            ? { ...photo, url: newPhotoUrl, status: 'PENDING' }
            : photo
        )
      );

      if (slotId === 'photo_1' && updateUser) {
        updateUser({ ...user, photo_1: newPhotoUrl });
      }
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error("Failed to upload photo:", error);
    } finally {
      setUploadingSlot(null);
    }
  };

  const confirmDeletePhoto = async () => {
    const slotId = photoToDelete;
    if (!profileId || !slotId) return;

    setPhotoToDelete(null);

    try {
      await axiosInstance.delete(`/users/profile/${profileId}/photos/${slotId}`);
      setPhotos((prev) =>
        prev.map((photo) => (photo.id === slotId ? { ...photo, url: '', status: 'APPROVED' } : photo))
      );

      if (slotId === 'photo_1' && updateUser) {
        updateUser({ ...user, photo_1: null });
      }
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  const handleSetPrimary = async (slotId) => {
    if (!profileId || slotId === 'photo_1') return;
    const targetPhoto = photos.find(p => p.id === slotId);
    if (!targetPhoto || !targetPhoto.url) return;

    if (targetPhoto.status === 'REJECTED') {
      alert('Rejected photos cannot be set as your primary profile photo. Please upload a compliant photo.');
      return;
    }
    if (targetPhoto.status === 'PENDING') {
      alert('Photos under moderation review cannot be set as primary until approved by our safety team.');
      return;
    }

    try {
      await axiosInstance.put(`/users/profile/${profileId}/photos/swap`, {
        slot1: 'photo_1',
        slot2: slotId
      });

      const currentPhotos = [...photos];
      const photo1 = currentPhotos.find(p => p.id === 'photo_1');
      
      setPhotos(prev => prev.map(p => {
        if (p.id === 'photo_1') return { ...p, url: targetPhoto.url, status: targetPhoto.status };
        if (p.id === slotId) return { ...p, url: photo1.url, status: photo1.status };
        return p;
      }));

      if (updateUser) {
        updateUser({ ...user, photo_1: targetPhoto.url });
      }
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error("Failed to set primary photo:", error);
    }
  };

  const hasPendingPhotos = photos.some(p => p.url && p.status === 'PENDING');
  const hasRejectedPhotos = photos.some(p => p.url && p.status === 'REJECTED');

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6 px-3 md:px-0">
      <section className="rounded-none md:rounded-3xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-6 shadow-none md:shadow-sm text-left space-y-5">
        {/* Header */}
        <div className="border-b border-slate-100 pb-3 md:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-deep-maroon"></span>
              Manage Photos
            </h2>
            <p className="text-[11px] md:text-[12px] text-soft-gray mt-1 leading-relaxed">
              Upload up to 4 photos. Primary photo is shown as your matrimonial search display card.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPhotos(true)}
            disabled={isRefreshing}
            className={`self-start sm:self-auto flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs ${
              isRefreshing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 cursor-pointer active:scale-95'
            }`}
            title="Check photo moderation status"
          >
            <span
              className={`material-symbols-outlined text-[15px] ${
                isRefreshing ? 'animate-spin text-deep-maroon' : ''
              }`}
            >
              refresh
            </span>
            <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
          </button>
        </div>

        {/* Verification Status Alert Callout */}
        {hasPendingPhotos && (
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs animate-fade-in shadow-2xs">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <span className="material-symbols-outlined text-lg">hourglass_top</span>
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h4 className="font-bold text-amber-900 text-sm">Photos Under Moderation Review</h4>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Your recently uploaded photos are currently being verified by our safety team. Once approved, they will automatically be displayed on public match searches.
              </p>
            </div>
          </div>
        )}

        {hasRejectedPhotos && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3.5 text-xs animate-fade-in shadow-xs">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-rose-900 text-sm">Photo Verification Update</h4>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-200/70 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-rose-800 text-xs leading-relaxed font-medium">
                {rejectionReason ? (
                  <>
                    One or more photos was not approved. Reason: <span className="font-bold text-rose-950 underline decoration-rose-300 underline-offset-2">"{rejectionReason}"</span>. Please click the replace button to upload a compliant photo.
                  </>
                ) : (
                  'One or more of your photos was not approved. Please upload a clear, front-facing portrait photo.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4.5 max-w-full pt-1">
          {photos.map((photo) => {
            const isPending = photo.url && photo.status === 'PENDING';
            const isRejected = photo.url && photo.status === 'REJECTED';
            const isApproved = photo.url && photo.status === 'APPROVED';

            return (
              <div key={photo.id} className="flex flex-col">
                {/* Photo Card Box */}
                <div 
                  className={`relative rounded-2xl overflow-hidden group aspect-[3/4] flex flex-col items-center justify-center transition-all duration-300 ${
                    photo.url 
                      ? 'border border-slate-200/80 shadow-xs hover:shadow-md bg-slate-900/5' 
                      : 'border-2 border-dashed border-rose-200/90 hover:border-deep-maroon bg-gradient-to-b from-rose-50/20 to-slate-50/50 hover:from-rose-50/50 hover:to-rose-50/30 cursor-pointer shadow-2xs hover:shadow-xs'
                  }`}
                  onClick={!photo.url ? () => document.getElementById(`photo-upload-${photo.id}`).click() : undefined}
                >
                  <input
                    type="file"
                    accept="image/*"
                    id={`photo-upload-${photo.id}`}
                    className="hidden"
                    onChange={(e) => {
                      handleFileUpload(photo.id, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />

                  {uploadingSlot === photo.id && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 z-30">
                      <div className="w-8 h-8 border-2 border-deep-maroon border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold text-deep-maroon animate-pulse uppercase tracking-wider">Uploading...</span>
                    </div>
                  )}

                  {photo.url ? (
                    <>
                      <img src={photo.url} alt="Profile photo" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      
                      {/* Elegant Bottom Watermark Overlay */}
                      <div className="pointer-events-none select-none absolute bottom-0 inset-x-0 pb-2 pt-6 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-center justify-center gap-1 z-10">
                        <span className="material-symbols-outlined text-[11px] text-heritage-gold leading-none">verified_user</span>
                        <span className="text-white/90 font-bold tracking-widest uppercase text-[8.5px] sm:text-[9.5px] whitespace-nowrap drop-shadow-xs">
                          Bharath Marriage
                        </span>
                      </div>

                      {/* Top Badges Container - Organized to prevent badge overlap */}
                      <div className="absolute top-2 inset-x-2 flex flex-col items-start gap-1 z-15 pointer-events-none">
                        <div className="w-full flex items-center justify-between gap-1">
                          {/* Left: Primary Badge */}
                          {photo.isPrimary ? (
                            <span className="bg-deep-maroon/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider border border-white/25 whitespace-nowrap">
                              <span className="material-symbols-outlined text-[11px] text-heritage-gold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span>Primary</span>
                            </span>
                          ) : <span />}

                          {/* Right: Status Badge for non-primary cards */}
                          {!photo.isPrimary && (
                            <>
                              {isPending && (
                                <span className="bg-amber-500/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider border border-white/30 animate-pulse whitespace-nowrap">
                                  <span className="material-symbols-outlined text-[11px]">schedule</span>
                                  <span>In Review</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="bg-rose-600/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider border border-white/30 whitespace-nowrap">
                                  <span className="material-symbols-outlined text-[11px]">cancel</span>
                                  <span>Rejected</span>
                                </span>
                              )}
                              {isApproved && (
                                <span className="hidden md:flex bg-emerald-600/90 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm items-center gap-1 uppercase tracking-wider border border-white/20 whitespace-nowrap">
                                  <span className="material-symbols-outlined text-[11px]">verified</span>
                                  <span>Approved</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* For Primary card: stack In Review / Rejected neatly below Primary so they never collide */}
                        {photo.isPrimary && (
                          <div className="flex items-center justify-start">
                            {isPending && (
                              <span className="bg-amber-500/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider border border-white/30 animate-pulse whitespace-nowrap">
                                <span className="material-symbols-outlined text-[11px]">schedule</span>
                                <span>In Review</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="bg-rose-600/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider border border-white/30 whitespace-nowrap">
                                <span className="material-symbols-outlined text-[11px]">cancel</span>
                                <span>Rejected</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Premium Glassmorphic Hover Overlay for Desktop */}
                      <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-col items-center justify-center gap-2.5 z-20 backdrop-blur-[3px] p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); document.getElementById(`photo-upload-${photo.id}`).click(); }}
                            className="bg-white/95 hover:bg-white text-slate-800 h-9.5 px-3 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-white/40 font-bold text-[11px]"
                            title="Replace / Update Photo"
                          >
                            <span className="material-symbols-outlined text-[16px] text-deep-maroon">photo_camera</span>
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo.id); }}
                            className="bg-rose-600/90 hover:bg-rose-600 text-white w-9.5 h-9.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 border border-rose-400/30"
                            title="Delete Photo"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                          </button>
                        </div>

                        {!photo.isPrimary && isApproved && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo.id); }}
                            className="bg-gradient-to-r from-deep-maroon to-primary hover:opacity-95 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 border border-white/20 mt-0.5"
                          >
                            <span className="material-symbols-outlined text-[13px] text-heritage-gold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span>Set Primary</span>
                          </button>
                        )}

                        {!photo.isPrimary && isRejected && (
                          <div className="px-2.5 py-1 rounded-xl bg-rose-950/90 border border-rose-500/50 text-center max-w-[95%] shadow-md">
                            <span className="text-[9.5px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">error</span> Needs Change
                            </span>
                            {rejectionReason && (
                              <p className="text-[9px] font-medium text-rose-100 line-clamp-2 leading-tight mt-0.5">
                                "{rejectionReason}"
                              </p>
                            )}
                          </div>
                        )}

                        {!photo.isPrimary && isPending && (
                          <span className="text-[9.5px] font-bold text-amber-200 bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/40 text-center tracking-wide shadow-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>Under Review</span>
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Empty Upload Slot */
                    <div className="flex flex-col items-center text-center w-full justify-center px-2 py-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50/80 border border-rose-200/70 flex items-center justify-center mb-2 text-deep-maroon group-hover:bg-deep-maroon group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-2xs">
                        <span className="material-symbols-outlined text-[24px]">
                          add_photo_alternate
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-deep-maroon transition-colors tracking-wide">
                        Add Photo
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        JPG / PNG
                      </span>
                    </div>
                  )}
                </div>

                {/* Permanent Rejection Reason Box Below Card (Visible Always) */}
                {isRejected && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-left flex items-start gap-1.5 shadow-2xs">
                    <span className="material-symbols-outlined text-rose-600 text-[15px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-rose-800 uppercase tracking-wide">Rejection Reason</p>
                      <p className="text-[10.5px] font-semibold text-rose-900 leading-snug mt-0.5 break-words">
                        {rejectionReason || 'Does not meet photo guidelines. Please re-upload.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mobile Action Row */}
                {photo.url && (
                  <div className="md:hidden flex flex-row items-center justify-between mt-2 w-full gap-1.5">
                    {photo.isPrimary ? (
                      <div className="flex-1 h-8 flex items-center justify-center gap-1 text-deep-maroon bg-deep-maroon/10 border border-deep-maroon/20 rounded-xl px-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[12px] text-heritage-gold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-[9.5px] font-bold tracking-wide uppercase whitespace-nowrap">Primary</span>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isApproved) handleSetPrimary(photo.id); 
                        }}
                        disabled={!isApproved}
                        className={`flex-1 h-8 flex items-center justify-center border rounded-xl text-[9.5px] font-bold uppercase tracking-wide whitespace-nowrap px-1.5 min-w-0 transition-all ${
                          isApproved 
                            ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200/70 active:scale-95 cursor-pointer'
                            : 'text-slate-400 bg-slate-50 border-slate-200/40 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span>{isRejected ? 'Rejected' : isPending ? 'In Review' : 'Set Primary'}</span>
                      </button>
                    )}

                    {/* Actions on Right (Three Dots Menu) */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSlot(activeMenuSlot === photo.id ? null : photo.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all border border-slate-200/60 cursor-pointer"
                        title="More Options"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </button>

                      {/* Popover Dropdown */}
                      {activeMenuSlot === photo.id && (
                        <div className="absolute right-0 top-9 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 py-1.5 w-36 z-50 flex flex-col animate-scale-up">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuSlot(null);
                              document.getElementById(`photo-upload-${photo.id}`).click();
                            }}
                            className="px-3 py-2 text-left text-[11px] text-slate-700 font-bold hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-deep-maroon">photo_camera</span>
                            <span>Replace Photo</span>
                          </button>
                          
                          <div className="h-px bg-slate-100 my-1 w-full" />
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuSlot(null);
                              setPhotoToDelete(photo.id);
                            }}
                            className="px-3 py-2 text-left text-[11px] text-rose-600 font-bold hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-rose-600">delete_outline</span>
                            <span>Delete Photo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {photoToDelete && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setPhotoToDelete(null)}></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 pointer-events-auto text-left transform transition-all animate-scale-up space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Remove this photo?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This action will permanently delete the photo from your matrimony profile. You can upload a new photo at any time.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => setPhotoToDelete(null)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePhoto}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
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
