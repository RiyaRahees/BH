import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import HoroscopeCharts from '../../../components/HoroscopeCharts';
import { downloadHoroscope } from '../../utils/downloadHoroscope';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UpgradeModal from '../../components/UpgradeModal';
import { getEffectivePlan } from '../../utils/planUtils';
import { getResolvedImageUrl, handleImageError } from '../../utils/imageUtils';
import AdBanner from '../../../components/AdBanner';

function formatTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';

  return trimmed
    .split(' ')
    .map(word => {
      if (!word) return '';
      if (word.includes('/')) {
        return word
          .split('/')
          .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
          .join(' / ');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function DetailSection({ title, rows }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <h2 className="font-display-lg text-[13px] tracking-wider text-deep-maroon font-bold uppercase border-b border-heritage-gold/20 pb-1.5 mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-heritage-gold"></span>
        {title}
      </h2>

      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-start py-1.5 border-b border-slate-100/60 last:border-b-0 gap-4">
            <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wider mt-0.5 shrink-0">{label}</span>
            <span className="text-xs font-semibold text-charcoal-text text-right">{value || 'Not Specified'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileDetails() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [interestState, setInterestState] = useState({ status: 'none', isSender: false, isReceiver: false, interestId: null });
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestConfirmModal, setInterestConfirmModal] = useState({ isOpen: false, type: '' });
  
  // Report state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fake Profile / Impersonation');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');

  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, requiredPlan: '', featureName: '' });
  const [partnerPrefs, setPartnerPrefs] = useState(null);

  const handleOpenReport = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setReportSuccess('');
    setReportError('');
    setReportDetails('');
    setReportReason('Fake Profile / Impersonation');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportReason) {
      setReportError('Please select a report reason.');
      return;
    }
    setReportSubmitting(true);
    setReportError('');
    try {
      await axiosInstance.post(`/users/profile/${profileId}/report`, {
        reason: reportReason,
        details: reportDetails
      });
      setReportSuccess('Report submitted successfully. Thank you for keeping our community safe.');
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit report', err);
      setReportError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleRequirePlan = (requiredTiers, featureName) => {
    if (!isLoggedIn) {
      navigate('/login');
      return false;
    }
    
    const userTier = getEffectivePlan(user);
    if (requiredTiers.includes(userTier)) {
      return true;
    } else {
      setUpgradeModal({ isOpen: true, requiredPlan: requiredTiers[0], featureName });
      return false;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/users/profile/${profileId}`);
        setProfile(response.data.user);
        
        if (isLoggedIn) {
          try {
            const favRes = await axiosInstance.get(`/users/profile/${profileId}/favourites/status`);
            setIsFavourite(favRes.data.isFavourite);
          } catch (e) {
            console.error("Failed to fetch favourite status", e);
          }
          try {
            const intRes = await axiosInstance.get(`/users/profile/${profileId}/interests/status`);
            setInterestState(intRes.data);
          } catch (e) {
            console.error("Failed to fetch interest status", e);
          }
        }

        if (isLoggedIn && user?.profile_id) {
          try {
            const prefRes = await axiosInstance.get(`/users/profile/${user.profile_id}/partner-preferences`);
            setPartnerPrefs(prefRes.data?.preferences || prefRes.data || null);
          } catch (e) {
            console.error('Failed to fetch partner preferences', e);
          }
        } else {
          setPartnerPrefs(null);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, isLoggedIn, user?.profile_id]);

  const handleInterestButtonClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (interestState.status === 'accepted') {
      setInterestConfirmModal({ isOpen: true, type: 'accepted' });
    } else if (interestState.status === 'pending' && interestState.isReceiver) {
      setInterestConfirmModal({ isOpen: true, type: 'return' });
    } else if (interestState.status === 'pending' && interestState.isSender) {
      setInterestConfirmModal({ isOpen: true, type: 'withdraw' });
    } else {
      setInterestConfirmModal({ isOpen: true, type: 'send' });
    }
  };

  const handleSendOrReturnInterest = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setInterestLoading(true);
    try {
      if (interestState.status === 'pending' && interestState.isSender && interestState.interestId) {
        // Withdraw/Cancel Interest
        await axiosInstance.delete(`/users/interests/${interestState.interestId}`);
        setInterestState(prev => ({
          ...prev,
          status: 'none',
          isSender: false,
          isReceiver: false,
          interestId: null
        }));
        toast.showToast('Interest withdrawn successfully', 'success');
      } else {
        // Send or Return Interest
        const res = await axiosInstance.post(`/users/profile/${profileId}/interests`);
        const newStatus = res.data.status;
        setInterestState(prev => ({
          ...prev,
          status: newStatus,
          interestId: res.data.interestId || prev.interestId,
          isSender: newStatus === 'accepted' ? prev.isSender : true
        }));
        toast.showToast(res.data.message || 'Interest sent successfully!', 'success');
      }
    } catch (err) {
      console.error("Failed to process interest request", err);
      toast.showToast(err.response?.data?.error || 'Failed to process interest', 'error');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleToggleFavourite = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setFavLoading(true);
    try {
      if (isFavourite) {
        await axiosInstance.delete(`/users/profile/${profileId}/favourites`);
        setIsFavourite(false);
      } else {
        await axiosInstance.post(`/users/profile/${profileId}/favourites`);
        setIsFavourite(true);
      }
    } catch (err) {
      console.error("Failed to toggle favourite", err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleChatNow = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const targetId = profile.profile_id || profileId;

    try {
      const { data } = await axiosInstance.get(`/users/chats/eligibility/${targetId}`);
      if (data.canChat) {
        navigate('/dashboard?tab=inbox', { 
          state: { 
            selectedProfile: {
              ...profile,
              profile_id: targetId,
              id: targetId
            } 
          } 
        });
      } else {
        setUpgradeModal({ isOpen: true, requiredPlan: 'GOLD', featureName: 'Direct Chat & Messaging' });
      }
    } catch (error) {
      console.error("Chat eligibility check failed", error);
      if (handleRequirePlan(['GOLD', 'PLATINUM', 'DIAMOND'], 'Direct Chat & Messaging')) {
        navigate('/dashboard?tab=inbox', { 
          state: { 
            selectedProfile: {
              ...profile,
              profile_id: targetId,
              id: targetId
            } 
          } 
        });
      }
    }
  };

  const handleHoroscopeDownloadClick = () => {
    if (handleRequirePlan(['PLATINUM', 'DIAMOND'], 'Download Horoscope')) {
      downloadHoroscope(profile);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/10 to-amber-50/5 pt-32 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-maroon"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/10 to-amber-50/5 pt-32 pb-16 flex items-center justify-center">
        <div className="text-red-600 font-bold text-xl">Profile Not Found</div>
      </div>
    );
  }

  const firstName = profile.name ? profile.name.split(' ')[0] : 'Member';
  const subject = profile.gender === 'Female' ? 'She' : 'He';
  const isHindu = profile.religion?.toLowerCase().includes('hindu');

  // ── Dynamic & Accurate Match Score ──────────────────────────────────────────
  const matchResult = (() => {
    if (!isLoggedIn || !user) return null;

    const userGender = (user?.gender || '').trim().toLowerCase();
    const profileGender = (profile?.gender || '').trim().toLowerCase();
    const isSameGender = Boolean(userGender && profileGender && userGender === profileGender);

    // SAME GENDER VISIT: Always Red (Incompatible / Low Match)
    if (isSameGender) {
      return {
        score: 30,
        matchingFactors: [],
        missingFactors: ['Gender Compatibility'],
        theme: {
          title: 'Incompatible',
          sub: 'Same gender profile alignment',
          bgClass: 'bg-gradient-to-br from-rose-50 to-red-50/80 border-red-200',
          textClass: 'text-red-900',
          subTextClass: 'text-red-700',
          ringBg: '#fee2e2',
          ringColor: '#dc2626',
          badgeClass: 'bg-red-100/90 text-red-800 border-red-200',
          tagClass: 'bg-red-100/70 text-red-900 border-red-200/80',
          icon: 'person_off'
        }
      };
    }

    // DIFFERENT GENDER: Starts at baseline 60 points + up to 40 additional points for matches
    let score = 60;
    const matchingFactors = [];
    const missingFactors = [];

    // Helper: Height in inches
    const parseInches = (h) => {
      if (!h) return null;
      const norm = String(h).trim().toLowerCase();
      const m = norm.match(/(\d+)\s*(?:ft|feet|')\s*(\d+)?\s*(?:in|inch|inches|")?/);
      if (m) return (parseInt(m[1], 10) * 12) + parseInt(m[2] || '0', 10);
      const cm = norm.match(/^(\d+(?:\.\d+)?)\s*cm$/);
      if (cm) return Math.round(parseFloat(cm[1]) / 2.54);
      const num = parseFloat(norm);
      if (!isNaN(num)) return num > 100 ? Math.round(num / 2.54) : Math.round(num * 12);
      return null;
    };

    // 1. RELIGION (+8 Points)
    let isReligionMatch = false;
    const rawTargetReligion = partnerPrefs?.religion || user?.religion;
    const rawCandReligion = profile?.religion;

    if (rawTargetReligion && rawCandReligion) {
      const targetRelClean = rawTargetReligion.split('-')[0].trim().split(' ')[0].trim().toLowerCase();
      const candRelClean = rawCandReligion.split('-')[0].trim().split(' ')[0].trim().toLowerCase();
      
      if (['all', 'open to all', 'any'].includes(targetRelClean) || targetRelClean === candRelClean || candRelClean.includes(targetRelClean) || targetRelClean.includes(candRelClean)) {
        score += 8;
        matchingFactors.push('Religion');
        isReligionMatch = true;
      } else {
        missingFactors.push('Religion');
      }
    } else if (!rawTargetReligion && rawCandReligion) {
      missingFactors.push('Religion');
    }

    // 2. CASTE (+6 Points - Only valid if Religion matches)
    if (!isReligionMatch) {
      missingFactors.push('Caste');
    } else {
      const rawTargetCaste = (partnerPrefs?.caste && !['open to all', 'any caste', 'any', 'all'].includes(partnerPrefs.caste.trim().toLowerCase()))
        ? partnerPrefs.caste
        : (user?.caste || user?.community || (user?.religion?.includes('-') ? user.religion.split('-')[1] : null));
      const targetCaste = rawTargetCaste ? rawTargetCaste.trim() : null;

      const rawCandCaste = profile?.caste || profile?.community || (profile?.religion?.includes('-') ? profile.religion.split('-')[1] : null);
      const candCaste = rawCandCaste ? rawCandCaste.trim() : null;

      const isCasteOpen = partnerPrefs?.caste && ['open to all', 'any caste', 'any', 'all'].includes(partnerPrefs.caste.trim().toLowerCase());

      if (isCasteOpen) {
        score += 6;
        matchingFactors.push('Caste (Open)');
      } else if (targetCaste && candCaste) {
        const tCaste = targetCaste.toLowerCase().replace(/[\-_/,\s]+/g, '');
        const cCaste = candCaste.toLowerCase().replace(/[\-_/,\s]+/g, '');
        if (tCaste === cCaste || tCaste.includes(cCaste) || cCaste.includes(tCaste)) {
          score += 6;
          matchingFactors.push('Caste');
        } else {
          missingFactors.push('Caste');
        }
      } else {
        missingFactors.push('Caste');
      }
    }

    // 3. DISTRICT / LOCATION (+6 Points)
    const rawTargetLoc = partnerPrefs?.location_preferences || user?.district || user?.detailDistrict || user?.location;
    const rawCandLoc = profile?.district || profile?.detailDistrict || profile?.location;

    if (rawTargetLoc && rawCandLoc) {
      const cleanTarget = String(rawTargetLoc).toLowerCase().replace(/^\d+[\s\-]+/, '').trim();
      const cleanCand = String(rawCandLoc).toLowerCase().replace(/^\d+[\s\-]+/, '').trim();

      const isAllKerala = ['kerala', 'any', 'all', 'open to all', 'any district / kerala', 'any district'].some(k => cleanTarget.includes(k));

      if (isAllKerala) {
        score += 6;
        matchingFactors.push('District');
      } else {
        const targetTokens = cleanTarget.split(',').map(s => s.trim()).filter(Boolean);
        const isDistrictMatch = targetTokens.some(t => cleanCand.includes(t) || t.includes(cleanCand));
        if (isDistrictMatch) {
          score += 6;
          matchingFactors.push('District');
        } else {
          missingFactors.push('District');
        }
      }
    }

    // 4. AGE / AGE RANGE (+6 Points)
    const candAge = profile?.age;
    const minAge = partnerPrefs?.min_age ? parseInt(partnerPrefs.min_age, 10) : null;
    const maxAge = partnerPrefs?.max_age ? parseInt(partnerPrefs.max_age, 10) : null;

    let userAge = user?.age ? parseInt(user.age, 10) : null;
    if (!userAge && (user?.dob || user?.date_of_birth)) {
      const d = new Date(user.dob || user.date_of_birth);
      if (!isNaN(d.getTime())) userAge = new Date().getFullYear() - d.getFullYear();
    }

    if (candAge) {
      if (minAge !== null && maxAge !== null) {
        if (candAge >= minAge && candAge <= maxAge) {
          score += 6;
          matchingFactors.push('Age Range');
        } else {
          missingFactors.push('Age Range');
        }
      } else if (userAge) {
        const diff = Math.abs(candAge - userAge);
        if (diff <= 2) {
          score += 6;
          matchingFactors.push('Exact Age Match');
        } else if (diff <= 4) {
          score += 4;
          matchingFactors.push('Nearest Age');
        } else if (diff <= 6) {
          score += 3;
          matchingFactors.push('Age Range');
        } else {
          missingFactors.push('Age Range');
        }
      }
    }

    // 5. OCCUPATION / PROFESSION (+4 Points)
    const rawTargetProf = partnerPrefs?.preferred_professions || user?.profession || user?.occupation;
    const rawCandProf = profile?.profession || profile?.occupation;

    if (rawTargetProf && rawCandProf) {
      const pPrefClean = String(rawTargetProf).toLowerCase().trim();
      const cProfClean = String(rawCandProf).toLowerCase().trim();

      const isOpenProf = ['any', 'all', 'open to all', 'any profession'].some(k => pPrefClean === k || pPrefClean.includes(k));
      if (isOpenProf) {
        score += 4;
        matchingFactors.push('Occupation');
      } else {
        const isProfMatch =
          cProfClean.includes(pPrefClean) || pPrefClean.includes(cProfClean) ||
          pPrefClean.split(/[/,;\-\s]+/).some(token => token.length > 2 && cProfClean.includes(token)) ||
          (['teacher', 'professor', 'educator', 'lecturer'].some(k => pPrefClean.includes(k)) && ['teacher', 'professor', 'educator', 'lecturer', 'b.ed'].some(k => cProfClean.includes(k))) ||
          (['software', 'developer', 'engineer', 'it'].some(k => pPrefClean.includes(k)) && ['software', 'developer', 'engineer', 'it', 'programmer'].some(k => cProfClean.includes(k))) ||
          (['doctor', 'nurse', 'medical'].some(k => pPrefClean.includes(k)) && ['doctor', 'nurse', 'medical', 'hospital'].some(k => cProfClean.includes(k))) ||
          (['accountant', 'finance', 'banking', 'ca'].some(k => pPrefClean.includes(k)) && ['accountant', 'finance', 'banking', 'ca', 'auditor'].some(k => cProfClean.includes(k)));

        if (isProfMatch) {
          score += 4;
          matchingFactors.push('Occupation');
        } else {
          missingFactors.push('Occupation');
        }
      }
    }

    // 6. EDUCATION LEVEL (+4 Points)
    const rawTargetEd = partnerPrefs?.education_level || user?.education;
    const rawCandEd = profile?.education;

    if (rawTargetEd && rawCandEd) {
      const ePrefClean = String(rawTargetEd).toLowerCase().trim();
      const cEdClean = String(rawCandEd).toLowerCase().trim();

      const isOpenEd = ['any', 'all', 'open to all', 'any education'].some(k => ePrefClean === k || ePrefClean.includes(k));
      if (isOpenEd) {
        score += 4;
        matchingFactors.push('Education');
      } else {
        const isEdMatch =
          cEdClean.includes(ePrefClean) || ePrefClean.includes(cEdClean) ||
          (ePrefClean.includes('degree') && ['b.ed', 'bca', 'b.sc', 'b.com', 'ba', 'b.tech', 'bba', 'degree', 'bachelor', 'graduate'].some(k => cEdClean.includes(k))) ||
          (ePrefClean.includes('master') && ['m.tech', 'mca', 'm.sc', 'm.com', 'ma', 'm.ed', 'mba', 'master', 'post graduate'].some(k => cEdClean.includes(k))) ||
          (ePrefClean.includes('engineering') && ['b.tech', 'b.e', 'm.tech', 'm.e', 'engineering', 'engineer'].some(k => cEdClean.includes(k)));

        if (isEdMatch) {
          score += 4;
          matchingFactors.push('Education');
        } else {
          missingFactors.push('Education');
        }
      }
    }

    // 7. HEIGHT (+2 Points)
    const minH = partnerPrefs?.min_height ? parseInches(partnerPrefs.min_height) : null;
    const maxH = partnerPrefs?.max_height ? parseInches(partnerPrefs.max_height) : null;
    const candH = profile?.height ? parseInches(profile.height) : null;

    if (candH && (minH !== null || maxH !== null)) {
      if ((minH === null || candH >= minH) && (maxH === null || candH <= maxH)) {
        score += 2;
        matchingFactors.push('Height');
      } else {
        missingFactors.push('Height');
      }
    }

    // 8. MARITAL STATUS (+2 Points)
    const rawTargetMarital = partnerPrefs?.marital_status || partnerPrefs?.maritalStatus || user?.marital_status || user?.maritalStatus || 'Never Married';
    const rawCandMarital = profile?.marital_status || profile?.maritalStatus;

    if (rawTargetMarital && rawCandMarital) {
      const tMar = String(rawTargetMarital).toLowerCase().trim();
      const cMar = String(rawCandMarital).toLowerCase().trim();

      if (['any', 'all', 'open to all'].includes(tMar) || tMar === cMar || (tMar.includes('unmarried') && cMar.includes('never married')) || (tMar.includes('never married') && cMar.includes('unmarried'))) {
        score += 2;
        matchingFactors.push('Marital Status');
      } else {
        missingFactors.push('Marital Status');
      }
    }

    // 9. MOTHER TONGUE / LANGUAGE (+2 Points)
    const rawTargetLang = partnerPrefs?.mother_tongue || user?.mother_tongue || user?.language || 'Malayalam';
    const rawCandLang = profile?.mother_tongue || profile?.language || 'Malayalam';

    if (rawTargetLang && rawCandLang) {
      const tLang = String(rawTargetLang).toLowerCase().trim();
      const cLang = String(rawCandLang).toLowerCase().trim();

      if (['any', 'all', 'open to all'].includes(tLang) || tLang === cLang || tLang.includes(cLang) || cLang.includes(tLang)) {
        score += 2;
        matchingFactors.push('Language');
      }
    }

    // Final score (60 to 98)
    const finalPercent = Math.min(98, Math.max(60, Math.round(score)));

    let theme = {
      title: 'Fair Match',
      sub: 'Preferences match some of your profile criteria',
      bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50/60 border-amber-200/80',
      textClass: 'text-amber-900',
      subTextClass: 'text-amber-800/80',
      ringBg: '#fef3c7',
      ringColor: '#d97706',
      badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-200/80',
      tagClass: 'bg-amber-100/60 text-amber-900 border-amber-200/60',
      icon: 'star_half'
    };

    if (finalPercent >= 85) {
      theme = {
        title: 'Excellent Match',
        sub: 'Outstanding compatibility across key criteria',
        bgClass: 'bg-gradient-to-br from-emerald-50 to-teal-50/60 border-emerald-200/80',
        textClass: 'text-emerald-900',
        subTextClass: 'text-emerald-700/80',
        ringBg: '#d1fae5',
        ringColor: '#059669',
        badgeClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80',
        tagClass: 'bg-emerald-100/60 text-emerald-900 border-emerald-200/60',
        icon: 'verified'
      };
    } else if (finalPercent >= 70) {
      theme = {
        title: 'Good Match',
        sub: 'Strong compatibility & partner preference alignment',
        bgClass: 'bg-gradient-to-br from-amber-50 to-yellow-50/60 border-amber-200/80',
        textClass: 'text-amber-900',
        subTextClass: 'text-amber-800/80',
        ringBg: '#fef3c7',
        ringColor: '#d97706',
        badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-200/80',
        tagClass: 'bg-amber-100/60 text-amber-900 border-amber-200/60',
        icon: 'star'
      };
    }

    return {
      score: finalPercent,
      matchingFactors,
      missingFactors,
      theme
    };
  })();
  // ───────────────────────────────────────────────────────────────────────────

  const quickFacts = [
    { icon: 'cake', label: `${profile.age || 'N/A'} yrs` },
    { icon: 'diversity_3', label: profile.religion ? profile.religion.split(' - ')[0] : 'Hindu' },
    { icon: 'straighten', label: profile.height ? profile.height.split(' - ')[0] : 'Not specified' },
    { icon: 'school', label: profile.education || 'Degree' },
  ];

  const formatDob = (dobVal) => {
    if (!dobVal) return 'N/A';
    // Handle YYYY-MM-DD (MySQL format)
    if (/^\d{4}-\d{2}-\d{2}/.test(dobVal)) {
      const [y, m, d] = dobVal.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    return dobVal;
  };

  const profileDob = profile?.date_of_birth || profile?.dobEnglish || profile?.dob;
  const profileReligion = profile?.religion ? profile.religion.split(' - ')[0].trim() : 'Not specified';
  const rawProfileCaste = profile?.caste || profile?.community || (profile?.religion && profile.religion.includes('-') ? profile.religion.split('-')[1]?.trim() : '');
  const cleanProfileCaste = (rawProfileCaste && !['none', 'null', 'undefined', 'others', 'other', 'open to all'].includes(rawProfileCaste.toLowerCase())) ? rawProfileCaste.trim() : null;

  const basicDetails = [
    ['Name', formatTitleCase(profile?.name)],
    ['Gender', profile?.gender],
    ['Religion', profileReligion],
    ...(cleanProfileCaste ? [['Caste', cleanProfileCaste]] : []),
    ['Date of Birth', formatDob(profileDob)],
    ['Marital Status', profile?.marital_status || profile?.maritalStatus || 'Unmarried'],
    ['Height', profile?.height],
    ['Profile Created For', profile?.profile_created_for || profile?.profileCreatedFor || 'Myself'],
  ];

  const professionalDetails = [
    ['Education', profile.education],
    ['Occupation', profile.profession ? formatTitleCase(profile.profession) : 'Not specified'],
    ['Employment Status', profile.employment_status || profile.employmentStatus || 'Working'],
    ['Employed In', profile.employedIn || profile.employment_country || 'India'],
  ];

  const isOwnProfile = user?.profile_id?.toLowerCase() === profileId?.toLowerCase();
  const isMutualInterest = interestState.status === 'accepted' || isOwnProfile;

  const locationDetails = [
    ['Country', profile.country || 'India'],
    ['State', profile.state || 'Kerala'],
    ['District', profile.district ? profile.district.replace(/^\d+\s*-\s*/, '') : 'Not specified'],
    ['City', profile.location || profile.place || 'Not specified'],
  ];

  const fullAddressDetails = [
    ['House Name / Flat', profile.house_name || profile.houseName || 'Not Specified'],
    ['Street / Locality', profile.street_locality || profile.streetLocality || 'Not Specified'],
    ['Post Office', profile.post_office || profile.postOffice || 'Not Specified'],
    ['PIN Code', profile.pincode || 'Not Specified'],
  ];

  const horoscopeDetails = [
    ['Birth Time', profile.birth_time || 'Not specified'],
    ['Janma Sista Dasa', profile.janmaSistaDasa || 'Not specified'],
    ['End Dasa', profile.endDasa || 'Not specified'],
    ['Dob (Malayalam)', (() => {
      const val = profile.date_of_birth_malayalam || profile.dobMalayalam;
      if (!val) return 'Not specified';
      const parts = val.split(' ');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val.replace(/ /g, '/');
    })()],
    ['Dob (English)', (() => {
      const val = profile.date_of_birth || profile.dobEnglish;
      if (!val) return '';
      if (val.includes('/')) return val; // Already DD/MM/YYYY
      const parts = val.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val;
    })()],
    ['Star / Rasi', profile.horoscope_information || profile.nakshatra || profile.starRasi || 'Not specified'],
  ];

  const familyDetails = [
    ['Father\'s Name', profile.fathers_name || profile.father_name || profile.fathersName || 'Not specified'],
    ['Father\'s Age', profile.age_of_father || profile.fathers_age || profile.fathersAge || 'Not specified'],
    ['Father\'s Job', profile.fathers_job || profile.father_job || profile.fathersJob || 'Not specified'],
    ['Mother\'s Name', profile.mothers_name || profile.mother_name || profile.mothersName || 'Not specified'],
    ['Mother\'s Age', profile.age_of_mother || profile.mothers_age || profile.mothersAge || 'Not specified'],
    ['Mother\'s Job', profile.mothers_job || profile.mother_job || profile.mothersJob || 'Not specified'],
    ['Sibling Details', profile.sibling_details || profile.siblingDetails || 'Not specified'],
  ];

  const isValidPhoto = (url) => url && typeof url === 'string' && url.trim() !== '' && url !== 'null' && url !== 'undefined' && !url.includes('img_avatar');
  const defaultAvatar = profile.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png';

  const rawPhotos = [
    profile.photo_1,
    profile.photo_2,
    profile.photo_3,
    profile.photo_4,
    profile.photo,
    profile.image,
    profile.avatar
  ].filter(isValidPhoto);

  const userPhotos = [...new Set(rawPhotos)];
  if (userPhotos.length === 0) {
    userPhotos.push(defaultAvatar);
  }

  const effectivePlan = getEffectivePlan(user);
  const canViewPremiumFeatures = isLoggedIn && user && ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(effectivePlan);
  const canViewDetailedInfo = isLoggedIn && user && ['GOLD', 'PLATINUM', 'DIAMOND'].includes(effectivePlan);

  let galleryPhotos = [...userPhotos];
  if (!canViewPremiumFeatures && userPhotos.length > 1) {
    galleryPhotos = [userPhotos[0], 'locked_photos'];
  }

  const handlePrevPhoto = () => {
    if (galleryPhotos[activePhotoIdx] === 'locked_photos') return;
    setActivePhotoIdx((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (galleryPhotos[activePhotoIdx] === 'locked_photos') return;
    setActivePhotoIdx((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbfaf9] via-rose-50/10 to-amber-50/5 text-charcoal-text pt-24 md:pt-28 pb-16">
      <main className="mx-auto grid max-w-container-max gap-6 px-margin-mobile py-6 md:grid-cols-[360px_1fr] md:px-margin-desktop">
        
        {/* Left Column: Portrait & Locked Contact Panel */}
        <aside className="md:sticky md:top-24 md:self-start w-full max-w-[340px] md:max-w-none mx-auto md:bg-transparent md:p-0 md:border-0 md:shadow-none">
          <div className="relative overflow-hidden rounded-2xl border-2 border-heritage-gold/25 p-1.5 bg-white shadow-md group w-full mx-auto">
            {/* Main Active Photo / Avatar */}
            {galleryPhotos[activePhotoIdx] === 'locked_photos' ? (
              <div 
                className="aspect-[4/5] w-full bg-[#f8fafc] rounded-xl flex flex-col items-center justify-center border border-slate-200 cursor-pointer p-4 text-center group-hover:border-blue-300 transition-colors"
                onClick={() => handleRequirePlan(['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'], 'View Photos & Horoscopes')}
              >
                <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">lock</span>
                </div>
                <h3 className="font-bold text-charcoal-text text-sm mb-1">More Photos Locked</h3>
                <p className="text-[10px] text-soft-gray font-medium">Upgrade to Silver plan to unlock</p>
                <button className="mt-4 text-[10px] font-bold text-blue-600 border border-blue-200 bg-blue-50 px-4 py-1.5 rounded-lg flex items-center gap-1">
                  Upgrade Now <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                </button>
              </div>
            ) : (
              <img 
                src={getResolvedImageUrl(galleryPhotos[activePhotoIdx], profile.gender)} 
                alt={profile.name} 
                className="aspect-[3/4] w-full object-cover object-top rounded-xl shadow-inner bg-slate-100"
                onError={(e) => handleImageError(e, profile.gender)}
              />
            )}
            
            {/* Badges Container - Flex Row to Prevent Overlap on Mobile */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
              {/* Verified Profile Badge */}
              <div className="bg-emerald-600/95 text-white font-bold tracking-wider text-[9px] uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1 shrink-0 pointer-events-auto border border-white/20">
                <span className="material-symbols-outlined text-[12px] leading-none fill-current">verified</span>
                <span>100%</span>
              </div>

              {/* Diamond Premium Profile Badge */}
              {(profile.plan?.toUpperCase() === 'DIAMOND' || (user?.plan?.toUpperCase() === 'DIAMOND' && (profile.id === user?.profile_id || profile.profile_id === user?.profile_id))) && (
                <div className="bg-gradient-to-r from-amber-500 to-heritage-gold text-white font-bold tracking-wider text-[9px] uppercase px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1 shrink-0 border border-amber-300/50 pointer-events-auto">
                  <span className="material-symbols-outlined text-[12px] leading-none text-yellow-100">workspace_premium</span>
                  <span>Diamond</span>
                </div>
              )}
            </div>

            {/* Carousel Chevrons */}
            {galleryPhotos.length > 1 && (
              <>
                <button 
                  onClick={handlePrevPhoto} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-charcoal-text w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 z-20 opacity-0 group-hover:opacity-100 duration-250"
                  aria-label="Previous photo"
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">chevron_left</span>
                </button>
                <button 
                  onClick={handleNextPhoto} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-charcoal-text w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 z-20 opacity-0 group-hover:opacity-100 duration-250"
                  aria-label="Next photo"
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">chevron_right</span>
                </button>
              </>
            )}
          </div>

          {/* Multiple Photo View Section — Total 4 Photo Slots */}
          <div className="mt-3 grid grid-cols-4 gap-2 w-full">
            {Array.from({ length: 4 }).map((_, index) => {
              const photo = galleryPhotos[index];
              const isActive = activePhotoIdx === index;

              if (photo === 'locked_photos') {
                return (
                  <button
                    key={index}
                    onClick={() => setActivePhotoIdx(index)}
                    className={`aspect-square w-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
                      isActive ? 'border-deep-maroon scale-105 shadow-sm' : 'border-slate-200/60 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Locked photo ${index + 1}`}
                  >
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                    </div>
                  </button>
                );
              }

              if (photo) {
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      if (e.currentTarget.dataset.error === 'true') return;
                      setActivePhotoIdx(index);
                    }}
                    className={`aspect-square w-full rounded-xl overflow-hidden border-2 transition-all relative ${
                      isActive ? 'border-deep-maroon scale-105 shadow-sm' : 'border-slate-200/60 opacity-70 hover:opacity-100'
                    } cursor-pointer`}
                    aria-label={`Toggle photo ${index + 1}`}
                  >
                    {/* Placeholder SVG behind the image */}
                    <div className="absolute inset-0 bg-[#f1f5f9] border border-slate-200/60 flex items-center justify-center opacity-60">
                      <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    {/* Actual image on top */}
                    <img 
                      src={getResolvedImageUrl(photo, profile.gender)} 
                      alt="" 
                      className="w-full h-full object-cover relative z-10 bg-white" 
                      onError={(e) => {
                        if (index === 0) {
                          handleImageError(e, profile.gender);
                        } else {
                          e.target.style.display = 'none';
                          const btn = e.target.closest('button');
                          if (btn) {
                            btn.dataset.error = 'true';
                            btn.style.cursor = 'not-allowed';
                            btn.style.border = 'none';
                          }
                        }
                      }}
                    />
                  </button>
                );
              }

              // Disabled / Non-clickable Placeholder for unuploaded photo slots
              return (
                <div 
                  key={index}
                  className="aspect-square w-full rounded-xl bg-[#f1f5f9] border border-slate-200/60 flex items-center justify-center opacity-60 cursor-not-allowed select-none"
                  title={`Photo ${index + 1} not uploaded`}
                >
                  <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Name and ID in One Line */}
          <div className="mt-3.5 space-y-1 text-center md:text-left w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-nowrap w-full">
              <h1 className="font-display-lg text-xl sm:text-2xl font-bold text-deep-maroon tracking-tight leading-tight truncate">
                {formatTitleCase(profile.name)}
              </h1>
              <span className="shrink-0 inline-flex items-center gap-1 bg-deep-maroon/5 border border-deep-maroon/15 text-deep-maroon px-2 py-0.5 rounded-md font-mono font-bold text-[11px] sm:text-xs tracking-wider shadow-2xs">
                <span className="material-symbols-outlined text-[13px] opacity-75">badge</span>
                <span>{profile.profile_id || profile.id || profileId}</span>
              </span>
            </div>
            {(profile.district || profile.location) && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center justify-center md:justify-start gap-1 pt-0.5">
                <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                <span>{profile.district?.replace(/^\d+\s*-\s*/, '') || profile.location}</span>
              </p>
            )}
          </div>

          {/* Enhanced Compatibility Score Widget */}
          {matchResult && (
            <div className={`mt-4 rounded-xl p-4 border shadow-sm ${matchResult.theme.bgClass}`}>
              <div className="flex items-center gap-3">
                {/* SVG Progress Ring */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" stroke={matchResult.theme.ringBg} strokeWidth="3.5" fill="transparent" />
                    <circle
                      cx="24" cy="24" r="20"
                      stroke={matchResult.theme.ringColor}
                      strokeWidth="3.5" fill="transparent"
                      strokeDasharray="125.6"
                      strokeDashoffset={125.6 - (125.6 * matchResult.score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className={`text-xs font-bold ${matchResult.theme.textClass}`}>{matchResult.score}%</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">{matchResult.theme.icon}</span>
                    <p className={`text-xs sm:text-sm font-bold ${matchResult.theme.textClass}`}>{matchResult.theme.title}</p>
                  </div>
                  <p className={`text-[10px] sm:text-[11px] font-medium leading-tight ${matchResult.theme.subTextClass}`}>{matchResult.theme.sub}</p>
                </div>
              </div>

              {/* Matching Factor Badges */}
              {matchResult.matchingFactors.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-black/5 flex flex-wrap gap-1.5 items-center">
                  {matchResult.matchingFactors.map((factor, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 shadow-2xs ${matchResult.theme.tagClass}`}
                    >
                      <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                      {factor}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Address Locked Section */}
          <div className="mt-4 border-t border-slate-200 pt-4 text-left">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="material-symbols-outlined text-[16px] sm:text-[20px] text-charcoal-text font-bold">phone_in_talk</span>
              <h3 className="text-[11px] sm:text-xs font-bold text-charcoal-text uppercase tracking-wider">Contact Details</h3>
            </div>

            {isLoggedIn ? (
              ['PLATINUM', 'DIAMOND'].includes(effectivePlan) ? (
                <div className="bg-emerald-50/80 rounded-xl p-3 sm:p-3.5 border border-emerald-100/80 flex flex-col gap-2.5 shadow-sm">
                  {/* Unmasked Phone Line */}
                  <div className="flex items-center gap-2.5 text-emerald-900">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">smartphone</span>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Mobile Number</p>
                      <p className="text-xs sm:text-sm font-bold tracking-wide text-charcoal-text">
                        {profile.country_code || '+91'} {profile.mobile_number || profile.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Email Line */}
                  {profile.email_address && (
                    <div className="flex items-center gap-2.5 text-emerald-900 pt-2 border-t border-emerald-200/50">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">mail</span>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Email Address</p>
                        <p className="text-xs font-bold tracking-wide text-charcoal-text">{profile.email_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Masked Phone Line */}
                  <div className="flex items-center gap-2 pl-1 mb-1.5 text-[11px] sm:text-xs font-bold text-charcoal-text">
                    <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-slate-500">smartphone</span>
                    <span>+91 099* *** ***</span>
                  </div>

                  {/* WhatsApp Line */}
                  <div className="flex items-center gap-2 pl-1 mb-3 text-[11px] sm:text-xs font-bold text-charcoal-text">
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.887-6.963C16.578 1.928 14.113.901 11.49.901c-5.45 0-9.875 4.421-9.879 9.855-.001 1.75.475 3.46 1.378 4.975l-1.03 3.766 3.864-1.013zm11.366-7.406c-.3-.15-1.774-.875-2.046-.975-.272-.1-.47-.15-.667.15-.198.3-.767.975-.94 1.175-.173.2-.347.225-.647.075-.3-.15-1.266-.467-2.41-1.485-.89-.795-1.49-1.777-1.664-2.078-.174-.3-.019-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.667-1.605-.913-2.197-.24-.578-.484-.5-.667-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.774-.725 2.022-1.425.247-.699.247-1.299.173-1.425-.074-.124-.272-.198-.57-.348z" />
                    </svg>
                    <span>WhatsApp Verified</span>
                  </div>

                  {/* Lock Action Box */}
                  <div className="bg-[#f4f6f8] rounded-xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3.5 border border-slate-100">
                    <div className="relative flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center bg-violet-500 rounded-xl text-white shadow-sm">
                      <span className="material-symbols-outlined text-[15px] sm:text-[18px] fill-current">lock</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-bold text-charcoal-text leading-tight">Upgrade to unlock contact details</p>
                      <button 
                        onClick={() => handleRequirePlan(['PLATINUM', 'DIAMOND'], 'View Contact Numbers')}
                        className="text-[9px] sm:text-[10px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 mt-0.5 transition-colors cursor-pointer"
                      >
                        Upgrade Now
                        <span className="material-symbols-outlined text-[12px] leading-none">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              )
            ) : (
              <>
                {/* Masked Phone Line */}
                <div className="flex items-center gap-2 pl-1 mb-1.5 text-[11px] sm:text-xs font-bold text-slate-400">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px]">smartphone</span>
                  <span>+91 9447x xxxxx</span>
                </div>

                {/* WhatsApp Line */}
                <div className="flex items-center gap-2 pl-1 mb-3 text-[11px] sm:text-xs font-bold text-slate-400">
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.887-6.963C16.578 1.928 14.113.901 11.49.901c-5.45 0-9.875 4.421-9.879 9.855-.001 1.75.475 3.46 1.378 4.975l-1.03 3.766 3.864-1.013zm11.366-7.406c-.3-.15-1.774-.875-2.046-.975-.272-.1-.47-.15-.667.15-.198.3-.767.975-.94 1.175-.173.2-.347.225-.647.075-.3-.15-1.266-.467-2.41-1.485-.89-.795-1.49-1.777-1.664-2.078-.174-.3-.019-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.667-1.605-.913-2.197-.24-.578-.484-.5-.667-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.774-.725 2.022-1.425.247-.699.247-1.299.173-1.425-.074-.124-.272-.198-.57-.348z" />
                  </svg>
                  <span>WhatsApp Number (Locked)</span>
                </div>

                {/* Lock Action Box */}
                <div className="bg-[#f4f6f8] rounded-xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3.5 border border-slate-100">
                  <div className="relative flex h-7.5 w-7.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center bg-amber-500 rounded-xl text-white shadow-sm">
                    <span className="material-symbols-outlined text-[15px] sm:text-[18px] fill-current">lock</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-charcoal-text leading-tight">Login to unlock contact details</p>
                    <Link to="/login" className="text-[9px] sm:text-[10px] font-bold text-deep-maroon hover:text-primary inline-flex items-center gap-0.5 mt-0.5 transition-colors">
                      Login Now
                      <span className="material-symbols-outlined text-[12px] leading-none">chevron_right</span>
                    </Link>
                  </div>
                </div>
                </>
              )}
          </div>

          {/* Place 3: Profile Detail Sidebar Ad */}
          <div className="mt-4">
            <AdBanner slot="SEARCH_SIDEBAR" tier="SIDEBAR" />
          </div>
        </aside>

        {/* Right Column: Premium Details Content */}
        <section className="min-w-0 flex flex-col gap-6">

          {/* Diamond Premium Profile Header Banner */}
          {(profile.plan?.toUpperCase() === 'DIAMOND' || (user?.plan?.toUpperCase() === 'DIAMOND' && (profile.id === user?.profile_id || profile.profile_id === user?.profile_id))) && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-heritage-gold text-white rounded-2xl p-4 shadow-md flex items-center justify-between border border-amber-300/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px] text-yellow-100">workspace_premium</span>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-yellow-100 leading-tight flex items-center gap-1.5">
                    <span>Diamond Premium Member</span>
                    <span className="material-symbols-outlined text-[14px] text-yellow-200">verified</span>
                  </p>
                  <p className="text-[11px] text-white/95 font-medium mt-0.5">Verified Diamond VIP Member of Bharath Marriage</p>
                </div>
              </div>
              <span className="bg-white/20 text-white font-bold text-[9px] uppercase px-3 py-1 rounded-full backdrop-blur-xs border border-white/30 shrink-0 hidden sm:inline-block">
                VIP MEMBER
              </span>
            </div>
          )}

          {/* Quick Action Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-3 md:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Primary Action Buttons (Interest, Favourite & Chat Now) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1">
              {/* Interest Button */}
              {!isOwnProfile && (
                <button
                  onClick={handleInterestButtonClick}
                  disabled={interestLoading}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-3.5 sm:px-4 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-xs font-bold whitespace-nowrap shrink-0 ${
                    interestState.status === 'accepted'
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                      : interestState.status === 'pending' && interestState.isReceiver
                      ? 'border-primary bg-primary text-white shadow-md animate-bounce'
                      : interestState.status === 'pending' && interestState.isSender
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  } ${interestLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {interestState.status === 'accepted'
                      ? 'favorite'
                      : interestState.status === 'pending' && interestState.isReceiver
                      ? 'mark_email_unread'
                      : interestState.status === 'pending' && interestState.isSender
                      ? 'check_circle'
                      : 'volunteer_activism'}
                  </span>
                  <span>
                    {interestState.status === 'accepted'
                      ? 'Mutual Interest'
                      : interestState.status === 'pending' && interestState.isReceiver
                      ? 'Accept Interest'
                      : interestState.status === 'pending' && interestState.isSender
                      ? 'Interest Sent'
                      : 'Send Interest'}
                  </span>
                </button>
              )}

              <button
                onClick={handleToggleFavourite}
                disabled={favLoading}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-3.5 sm:px-4 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-xs font-bold whitespace-nowrap shrink-0 ${
                  isFavourite 
                    ? 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100' 
                    : 'border-slate-200 bg-slate-50 text-soft-gray hover:bg-slate-100'
                } ${favLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isFavourite ? 'fill-current text-pink-600' : ''}`}>favorite</span>
                <span>{isFavourite ? 'Favourited' : 'Favourite'}</span>
              </button>

              <button
                onClick={handleChatNow}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-3.5 sm:px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95 text-xs font-bold whitespace-nowrap shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Chat Now</span>
              </button>
            </div>

            {/* Secondary Action Toolbar & Status (Active & Report) */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              {profile && (
                <div className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl border text-xs font-bold ${
                  !profile.status || profile.status.toUpperCase() === 'ACTIVE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : profile.status.toUpperCase() === 'DEACTIVATED' 
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {!profile.status || profile.status.toUpperCase() === 'ACTIVE'
                      ? 'check_circle' 
                      : profile.status.toUpperCase() === 'DEACTIVATED'
                        ? 'person_off'
                        : 'info'
                    }
                  </span>
                  <span className="uppercase text-xs">{profile.status || 'ACTIVE'}</span>
                </div>
              )}

              <button 
                onClick={handleOpenReport}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-600 transition-colors text-xs font-bold cursor-pointer shadow-2xs"
                aria-label="Report profile"
              >
                <span className="material-symbols-outlined text-[16px]">flag</span>
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Quick Facts Widget */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickFacts.map((fact) => (
              <div key={fact.label} className="bg-white border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:border-heritage-gold/20 hover:shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-heritage-gold bg-amber-50/60 p-1.5 rounded-xl">{fact.icon}</span>
                <span className="text-xs font-bold text-charcoal-text">{fact.label}</span>
              </div>
            ))}
          </div>

          {/* Combined Profile Details Card */}
          <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-slate-200/60 md:shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-0 md:p-6 flex flex-col gap-6 relative overflow-hidden">
            
            {/* Basic Details (Always Visible) */}
            <DetailSection title="Basic Details" rows={basicDetails} />

            {/* Restricted Content Wrapper */}
            <div className={`flex flex-col gap-6 transition-all duration-300 ${!isLoggedIn ? 'select-none filter blur-sm pointer-events-none md:max-h-[300px] max-h-[250px] overflow-hidden' : ''}`}>
              {/* About Me Segment */}
              <div>
                <h2 className="font-display-lg text-[13px] tracking-wider text-deep-maroon font-bold uppercase border-b border-heritage-gold/20 pb-1.5 mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-heritage-gold"></span>
                  About Me
                </h2>
                <p className="text-xs leading-6 text-slate-600 italic font-medium max-w-3xl">
                  "{firstName} is a warm, family-oriented professional working as a {formatTitleCase(profile.profession) || 'professional'} in {profile.location || 'Kerala'}. {subject} values honesty,
                  education, and a balanced lifestyle, and is looking for a partner with shared family values and mutual respect."
                </p>
              </div>

              {/* Profile Details Sections */}
              {canViewDetailedInfo ? (
                <>
                  <DetailSection title="Professional Info" rows={professionalDetails} />
                  
                  {/* Location Details with Mutual Interest Privacy */}
                  <div className="py-2">
                    <DetailSection title="Location Details" rows={locationDetails} />
                    
                    {isMutualInterest ? (
                      <div className="mt-3 bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60">
                        <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs border-b border-emerald-200/80 pb-2">
                          <span className="material-symbols-outlined text-[16px]">verified_user</span>
                          <span>Full Address (Mutual Interest Unlocked)</span>
                        </div>
                        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 pt-1">
                          {fullAddressDetails.map(([label, value]) => (
                            <div key={label} className="flex justify-between items-start py-1.5 border-b border-emerald-100/60 last:border-b-0 gap-4">
                              <span className="text-[10px] font-bold text-emerald-900/70 uppercase tracking-wider mt-0.5 shrink-0">{label}</span>
                              <span className="text-xs font-semibold text-charcoal-text text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-4 bg-gradient-to-r from-rose-50/60 via-amber-50/40 to-slate-50 rounded-xl border border-rose-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">lock_person</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-charcoal-text">
                              Full Address Details Locked
                            </p>
                            <p className="text-[11px] text-soft-gray mt-0.5">
                              House name, street, post office & PIN code are only visible to mutual interest matches.
                            </p>
                          </div>
                        </div>

                        {interestState.status === 'pending' && interestState.isReceiver ? (
                          <button
                            onClick={handleSendOrReturnInterest}
                            disabled={interestLoading}
                            className="px-3.5 py-2 bg-primary hover:bg-deep-maroon text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 sm:w-[130px]"
                          >
                            <span>Accept Interest</span>
                          </button>
                        ) : interestState.status === 'pending' && interestState.isSender ? (
                          <button
                            onClick={handleSendOrReturnInterest}
                            disabled={interestLoading}
                            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 shadow-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 sm:w-[130px]"
                            title="Click to cancel interest"
                          >
                            <span>Interest Sent</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleSendOrReturnInterest}
                            disabled={interestLoading}
                            className="px-3.5 py-2 bg-deep-maroon hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 sm:w-[130px]"
                          >
                            <span>Send Interest</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <DetailSection title="Family Details" rows={familyDetails} />
                </>
              ) : (
                <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center mt-2 mb-2">
                  <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[24px]">lock</span>
                  </div>
                  <h3 className="font-bold text-charcoal-text text-sm mb-1">Detailed Info Locked</h3>
                  <p className="text-[11px] text-soft-gray font-medium max-w-[250px] mx-auto mb-4">
                    Upgrade to Gold plan or higher to view professional, location, and family details.
                  </p>
                  <button 
                    onClick={() => handleRequirePlan(['GOLD', 'PLATINUM', 'DIAMOND'], 'Detailed Profile Info')}
                    className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                  >
                    Upgrade Now <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              )}

              {isHindu && (
                <div className="py-4 border-t border-slate-100/60 mt-2">
                  <div className="flex items-center justify-between border-b border-heritage-gold/20 pb-1.5 mb-3">
                    <h2 className="font-display-lg text-[13px] tracking-wider text-deep-maroon font-bold uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-deep-maroon">cake</span>
                      Horoscope Details
                    </h2>
                    {canViewPremiumFeatures && (
                      <button
                        onClick={handleHoroscopeDownloadClick}
                        className="flex items-center gap-1.5 bg-deep-maroon hover:bg-deep-maroon/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Download
                      </button>
                    )}
                  </div>

                  {canViewPremiumFeatures ? (
                    <>
                      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                        {horoscopeDetails.map(([label, value]) => (
                          <div key={label} className="flex justify-between items-start py-1.5 border-b border-slate-100/60 last:border-b-0 gap-4">
                            <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wider mt-0.5 shrink-0">{label}</span>
                            <span className="text-xs font-semibold text-charcoal-text text-right">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* South Indian / Kerala Style Horoscope Grids Component */}
                      <HoroscopeCharts />
                    </>
                  ) : (
                    <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-[24px]">lock</span>
                      </div>
                      <h3 className="font-bold text-charcoal-text text-sm mb-1">Horoscope Details Locked</h3>
                      <p className="text-[11px] text-soft-gray font-medium max-w-[250px] mx-auto mb-4">
                        Upgrade to the Silver plan or higher to view full horoscope details and planetary charts.
                      </p>
                      <button 
                        onClick={() => handleRequirePlan(['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'], 'View Photos & Horoscopes')}
                        className="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-5 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lock Overlay for Restricted Content */}
            {!isLoggedIn && (
              <div className="absolute inset-x-0 bottom-0 top-[220px] bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="max-w-md bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 -mt-8 sm:mt-0">
                  <div className="w-12 h-12 rounded-full bg-deep-maroon/10 text-deep-maroon flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[24px] fill-current">lock</span>
                  </div>
                  <h3 className="font-display-lg text-base sm:text-lg text-charcoal-text uppercase tracking-wider mb-2 font-bold">
                    Unlock Full Profile Details
                  </h3>
                  <p className="text-[11px] sm:text-xs text-soft-gray leading-relaxed mb-6">
                    About me, professional information, family background, location preferences, and horoscope details are only visible to registered members.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/login"
                      className="bg-deep-maroon hover:bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-md transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      Login
                    </Link>
                    <Link
                      to="/#register"
                      className="bg-white hover:bg-slate-50 text-deep-maroon border border-deep-maroon/30 text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Register Free
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

        </section>
      </main>

      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })} 
        requiredPlan={upgradeModal.requiredPlan}
        featureName={upgradeModal.featureName}
      />

      {/* Report Profile Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative">
            <button 
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 text-rose-600">
              <span className="material-symbols-outlined text-2xl">report_problem</span>
              <h3 className="text-lg font-bold text-slate-800">Report Profile</h3>
            </div>

            <p className="text-xs text-slate-500">
              Help us maintain a safe community. Tell us why you are reporting <span className="font-bold text-slate-700">{profile?.name || profileId}</span>.
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <span>{reportSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
                {reportError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-base">error</span>
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Reason for Report *</label>
                  <select 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50 font-medium cursor-pointer"
                  >
                    <option value="Fake Profile / Impersonation">Fake Profile / Impersonation</option>
                    <option value="Inappropriate Photos or Content">Inappropriate Photos or Content</option>
                    <option value="Harassment or Abusive Behavior">Harassment or Abusive Behavior</option>
                    <option value="Scam, Money Request or Commercial Spam">Scam, Money Request or Commercial Spam</option>
                    <option value="Incorrect or Misleading Information">Incorrect or Misleading Information</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Additional Details (Optional)</label>
                  <textarea 
                    rows="3"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide any extra context to help our moderation team..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50 font-medium"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {reportSubmitting && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                    <span>Submit Report</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmation & Info Modal for Mutual / Express Interest */}
      {interestConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-scale-up relative space-y-4">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setInterestConfirmModal({ isOpen: false, type: '' })}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>

            {/* Top Icon Badge */}
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-xs ${
              interestConfirmModal.type === 'accepted'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : interestConfirmModal.type === 'return'
                ? 'bg-deep-maroon/10 text-deep-maroon border-deep-maroon/20'
                : interestConfirmModal.type === 'withdraw'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-deep-maroon/10 text-deep-maroon border-deep-maroon/20'
            }`}>
              <span className="material-symbols-outlined text-[28px]">
                {interestConfirmModal.type === 'accepted'
                  ? 'favorite'
                  : interestConfirmModal.type === 'return'
                  ? 'mark_email_read'
                  : interestConfirmModal.type === 'withdraw'
                  ? 'heart_broken'
                  : 'volunteer_activism'}
              </span>
            </div>

            {/* Modal Title & Text */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-800">
                {interestConfirmModal.type === 'accepted'
                  ? 'Mutual Interest Connected ❤️'
                  : interestConfirmModal.type === 'return'
                  ? 'Accept Interest & Match?'
                  : interestConfirmModal.type === 'withdraw'
                  ? 'Withdraw Interest Request?'
                  : 'Send Express Interest?'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {interestConfirmModal.type === 'accepted'
                  ? `You and ${profile?.name || 'this member'} have expressed mutual interest! Direct chat and full contact details are unlocked.`
                  : interestConfirmModal.type === 'return'
                  ? `${profile?.name || 'This member'} expressed interest in your profile. Accept interest to confirm mutual connection and unlock direct chat!`
                  : interestConfirmModal.type === 'withdraw'
                  ? `Are you sure you want to withdraw the interest request sent to ${profile?.name || 'this member'}?`
                  : `Send an express interest request to ${profile?.name || 'this member'}? They will be notified immediately.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {interestConfirmModal.type === 'accepted' ? (
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setInterestConfirmModal({ isOpen: false, type: '' });
                      handleChatNow();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    <span>Chat with {profile?.name ? profile.name.split(' ')[0] : 'Member'} Now</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      type="button"
                      disabled={interestLoading}
                      onClick={async () => {
                        if (!interestState.interestId) return;
                        setInterestLoading(true);
                        try {
                          await axiosInstance.delete(`/users/interests/${interestState.interestId}`);
                          setInterestState({
                            status: 'none',
                            isSender: false,
                            isReceiver: false,
                            interestId: null
                          });
                          setInterestConfirmModal({ isOpen: false, type: '' });
                          toast.showToast('Mutual interest connection cancelled', 'info');
                        } catch (err) {
                          console.error('Failed to cancel mutual interest', err);
                          toast.showToast('Failed to cancel mutual interest', 'error');
                        } finally {
                          setInterestLoading(false);
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">heart_broken</span>
                      <span>Cancel Interest</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterestConfirmModal({ isOpen: false, type: '' })}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setInterestConfirmModal({ isOpen: false, type: '' })}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={interestLoading}
                    onClick={async () => {
                      setInterestConfirmModal({ isOpen: false, type: '' });
                      await handleSendOrReturnInterest();
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      interestConfirmModal.type === 'withdraw'
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                        : 'bg-deep-maroon hover:bg-primary shadow-deep-maroon/20'
                    }`}
                  >
                    {interestLoading ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <span>
                        {interestConfirmModal.type === 'return'
                          ? 'Yes, Return'
                          : interestConfirmModal.type === 'withdraw'
                          ? 'Yes, Withdraw'
                          : 'Yes, Send'}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
