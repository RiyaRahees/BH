import pool from '../config/db.js';

export const DISTRICT_MAP = {
  thiruvananthapuram: { code: 'TVM', num: '01', name: 'Thiruvananthapuram' },
  trivandrum: { code: 'TVM', num: '01', name: 'Thiruvananthapuram' },
  kollam: { code: 'KLM', num: '02', name: 'Kollam' },
  quilon: { code: 'KLM', num: '02', name: 'Kollam' },
  pathanamthitta: { code: 'PTA', num: '03', name: 'Pathanamthitta' },
  alappuzha: { code: 'ALP', num: '04', name: 'Alappuzha' },
  alleppey: { code: 'ALP', num: '04', name: 'Alappuzha' },
  kottayam: { code: 'KTM', num: '05', name: 'Kottayam' },
  idukki: { code: 'IDK', num: '06', name: 'Idukki' },
  ernakulam: { code: 'EKM', num: '07', name: 'Ernakulam' },
  cochin: { code: 'EKM', num: '07', name: 'Ernakulam' },
  kochi: { code: 'EKM', num: '07', name: 'Ernakulam' },
  thrissur: { code: 'TSR', num: '08', name: 'Thrissur' },
  trichur: { code: 'TSR', num: '08', name: 'Thrissur' },
  palakkad: { code: 'PKD', num: '09', name: 'Palakkad' },
  palghat: { code: 'PKD', num: '09', name: 'Palakkad' },
  malappuram: { code: 'MPM', num: '10', name: 'Malappuram' },
  kozhikode: { code: 'KKD', num: '11', name: 'Kozhikode' },
  calicut: { code: 'KKD', num: '11', name: 'Kozhikode' },
  wayanad: { code: 'WYD', num: '12', name: 'Wayanad' },
  kannur: { code: 'KNR', num: '13', name: 'Kannur' },
  cannanore: { code: 'KNR', num: '13', name: 'Kannur' },
  kasaragod: { code: 'KSD', num: '14', name: 'Kasaragod' },
  kasargod: { code: 'KSD', num: '14', name: 'Kasaragod' }
};

export const PINCODE_PREFIX_MAP = {
  '695': 'TVM',
  '691': 'KLM',
  '689': 'PTA',
  '688': 'ALP',
  '686': 'KTM',
  '685': 'IDK',
  '682': 'EKM',
  '683': 'EKM',
  '680': 'TSR',
  '678': 'PKD',
  '676': 'MPM',
  '679': 'MPM',
  '673': 'KKD',
  '670': 'KNR',
  '671': 'KSD'
};

/**
 * Resolves standard 3-letter district reference code from district string, location, or pincode
 */
export const resolveDistrictCode = (district, location, pincode) => {
  const normalize = (str) => (str ? String(str).toLowerCase().trim() : '');

  const normDistrict = normalize(district);
  if (normDistrict && DISTRICT_MAP[normDistrict]) {
    return DISTRICT_MAP[normDistrict].code;
  }

  // Check if district contains name
  for (const [key, val] of Object.entries(DISTRICT_MAP)) {
    if (normDistrict.includes(key)) {
      return val.code;
    }
  }

  const normLocation = normalize(location);
  if (normLocation) {
    for (const [key, val] of Object.entries(DISTRICT_MAP)) {
      if (normLocation.includes(key)) {
        return val.code;
      }
    }
    // Check if location is a pincode like 673305
    const match = normLocation.match(/(\d{3})\d{3}/);
    if (match && PINCODE_PREFIX_MAP[match[1]]) {
      return PINCODE_PREFIX_MAP[match[1]];
    }
  }

  const normPin = normalize(pincode);
  if (normPin && normPin.length >= 3) {
    const prefix = normPin.slice(0, 3);
    if (PINCODE_PREFIX_MAP[prefix]) {
      return PINCODE_PREFIX_MAP[prefix];
    }
  }

  return 'KL'; // Default Kerala code
};

/**
 * Generates strict district-based franchise reference code: e.g. BM-KKD-001 or BM-TVM-001
 */
export const generateDistrictFranchiseCode = async (district, location, pincode) => {
  const distCode = resolveDistrictCode(district, location, pincode);
  const prefix = `BM-${distCode}-`;

  try {
    const [existing] = await pool.execute(
      `SELECT franchise_id FROM bm_franchise WHERE franchise_id LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextNum = 1;
    if (existing.length > 0 && existing[0].franchise_id) {
      const parts = existing[0].franchise_id.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating franchise code:', err);
    return `${prefix}001`;
  }
};
