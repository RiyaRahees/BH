import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axiosInstance from './axiosInstance';
import { getResolvedImageUrl } from './imageUtils';

// Helper to convert SVG/PNG logo to high-resolution PNG data URL keeping natural aspect ratio
const loadSvgAsPngDataUrl = (imgUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width || 400;
        const h = img.naturalHeight || img.height || 120;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png', 1.0));
      } catch (err) {
        console.warn('Canvas rasterize failed for logo:', err);
        resolve(imgUrl);
      }
    };
    img.onerror = () => resolve(imgUrl);
    img.src = imgUrl;
  });
};

// Helper to convert applicant image to base64
const fetchImageAsBase64 = async (rawUrl, gender = 'Male') => {
  const url = getResolvedImageUrl(rawUrl, gender);
  if (!url) return null;

  // 1. Try DOM extraction if image is already loaded on page in drawer
  try {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      if ((img.src === url || img.src?.includes(url) || (rawUrl && img.src?.includes(rawUrl))) && img.complete && img.naturalWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        if (dataUrl && dataUrl.length > 100) return dataUrl;
      }
    }
  } catch (e) {
    console.warn('DOM extraction failed, attempting network fetch:', e);
  }

  // 2. Try axiosInstance blob request
  try {
    const res = await axiosInstance.get(url, { responseType: 'blob' });
    if (res.data) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(res.data);
      });
      if (dataUrl) return dataUrl;
    }
  } catch (err) {
    console.warn('Axios blob fetch failed:', err);
  }

  // 3. Try standard fetch
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) return dataUrl;
    }
  } catch (err) {
    console.warn('Direct fetch failed:', err);
  }

  // 4. Image canvas loader fallback
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// Generates a crisp SVG QR code data URL offline
const getDummyQRCodeDataUrl = () => {
  return `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="70" height="70">
      <rect width="21" height="21" fill="#ffffff"/>
      <!-- Top Left Finder -->
      <rect x="0" y="0" width="7" height="7" fill="#701428"/>
      <rect x="1" y="1" width="5" height="5" fill="#ffffff"/>
      <rect x="2" y="2" width="3" height="3" fill="#701428"/>
      <!-- Top Right Finder -->
      <rect x="14" y="0" width="7" height="7" fill="#701428"/>
      <rect x="15" y="1" width="5" height="5" fill="#ffffff"/>
      <rect x="16" y="2" width="3" height="3" fill="#701428"/>
      <!-- Bottom Left Finder -->
      <rect x="0" y="14" width="7" height="7" fill="#701428"/>
      <rect x="1" y="15" width="5" height="5" fill="#ffffff"/>
      <rect x="2" y="16" width="3" height="3" fill="#701428"/>
      <!-- Data Modules -->
      <rect x="8" y="2" width="1" height="1" fill="#701428"/><rect x="10" y="2" width="1" height="1" fill="#701428"/>
      <rect x="9" y="4" width="2" height="1" fill="#701428"/><rect x="12" y="4" width="1" height="1" fill="#701428"/>
      <rect x="2" y="8" width="1" height="1" fill="#701428"/><rect x="4" y="8" width="2" height="1" fill="#701428"/><rect x="8" y="8" width="1" height="1" fill="#701428"/><rect x="10" y="8" width="3" height="1" fill="#701428"/><rect x="15" y="8" width="2" height="1" fill="#701428"/><rect x="18" y="8" width="1" height="1" fill="#701428"/>
      <rect x="0" y="10" width="1" height="1" fill="#701428"/><rect x="3" y="10" width="1" height="1" fill="#701428"/><rect x="6" y="10" width="2" height="1" fill="#701428"/><rect x="9" y="10" width="1" height="1" fill="#701428"/><rect x="12" y="10" width="2" height="1" fill="#701428"/><rect x="16" y="10" width="1" height="1" fill="#701428"/><rect x="19" y="10" width="2" height="1" fill="#701428"/>
      <rect x="8" y="12" width="2" height="1" fill="#701428"/><rect x="11" y="12" width="1" height="1" fill="#701428"/><rect x="14" y="12" width="3" height="1" fill="#701428"/><rect x="18" y="12" width="1" height="1" fill="#701428"/>
      <rect x="9" y="14" width="1" height="1" fill="#701428"/><rect x="11" y="14" width="2" height="1" fill="#701428"/><rect x="15" y="14" width="1" height="1" fill="#701428"/><rect x="17" y="14" width="2" height="1" fill="#701428"/>
      <rect x="8" y="16" width="3" height="1" fill="#701428"/><rect x="13" y="16" width="1" height="1" fill="#701428"/><rect x="16" y="16" width="2" height="1" fill="#701428"/>
      <rect x="9" y="18" width="1" height="1" fill="#701428"/><rect x="12" y="18" width="3" height="1" fill="#701428"/><rect x="17" y="18" width="1" height="1" fill="#701428"/><rect x="19" y="18" width="1" height="1" fill="#701428"/>
    </svg>
  `);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

