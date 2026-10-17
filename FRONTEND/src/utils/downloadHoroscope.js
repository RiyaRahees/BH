/**
 * downloadHoroscope.js
 * Generates and downloads a premium horoscope PNG for a given profile.
 * Keeps all canvas-drawing logic out of the page component.
 */

// ── House grid positions (South Indian / Kerala style) ──────────────────────
const HOUSE_POSITIONS = [
  [0, 0, 12], [0, 1, 1],  [0, 2, 2],  [0, 3, 3],
  [1, 0, 11],                          [1, 3, 4],
  [2, 0, 10],                          [2, 3, 5],
  [3, 0, 9],  [3, 1, 8],  [3, 2, 7],  [3, 3, 6],
];

// Default chart data (planets in Malayalam)
const DEFAULT_GRAHANILA  = { 12:['ചൊ'], 11:['ശ'], 10:['കെ'], 8:['രാ'], 7:['ശു'], 5:['ഗു'], 4:['ബു'], 3:['സൂ'], 1:['ല','ച'] };
const DEFAULT_NAVAMSAKAM = { 11:['ശ','ചൊ'], 10:['കെ'], 9:['രാ'], 7:['ശു'], 6:['ഗു'], 4:['ബു'], 3:['സൂ'], 2:['ച'], 1:['ല'] };

// Colour palette
const C = {
  maroon : '#7b1f28',
  gold   : '#b8922a',
  dark   : '#1a1a1a',
  gray   : '#666666',
  lgray  : '#e8e0d8',
  bg     : '#fdf8f3',
  headBg : '#fff9f5',
  footBg : '#fff5ee',
  white  : '#ffffff',
};

