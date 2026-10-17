import React, { useEffect, useState } from "react";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const plans = [
  {
    id: "free",
    tier: "Standard",
    price: "Free",
    isPopular: false,
    isElite: false,
    btnClass: "border border-deep-maroon text-deep-maroon hover:bg-deep-maroon/5",
    features: {
      "Profile Listing": true,
      "Browse Profiles": true,
      "View Photos & Horoscopes": false,
      "Detailed Profile Info": false,
      "Direct Chat & Messaging": false,
      "View Contact Numbers": false,
      "Premium Profile Badge": false,
      "Video Calling": false,
      "Download Horoscope": false,
    },
  },
  {
    id: "silver",
    tier: "Silver",
    price: "₹400/mo",
    originalPrice: "₹500",
    discount: "20% OFF",
    isPopular: false,
    isElite: false,
    btnClass: "border border-deep-maroon text-deep-maroon hover:bg-deep-maroon/5",
    features: {
      "Profile Listing": true,
      "Browse Profiles": true,
      "View Photos & Horoscopes": true,
      "Detailed Profile Info": false,
      "Direct Chat & Messaging": false,
      "View Contact Numbers": false,
      "Premium Profile Badge": false,
      "Video Calling": false,
      "Download Horoscope": false,
    },
  },
  {
    id: "gold",
    tier: "Gold",
    price: "₹600/mo",
    originalPrice: "₹700",
    discount: "15% OFF",
    isPopular: false,
    isElite: false,
    btnClass: "bg-deep-maroon hover:bg-primary text-white shadow-md hover:shadow-lg",
    features: {
      "Profile Listing": true,
      "Browse Profiles": true,
      "View Photos & Horoscopes": true,
      "Detailed Profile Info": true,
      "Direct Chat & Messaging": true,
      "View Contact Numbers": false,
      "Premium Profile Badge": false,
      "Video Calling": false,
      "Download Horoscope": false,
    },
  },
  {
    id: "platinum",
    tier: "Platinum",
    price: "₹800/mo",
    originalPrice: "₹900",
    discount: "10% OFF",
    isPopular: true,
    isElite: false,
    btnClass: "bg-deep-maroon hover:bg-primary text-white shadow-md hover:shadow-lg",
    features: {
      "Profile Listing": true,
      "Browse Profiles": true,
      "View Photos & Horoscopes": true,
      "Detailed Profile Info": true,
      "Direct Chat & Messaging": true,
      "View Contact Numbers": true,
      "Premium Profile Badge": false,
      "Video Calling": false,
      "Download Horoscope": true,
    },
  },
  {
    id: "diamond",
    tier: "Diamond",
    price: "₹1000/mo",
    originalPrice: "₹1050",
    discount: "5% OFF",
    isPopular: false,
    isElite: true,
    btnClass: "bg-heritage-gold hover:bg-amber-600 text-white shadow-md hover:shadow-lg",
    features: {
      "Profile Listing": true,
      "Browse Profiles": true,
      "View Photos & Horoscopes": true,
      "Detailed Profile Info": true,
      "Direct Chat & Messaging": true,
      "View Contact Numbers": true,
      "Premium Profile Badge": true,
      "Video Calling": true,
      "Download Horoscope": true,
    },
  },
];

const featureList = [
  { key: "Profile Listing", icon: "person" },
  { key: "Browse Profiles", icon: "manage_search" },
  { key: "View Photos & Horoscopes", icon: "photo_library" },
  { key: "Detailed Profile Info", icon: "badge" },
  { key: "Direct Chat & Messaging", icon: "chat" },
  { key: "View Contact Numbers", icon: "contact_phone" },
  { key: "Download Horoscope", icon: "download" },
  { key: "Premium Profile Badge", icon: "workspace_premium" },
  { key: "Video Calling", icon: "videocam" },
];

function CheckIcon({ isElite }) {
  return (
    <span
      className={`material-symbols-outlined ${isElite ? "text-heritage-gold" : "text-emerald-500"}`}
      style={{ fontSize: "19px", fontVariationSettings: "'FILL' 1" }}
    >
      check_circle
    </span>
  );
}

