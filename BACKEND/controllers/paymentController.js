import Razorpay from 'razorpay';
import crypto from 'crypto';
import pool from '../config/db.js';
import { calculateProratedUpgrade } from '../utils/upgradeCalculator.js';
import { sendInvoiceEmail } from '../utils/emailService.js';

// Initialize Razorpay
// Note: We use process.env to get keys. Ensure they are set in BACKEND/.env
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TLHHuA0KdXK0Zt',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'F6tYVjTwHC7wlw7WSislMSMa',
  });
};

const findPlanByKey = (plansList, planKey) => {
  if (!planKey) return null;
  const key = planKey.toLowerCase();
  return plansList.find(p => {
    const nameLower = p.name.toLowerCase();
    if (key === 'free') return nameLower.includes('standard');
    return nameLower.includes(key);
  });
};

export const calculateUpgradeCost = async (req, res) => {
  try {
    const { newPlanId } = req.body;
    
    // Fetch user details and current plan
    const [users] = await pool.query('SELECT plan, subscription_start_date, subscription_expiry_date FROM user_registration WHERE id = ?', [req.user.id]);
    const user = users[0];
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Fetch plans
    const [plans] = await pool.query('SELECT * FROM bm_user_plans');
    const newPlan = plans.find(p => p.id == newPlanId);
    const currentPlan = findPlanByKey(plans, user.plan);
    
    if (!newPlan) return res.status(404).json({ error: 'New plan not found' });
    
    // Validate if upgrade is higher (simple validation using pricing)
    const currentPrice = currentPlan ? Number(currentPlan.pricing) : 0;
    const newPrice = Number(newPlan.pricing);
    
    if (newPrice <= currentPrice) {
      return res.status(400).json({ error: 'You can only upgrade to a higher tier plan.' });
    }
    
    // Calculate prorated amounts
    const prorated = calculateProratedUpgrade(
      currentPrice,
      newPrice,
      user.subscription_start_date ? new Date(user.subscription_start_date) : null,
      user.subscription_expiry_date ? new Date(user.subscription_expiry_date) : null
    );
    
    res.status(200).json({
      success: true,
      currentPlan: currentPlan ? currentPlan.name : 'Free',
      newPlan: newPlan.name,
      ...prorated
    });
    
  } catch (error) {
    console.error("Calculate Upgrade Error:", error);
    res.status(500).json({ error: 'Failed to calculate upgrade cost' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { planId, isUpgrade } = req.body;
    
    // Fetch plan details from db to get exact price
    const [plans] = await pool.query('SELECT * FROM bm_user_plans WHERE id = ?', [planId]);
    
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = plans[0];
    
    let amountToPay = Number(plan.pricing);
    
    if (isUpgrade) {
      const [users] = await pool.query('SELECT plan, subscription_start_date, subscription_expiry_date FROM user_registration WHERE id = ?', [req.user.id]);
      const user = users[0];
      const [allPlans] = await pool.query('SELECT * FROM bm_user_plans');
      const currentPlan = findPlanByKey(allPlans, user.plan);
      
      const currentPrice = currentPlan ? Number(currentPlan.pricing) : 0;
      const newPrice = Number(plan.pricing);
      
      if (newPrice <= currentPrice) {
        return res.status(400).json({ error: 'You can only upgrade to a higher tier plan.' });
      }
      
      const prorated = calculateProratedUpgrade(
        currentPrice,
        newPrice,
        user.subscription_start_date ? new Date(user.subscription_start_date) : null,
        user.subscription_expiry_date ? new Date(user.subscription_expiry_date) : null
      );
      
      amountToPay = prorated.amountToPay;
    }
    
    // Razorpay amount is in paise (₹1 = 100 paise)
    const amount = Math.round(amountToPay * 100);
    
    // Free plans don't need razorpay
    if (amount === 0) {
      return res.status(400).json({ error: 'No payment required for this action.' });
    }

    const instance = getRazorpayInstance();
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`
    };

    const order = await instance.orders.create(options);
    
    res.status(200).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TLHHuA0KdXK0Zt'
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: 'Something went wrong while creating order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planTier, planId, isUpgrade } = req.body;
    
    const secret = (process.env.RAZORPAY_KEY_SECRET || 'F6tYVjTwHC7wlw7WSislMSMa').trim();
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");
      
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      // Payment is verified, update the user's plan in database
      let upperTier = '';
      if (planTier && typeof planTier === 'string') {
        upperTier = planTier.toUpperCase();
      } else if (planId) {
        const [matchedPlans] = await pool.query('SELECT name FROM bm_user_plans WHERE id = ?', [planId]);
        if (matchedPlans.length > 0) {
          upperTier = matchedPlans[0].name.toUpperCase().split(' ')[0];
        }
      }
      if (!upperTier) upperTier = 'GOLD';

      const [allPlans] = await pool.query('SELECT * FROM bm_user_plans');
      const newPlan = findPlanByKey(allPlans, upperTier);
      const planDuration = newPlan && newPlan.duration ? parseInt(newPlan.duration, 10) : 30;
      
      const [users] = await pool.query(
        'SELECT id, profile_id, full_name, email_address, mobile_number, district, plan, subscription_start_date, subscription_expiry_date FROM user_registration WHERE id = ?',
        [req.user.id]
      );
      const user = users[0];

      let payableAmount = 0;
      let creditApplied = 0;

      if (isUpgrade) {
        // Upgrade flow: Fetch current plan details to calculate prorated pricing
        const currentPlan = findPlanByKey(allPlans, user?.plan);
        const currentPrice = currentPlan ? Number(currentPlan.pricing) : 0;
        const newPrice = newPlan ? Number(newPlan.pricing) : 0;
        
        let subStart = user?.subscription_start_date ? new Date(user.subscription_start_date) : null;
        let subExpiry = user?.subscription_expiry_date ? new Date(user.subscription_expiry_date) : null;
        if (subStart && isNaN(subStart.getTime())) subStart = null;
        if (subExpiry && isNaN(subExpiry.getTime())) subExpiry = null;

        const prorated = calculateProratedUpgrade(
          currentPrice,
          newPrice,
          subStart,
          subExpiry
        );

        payableAmount = prorated?.amountToPay || 0;
        creditApplied = prorated?.remainingCredit || 0;
      } else {
        // Normal direct purchase flow
        payableAmount = newPlan ? Number(newPlan.pricing) : 0;
        creditApplied = 0;
      }

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + planDuration);

      // Update user plan and set subscription start and expiry dates
      await pool.query(
        'UPDATE user_registration SET plan = ?, subscription_start_date = ?, subscription_expiry_date = ? WHERE id = ?', 
        [upperTier, startDate, expiryDate, req.user.id]
      );
      
      // Insert into upgrade/billing history for both upgrade and new purchase
      try {
        await pool.query(`
          INSERT INTO bm_upgrade_history 
          (user_id, previous_plan, new_plan, credit_amount, payable_amount, payment_id, order_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          req.user.id, 
          user?.plan || 'FREE', 
          upperTier, 
          creditApplied, 
          payableAmount, 
          razorpay_payment_id || '', 
          razorpay_order_id || ''
        ]);
      } catch (historyErr) {
        console.error("Failed to insert upgrade history:", historyErr);
      }

      // Send official Tax Invoice email to user's registered email address
      if (user && user.email_address) {
        sendInvoiceEmail({
          user,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          planName: upperTier,
          amount: payableAmount,
          startDate,
          expiryDate,
          validityDays: planDuration,
          status: 'PAID'
        }).catch((mailErr) => console.error('[VerifyPayment Invoice Email Error]:', mailErr));
      }
      
      res.status(200).json({ success: true, message: 'Payment verified and plan updated successfully' });
    } else {
      import('fs').then(fs => fs.appendFileSync('payment_debug.log', `Invalid Signature: Expected ${expectedSignature}, got ${razorpay_signature}\n`));
      res.status(400).json({ success: false, error: 'Invalid Payment Signature' });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    import('fs').then(fs => fs.appendFileSync('payment_debug.log', `Error: ${error.stack}\n`));
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

export const getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, profile_id, full_name, email_address, mobile_number, district, plan, is_free_trial_claimed, subscription_start_date, created_at FROM user_registration WHERE id = ?',
      [userId]
    );

    const user = users.length > 0 ? users[0] : null;

    const [history] = await pool.query(
      'SELECT * FROM bm_upgrade_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const formattedHistory = [];
    const seenSignatures = new Set();

    for (const row of history) {
      const dateStr = new Date(row.created_at).toISOString().split('T')[0];
      const signature = `${row.new_plan}_${row.payable_amount}_${dateStr}`;
      
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        formattedHistory.push({
          id: row.id,
          paymentId: row.payment_id,
          orderId: row.order_id,
          previousPlan: row.previous_plan || 'FREE',
          newPlan: row.new_plan,
          amount: row.payable_amount,
          creditApplied: row.credit_amount,
          date: row.created_at
        });
      }
    }
    
    // Auto-inject Diamond Free Trial into history if claimed but no record exists (legacy fix)
    const hasClaimRecord = formattedHistory.some(h => String(h.paymentId).includes('FREE_CLAIM') || String(h.orderId).includes('FREE_TRIAL'));
    if (user && (user.is_free_trial_claimed || user.plan === 'DIAMOND') && !hasClaimRecord) {
      formattedHistory.unshift({
        id: 'legacy-free-claim',
        paymentId: `FREE_CLAIM_${user.profile_id || user.id}`,
        orderId: `ORD_FREE_TRIAL_365`,
        previousPlan: 'FREE',
        newPlan: 'DIAMOND (365 Days Free Trial)',
        amount: 0,
        creditApplied: 0,
        date: user.subscription_start_date || user.created_at
      });
    }

    res.status(200).json({ history: formattedHistory, user });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

export const claimFreePlan = async (req, res) => {
  try {
    const { planTier } = req.body;
    const upperTier = planTier ? planTier.toUpperCase() : 'GOLD';

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 365); // 1 Year Free

    const [users] = await pool.query(
      'SELECT id, profile_id, full_name, email_address, mobile_number, district, plan FROM user_registration WHERE id = ?', 
      [req.user.id]
    );
    const user = users.length > 0 ? users[0] : null;
    const previousPlan = user ? user.plan : 'FREE';

    await pool.query(
      'UPDATE user_registration SET plan = ?, subscription_start_date = ?, subscription_expiry_date = ? WHERE id = ?', 
      [upperTier, startDate, expiryDate, req.user.id]
    );

    const paymentId = 'FREE_PROMO_' + Date.now();
    const orderId = 'ORD_PROMO_' + Date.now();

    try {
      await pool.query(
        'INSERT INTO bm_upgrade_history (user_id, previous_plan, new_plan, credit_amount, payable_amount, payment_id, order_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, previousPlan, upperTier, 0, 0, paymentId, orderId]
      );
    } catch (err) { console.error('Failed history insertion', err); }

    if (user && user.email_address) {
      sendInvoiceEmail({
        user,
        paymentId,
        orderId,
        planName: `${upperTier} (Free Trial)`,
        amount: 0,
        startDate,
        expiryDate,
        validityDays: 365,
        status: 'ACTIVATED'
      }).catch((mailErr) => console.error('[ClaimFreePlan Invoice Email Error]:', mailErr));
    }

    res.status(200).json({ success: true, message: 'Free plan activated successfully!' });
  } catch (error) {
    console.error('Error claiming free plan:', error);
    res.status(500).json({ error: 'Failed to claim free plan' });
  }
};