// ── Draw a single Jathakam (South-Indian grid) chart ────────────────────────
function drawJathakam(ctx, data, title, symbol, ox, oy, size) {
  const cell = size / 4;

  // outer border
  ctx.strokeStyle = C.dark;
  ctx.lineWidth   = 2;
  ctx.strokeRect(ox, oy, size, size);

  // individual house cells
  HOUSE_POSITIONS.forEach(([row, col, houseNum]) => {
    const x = ox + col * cell;
    const y = oy + row * cell;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth   = 1;
    ctx.strokeRect(x, y, cell, cell);

    // house number – top left
    ctx.fillStyle = C.gray;
    ctx.font      = `${Math.round(cell * 0.18)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(String(houseNum), x + 4, y + Math.round(cell * 0.22));

    // planet labels – centred
    const planets = data[houseNum] || [];
    ctx.fillStyle = C.maroon;
    ctx.font      = `bold ${Math.round(cell * 0.22)}px sans-serif`;
    ctx.textAlign = 'center';
    planets.forEach((p, i) => {
      ctx.fillText(p, x + cell / 2, y + cell / 2 + i * Math.round(cell * 0.26));
    });
  });

  // centre 2×2 merged box
  ctx.strokeStyle = C.dark;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(ox + cell, oy + cell, cell * 2, cell * 2);

  // symbol (large)
  ctx.fillStyle = C.maroon;
  ctx.font      = `${Math.round(cell * 0.45)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText(symbol, ox + size / 2, oy + size / 2 - cell * 0.06);

  // chart title inside centre
  ctx.fillStyle = C.dark;
  ctx.font      = `bold ${Math.round(cell * 0.2)}px sans-serif`;
  ctx.fillText(title, ox + size / 2, oy + size / 2 + cell * 0.32);

  // label below the chart square
  ctx.fillStyle = C.gray;
  ctx.font      = `${Math.round(cell * 0.18)}px sans-serif`;
  ctx.fillText(title, ox + size / 2, oy + size + Math.round(cell * 0.35));
  ctx.textAlign = 'left';
}

// ── Render everything onto the canvas, then trigger download ─────────────────
function renderCanvas(ctx, canvas, profile, logoImg) {
  const { W, H, sidePad, headerH, nameH, detailH, chartTopY, footerH, cSize, gap } = canvas._layout;

  // background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // top accent bar
  ctx.fillStyle = C.maroon;
  ctx.fillRect(0, 0, W, 6);

  // bottom accent bar
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, H - 6, W, 6);

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.headBg;
  ctx.fillRect(0, 6, W, headerH - 6);

  if (logoImg) {
    const lh = headerH - 24;
    const lw = (logoImg.width / logoImg.height) * lh;
    ctx.drawImage(logoImg, (W - lw) / 2, 14, lw, lh);
  } else {
    ctx.fillStyle = C.maroon;
    ctx.font      = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bharath', W / 2, 55);
    ctx.fillStyle = C.gold;
    ctx.font      = 'bold 14px sans-serif';
    ctx.fillText('── MARRIAGE ──', W / 2, 80);
  }

  // divider under header
  ctx.strokeStyle = C.lgray;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(sidePad, headerH);
  ctx.lineTo(W - sidePad, headerH);
  ctx.stroke();

  // ── Profile name band ─────────────────────────────────────────────────────
  const nameBandY = headerH + 6;
  ctx.fillStyle = C.maroon;
  ctx.font      = 'bold 26px serif';
  ctx.textAlign = 'center';
  ctx.fillText(profile.name, W / 2, nameBandY + 30);

  ctx.fillStyle = C.gold;
  ctx.font      = 'bold 11px sans-serif';
  ctx.fillText('HOROSCOPE PROFILE', W / 2, nameBandY + 50);

  ctx.fillStyle = C.gray;
  ctx.font      = '11px sans-serif';
  ctx.fillText(`ID: ${profile.id || 'BKLH000000001'}`, W / 2, nameBandY + 68);

  // ── Info detail grid ──────────────────────────────────────────────────────
  const infoY = headerH + nameH + 10;

  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.roundRect(sidePad, infoY, W - sidePad * 2, detailH - 10, 8);
  ctx.fill();
  ctx.strokeStyle = C.lgray;
  ctx.lineWidth   = 1;
  ctx.stroke();

  const infoItems = [
    ['Age',         `${profile.age} yrs`],
    ['Religion',    profile.religion?.split(' - ')[0] || '—'],
    ['Height',      profile.height?.split(' - ')[0] || '—'],
    ['Education',   profile.education || '—'],
    ['Occupation',  profile.profession || '—'],
    ['Location',    `${profile.location}, ${profile.state?.split(',')[0] || ''}`.trim()],
    ['Star / Rasi', profile.starRasi || 'Chathayam'],
    ['Birth Time',  profile.birthTime || '10:00 AM'],
    ['DOB (Eng)',   (() => {
      const val = profile.dobEnglish || '1996-08-17';
      if (!val) return '';
      if (val.includes('/')) return val;
      const parts = val.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val;
    })()],
    ['Janma Dasa',  profile.janmaSistaDasa || 'Rahu'],
    ['End Dasa',    profile.endDasa || '2030-01-01'],
    ['DOB (Mal)',   (() => {
      const val = profile.date_of_birth_malayalam || profile.dobMalayalam;
      if (!val) return '1190 Chingam 1';
      const parts = val.split(' ');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val.replace(/ /g, '/');
    })()],
  ];

  const cols  = 4;
  const cellW = (W - sidePad * 2 - 24) / cols;
  const cellH = (detailH - 26) / Math.ceil(infoItems.length / cols);

  infoItems.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = sidePad + 12 + col * cellW;
    const y   = infoY + 16 + row * cellH;

    ctx.fillStyle = C.gray;
    ctx.font      = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), x, y);

    ctx.fillStyle = C.dark;
    ctx.font      = 'bold 11px sans-serif';
    let val = value;
    if (ctx.measureText(val).width > cellW - 8) {
      while (ctx.measureText(val + '…').width > cellW - 8 && val.length > 0) val = val.slice(0, -1);
      val += '…';
    }
    ctx.fillText(val, x, y + 15);
  });

  // gold divider above charts
  ctx.strokeStyle = C.gold;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(sidePad, chartTopY - 12);
  ctx.lineTo(W - sidePad, chartTopY - 12);
  ctx.stroke();

  ctx.fillStyle = C.maroon;
  ctx.font      = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('JATHAKAM CHARTS', sidePad, chartTopY - 16);

  // ── Charts ────────────────────────────────────────────────────────────────
  const totalW     = cSize * 2 + gap;
  const chartStartX = (W - totalW) / 2;

  drawJathakam(ctx, DEFAULT_GRAHANILA,  'ഗ്രഹനില', 'ॐ', chartStartX,              chartTopY, cSize);
  drawJathakam(ctx, DEFAULT_NAVAMSAKAM, 'നവാംശകം', '卐', chartStartX + cSize + gap, chartTopY, cSize);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = H - footerH;
  ctx.fillStyle = C.footBg;
  ctx.fillRect(0, footerY, W, footerH);

  ctx.strokeStyle = C.lgray;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(sidePad, footerY);
  ctx.lineTo(W - sidePad, footerY);
  ctx.stroke();

  ctx.fillStyle = C.gray;
  ctx.font      = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by Bharath Marriage  •  www.bharathmarriage.com  •  Confidential', W / 2, footerY + 18);

  ctx.fillStyle = C.lgray;
  ctx.font      = '9px sans-serif';
  ctx.fillText(
    `Downloaded on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    W / 2,
    footerY + 33,
  );

  // trigger download
  const link = document.createElement('a');
  link.download = `${profile.name.replace(/\s+/g, '_')}_horoscope.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * @param {object} profile  – the profile data object from ProfileDetail
 */
export function downloadHoroscope(profile) {
  // layout constants
  const W         = 900;
  const cSize     = 280;
  const sidePad   = 50;
  const gap       = 40;
  const headerH   = 130;
  const nameH     = 70;
  const detailH   = 120;
  const chartTopY = headerH + nameH + detailH + 20;
  const footerH   = 44;
  const H         = chartTopY + cSize + 50 + footerH;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  // stash layout so renderCanvas can read it without re-computing
  canvas._layout = { W, H, sidePad, headerH, nameH, detailH, chartTopY, footerH, cSize, gap };

  const ctx = canvas.getContext('2d');

  const img    = new Image();
  img.onload   = () => renderCanvas(ctx, canvas, profile, img);
  img.onerror  = () => renderCanvas(ctx, canvas, profile, null);
  img.src      = '/newlogo1.png';
}
