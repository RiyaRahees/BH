export const getEffectivePlan = (user) => {
  if (!user) return 'FREE';

  const rawPlan = (user.plan || 'FREE').toUpperCase();

  // If user is set to DIAMOND but has not claimed free trial and has no paid subscription start date, default to FREE
  if (rawPlan === 'DIAMOND') {
    const isClaimed = user.is_free_trial_claimed === 1 || user.is_free_trial_claimed === true || user.is_free_trial_claimed === '1';
    const hasStartDate = Boolean(user.subscription_start_date || user.subscriptionStartDate);
    const hasExpiryDate = Boolean(user.subscription_expiry_date || user.subscriptionExpiryDate);
    if (user.is_free_trial_claimed !== undefined && !isClaimed && !hasStartDate && !hasExpiryDate) {
      return 'FREE';
    }
  }

  // If the user has claimed DIAMOND trial or purchased a paid plan
  if (['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(rawPlan)) {
    const expiry = user.subscription_expiry_date || user.subscriptionExpiryDate;
    if (expiry) {
      const expiryTime = new Date(expiry).getTime();
      if (!isNaN(expiryTime) && Date.now() > expiryTime) {
        return 'FREE';
      }
    }
    return rawPlan;
  }

  return 'FREE';
};

