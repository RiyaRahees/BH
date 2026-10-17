/**
 * Static Ads Dataset & Configuration
 * Provides mock ads for Kerala Matrimony vendors and defines the 3 ad tiers.
 */

export const AD_TIERS = {
  LEADERBOARD: {
    id: 'LEADERBOARD',
    name: 'Top Leaderboard Banner',
    badge: 'Tier 1 - Highest Visibility',
    dimensions: '728 x 90 (Desktop) / 320 x 100 (Mobile)',
    aspectRatio: '8:1',
    monthlyPrice: 4999,
    weeklyPrice: 1499,
    description: 'Premier wide banner placed at the very top of search results and homepage sections for maximum brand impressions.',
    idealFor: 'Wedding Jewellers, Resort Hotels, Automobile, Real Estate'
  },
  INFEED_CARD: {
    id: 'INFEED_CARD',
    name: 'In-Feed Match Card',
    badge: 'Tier 2 - Best Engagement (High CTR)',
    dimensions: '300 x 360 (Standard Profile Card Size)',
    aspectRatio: '4:5',
    monthlyPrice: 3499,
    weeklyPrice: 999,
    description: 'Blends seamlessly directly inside the Matches & Search grid between profile cards. Users view it naturally while exploring brides & grooms.',
    idealFor: 'Kalyana Mandapams, Bridal Boutiques, Wedding Planners, Catering'
  },
  SIDEBAR: {
    id: 'SIDEBAR',
    name: 'Sidebar & Detail Banner',
    badge: 'Tier 3 - Continuous Exposure',
    dimensions: '300 x 250 / 300 x 600',
    aspectRatio: '1:1 or 1:2',
    monthlyPrice: 2499,
    weeklyPrice: 799,
    description: 'Positioned alongside search filters and detailed profile views for steady, non-intrusive brand recall.',
    idealFor: 'Candid Photographers, Makeup Artists, Astrology Consultants, Event Decor'
  }
};

