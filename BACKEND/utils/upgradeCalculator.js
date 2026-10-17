export const calculateProratedUpgrade = (currentPlanPrice, newPlanPrice, startDate, expiryDate) => {
  const current = new Date();
  
  // If no existing valid subscription or expired, return full price for standard 30 days
  if (!startDate || !expiryDate || current >= expiryDate) {
    return {
      totalSubscriptionDays: 30,
      remainingDays: 0,
      currentDailyPrice: 0,
      remainingCredit: 0,
      fullNewPlanPrice: Number(newPlanPrice.toFixed(2)),
      amountToPay: Number(newPlanPrice.toFixed(2))
    };
  }
  
  // 1. Calculate total subscription days
  const totalMs = expiryDate.getTime() - startDate.getTime();
  let totalSubscriptionDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
  
  // Fallback if dates are identical or invalid
  if (totalSubscriptionDays <= 0) totalSubscriptionDays = 30; 

  // 2. Calculate remaining days
  const remainingMs = expiryDate.getTime() - current.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  // 3. Calculate current plan daily price
  const currentDailyPrice = currentPlanPrice / totalSubscriptionDays;

  // 4. Calculate unused credit of current plan (daily price * remaining days)
  const remainingCredit = Number((currentDailyPrice * remainingDays).toFixed(2));

  // 5. Full new plan price for 30 days
  const fullNewPlanPrice = Number(newPlanPrice.toFixed(2));

  // 6. Final payable amount: full new plan price minus unused credit
  let amountToPay = fullNewPlanPrice - remainingCredit;
  if (amountToPay < 0) amountToPay = 0;
  amountToPay = Number(amountToPay.toFixed(2));

  return {
    totalSubscriptionDays,
    remainingDays,
    currentDailyPrice: Number(currentDailyPrice.toFixed(2)),
    remainingCredit,
    fullNewPlanPrice,
    amountToPay
  };
};