const formatHeight = (user) => {
  const h = user.height || user.height_cm || user.applicant_height || user.height_feet;
  if (!h) return 'N/A';
  const str = String(h).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return 'N/A';
  if (/^\d+(\.\d+)?$/.test(str)) {
    return `${str} cm`;
  }
  return str;
};

const formatAge = (user) => {
  if (user.age && !isNaN(Number(user.age))) return `${user.age} Yrs`;
  const dobStr = user.dob || user.date_of_birth;
  if (dobStr) {
    try {
      const birthDate = new Date(dobStr);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age > 0) return `${age} Yrs`;
      }
    } catch {
      // ignore
    }
  }
  return 'N/A';
};

const cleanDistrict = (d) => {
  if (!d) return '';
  return d.replace(/^\d+[\s_-]*/, '').trim();
};

const formatDistrictOnly = (user) => {
  const d = cleanDistrict(user.district);
  if (d) return d;
  if (user.place?.trim()) return user.place.trim();
  if (user.location) {
    const parts = user.location.split(',').map(s => s.trim().replace(/^\d+[\s_-]*/, ''));
    if (parts[0]) return parts[0];
  }
  return 'N/A';
};

const getDownloaderInfo = () => {
  try {
    const role = (localStorage.getItem('adminRole') || '').toLowerCase();
    const franchise = localStorage.getItem('adminFranchise') || '';
    const adminName = localStorage.getItem('adminName') || '';

    if (role === 'superadmin' || (!role && !franchise)) {
      return 'Super Admin (Head Office)';
    }

    if (franchise && franchise !== 'HEAD_OFFICE' && franchise !== 'null' && franchise !== 'undefined' && franchise !== 'All') {
      return adminName ? `Franchise: ${franchise} (${adminName})` : `Franchise: ${franchise}`;
    }

    if (adminName) {
      return `Admin: ${adminName}`;
    }
  } catch {
    // ignore
  }
  return 'Super Admin (Head Office)';
};

const HOUSE_GRID_POSITIONS = [
  { house: 12, row: 1, col: 1 },
  { house: 1,  row: 1, col: 2 },
  { house: 2,  row: 1, col: 3 },
  { house: 3,  row: 1, col: 4 },
  { house: 11, row: 2, col: 1 },
  { house: 4,  row: 2, col: 4 },
  { house: 10, row: 3, col: 1 },
  { house: 5,  row: 3, col: 4 },
  { house: 9,  row: 4, col: 1 },
  { house: 8,  row: 4, col: 2 },
  { house: 7,  row: 4, col: 3 },
  { house: 6,  row: 4, col: 4 },
];

const DEFAULT_GRAHANILA = {
  12: ['ചൊ'], 11: ['ശ'], 10: ['കെ'], 8: ['രാ'],
  7: ['ശു'], 5: ['ഗു'], 4: ['ബു'], 3: ['സൂ'], 1: ['ല', 'ച']
};

const DEFAULT_NAVAMSAKAM = {
  11: ['ശ', 'ചൊ'], 10: ['കെ'], 9: ['രാ'], 7: ['ശു'],
  6: ['ഗു'], 4: ['ബു'], 3: ['സൂ'], 2: ['ച'], 1: ['ല']
};

const PLANET_MAP = {
  'Lagna': 'ല', 'Sun': 'സൂ', 'Moon': 'ച', 'Mars': 'ചൊ',
  'Mercury': 'ബു', 'Jupiter': 'ഗു', 'Venus': 'ശു', 'Saturn': 'ശ',
  'Rahu': 'രാ', 'Ketu': 'കെ'
};