export const INITIAL_STATIC_ADS = [
  // ── Leaderboard Ads ──
  {
    id: 'ad-leader-01',
    tier: 'LEADERBOARD',
    slot: 'SEARCH_TOP',
    businessName: 'Malabar Heritage Gold & Diamonds',
    title: 'Malabar Heritage Gold & Diamonds',
    tagline: 'Exclusive 2026 Kerala Bridal Jewellery Collection',
    contactPerson: 'K. Sukumaran',
    email: 'ads@malabarheritage.in',
    phone: '+91 98470 11223',
    ctaText: 'Explore Collection',
    targetUrl: 'https://www.google.com/search?q=kerala+bridal+jewellery',
    bgGradient: 'from-amber-950 via-amber-900 to-[#1b0d06]',
    borderColor: 'border-amber-500/40',
    accentColor: 'text-amber-300',
    icon: 'diamond',
    badge: 'OFFICIAL SPONSOR',
    status: 'APPROVED',
    duration: '1 Month',
    amount: 4999,
    requestedAt: '2026-10-15T09:30:00Z',
    creativeUrl: '/ad_jewellery.jpg'
  },
  {
    id: 'ad-leader-02',
    tier: 'LEADERBOARD',
    slot: 'HOME_MID',
    businessName: 'The Grand Palace International Convention Centre',
    title: 'The Grand Palace International Convention Centre',
    tagline: 'Kerala’s Most Luxurious Central AC Kalyana Mandapam with 3000+ Seating',
    contactPerson: 'Mathew Varghese',
    email: 'info@grandpalacecalicut.com',
    phone: '+91 98470 33445',
    ctaText: 'Book Wedding Hall',
    targetUrl: 'https://www.google.com/search?q=kerala+wedding+convention+centre',
    bgGradient: 'from-[#2e081a] via-[#450a26] to-[#12020a]',
    borderColor: 'border-rose-500/40',
    accentColor: 'text-rose-300',
    icon: 'castle',
    badge: 'FEATURED VENUE',
    status: 'APPROVED',
    duration: '3 Months',
    amount: 12749,
    requestedAt: '2026-10-14T14:15:00Z',
    creativeUrl: '/ad_mandapam.jpg'
  },

  // ── In-Feed Match Cards (Injected in user profile grids) ──
  {
    id: 'ad-card-01',
    tier: 'INFEED_CARD',
    slot: 'SEARCH_INFEED',
    businessName: 'Varmala Bridal Coutures',
    category: 'Wedding Attire & Silks',
    title: 'Handcrafted Kanchipuram Sarees & Groom Sherwanis',
    tagline: 'Get up to 25% festive discount for Bharath Marriage members. Custom fittings available in Kochi, Calicut & Trivandrum.',
    contactPerson: 'Meera Nambiar',
    email: 'enquiry@varmalacoutures.com',
    phone: '+91 98470 55667',
    ctaText: 'View Catalogue',
    targetUrl: 'https://www.google.com/search?q=kerala+bridal+silk+sarees',
    rating: '4.9 (1,240+ brides)',
    location: 'MG Road, Kochi & SM Street, Calicut',
    badge: 'SPONSORED VENDOR',
    accentColor: 'text-heritage-gold',
    status: 'APPROVED',
    duration: '1 Month',
    amount: 3499,
    requestedAt: '2026-10-16T11:00:00Z',
    creativeUrl: '/ad_saree.jpg'
  },
  {
    id: 'ad-card-02',
    tier: 'INFEED_CARD',
    slot: 'SEARCH_INFEED',
    businessName: 'WedStories Kerala Candid Cinema',
    category: 'Wedding Photography & Film',
    title: 'Award-Winning Wedding Photography & Cinematic Drone',
    tagline: 'Capture timeless Kerala wedding moments with international standard 4K cinematic film & luxury albums.',
    contactPerson: 'Akhil Raj',
    email: 'hello@wedstorieskerala.com',
    phone: '+91 98470 77889',
    ctaText: 'Check Availability',
    targetUrl: 'https://www.google.com/search?q=kerala+candid+wedding+photography',
    rating: '5.0 (480+ weddings)',
    location: 'Thrissur & Kochi, Kerala',
    badge: 'SPONSORED PHOTOGRAPHER',
    accentColor: 'text-amber-400',
    status: 'APPROVED',
    duration: '1 Month',
    amount: 3499,
    requestedAt: '2026-10-16T16:20:00Z',
    creativeUrl: '/ad_resort.jpg'
  },

  // ── Pending Submissions (Ready for Super Admin Review & Approval) ──
  {
    id: 'ad-pending-01',
    tier: 'INFEED_CARD',
    slot: 'SEARCH_INFEED',
    businessName: 'Alappuzha Backwater Destination Weddings',
    category: 'Luxury Houseboats & Resorts',
    title: 'Romantic Houseboat & Island Wedding Packages',
    tagline: 'Host intimate pre-wedding celebrations and luxury traditional houseboat ceremonies in Vembanad Lake.',
    contactPerson: 'Santhosh Joseph',
    email: 'santhosh@alappuzhaweddings.com',
    phone: '+91 98470 88990',
    ctaText: 'Explore Packages',
    targetUrl: 'https://www.google.com/search?q=kerala+destination+weddings+alappuzha',
    location: 'Punnamada, Alappuzha',
    badge: 'NEW APPLICANT',
    status: 'PENDING',
    duration: '1 Month',
    amount: 3499,
    requestedAt: '2026-10-17T08:15:00Z',
    notes: 'We want to target families searching in Ernakulam, Alappuzha, and Kottayam.',
    creativeUrl: '/ad_resort.jpg'
  },
  {
    id: 'ad-pending-02',
    tier: 'LEADERBOARD',
    slot: 'SEARCH_TOP',
    businessName: 'Kalyan Sougandhikam Mandapam',
    title: 'Kalyan Sougandhikam Mandapam Trivandrum',
    tagline: 'Air-Conditioned 1500-Seater Auditorium with Dining & Multi-Level Parking',
    contactPerson: 'Venugopal Iyer',
    email: 'bookings@kalyansougandhikam.in',
    phone: '+91 98470 44556',
    ctaText: 'Book Auditorium',
    targetUrl: 'https://www.google.com/search?q=kalyan+sougandhikam+trivandrum',
    badge: 'NEW APPLICANT',
    status: 'PENDING',
    duration: '1 Week',
    amount: 1499,
    requestedAt: '2026-10-17T09:45:00Z',
    notes: 'Immediate launch requested for next week bookings.',
    creativeUrl: '/ad_mandapam.jpg'
  },

  // ── Sidebar Ad ──
  {
    id: 'ad-side-01',
    tier: 'SIDEBAR',
    slot: 'SEARCH_SIDEBAR',
    businessName: 'Royal Kerala Feast Caterers',
    category: 'Authentic Sadya & Multi-Cuisine',
    title: 'Authentic 28-Course Kerala Sadya & Grand Buffets',
    tagline: 'Hygienic, traditional taste crafted by veteran master chefs with 25+ years experience.',
    contactPerson: 'Chef Ramdas',
    email: 'feast@royalsadya.com',
    phone: '+91 98470 99001',
    ctaText: 'Get Free Menu Quote',
    targetUrl: 'https://www.google.com/search?q=kerala+wedding+catering+sadya',
    badge: 'PREMIUM CATERER',
    status: 'APPROVED',
    duration: '1 Month',
    amount: 2499,
    requestedAt: '2026-10-13T10:00:00Z',
    creativeUrl: '/ad_catering.jpg'
  }
];

const LOCAL_STORAGE_KEY = 'bh_admin_ads_data';

// Helper to get all ads with localStorage persistence and automatic creative hydration
export const getStoredAds = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure existing ads have valid creative images if available
      const initialMap = new Map(INITIAL_STATIC_ADS.map((a) => [a.id, a]));
      let hasUpdates = false;
      const hydrated = parsed.map((ad) => {
        const initial = initialMap.get(ad.id);
        if (initial && initial.creativeUrl && !ad.creativeUrl) {
          hasUpdates = true;
          return { ...ad, creativeUrl: initial.creativeUrl };
        }
        return ad;
      });
      if (hasUpdates) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hydrated));
      }
      return hydrated;
    }
  } catch (e) {
    console.error('Error loading stored ads', e);
  }
  return INITIAL_STATIC_ADS;
};

// Helper to save ads to localStorage
export const saveStoredAds = (ads) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ads));
    // Trigger storage event for cross-tab or component sync
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving stored ads', e);
  }
};

// Default export of active approved ads for frontend display
export const STATIC_ADS = INITIAL_STATIC_ADS;