function CrossIcon() {
  return (
    <span
      className="material-symbols-outlined text-slate-200"
      style={{ fontSize: "19px" }}
    >
      remove
    </span>
  );
}

export default function Packages() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, verifySession } = useAuth();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userPlanRaw = (user?.plan || '').toLowerCase();
  const isClaimed = user?.is_free_trial_claimed === 1 || user?.is_free_trial_claimed === true;
  const isDiamondActive = userPlanRaw === 'diamond' && (isClaimed || user?.subscription_start_date || user?.subscriptionStartDate);
  const userTier = isLoggedIn 
    ? (isDiamondActive ? 'diamond' : (['silver', 'gold', 'platinum'].includes(userPlanRaw) ? userPlanRaw : 'free')) 
    : null;
  const planRanks = { free: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
  const userRank = planRanks[userTier] || 1;
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [successModal, setSuccessModal] = useState({ isOpen: false, planName: '' });
  const [upgradeData, setUpgradeData] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null); // { type: 'success'|'error', title: string, message: string, planTier?: string }
  const [dynamicPlans, setDynamicPlans] = useState(plans);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axiosInstance.get('/public/plans');
        const formattedPlans = data.plans
          .filter(p => p.status === 'Active') // only keep active plans
          .map(p => {
            const internalId = p.id === 'PKG-01' ? 'free' :
                               p.id === 'PKG-02' ? 'silver' :
                               p.id === 'PKG-03' ? 'gold' :
                               p.id === 'PKG-04' ? 'platinum' : 'diamond';
            
            const tierName = p.name.replace(' Plan', '');
            const isPopular = p.id === 'PKG-04';
            const isElite = p.id === 'PKG-05';
            
            let btnClass = "border border-deep-maroon text-deep-maroon hover:bg-deep-maroon/5";
            if (['PKG-03', 'PKG-04'].includes(p.id)) btnClass = "bg-deep-maroon hover:bg-primary text-white shadow-md hover:shadow-lg";
            if (p.id === 'PKG-05') btnClass = "bg-heritage-gold hover:bg-amber-600 text-white shadow-md hover:shadow-lg";

            const featureMap = {};
            featureList.forEach(f => {
              featureMap[f.key] = p.features.includes(f.key);
            });
            
            let durationLabel = '';
            const rawDurationStr = String(p.duration).trim();
            
            if (rawDurationStr.includes('Month')) {
              // It's already in months
              durationLabel = rawDurationStr;
            } else if (/^\d+$/.test(rawDurationStr)) {
              // It's a number (days), convert to months if multiple of 28
              const days = parseInt(rawDurationStr, 10);
              if (days > 0 && days % 28 === 0) {
                const months = days / 28;
                durationLabel = `${months} Month${months > 1 ? 's' : ''}`;
              } else {
                durationLabel = `${days} Days`;
              }
            } else {
              durationLabel = rawDurationStr;
            }
            
            // Format 12 Months to 1 Year
            if (durationLabel.toLowerCase() === '12 months' || durationLabel.toLowerCase() === '12 month') {
              durationLabel = '1 Year';
            }
            
            // User requested 1 year free plan text
            if (p.price === 0 || Number(p.price) === 0) {
              durationLabel = "1 Year Free";
            }

            return {
              id: internalId,
              dbId: p.id,
              tier: tierName,
              price: Number(p.price) === 0 ? "Free" : `₹${p.price} / ${durationLabel}`,
              originalPrice: Number(p.price) > 0 ? `₹${Number(p.price) + 100}` : null,
              discount: Number(p.price) > 0 ? "Limited Offer" : null,
              isPopular,
              isElite,
              btnClass,
              features: featureMap
            };
        });
        setDynamicPlans(formattedPlans);
      } catch (err) {
        console.error('Failed to fetch dynamic plans:', err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/#register');
  };

  const handleUpgrade = async (plan) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (plan.id === 'free') return;

    try {
      setLoadingPlan(plan.id);
      
      const planMap = {
        'free': 1,
        'silver': 2,
        'gold': 3,
        'platinum': 4,
        'diamond': 5
      };
      
      const dbPlanId = planMap[plan.id];
      // NEW PROMO LOGIC: All plans are 100% free for 1 year!
      await axiosInstance.post('/payments/claim-free-plan', { planTier: plan.tier });
      
      // Show success modal instead of toast
      setSuccessModal({ isOpen: true, planName: plan.tier });
      
      // Update session if needed
      if (verifySession) await verifySession();
      setLoadingPlan(null);
      
      // We removed the automatic reload, it will happen when they click Continue on the modal
      
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoadingPlan(null);
    }
  };

  const initiateRazorpay = async (plan, dbPlanId, isUpgrade = false) => {
    try {
      setLoadingPlan(plan.id);
      const { data: orderData } = await axiosInstance.post('/payments/create-order', {
        planId: dbPlanId,
        isUpgrade
      });

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: "INR",
        name: "Bharath Marriage",
        description: `${plan.tier} Plan Subscription`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            await axiosInstance.post('/payments/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planTier: plan.tier,
              planId: dbPlanId,
              isUpgrade
            });
            
            toast.success('Payment successful! Your plan is activated and your tax invoice has been sent to your email.');
            setUpgradeData(null);
          } catch (error) {
            console.error("Payment Verification Catch Error:", error);
            setPaymentModal({
              type: 'error',
              title: 'Payment Verification Failed',
              message: error.response?.data?.error || error.message || "We could not verify your payment. Please try again."
            });
          }
        },
        prefill: {
          name: user?.username || "",
          email: user?.email_address || "",
          contact: user?.mobile_number || ""
        },
        theme: {
          color: "#7e1a3b"
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setPaymentModal({
          type: 'error',
          title: 'Payment Failed',
          message: response.error?.description || "Payment process was cancelled or declined."
        });
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      setPaymentModal({
        type: 'error',
        title: 'Order Creation Failed',
        message: error.response?.data?.error || "Failed to initiate payment. Please try again."
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#fbfaf9] via-rose-50/20 to-amber-50/10 min-h-screen pt-20 md:pt-28 pb-20">
      <Helmet>
        <title>Matrimony Packages & Membership Plans | Bharath Marriage</title>
        <meta
          name="description"
          content="Explore affordable matrimony packages and membership plans to connect with verified bride and groom profiles across Kerala."
        />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* ── Header ── */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[10px] md:text-[11px] font-semibold text-deep-maroon tracking-[0.2em] uppercase mb-2">
            Membership
          </p>
          <h1 className="font-display-lg text-2xl md:text-[34px] text-charcoal-text font-bold tracking-tight leading-tight">
            Choose Your Plan
          </h1>
          <p className="text-soft-gray text-xs md:text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Select the best package to connect with verified matches and find your perfect life partner.
          </p>
        </div>

        {/* ── Comparison Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-center">

              {/* Table Head */}
              <thead>
                <tr className="border-b border-slate-100">
                  {/* Features label column */}
                  <th className="py-6 px-6 text-left text-[11px] font-semibold text-soft-gray uppercase tracking-wider w-[26%]">
                    Features
                  </th>

                  {dynamicPlans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`py-0 px-3 border-l border-slate-100 w-[14.8%] relative
                        ${plan.isPopular ? "bg-deep-maroon/[0.03]" : plan.isElite ? "bg-amber-50/40" : ""}
                      `}
                    >
                      {/* Popular / Elite top stripe */}
                      {(plan.isPopular || plan.isElite) && (
                        <div
                          className={`absolute top-0 left-0 right-0 h-[3px]
                            ${plan.isPopular ? "bg-deep-maroon" : "bg-heritage-gold"}
                          `}
                        />
                      )}

                      <div className="py-5 px-1 relative flex flex-col items-center">
                        {/* Current Plan Badge */}
                        {userTier === plan.id && (
                          <div className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Current Plan
                          </div>
                        )}

                        {/* Tier name */}
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider block mb-1
                            ${plan.id === "diamond" ? "text-heritage-gold" : plan.id === "platinum" ? "text-deep-maroon" : "text-slate-600"}
                          `}
                        >
                          {plan.tier}
                        </span>

                        {/* Price & Original Strikethrough Price */}
                        <div className="flex flex-col items-center mt-0.5">
                          {plan.originalPrice && (
                            <span className="text-[11px] text-slate-400 line-through font-semibold leading-none mb-0.5">
                              {plan.originalPrice}
                            </span>
                          )}
                          <span
                            className={`text-base md:text-lg font-black leading-tight
                              ${plan.id === "diamond" ? "text-heritage-gold" : plan.id === "free" ? "text-slate-400" : "text-charcoal-text"}
                            `}
                          >
                            {plan.price}
                          </span>
                        </div>

                        {/* Discount badge */}
                        {plan.discount ? (
                          <span className="inline-block mt-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            {plan.discount}
                          </span>
                        ) : plan.id === "free" ? (
                          <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider mt-1 block">
                            1 Year Free
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider mt-1 block">
                            Standard
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body — Features */}
              <tbody>
                {featureList.map(({ key, icon }, idx) => (
                  <tr
                    key={key}
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50
                      ${idx % 2 !== 0 ? "bg-slate-50/25" : ""}
                    `}
                  >
                    {/* Feature name */}
                    <td className="py-3.5 px-6 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-slate-400 flex-shrink-0"
                          style={{ fontSize: "14px" }}
                        >
                          {icon}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 leading-tight">
                          {key}
                        </span>
                      </div>
                    </td>

                    {/* Plan cells */}
                    {dynamicPlans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`py-3.5 px-3 border-l border-slate-100
                          ${plan.isPopular ? "bg-deep-maroon/[0.02]" : plan.isElite ? "bg-amber-50/25" : ""}
                        `}
                      >
                        {plan.features[key]
                          ? <CheckIcon isElite={plan.isElite} />
                          : <CrossIcon />
                        }
                      </td>
                    ))}
                  </tr>
                ))}

                {/* CTA row */}
                <tr>
                  <td className="py-5 px-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Get Started
                  </td>
                  {dynamicPlans.map((plan) => {
                    const planRank = planRanks[plan.id] || 1;
                    const isCurrentPlan = userTier === plan.id;
                    const isLowerPlan = isLoggedIn && planRank < userRank;
                    const isDisabled = loadingPlan === plan.id || isCurrentPlan || isLowerPlan || plan.id !== "diamond";
                    
                    return (
                      <td
                        key={plan.id}
                        className={`py-5 px-3 border-l border-slate-100
                          ${plan.isPopular ? "bg-deep-maroon/[0.02]" : plan.isElite ? "bg-amber-50/25" : ""}
                          ${isCurrentPlan ? "bg-emerald-50/30" : ""}
                        `}
                      >
                        <button
                          onClick={
                            isDisabled
                              ? undefined
                              : () => handleUpgrade(plan)
                          }
                          disabled={isDisabled}
                          className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                            ${isCurrentPlan 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 opacity-80 cursor-default' 
                                : isDisabled
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                                : plan.btnClass + (loadingPlan === plan.id ? ' opacity-70 pointer-events-none' : ' active:scale-[0.97] cursor-pointer')
                            }
                          `}
                        >
                          {loadingPlan === plan.id ? (
                             <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          ) : isCurrentPlan ? (
                            <>
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Current Plan
                            </>
                          ) : plan.id === "free" ? (
                            "Free"
                          ) : (
                            "Get Free Plan"
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>

            </table>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-soft-gray text-[10px] md:text-[11px] mt-6 leading-relaxed">
          All packages include profile verification review. Cancel or modify your plan at any time.
        </p>

      </div>
      
      {/* Upgrade Confirmation Modal */}
      {upgradeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-text/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transform transition-all animate-scale-up border border-heritage-gold/20">
            <div className="bg-gradient-to-r from-deep-maroon to-primary p-5 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h2 className="font-display-lg text-lg font-bold flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined">upgrade</span>
                Upgrade Summary
              </h2>
              <button 
                onClick={() => setUpgradeData(null)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10 p-1 relative z-10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 bg-[#fbfaf9]">
              <p className="text-sm text-soft-gray mb-5 text-center leading-relaxed">
                You are upgrading from <span className="font-bold text-charcoal-text">{upgradeData.currentPlan}</span> to <span className="font-bold text-deep-maroon">{upgradeData.newPlan}</span>. 
                Your unused credit from the current plan will be applied towards a full 30-day {upgradeData.newPlan} subscription.
              </p>
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-soft-gray font-medium">Current Plan</span>
                  <span className="font-semibold text-slate-700">{upgradeData.currentPlan}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-soft-gray font-medium">New Plan</span>
                  <span className="font-semibold text-slate-700">{upgradeData.newPlan}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-soft-gray font-medium">{upgradeData.newPlan} Plan Price (30 Days)</span>
                  <span className="font-semibold text-slate-700">₹{upgradeData.fullNewPlanPrice ? upgradeData.fullNewPlanPrice.toFixed(2) : (upgradeData.amountToPay + upgradeData.remainingCredit).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-soft-gray font-medium">Current Plan Credit</span>
                  <span className="font-semibold text-emerald-600">-₹{upgradeData.remainingCredit.toFixed(2)}</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-slate-200 border-dashed flex justify-between items-center">
                  <span className="font-bold text-charcoal-text uppercase tracking-wider text-xs">Final Amount to Pay</span>
                  <span className="font-display-lg text-xl font-bold text-deep-maroon">₹{upgradeData.amountToPay.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={() => initiateRazorpay(upgradeData.plan, upgradeData.dbPlanId, true)}
                disabled={loadingPlan === upgradeData.plan.id}
                className="w-full py-3.5 bg-gradient-to-r from-deep-maroon to-primary text-white rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
                {loadingPlan === upgradeData.plan.id ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    Proceed to Pay ₹{upgradeData.amountToPay.toFixed(2)}
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success/Error Result Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all border border-slate-100">
            <div className={`p-6 text-center text-white ${paymentModal.type === 'success' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-rose-600 to-red-700'}`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-inner">
                <span className="material-symbols-outlined text-4xl text-white">
                  {paymentModal.type === 'success' ? 'check_circle' : 'error'}
                </span>
              </div>
              <h3 className="font-display-lg text-2xl font-bold">{paymentModal.title}</h3>
              {paymentModal.planTier && (
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  {paymentModal.planTier} Tier
                </span>
              )}
            </div>

            <div className="p-6 text-center">
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                {paymentModal.message}
              </p>

              {paymentModal.type === 'success' ? (
                <button
                  onClick={() => {
                    setPaymentModal(null);
                    navigate('/dashboard');
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-deep-maroon to-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer flex justify-center items-center gap-2"
                >
                  <span>Go to Dashboard</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={() => setPaymentModal(null)}
                  className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-slate-900 transition-all cursor-pointer"
                >
                  Close & Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transform transition-all animate-scale-up border border-heritage-gold/30">
            <div className="bg-gradient-to-r from-amber-500 to-heritage-gold p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-300/30 rounded-full blur-xl -ml-8 -mb-8"></div>
              
              <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 shadow-inner border border-white/30 relative z-10">
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <h2 className="font-display-lg text-2xl font-bold tracking-wide relative z-10">Welcome to Premium</h2>
              <p className="text-amber-50 text-sm font-medium mt-1 relative z-10 tracking-wider uppercase">Membership Activated</p>
            </div>
            
            <div className="p-8 text-center bg-[#fbfaf9]">
              <h3 className="text-xl font-bold text-charcoal-text mb-3">
                {successModal.planName} Plan Unlocked
              </h3>
              <p className="text-[13px] text-soft-gray mb-8 leading-relaxed">
                Congratulations! You now have full access to our premium features for <strong className="text-charcoal-text font-bold">1 Year completely free</strong>. Start exploring verified profiles and connect with your perfect match today.
              </p>
              
              <button
                onClick={() => {
                  setSuccessModal({ isOpen: false, planName: '' });
                  window.location.reload();
                }}
                className="w-full bg-gradient-to-r from-deep-maroon to-primary text-white font-bold py-3.5 px-4 rounded-xl hover:shadow-xl transition-all duration-300 shadow-lg shadow-primary/20 text-[12px] tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                Start Exploring Matches
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}