const renderJathakamHTML = (title, symbol, dataMap = {}, subtitle = '') => {
  let cellsHTML = '';

  // Center 2x2 merged cell
  cellsHTML += `
    <div style="grid-row: 2 / span 2; grid-column: 2 / span 2; border: 1.5px solid #701428; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fffcfd; padding: 4px;">
      <div style="font-size: 28px; color: #701428; line-height: 1; font-family: Georgia, 'Times New Roman', serif; font-weight: 900;">${symbol}</div>
      <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 4px; letter-spacing: 0.3px;">${title}</div>
      ${subtitle ? `<div style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">${subtitle}</div>` : ''}
    </div>
  `;

  HOUSE_GRID_POSITIONS.forEach(({ house, row, col }) => {
    const planets = dataMap[house] || [];
    const planetsText = Array.isArray(planets) ? planets.join('  ') : String(planets);
    cellsHTML += `
      <div style="grid-row: ${row}; grid-column: ${col}; border: 1px solid #701428; position: relative; display: flex; align-items: center; justify-content: center; padding: 12px 3px 3px 3px; box-sizing: border-box; overflow: hidden; background: #ffffff;">
        <span style="position: absolute; top: 2px; left: 3px; font-size: 8px; color: #94a3b8; font-weight: 700; line-height: 1;">${house}</span>
        <span style="font-size: 10.5px; font-weight: 900; color: #701428; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.1; text-align: center; white-space: nowrap;">${planetsText}</span>
      </div>
    `;
  });

  return `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <div style="display: grid; grid-template-columns: repeat(4, 52px); grid-template-rows: repeat(4, 52px); border: 2px solid #701428; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        ${cellsHTML}
      </div>
    </div>
  `;
};

export const generateProfileHTML = async (user) => {
  const rawPhoto = user.photo_1 || user.image || user.photo_2 || user.photo_3 || user.photo_4;
  const photoBase64 = await fetchImageAsBase64(rawPhoto, user.gender);
  const logoPngBase64 = await loadSvgAsPngDataUrl('/logo.png');
  const qrCodeDataUrl = getDummyQRCodeDataUrl();
  
  const now = new Date();
  const currentDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const downloaderInfo = getDownloaderInfo();
  
  const dobFormatted = formatDate(user.dob || user.date_of_birth);
  const formattedHeight = formatHeight(user);
  const formattedAge = formatAge(user);
  const phone = user.phone || (user.mobile_number ? `${user.country_code || '+91'} ${user.mobile_number}` : 'N/A');
  const email = user.email || user.email_address || 'N/A';
  const districtText = formatDistrictOnly(user);
  const profileId = user.profile_id || user.id || 'N/A';
  const candidateName = (user.full_name || user.name || 'CANDIDATE NAME').toUpperCase();

  // Check if candidate is Hindu
  const religionRaw = (user.religion || '').trim();
  const religionLower = religionRaw.toLowerCase();
  const isHindu = religionLower === 'hindu' || religionLower.includes('hindu') || (!religionLower && Boolean(user.star || user.nakshatra || user.rasi || user.date_of_birth_malayalam));
  const totalPages = isHindu ? 2 : 1;

  // Parse planetary positions for Hindu users
  let grahanilaData = {};
  let navamsakamData = {};

  if (isHindu) {
    if (Array.isArray(user.planetaryPositions) && user.planetaryPositions.length > 0) {
      user.planetaryPositions.forEach(pos => {
        const code = PLANET_MAP[pos.planet_name] || pos.planet_name;
        const h = pos.house_number;
        if (pos.chart_type === 'grahanila') {
          if (!grahanilaData[h]) grahanilaData[h] = [];
          grahanilaData[h].push(code);
        } else if (pos.chart_type === 'navamsakam') {
          if (!navamsakamData[h]) navamsakamData[h] = [];
          navamsakamData[h].push(code);
        }
      });
    }

    if (Object.keys(grahanilaData).length === 0) {
      grahanilaData = user.grahanila && Object.keys(user.grahanila).length > 0 ? user.grahanila : DEFAULT_GRAHANILA;
    }
    if (Object.keys(navamsakamData).length === 0) {
      navamsakamData = user.navamsakam && Object.keys(user.navamsakam).length > 0 ? user.navamsakam : DEFAULT_NAVAMSAKAM;
    }
  }

  // Partner Preferences Object
  const partner = {
    ...(user.partnerPreferences || {}),
    ...(user.partner_preference || {}),
    ...user
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Matrimonial Bio-Data - ${profileId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Malayalam", Arial, Helvetica, sans-serif; 
    color: #0f172a; 
    background: #ffffff; 
  }
  
  .pdf-page {
    width: 794px;
    height: 1123px;
    padding: 16px 22px 36px 22px;
    box-sizing: border-box;
    background: #ffffff;
    border: 3.5px solid #701428;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-page {
      page-break-after: always;
      break-after: page;
      border: 3.5px solid #701428 !important;
    }
    .pdf-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
  }

  /* Header Bar with Logo */
  .brand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #701428;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .header-logo-wrap {
    flex: 1;
    display: flex;
    align-items: center;
  }
  .header-logo-img {
    height: 48px;
    width: auto;
    max-width: 210px;
    object-fit: contain;
    display: block;
  }
  .brand-heading-center {
    flex: 2;
    text-align: center;
  }
  .brand-logo-text {
    font-size: 25px;
    font-weight: 900;
    color: #701428;
    letter-spacing: 0.5px;
    font-family: Georgia, serif;
    line-height: 1.1;
  }
  .brand-subtext {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .header-qr-wrap {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }
  .qr-code-img {
    width: 58px;
    height: 58px;
    object-fit: contain;
    border: 1px solid #701428;
    padding: 2px;
    border-radius: 4px;
  }

  /* Candidate Summary Header Block */
  .candidate-header-wrap {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    align-items: flex-start;
  }
  .candidate-photo-box {
    width: 138px;
    height: 172px;
    border: 1.5px solid #701428;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .candidate-photo-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo-placeholder {
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
    font-weight: 600;
    line-height: 1.4;
  }

  .candidate-info-right {
    flex: 1;
  }
  .candidate-name {
    font-size: 23px;
    font-weight: 900;
    color: #701428;
    font-family: Georgia, serif;
    line-height: 1.1;
    margin-bottom: 2px;
  }
  .candidate-profile-id {
    font-size: 11px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px dashed #701428;
  }

  /* 4 Stat Boxes (Fixed Vertical Padding & Alignment) */
  .stats-grid {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .stat-card {
    flex: 1;
    min-height: 52px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 6px 4px;
    text-align: center;
    background: #fffcfd;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }
  .stat-label {
    font-size: 8.5px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    line-height: 1.1;
    display: block;
    margin-bottom: 3px;
  }
  .stat-value {
    font-size: 11.5px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    text-align: center;
    word-break: break-word;
    display: block;
  }

  /* Header Key-Value Info Grid */
  .top-info-table {
    width: 100%;
    font-size: 10.5px;
    border-collapse: collapse;
  }
  .top-info-table td {
    padding: 3.8px 0;
    vertical-align: top;
  }
  .info-lbl {
    font-weight: 700;
    color: #0f172a;
    width: 118px;
  }
  .info-sep {
    width: 10px;
    font-weight: 700;
    color: #0f172a;
  }
  .info-val {
    font-weight: 600;
    color: #334155;
  }

  /* Section Banner Header */
  .section-banner {
    background: #701428;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 800;
    padding: 5.5px 10px;
    border-radius: 3px;
    margin-bottom: 7px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* 2-Column Main Content Layout */
  .main-content-row {
    display: flex;
    gap: 20px;
    margin-top: 10px;
    margin-bottom: 10px;
    align-items: stretch;
  }
  .col-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .col-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* 2-Column Compact Grid inside Section Cards */
  .grid-2col-table {
    width: 100%;
    font-size: 10.5px;
    border-collapse: collapse;
  }
  .grid-2col-table td {
    padding: 6.2px 0;
    vertical-align: top;
    border-bottom: 1px dashed #f1f5f9;
  }
  .grid-2col-table tr:last-child td {
    border-bottom: none;
  }
  .kv-lbl {
    font-weight: 700;
    color: #0f172a;
    width: 122px;
  }
  .kv-sep {
    width: 10px;
    font-weight: 700;
    color: #0f172a;
  }
  .kv-val {
    font-weight: 600;
    color: #334155;
  }

  /* About me paragraph */
  .about-text {
    font-size: 10px;
    line-height: 1.55;
    color: #334155;
    font-weight: 500;
    background: #f8fafc;
    padding: 12px 14px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    min-height: 115px;
  }

  /* Notice Callout Box */
  .notice-callout-box {
    background: #fdf2f4;
    border: 1px solid #fecdd3;
    border-left: 3.5px solid #701428;
    padding: 8px 12px;
    border-radius: 4px;
  }
  .notice-callout-title {
    font-size: 9.5px;
    font-weight: 800;
    color: #701428;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 3px;
  }
  .notice-callout-desc {
    font-size: 9px;
    color: #475569;
    font-weight: 600;
    line-height: 1.4;
  }

  /* Footer Declaration Section */
  .declaration-box {
    margin-top: 6px;
    padding-bottom: 4px;
  }
  .declaration-text {
    font-size: 9.5px;
    color: #334155;
    margin-bottom: 10px;
    font-weight: 500;
    line-height: 1.35;
  }
  .declaration-signature-row {
    display: flex;
    justify-content: space-between;
    font-size: 10.5px;
    font-weight: 700;
    color: #0f172a;
  }

  /* Document Issue Metadata Pinned Bottom Footer Bar */
  .pdf-footer-bar {
    position: absolute;
    bottom: 10px;
    left: 22px;
    right: 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #cbd5e1;
    padding-top: 6px;
    font-size: 9.5px;
    color: #475569;
    font-weight: 600;
    background: #ffffff;
  }
  .footer-val {
    color: #701428;
    font-weight: 800;
  }
  .footer-date-val {
    color: #0f172a;
    font-weight: 700;
  }

  /* PAGE 2 SPECIFIC STYLES */
  .page2-header-ribbon {
    display: flex;
    justify-content: space-between;
    background: #fdf2f4;
    border: 1px solid #fecdd3;
    border-radius: 4px;
    padding: 8px 14px;
    margin-bottom: 16px;
    align-items: center;
  }
  .page2-ribbon-item {
    font-size: 10.5px;
    color: #334155;
  }
  .page2-ribbon-item strong {
    color: #701428;
    font-weight: 800;
  }

  .charts-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 36px;
    background: #fffcfd;
    border: 1px solid #e2e8f0;
    padding: 24px 28px;
    border-radius: 6px;
    margin-bottom: 18px;
  }
  .chart-title-tag {
    font-size: 12px;
    font-weight: 900;
    color: #701428;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 8px;
    text-align: center;
  }

  .astro-disclaimer-box {
    background: #fdfaf6;
    border: 1px solid #fef3c7;
    border-left: 3.5px solid #d97706;
    padding: 10px 12px;
    border-radius: 4px;
    margin-top: auto;
    margin-bottom: 14px;
  }
  .astro-disclaimer-malayalam {
    font-size: 9.5px;
    color: #92400e;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 4px;
  }
  .astro-disclaimer-english {
    font-size: 9px;
    color: #78350f;
    font-weight: 500;
    line-height: 1.35;
  }
</style>
</head>
<body>

<!-- ======================================================= -->
<!-- PAGE 1: COMPLETE BIO-DATA (BALANCED & FULLY SPACED)     -->
<!-- ======================================================= -->
<div class="pdf-page" id="page-1">
  <div>
    <!-- Top Header -->
    <div class="brand-header">
      <div class="header-logo-wrap">
        ${logoPngBase64 ? `<img src="${logoPngBase64}" alt="Bharath Marriage Logo" class="header-logo-img" />` : ''}
      </div>
      <div class="brand-heading-center">
        <div class="brand-logo-text">BHARATH MARRIAGE</div>
        <div class="brand-subtext">Verified Matrimonial Bio-Data</div>
      </div>
      <div class="header-qr-wrap">
        <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code-img" />
      </div>
    </div>

    <!-- Candidate Summary Top Box -->
    <div class="candidate-header-wrap">
      <!-- Photo -->
      <div class="candidate-photo-box">
        ${photoBase64 ? `<img src="${photoBase64}" alt="${candidateName}" />` : `<div class="photo-placeholder">Affix Passport<br>Photograph Here</div>`}
      </div>

      <!-- Right Info -->
      <div class="candidate-info-right">
        <div class="candidate-name">${candidateName}</div>
        <div class="candidate-profile-id">Profile ID : ${profileId} &nbsp;&bull;&nbsp; Verified Profile</div>

        <!-- 4 Stats Boxes -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Height</span>
            <span class="stat-value">${formattedHeight}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Age</span>
            <span class="stat-value">${formattedAge}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Religion / Caste</span>
            <span class="stat-value">${user.religion || 'N/A'} ${user.caste ? `(${user.caste})` : ''}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Marital Status</span>
            <span class="stat-value">${user.marital_status || 'Never Married'}</span>
          </div>
        </div>

        <!-- Basic Info Table -->
        <table class="top-info-table">
          <tr>
            <td class="info-lbl">Date of Birth</td>
            <td class="info-sep">:</td>
            <td class="info-val">${dobFormatted}</td>
            <td class="info-lbl" style="padding-left: 10px;">Created For</td>
            <td class="info-sep">:</td>
            <td class="info-val">${user.profile_created_for || user.created_for || 'Self'}</td>
          </tr>
          <tr>
            <td class="info-lbl">Mother Tongue</td>
            <td class="info-sep">:</td>
            <td class="info-val">${user.mother_tongue || 'Malayalam'}</td>
            <td class="info-lbl" style="padding-left: 10px;">Gender</td>
            <td class="info-sep">:</td>
            <td class="info-val">${user.gender || 'N/A'}</td>
          </tr>
          <tr>
            <td class="info-lbl">Place / District</td>
            <td class="info-sep">:</td>
            <td class="info-val">${user.place || districtText || 'N/A'}</td>
            <td class="info-lbl" style="padding-left: 10px;">State / Country</td>
            <td class="info-sep">:</td>
            <td class="info-val">${user.state || 'Kerala'}, ${user.country || 'India'}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Main Content 2-Column Row (Balanced & Space-Filling) -->
    <div class="main-content-row">
      <!-- LEFT COLUMN -->
      <div class="col-left">
        <!-- Personal & Residential Details -->
        <div>
          <div class="section-banner">— PERSONAL & CONTACT DETAILS</div>
          <table class="grid-2col-table">
            <tr>
              <td class="kv-lbl">House Name</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.house_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Street / Locality</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.street_locality || user.locality || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Post Office</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.post_office ? `${user.post_office} P.O.` : 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">City / Place</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.place || districtText || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">District & State</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${districtText || user.district || 'N/A'}, ${user.state || 'Kerala'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Pincode / Zip</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.pincode || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Mobile Phone</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${phone}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Email Address</td>
              <td class="kv-sep">:</td>
              <td class="kv-val" style="word-break: break-all;">${email}</td>
            </tr>
          </table>
        </div>

        <!-- About Candidate -->
        <div>
          <div class="section-banner">— ABOUT CANDIDATE</div>
          <p class="about-text">
            ${user.about_me || 'No personal bio details added yet. Candidate is registered with verified credentials on Bharath Marriage portal.'}
          </p>
        </div>

        <!-- Family Background & Details -->
        <div>
          <div class="section-banner">— FAMILY BACKGROUND</div>
          <table class="grid-2col-table">
            <tr>
              <td class="kv-lbl">Father's Name</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.fathers_name || user.father_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Father's Occupation</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.fathers_job || user.father_occupation || 'N/A'}</td>
            </tr>
            ${user.age_of_father ? `
            <tr>
              <td class="kv-lbl">Father's Age</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.age_of_father} Yrs</td>
            </tr>
            ` : ''}
            <tr>
              <td class="kv-lbl">Mother's Name</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.mothers_name || user.mother_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Mother's Occupation</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.mothers_job || user.mother_occupation || 'N/A'}</td>
            </tr>
            ${user.age_of_mother ? `
            <tr>
              <td class="kv-lbl">Mother's Age</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.age_of_mother} Yrs</td>
            </tr>
            ` : ''}
            <tr>
              <td class="kv-lbl">Sibling Details</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.sibling_details || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Family Location</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.place || districtText || 'Kerala, India'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="col-right">
        <!-- Education & Career -->
        <div>
          <div class="section-banner">— EDUCATION & CAREER</div>
          <table class="grid-2col-table">
            <tr>
              <td class="kv-lbl">Qualification</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.education || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Profession / Job</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.profession || user.occupation || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Employment Status</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.employment_status || 'N/A'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Work Location</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.employment_country || user.work_location || 'India'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Career Details</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.career_information || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Partner Preferences -->
        <div>
          <div class="section-banner">— PARTNER PREFERENCES</div>
          <table class="grid-2col-table">
            <tr>
              <td class="kv-lbl">Age Preference</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.min_age ? `${partner.min_age} to ${partner.max_age} Yrs` : (user.partner_age_pref || 'Any')}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Height Preference</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.min_height ? `${partner.min_height} to ${partner.max_height}` : 'Any'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Marital Status</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.marital_status || 'Never Married / Any'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Preferred Religion</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.religion || user.partner_religion || 'Any'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Preferred Caste</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.caste || user.partner_caste || 'Any'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Mother Tongue Pref</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.mother_tongue || 'Malayalam'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Education Pref</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.education_level || partner.education || 'Any'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Professions Pref</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.preferred_professions || partner.profession || 'Any'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Location Pref</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${partner.location_preferences || partner.location || 'Any'}</td>
            </tr>
          </table>
        </div>

        ${isHindu ? `
        <!-- Hindu Notice Card pointing to Page 2 Horoscope -->
        <div class="notice-callout-box">
          <div class="notice-callout-title">Astrology & Horoscope Details (Page 2)</div>
          <div class="notice-callout-desc">
            Star: <strong>${user.nakshatra || user.star || 'N/A'}</strong> &bull; Rasi: <strong>${user.rasi || 'N/A'}</strong> &bull; Time: <strong>${user.birth_time || 'N/A'}</strong><br/>
            Complete traditional Grahanila & Navamsakam charts are attached on Page 2.
          </div>
        </div>
        ` : `
        <!-- Profile Verification & Account Status (Genuine Database Info for Non-Hindu Profiles) -->
        <div>
          <div class="section-banner">— PROFILE VERIFICATION & MEMBERSHIP</div>
          <table class="grid-2col-table">
            <tr>
              <td class="kv-lbl">Profile Managed By</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.profile_created_for || user.created_for || 'Self'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Account Status</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.status || 'Active / Verified'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Membership Plan</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.plan || 'Free Silver'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Verification Status</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${user.verification || 'Verified Contact & Profile'}</td>
            </tr>
            <tr>
              <td class="kv-lbl">Member Since</td>
              <td class="kv-sep">:</td>
              <td class="kv-val">${formatDate(user.created_at)}</td>
            </tr>
          </table>
        </div>
        `}
      </div>
    </div>
  </div>

  <!-- Footer Declaration Section -->
  <div class="declaration-box">
    <div class="section-banner">— CANDIDATE DECLARATION & AUTHENTICATION</div>
    <p class="declaration-text">
      I hereby solemnly declare that all the information, particulars, and details provided in this matrimonial bio-data are authentic, accurate, and true to the best of my knowledge and belief.
    </p>
    <div class="declaration-signature-row">
      <div>Place : ____________________</div>
      <div>Date : ____________________</div>
      <div>Signature : ____________________</div>
    </div>
  </div>

  <!-- Document Issue Metadata Pinned Bottom Footer Bar -->
  <div class="pdf-footer-bar">
    <div>Profile ID: <span class="footer-val">${profileId}</span></div>
    <div>Generated On: <span class="footer-date-val">${currentDate}</span></div>
    <div>Issued By: <span class="footer-val">${downloaderInfo}</span></div>
    <div>Page: <span class="footer-val">Page 1 of ${totalPages}</span></div>
  </div>
</div>

${isHindu ? `
<!-- ======================================================= -->
<!-- PAGE 2: HOROSCOPE & ASTROLOGY DETAILS (HINDUS ONLY)     -->
<!-- ======================================================= -->
<div class="pdf-page" id="page-2">
  <div>
    <!-- Top Header -->
    <div class="brand-header">
      <div class="header-logo-wrap">
        ${logoPngBase64 ? `<img src="${logoPngBase64}" alt="Bharath Marriage Logo" class="header-logo-img" />` : ''}
      </div>
      <div class="brand-heading-center">
        <div class="brand-logo-text">BHARATH MARRIAGE</div>
        <div class="brand-subtext">Verified Astrological Chart & Jathakam (ജാതക കുറിപ്പ്)</div>
      </div>
      <div class="header-qr-wrap">
        <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code-img" />
      </div>
    </div>

    <!-- Candidate Quick Reference Ribbon -->
    <div class="page2-header-ribbon">
      <div class="page2-ribbon-item">Name: <strong>${candidateName}</strong></div>
      <div class="page2-ribbon-item">Profile ID: <strong>${profileId}</strong></div>
      <div class="page2-ribbon-item">Gender: <strong>${user.gender || 'N/A'}</strong></div>
      <div class="page2-ribbon-item">Age: <strong>${formattedAge}</strong></div>
      <div class="page2-ribbon-item">Caste: <strong>${user.caste || 'N/A'}</strong></div>
    </div>

    <!-- Astrological Birth Details Grid -->
    <div style="margin-bottom: 16px;">
      <div class="section-banner">— ASTROLOGICAL BIRTH DETAILS / ജനന ജാതക വിവരങ്ങൾ</div>
      <table class="top-info-table" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px;">
        <tr>
          <td class="info-lbl" style="width: 140px;">Star / Nakshatra (നക്ഷത്രം)</td>
          <td class="info-sep">:</td>
          <td class="info-val" style="color: #701428; font-weight: 800; font-size: 11.5px;">${user.nakshatra || user.star || 'N/A'}</td>
          <td class="info-lbl" style="width: 130px; padding-left: 14px;">Rasi / Moon Sign (രാശി)</td>
          <td class="info-sep">:</td>
          <td class="info-val" style="color: #701428; font-weight: 800; font-size: 11.5px;">${user.rasi || 'N/A'}</td>
        </tr>
        <tr>
          <td class="info-lbl">Malayalam DOB (മലയാളം)</td>
          <td class="info-sep">:</td>
          <td class="info-val">${user.date_of_birth_malayalam || 'N/A'}</td>
          <td class="info-lbl" style="padding-left: 14px;">English Date of Birth</td>
          <td class="info-sep">:</td>
          <td class="info-val">${dobFormatted}</td>
        </tr>
        <tr>
          <td class="info-lbl">Time of Birth (ജനന സമയം)</td>
          <td class="info-sep">:</td>
          <td class="info-val">${user.birth_time || 'N/A'}</td>
          <td class="info-lbl" style="padding-left: 14px;">Place of Birth (ജനന സ്ഥലം)</td>
          <td class="info-sep">:</td>
          <td class="info-val">${user.place_of_birth || user.place || districtText || 'N/A'}</td>
        </tr>
        <tr>
          <td class="info-lbl">Dasa Balance (ദശാശിഷ്ടം)</td>
          <td class="info-sep">:</td>
          <td class="info-val">${user.dasa_balance || user.dasa_sesham || user.dasa || 'N/A'}</td>
          <td class="info-lbl" style="padding-left: 14px;">Chovva Dosham (ചൊവ്വ)</td>
          <td class="info-sep">:</td>
          <td class="info-val">${user.sevvai_dosham || user.chovva_dosham || 'None / ബാധകമല്ല'}</td>
        </tr>
        ${user.horoscope_information ? `
        <tr>
          <td class="info-lbl">Additional Horoscope Notes</td>
          <td class="info-sep">:</td>
          <td class="info-val" colspan="4">${user.horoscope_information}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Horoscope Charts Side-by-Side (Large Traditional 4x4 Kerala Charts) -->
    <div style="margin-bottom: 16px;">
      <div class="section-banner">— TRADITIONAL JATHAKAM CHARTS / ജാതക ചക്രങ്ങൾ</div>
      <div class="charts-wrapper">
        <!-- Grahanila Chart -->
        <div>
          <div class="chart-title-tag">ഗ്രഹ നില (GRAHANILA)</div>
          ${renderJathakamHTML('ഗ്രഹനില', 'ॐ', grahanilaData, 'RASI CHAKRA')}
        </div>

        <!-- Navamsakam Chart -->
        <div>
          <div class="chart-title-tag">നവാംശകം (NAVAMSAKAM)</div>
          ${renderJathakamHTML('നവാംശകം', '卐', navamsakamData, 'NAVAMSHA')}
        </div>
      </div>
    </div>
  </div>

  <!-- Astrological Verification Disclaimer -->
  <div class="astro-disclaimer-box">
    <div class="astro-disclaimer-malayalam">
      &bull; കുറിപ്പ്: ഈ ജാതക വിവരങ്ങളും ഗ്രഹനിലയും പ്രൊഫൈൽ ഉടമ നൽകിയിട്ടുള്ള ജനന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ തയ്യാറാക്കിയിട്ടുള്ളതാണ്. വിവാഹ പൊരുത്തത്തിനും തുടർന്നുള്ള കാര്യങ്ങൾക്കും അംഗീകൃത ജ്യോത്സ്യനുമായി പരിശോധിച്ച് ഉറപ്പുവരുത്തുക.
    </div>
    <div class="astro-disclaimer-english">
      &bull; Note: Astrological charts and planetary placements are generated based on birth information provided by the candidate/guardian. Matrimonial compatibility (Porutham) should be verified with a qualified astrologer.
    </div>
  </div>

  <!-- Document Issue Metadata Pinned Bottom Footer Bar -->
  <div class="pdf-footer-bar">
    <div>Profile ID: <span class="footer-val">${profileId}</span></div>
    <div>Generated On: <span class="footer-date-val">${currentDate}</span></div>
    <div>Issued By: <span class="footer-val">${downloaderInfo}</span></div>
    <div>Page: <span class="footer-val">Page 2 of 2</span></div>
  </div>
</div>
` : ''}

</body>
</html>
  `;
};

export const downloadProfilePDF = async (user) => {
  try {
    let fullUser = { ...user };
    const pid = user.id || user.profile_id;

    // Fetch deep profile details & planetary positions if available
    if (pid) {
      try {
        const [profileRes, partnerRes, astroRes] = await Promise.allSettled([
          axiosInstance.get(`/users/profile/${pid}`),
          axiosInstance.get(`/users/profile/${pid}/partner-preferences`),
          axiosInstance.get(`/users/profile/${pid}/planetary-positions`)
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value?.data?.user) {
          fullUser = { ...fullUser, ...profileRes.value.data.user };
        }
        if (partnerRes.status === 'fulfilled') {
          const prefData = partnerRes.value?.data?.preferences || partnerRes.value?.data?.partnerPreferences;
          if (prefData) {
            fullUser = { ...fullUser, partnerPreferences: prefData, ...prefData };
          }
        }
        if (astroRes.status === 'fulfilled' && astroRes.value?.data?.positions) {
          fullUser.planetaryPositions = astroRes.value.data.positions;
        }
      } catch (err) {
        console.warn('Could not fetch supplementary details for PDF:', err);
      }
    }

    const html = await generateProfileHTML(fullUser);
    
    // Create temporary hidden container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = '794px';
    container.style.height = 'auto';
    container.style.zIndex = '-9999';
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for fonts & images to load
    await new Promise((r) => setTimeout(r, 600));

    const pageEls = container.querySelectorAll('.pdf-page');
    if (!pageEls || pageEls.length === 0) throw new Error('PDF page elements not found');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageEls.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      const canvas = await html2canvas(pageEls[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    document.body.removeChild(container);
    
    const fileName = `${(fullUser.profile_id || fullUser.id || 'profile').toString().trim()}_matrimonial_biodata.pdf`;
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Error generating PDF with html2canvas:', err);
    try {
      const html = await generateProfileHTML(user);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        return true;
      }
    } catch (fallbackErr) {
      console.error('Print window fallback failed:', fallbackErr);
      throw fallbackErr;
    }
  }
};
