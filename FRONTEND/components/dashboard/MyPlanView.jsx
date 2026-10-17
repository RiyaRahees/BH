import React, { useState, useEffect } from 'react';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../src/context/ToastContext';

export default function MyPlanView() {
  const { user, updateUser, verifySession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [history, setHistory] = useState([]);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, plansRes, historyRes] = await Promise.allSettled([
          axiosInstance.get(`/users/profile/${user.profile_id}`),
          axiosInstance.get('/public/plans'),
          axiosInstance.get('/payments/history')
        ]);
        if (profileRes.status === 'fulfilled' && profileRes.value?.data?.user) {
          setProfile(profileRes.value.data.user);
        }
        if (plansRes.status === 'fulfilled' && plansRes.value?.data) {
          setPlans(plansRes.value.data.plans || plansRes.value.data);
        }
        if (historyRes.status === 'fulfilled' && historyRes.value?.data?.history) {
          setHistory(historyRes.value.data.history);
        } else {
          // Try fallback endpoint /payment/history
          try {
            const fallbackHist = await axiosInstance.get('/payment/history');
            if (fallbackHist.data?.history) {
              setHistory(fallbackHist.data.history);
            }
          } catch(e) {}
        }
      } catch (err) {
        console.error('Failed to fetch plan data', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.profile_id) {
      fetchData();
    }
  }, [user?.profile_id]);

  const handleClaimFreeTrial = async () => {
    setClaiming(true);
    try {
      const res = await axiosInstance.post('/users/claim-free-trial');
      if (res.data.success) {
        const updatedUser = res.data.user;
        
        // 1. Immediately update local profile state
        setProfile(updatedUser);
        
        // 2. Immediately update global auth context in real-time
        if (updateUser) {
          updateUser(updatedUser);
        }
        if (verifySession) {
          verifySession();
        }

        // 3. Immediately refresh billing / invoice history
        try {
          const histRes = await axiosInstance.get('/payments/history');
          if (histRes.data?.history) {
            setHistory(histRes.data.history);
          }
        } catch (hErr) {
          console.warn('Could not refresh history:', hErr);
        }

        // 4. Open the Luxury VIP Celebration Modal
        setShowCelebrationModal(true);
        toast.showToast(res.data.message || '🎉 1-Year Free Diamond Plan activated!', 'success');
      }
    } catch (err) {
      console.error('Failed to claim free trial', err);
      toast.showToast(err.response?.data?.error || 'Failed to claim free trial', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const downloadInvoice = (item) => {
    const issueDateObj = new Date(item.date || Date.now());
    const invDate = issueDateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const isTrialOr1Year = Number(item.amount) === 0 || String(item.newPlan).includes('365') || String(item.orderId).includes('365') || String(item.paymentId).includes('FREE_CLAIM') || String(item.newPlan).toUpperCase().includes('DIAMOND');
    const validityDays = isTrialOr1Year ? 365 : 30;

    const expiryDateObj = new Date(issueDateObj);
    expiryDateObj.setDate(expiryDateObj.getDate() + validityDays);

    const invExpiryDate = expiryDateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.showToast('Please allow popups to download invoice.', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${item.paymentId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; padding: 40px; background: #f8fafc; line-height: 1.6; font-size: 13px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 48px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
          .invoice-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #800020 0%, #b3002d 100%); }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 120px; font-weight: 900; color: rgba(220, 252, 231, 0.4); z-index: 0; pointer-events: none; letter-spacing: 10px; }
          .content-wrapper { position: relative; z-index: 1; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .brand-title { font-size: 28px; font-weight: 800; color: #800020; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 4px; }
          .brand-sub { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .company-info { margin-top: 12px; font-size: 12px; color: #64748b; line-height: 1.5; }
          .invoice-heading { text-align: right; }
          .invoice-heading h1 { font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
          .invoice-details { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
          .detail-row { display: flex; gap: 12px; font-size: 12px; }
          .detail-label { color: #64748b; font-weight: 500; }
          .detail-value { color: #0f172a; font-weight: 700; }
          
          .grid-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9; }
          .box h4 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .box p { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
          .box .sub-text { font-size: 12px; font-weight: 400; color: #64748b; }
          
          .table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .table th { background: #f8fafc; text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
          .table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; background: #fff; }
          .table tr:last-child td { border-bottom: none; }
          .amount-row { text-align: right; }
          .badge-success { display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #166534; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge-success::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #166534; }
          
          .summary-container { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .total-card { width: 320px; background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
          .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 12px; font-weight: 500; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #800020; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #cbd5e1; }
          
          .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
          .footer h4 { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .footer p { font-size: 12px; color: #64748b; }
          
          @media print {
            body { padding: 0; background: #fff; }
            .invoice-card { border: none; box-shadow: none; padding: 20px; max-width: 100%; border-radius: 0; }
            .invoice-card::before { display: none; }
            .watermark { color: rgba(220, 252, 231, 0.4) !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="watermark">PAID</div>
          <div class="content-wrapper">
            <div class="header">
              <div>
                <div class="brand-title">Bharath Marriage</div>
                <div class="brand-sub">Verified Matrimonial Services</div>
                <div class="company-info">
                  MG Road, Kochi, Kerala 682016<br/>
                  India | GSTIN: 32AAACB1234F1Z9<br/>
                  support@bharathmarriage.com
                </div>
              </div>
              <div class="invoice-heading">
                <h1>INVOICE</h1>
                <div class="invoice-details">
                  <div class="detail-row">
                    <span class="detail-label">Invoice No:</span>
                    <span class="detail-value">INV-${item.id || item.paymentId?.substring(0,8).toUpperCase() || '001'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date of Issue:</span>
                    <span class="detail-value">${invDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Plan Expiry Date:</span>
                    <span class="detail-value" style="color: #800020; font-weight: 800;">${invExpiryDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Plan Validity:</span>
                    <span class="detail-value">${validityDays} Days (${isTrialOr1Year ? '1 Year' : '1 Month'})</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-meta">
              <div class="box">
                <h4>Billed To</h4>
                <p>${profile?.full_name || user?.full_name || 'Valued Member'}</p>
                <div class="sub-text">Profile ID: ${profile?.profile_id || user?.profile_id || 'N/A'}</div>
                <div class="sub-text">${profile?.email_address || user?.email_address || ''}</div>
              </div>
              <div class="box">
                <h4>Payment Details</h4>
                <div class="sub-text" style="margin-bottom: 4px;">Payment ID: <span style="font-family: monospace; color: #0f172a; font-weight: 600;">${item.paymentId}</span></div>
                <div class="sub-text" style="margin-bottom: 8px;">Order ID: ${item.orderId || 'N/A'}</div>
                <div><span class="badge-success">${item.status || 'SUCCESS'}</span></div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Plan Tier</th>
                  <th>Valid From</th>
                  <th>Plan Expiry Date</th>
                  <th>Duration</th>
                  <th class="amount-row">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${item.newPlan} Membership</strong>
                    <div style="font-size:12px; color:#64748b; margin-top: 4px;">Full Access Matrimonial Subscription - Digital Service</div>
                  </td>
                  <td><span style="font-weight: 700; color: #800020; font-size: 13px;">${item.newPlan}</span></td>
                  <td>${invDate}</td>
                  <td><strong style="color: #800020; font-weight: 700;">${invExpiryDate}</strong></td>
                  <td>${validityDays} Days</td>
                  <td class="amount-row"><strong>₹${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="summary-container">
              <div class="total-card">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span style="color: #0f172a; font-weight: 600;">₹${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="summary-row">
                  <span>Taxes (GST 0%)</span>
                  <span style="color: #0f172a; font-weight: 600;">₹0.00</span>
                </div>
                <div class="total-row">
                  <span>Total Paid</span>
                  <span>₹${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <h4>Thank you for choosing Bharath Marriage!</h4>
              <p>This is a computer-generated tax invoice and does not require a physical signature.</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="text-center py-10">Loading plan details...</div>;
  }

  const currentPlanName = (profile?.plan || user?.plan || 'FREE').toUpperCase();
  const isClaimed = Boolean(
    profile?.is_free_trial_claimed === 1 || 
    profile?.is_free_trial_claimed === true || 
    user?.is_free_trial_claimed === 1 || 
    user?.is_free_trial_claimed === true || 
    (currentPlanName !== 'FREE')
  );

  const isDiamond = currentPlanName.includes('DIAMOND');
  const isPlatinum = currentPlanName.includes('PLATINUM');
  const isGold = currentPlanName.includes('GOLD');
  const isSilver = currentPlanName.includes('SILVER');

  const fallbackFeatures = isDiamond ? [
    "Unlimited Direct Messaging & Chat",
    "View Unlimited Contact Numbers",
    "HD Video Calling Enabled",
    "Priority Profile Badge & Top Listing",
    "Dedicated VIP Relationship Manager Support",
    "Personalized Horoscope Matching"
  ] : isPlatinum ? [
    "Unlimited Direct Messaging",
    "View Up to 150 Contact Numbers",
    "HD Video Calling Enabled",
    "Priority Profile Highlighting"
  ] : isGold ? [
    "Unlimited Direct Messaging",
    "View Up to 75 Contact Numbers",
    "Express Interest Alerts"
  ] : isSilver ? [
    "Send Unlimited Messages",
    "View Up to 30 Contact Numbers",
    "Express Interest Alerts"
  ] : [
    "Create Profile & Upload Photos",
    "Search & Browse Profiles",
    "Send Express Interest Alerts"
  ];

  const matchedPlan = plans.find(p => p.name.toUpperCase().includes(currentPlanName));
  const currentPlanDetails = {
    name: matchedPlan?.name || (currentPlanName === 'FREE' ? 'Free Plan' : `${currentPlanName} Plan`),
    price: matchedPlan?.price ?? (currentPlanName === 'FREE' ? 0 : (isDiamond ? 2999 : isPlatinum ? 1999 : isGold ? 999 : 499)),
    features: (matchedPlan?.features && Array.isArray(matchedPlan.features) && matchedPlan.features.length > 0)
      ? matchedPlan.features
      : fallbackFeatures
  };

  const planTiers = ['FREE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const currentTierIndex = planTiers.indexOf(currentPlanName.toUpperCase());
  
  let upgradePlan = null;
  if (currentTierIndex >= 0 && currentTierIndex < planTiers.length - 1) {
    for (let i = currentTierIndex + 1; i < planTiers.length; i++) {
      const p = plans.find(plan => plan.name.toUpperCase().includes(planTiers[i]));
      if (p) {
        upgradePlan = p;
        break;
      }
    }
  }

  const currentFeatures = Array.isArray(currentPlanDetails.features) ? currentPlanDetails.features : [];
  const upgradeFeatures = upgradePlan && Array.isArray(upgradePlan.features) ? upgradePlan.features : [];

  const rawExpiry = profile?.subscription_expiry_date || profile?.subscriptionExpiryDate || user?.subscription_expiry_date || user?.subscriptionExpiryDate;
  
  let daysLeft = 365;
  let isActive = true;
  let expiryDisplay = 'Never';

  if (currentPlanName === 'FREE') {
    expiryDisplay = 'Never (Free Tier)';
    isActive = true;
  } else {
    let targetExpiry = rawExpiry;
    if (!targetExpiry) {
      const start = new Date(profile?.subscription_start_date || user?.subscription_start_date || profile?.created_at || user?.created_at || Date.now());
      const calculatedEnd = new Date(start);
      calculatedEnd.setDate(calculatedEnd.getDate() + 365);
      targetExpiry = calculatedEnd;
    }

    const expTime = new Date(targetExpiry).getTime();
    if (!isNaN(expTime)) {
      const nowTime = Date.now();
      const diffDays = Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24));
      daysLeft = Math.max(0, diffDays);
      if (diffDays > 0) {
        isActive = true;
        expiryDisplay = `${diffDays} Days Remaining`;
      } else {
        isActive = false;
        expiryDisplay = `Expired on ${new Date(targetExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
    } else {
      isActive = true;
      expiryDisplay = '365 Days Remaining';
    }
  }

  const getPlanTheme = (planName) => {
    const name = planName.toUpperCase();
    if (name.includes('DIAMOND')) {
      return { border: 'border-t-4 border-t-amber-400 border-x border-b border-amber-200/50', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-600', icon: 'text-amber-500' };
    } else if (name.includes('PLATINUM')) {
      return { border: 'border-t-4 border-t-fuchsia-900 border-x border-b border-fuchsia-200/50', badge: 'bg-fuchsia-100 text-fuchsia-900', text: 'text-fuchsia-800', icon: 'text-fuchsia-700' };
    } else if (name.includes('GOLD')) {
      return { border: 'border-t-4 border-t-deep-maroon border-x border-b border-rose-200/50', badge: 'bg-rose-100 text-deep-maroon', text: 'text-deep-maroon', icon: 'text-deep-maroon' };
    } else if (name.includes('SILVER')) {
      return { border: 'border-t-4 border-t-rose-400 border-x border-b border-rose-200/50', badge: 'bg-rose-100 text-rose-700', text: 'text-rose-500', icon: 'text-rose-400' };
    }
    return { border: 'border-t-4 border-t-slate-300 border-x border-b border-slate-200', badge: 'bg-slate-200/70 text-slate-700', text: 'text-slate-500', icon: 'text-emerald-600' };
  };

  const theme = getPlanTheme(currentPlanName);

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="rounded-none md:rounded-xl border-none md:border md:border-slate-200/60 bg-transparent md:bg-white p-0 md:p-5 shadow-none md:shadow-sm text-left">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-maroon"></span>
            My Subscription Plan
          </h2>
          <p className="text-[11px] text-soft-gray mt-1">Review your current plan privileges or upgrade to access exclusive matching features.</p>
        </div>

        {!isClaimed && (
          <div className="rounded-2xl border border-[#fecdd3]/30 bg-gradient-to-br from-[#4a0011] via-[#800020] to-[#4a0011] p-5 md:p-6 text-white shadow-[0_8px_30px_rgb(128,0,32,0.2)] relative overflow-hidden text-left mb-5 group">
            {/* Elegant Background Glow & Pattern */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#fcd34d]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-[#fcd34d]/15 transition-all duration-700"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
            
            <div className="absolute right-0 bottom-0 opacity-[0.08] pointer-events-none transform translate-x-6 translate-y-6">
              <span className="material-symbols-outlined text-[130px] text-amber-200">workspace_premium</span>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border border-amber-400/30 backdrop-blur-sm shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_5px_#fbbf24]"></span>
                  Special VIP Offer
                </span>
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-900 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-sm border border-emerald-300/50">
                  100% Free For 1 Year
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-black mb-1.5 text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-200 tracking-tight drop-shadow-sm">
                Claim Your 365 Days Diamond Plan
              </h3>
              <p className="text-xs text-rose-100/90 max-w-2xl leading-relaxed mb-4 font-medium">
                Experience the absolute highest tier of matchmaking. Unlock direct messaging, full contact number access, HD video calling, and exclusive priority profile placement—completely free for an entire year.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleClaimFreeTrial}
                  disabled={claiming}
                  className="relative overflow-hidden group bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#4a0011] font-black text-[10px] md:text-xs px-6 py-3 rounded-xl shadow-[0_5px_20px_rgba(251,191,36,0.4)] hover:shadow-[0_8px_25px_rgba(251,191,36,0.6)] transition-all cursor-pointer transform active:scale-95 flex items-center gap-2 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300"
                >
                  {claiming ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Activating Diamond VIP...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">diamond</span>
                      <span className="relative z-10">Claim Your VIP Plan Now</span>
                      <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className={`rounded-xl bg-white p-5 flex flex-col justify-between relative overflow-hidden shadow-sm ${theme.border}`}>
            <div className={`absolute right-0 top-0 text-[9px] font-bold py-1 px-3 rounded-bl-lg uppercase tracking-wider ${theme.badge}`}>
              Current Plan
            </div>
            
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${theme.text}`}>
                {isDiamond ? 'VIP Exclusive Access' : isPlatinum ? 'Platinum Privileges' : isGold ? 'Gold Privileges' : isSilver ? 'Silver Privileges' : 'Standard Access'}
              </span>
              <h3 className="text-lg font-bold text-charcoal-text">{currentPlanDetails.name}</h3>
              {currentPlanName === 'FREE' ? (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Free Tier
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  100% Free VIP Activated
                </div>
              )}
              
              <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                {currentFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${theme.icon}`}>check_circle</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs text-slate-500 flex justify-between items-center">
              <div>
                Status: <span className={`font-bold ${isActive ? 'text-emerald-600' : 'text-red-500'}`}>{isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div>
                Expires in: <span className="font-bold text-slate-800">{expiryDisplay}</span>
              </div>
            </div>
          </div>

          {upgradePlan && currentPlanName.toUpperCase() !== upgradePlan.name.toUpperCase() ? (
            <div className="rounded-xl border border-heritage-gold/30 bg-gradient-to-br from-amber-50/20 via-rose-50/10 to-white p-5 flex flex-col justify-between relative overflow-hidden shadow-xs">
              <div className="absolute right-0 top-0 bg-heritage-gold text-white text-[9px] font-bold py-1 px-3 rounded-bl-lg uppercase tracking-wider animate-pulse">
                Highly Recommended
              </div>
              
              <div>
                <span className="text-[9px] font-bold text-heritage-gold uppercase tracking-widest block mb-1">Premium Privileges</span>
                <h3 className="text-lg font-bold text-deep-maroon">{upgradePlan.name}</h3>
                <p className="text-2xl font-black text-deep-maroon mt-2">
                  ₹{upgradePlan.price} <span className="text-xs font-normal text-slate-500">/ {upgradePlan.duration}</span>
                </p>
                
                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  {upgradeFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-heritage-gold text-sm font-bold">workspace_premium</span>
                      <strong>{feature}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/packages')}
                className="mt-6 w-full bg-gradient-to-r from-deep-maroon to-primary hover:from-primary hover:to-deep-maroon text-white text-xs font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 uppercase tracking-wider text-center cursor-pointer active:scale-95 border border-white/20"
              >
                Upgrade to {upgradePlan.name}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300/50 bg-gradient-to-br from-amber-100/40 via-amber-50/30 to-white p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-xs text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-heritage-gold text-white flex items-center justify-center shadow-lg mb-4">
                <span className="material-symbols-outlined text-[36px]">workspace_premium</span>
              </div>
              <h3 className="text-xl font-bold text-deep-maroon">Elite Member</h3>
              <p className="text-sm font-semibold text-charcoal-text mt-1">You are on our highest tier plan!</p>
              <p className="text-xs text-slate-500 mt-2 px-4">
                Enjoy all premium features, unlimited matches, direct contact access, and priority profile placement.
              </p>
              <div className="mt-6 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-4 py-1.5 rounded-full">
                All Features Unlocked
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-slate-200/60 pt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-deep-maroon">receipt_long</span>
                Billing & Invoices
              </h3>
              <p className="text-xs text-slate-500 mt-1">View your transaction history and download tax invoices.</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-12 text-center border border-slate-200/60 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[32px] text-slate-400">receipt_long</span>
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">No Purchase History</h4>
              <p className="text-xs text-slate-500 max-w-sm">Your future plan upgrades, payments, and generated invoices will appear here.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
                  <thead className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-500 font-extrabold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">Transaction Details</th>
                      <th className="px-6 py-4 font-bold">Plan Name</th>
                      <th className="px-6 py-4 font-bold">Amount</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 text-right font-bold">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-slate-800 font-bold tracking-tight">{item.paymentId}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const name = item.newPlan || '';
                            const parts = name.match(/^(.*?)(?:\((.*?)\))?$/);
                            const mainName = parts ? parts[1].trim() : name;
                            const subName = parts && parts[2] ? parts[2].trim() : null;
                            return (
                              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/50 shadow-xs min-w-[120px]">
                                <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">stars</span>
                                <span className="flex flex-col text-left justify-center">
                                  <span className="text-[11px] font-bold leading-tight tracking-wider uppercase">{mainName}</span>
                                  {subName && <span className="text-[9px] font-bold text-amber-600/80 leading-tight mt-0.5">{subName}</span>}
                                </span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-sm flex items-center">
                            <span className="text-slate-400 font-normal mr-0.5">₹</span>
                            {item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {item.status || 'Completed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => downloadInvoice(item)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-deep-maroon hover:text-deep-maroon hover:bg-rose-50/30 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer active:scale-95 group/btn"
                            title="Download Tax Invoice PDF"
                          >
                            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/btn:text-deep-maroon transition-colors">download</span>
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Luxury VIP Diamond Plan Celebration Modal */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-100 shadow-2xl relative overflow-hidden text-center animate-scale-up">
            {/* Top Close Button */}
            <button
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Glowing Diamond VIP Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-sm mb-3">
              <span className="material-symbols-outlined text-[34px]">diamond</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-200 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              VIP Diamond Activated • 365 Days Free
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-xl sm:text-2xl font-bold text-charcoal-text tracking-tight mb-1">
              Congratulations!
            </h2>
            <p className="text-xs sm:text-[13px] text-soft-gray font-normal max-w-sm mx-auto leading-relaxed mb-4">
              You are now an exclusive <strong className="text-deep-maroon font-semibold">Diamond VIP Member</strong>. All premium matchmaking features have been unlocked for your account.
            </p>

            {/* Unlocked Benefits Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4 text-left">
              <div className="bg-slate-50 border border-slate-100 p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">call</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-charcoal-text">Full Contacts</p>
                  <p className="text-[9px] text-soft-gray">View phone numbers</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">chat</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-charcoal-text">Unlimited Chat</p>
                  <p className="text-[9px] text-soft-gray">Direct messaging</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">videocam</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-charcoal-text">HD Video Call</p>
                  <p className="text-[9px] text-soft-gray">Face-to-face meet</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">workspace_premium</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-charcoal-text">VIP Badge</p>
                  <p className="text-[9px] text-soft-gray">Top priority ranking</p>
                </div>
              </div>
            </div>

            {/* Validity Notice */}
            <div className="text-[11px] text-amber-900 bg-amber-50/70 py-2 px-3 rounded-xl border border-amber-200/60 mb-4 flex items-center justify-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[15px] text-amber-600">event_available</span>
              <span><strong>Validity:</strong> 365 Days From Today (1 Year Free)</span>
            </div>

            {/* Action CTA */}
            <button
              onClick={() => setShowCelebrationModal(false)}
              className="w-full py-3 px-5 rounded-xl bg-deep-maroon hover:bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Explore Diamond VIP Features</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
