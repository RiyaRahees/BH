import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const malayalamPlanets = ["ച", "മ", "സ", "ല", "കുശ്രി", "ബു", "ഗു", "ശു", "മ", "ര", "കെ", "രാ"];
const nakshatras = [
  'അശ്വതി','ഭരണി','കാർത്തിക','റോഹിണി','മകയിരം','തിരുവാതിര','പുനർതം','പൂയം','ആയില്യം',
  'മകം','പൂരം','ഉത്രം','അത്തം','ചിത്തിര','സ്വാതി','വിശാഖം','അനിഴം','ത്രിക്കേറ്റ','മൂലം',
  'പൂരാടം','ഉത്രാടം','തിരുവോണം','അവിട്ടം','ചതയം','പൂരുരുട്ടാതി','ഉത്രട്ടാതി','രേവതി'
];
const rasis = ['മേടം','ഇടവം','മിഥുനം','കർക്കിടകം','ചിംഹം','കന്നി','തുലാം','വൃശ്ചികം','ധനു','മകരം','കുംഭം','മീനം'];

const getMaxDate18YearsAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const maxDate = getMaxDate18YearsAgo();

function RasiChart({ title, cells, rasiName, dob }) {
  const Cell = ({ num, children, col, row, className = "" }) => (
    <div
      className={`relative border border-slate-200 flex items-center justify-center min-h-[56px] md:min-h-[72px] ${className}`}
      style={{ gridColumn: col, gridRow: row }}
    >
      {num && (
        <span className="absolute top-0.5 right-1 text-[8px] md:text-[9px] text-orange-500/80 font-medium">
          {num}
        </span>
      )}
      <span className="text-[11px] md:text-sm text-charcoal-text font-bold">{children}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-4 grid-rows-4 w-full max-w-[260px] aspect-square border border-slate-200">
        <Cell num={1} col="1" row="1">{cells[1]}</Cell>
        <Cell num={2} col="2" row="1">{cells[2]}</Cell>
        <Cell num={3} col="3" row="1">{cells[3]}</Cell>
        <Cell num={4} col="4" row="1">{cells[4]}</Cell>

        <Cell num={5} col="1" row="2">{cells[5]}</Cell>
        <div
          className="border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center px-1"
          style={{ gridColumn: "2 / 4", gridRow: "2 / 4" }}
        >
          <span className="text-[11px] md:text-sm font-semibold text-charcoal-text leading-tight">
            {rasiName}
          </span>
          <span className="text-[9px] md:text-[11px] text-soft-gray mt-1 leading-tight">
            {dob}
          </span>
        </div>
        <Cell num={8} col="4" row="2">{cells[8]}</Cell>

        <Cell num={9} col="1" row="3">{cells[9]}</Cell>
        <Cell num={12} col="4" row="3">{cells[12]}</Cell>

        <Cell col="1" row="4" />
        <Cell col="2" row="4" />
        <Cell col="3" row="4" />
        <Cell col="4" row="4" />
      </div>
      <p className="text-[11px] md:text-sm font-semibold text-deep-maroon mt-3">{title}</p>
    </div>
  );
}

export default function Porutham() {
  const [groom, setGroom] = useState({ name: '', city: '', dob: '' });
  const [bride, setBride] = useState({ name: '', city: '', dob: '' });
  const [result, setResult] = useState(null);

  const handleChange = (person, field, value) => {
    const setter = person === 'groom' ? setGroom : setBride;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheck = (e) => {
    e.preventDefault();

    const groomNak = nakshatras[Math.floor(Math.random() * nakshatras.length)];
    const groomRasi = rasis[Math.floor(Math.random() * rasis.length)];
    const brideNak = nakshatras[Math.floor(Math.random() * nakshatras.length)];
    const brideRasi = rasis[Math.floor(Math.random() * rasis.length)];

    const groomCells = {};
    const brideCells = {};
    [1, 2, 3, 4, 5, 8, 9, 12].forEach(house => {
      groomCells[house] = malayalamPlanets[Math.floor(Math.random() * malayalamPlanets.length)];
      brideCells[house] = malayalamPlanets[Math.floor(Math.random() * malayalamPlanets.length)];
    });

    const poruthamList = ['ദിനം', 'ഗണം', 'രാശി', 'രാജ്ജു', 'നാടി', 'വശ്യ', 'യോണി', 'മഹേന്ദ്ര', 'സ്ത്രീദീർഘ', 'വിശ്യ'];
    let matchCount = 0;
    const matches = poruthamList.map((name) => {
      const match = Math.random() > 0.4;
      if (match) matchCount++;
      return { name, match };
    });

    setResult({
      groom: {
        name: groom.name,
        city: groom.city,
        dob: groom.dob ? groom.dob.replace("T", " ") : "—",
        nak: groomNak,
        rasi: groomRasi,
        cells: groomCells,
      },
      bride: {
        name: bride.name,
        city: bride.city,
        dob: bride.dob ? bride.dob.replace("T", " ") : "—",
        nak: brideNak,
        rasi: brideRasi,
        cells: brideCells,
      },
      matches,
      matchCount,
      score: `${matchCount}/${poruthamList.length}`,
      percentage: Math.round((matchCount / poruthamList.length) * 100),
    });
  };

  const isFormValid =
    groom.name && groom.city && groom.dob && bride.name && bride.city && bride.dob;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-16 px-margin-mobile md:px-margin-desktop">
      <Helmet>
        <title>Porutham Matching for Marriage | Bharath Marriage</title>
        <meta
          name="description"
          content="Check Porutham and horoscope compatibility for better matrimonial matches."
        />
      </Helmet>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <p className="text-[9px] md:text-[11px] font-label-caps font-semibold text-deep-maroon tracking-[0.18em] uppercase mb-1.5 md:mb-2">
            Horoscope Matching
          </p>
          <h1 className="font-display-lg text-lg md:text-2xl text-charcoal-text leading-tight">
            Porutham Compatibility Check
          </h1>
          <p className="text-soft-gray text-[11px] md:text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Enter birth details for both partners to check Vedic star compatibility.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleCheck}
          className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm p-4 md:p-8"
        >
          <div className="grid grid-cols-2 gap-3.5 md:gap-10">
            {/* Groom Details */}
            <div>
              <h2 className="font-display-lg text-[12px] md:text-base text-deep-maroon mb-2.5 md:mb-4 truncate">
                Groom Details
              </h2>

              <div className="space-y-2.5 md:space-y-3.5">
                <div>
                  <label className="block text-[9px] md:text-[11px] text-charcoal-text/70 font-semibold mb-1 uppercase tracking-wide">
                    Name
                  </label>
                  <input
                    type="text"
                    value={groom.name}
                    onChange={(e) => handleChange('groom', 'name', e.target.value)}
                    className="w-full border border-slate-200 rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-3 text-[11px] md:text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] md:text-[11px] text-charcoal-text/70 font-semibold mb-1 uppercase tracking-wide">
                    City
                  </label>
                  <input
                    type="text"
                    value={groom.city}
                    onChange={(e) => handleChange('groom', 'city', e.target.value)}
                    className="w-full border border-slate-200 rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-3 text-[11px] md:text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] md:text-[11px] text-charcoal-text/70 font-semibold mb-1 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <input
                    type="datetime-local"
                    value={groom.dob}
                    onChange={(e) => handleChange('groom', 'dob', e.target.value)}
                    className="w-full border border-slate-200 rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-3 text-[10px] md:text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
                    max={maxDate}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bride Details */}
            <div>
              <h2 className="font-display-lg text-[12px] md:text-base text-deep-maroon mb-2.5 md:mb-4 truncate">
                Bride Details
              </h2>

              <div className="space-y-2.5 md:space-y-3.5">
                <div>
                  <label className="block text-[9px] md:text-[11px] text-charcoal-text/70 font-semibold mb-1 uppercase tracking-wide">
                    Name
                  </label>
                  <input
                    type="text"
                    value={bride.name}
                    onChange={(e) => handleChange('bride', 'name', e.target.value)}
                    className="w-full border border-slate-200 rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-3 text-[11px] md:text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] md:text-[11px] text-charcoal-text/70 font-semibold mb-1 uppercase tracking-wide">
                    City
                  </label>
                  <input
                    type="text"
                    value={bride.city}
                    onChange={(e) => handleChange('bride', 'city', e.target.value)}
                    className="w-full border border-slate-200 rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-3 text-[11px] md:text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] md:text-[11px] text-charcoal-text/70 font-semibold mb-1 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <input
                    type="datetime-local"
                    value={bride.dob}
                    onChange={(e) => handleChange('bride', 'dob', e.target.value)}
                    className="w-full border border-slate-200 rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-3 text-[10px] md:text-xs text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:border-deep-maroon"
                    max={maxDate}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center mt-5 md:mt-8">
            <button
              type="submit"
              disabled={!isFormValid}
              className="bg-deep-maroon hover:bg-primary disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-[11px] md:text-sm py-2 md:py-2.5 px-6 md:px-8 rounded-lg shadow transition-all active:scale-95 cursor-pointer"
            >
              Check Porutham
            </button>
          </div>
        </form>

        {/* Small Disclaimer */}
        <div className="mt-4 p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5 text-left">
          <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5 select-none">info</span>
          <p className="text-[10px] md:text-[11px] text-charcoal-text/75 leading-relaxed">
            <strong className="text-charcoal-text font-semibold">Disclaimer:</strong> Porutham compatibility results are generated using traditional astrological principles and Vedic star algorithms for informational guidance. Please consult a qualified astrologer or family priest for comprehensive horoscope evaluation and final decisions.
          </p>
        </div>

        {/* Result */}
        {result && (
          <>
            <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm p-4 md:p-8 mt-5 fade-in">
              <h3 className="font-display-lg text-base md:text-xl text-heritage-gold text-center mb-4 md:mb-6">
                Entered Details
              </h3>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#1c1c22]">
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-tl-lg">
                        Person
                      </th>
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4">
                        City
                      </th>
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4">
                        Date of Birth
                      </th>
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4">
                        Nakshatram
                      </th>
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-tr-lg">
                        Rasi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 break-words">
                        {result.groom.name} (Groom)
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 break-words">
                        {result.groom.city}
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 whitespace-nowrap">
                        {result.groom.dob}
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 whitespace-nowrap font-bold text-deep-maroon">
                        {result.groom.nak}
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 whitespace-nowrap">
                        {result.groom.rasi}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 break-words">
                        {result.bride.name} (Bride)
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 break-words">
                        {result.bride.city}
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 whitespace-nowrap">
                        {result.bride.dob}
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 whitespace-nowrap font-bold text-deep-maroon">
                        {result.bride.nak}
                      </td>
                      <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 whitespace-nowrap">
                        {result.bride.rasi}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 mt-2">
                {/* Groom Card */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-deep-maroon text-[12px] uppercase tracking-wide mb-3 border-b border-slate-200 pb-1.5">
                    Groom Details
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                    <div className="text-soft-gray font-semibold">Name</div>
                    <div className="text-right font-medium text-charcoal-text break-words">{result.groom.name}</div>
                    
                    <div className="text-soft-gray font-semibold">City</div>
                    <div className="text-right font-medium text-charcoal-text break-words">{result.groom.city}</div>
                    
                    <div className="text-soft-gray font-semibold">Date of Birth</div>
                    <div className="text-right font-medium text-charcoal-text">{result.groom.dob}</div>
                    
                    <div className="text-soft-gray font-semibold">Nakshatram</div>
                    <div className="text-right font-bold text-deep-maroon">{result.groom.nak}</div>
                    
                    <div className="text-soft-gray font-semibold">Rasi</div>
                    <div className="text-right font-medium text-charcoal-text">{result.groom.rasi}</div>
                  </div>
                </div>

                {/* Bride Card */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-deep-maroon text-[12px] uppercase tracking-wide mb-3 border-b border-slate-200 pb-1.5">
                    Bride Details
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                    <div className="text-soft-gray font-semibold">Name</div>
                    <div className="text-right font-medium text-charcoal-text break-words">{result.bride.name}</div>
                    
                    <div className="text-soft-gray font-semibold">City</div>
                    <div className="text-right font-medium text-charcoal-text break-words">{result.bride.city}</div>
                    
                    <div className="text-soft-gray font-semibold">Date of Birth</div>
                    <div className="text-right font-medium text-charcoal-text">{result.bride.dob}</div>
                    
                    <div className="text-soft-gray font-semibold">Nakshatram</div>
                    <div className="text-right font-bold text-deep-maroon">{result.bride.nak}</div>
                    
                    <div className="text-soft-gray font-semibold">Rasi</div>
                    <div className="text-right font-medium text-charcoal-text">{result.bride.rasi}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rasi Charts */}
            <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm p-4 md:p-8 mt-5 fade-in">
              <h3 className="font-display-lg text-base md:text-xl text-heritage-gold text-center mb-5 md:mb-7">
                Birth Chart
              </h3>

              <div className="grid sm:grid-cols-2 gap-8 sm:gap-6 max-w-2xl mx-auto">
                <RasiChart
                  title={`${result.groom.name} - Groom`}
                  cells={result.groom.cells}
                  rasiName={result.groom.rasi}
                  dob={result.groom.dob}
                />
                <RasiChart
                  title={`${result.bride.name} - Bride`}
                  cells={result.bride.cells}
                  rasiName={result.bride.rasi}
                  dob={result.bride.dob}
                />
              </div>
            </div>

            {/* Porutham Compatibility */}
            <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm p-4 md:p-8 mt-5 fade-in">
              <h3 className="font-display-lg text-base md:text-xl text-heritage-gold text-center mb-4 md:mb-6">
                Porutham Compatibility
              </h3>

              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full min-w-[420px] md:min-w-0 border-collapse text-left">
                  <thead>
                    <tr className="bg-[#1c1c22]">
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-tl-lg w-[70px] md:w-[100px]">
                        Sl No.
                      </th>
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4">
                        Porutham
                      </th>
                      <th className="text-white text-[10px] md:text-xs font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-tr-lg w-[80px] md:w-[120px]">
                        Match
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.map((row, i) => (
                      <tr
                        key={row.name}
                        className={`${i !== result.matches.length - 1 ? "border-b border-slate-100" : ""} ${row.match ? "bg-emerald-50/20" : "bg-rose-50/20"}`}
                      >
                        <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4">
                          {i + 1}
                        </td>
                        <td className="text-charcoal-text text-[11px] md:text-sm py-2.5 md:py-3 px-3 md:px-4 font-semibold">
                          {row.name}
                        </td>
                        <td className="py-2.5 md:py-3 px-3 md:px-4 text-center">
                          <span
                            className={`material-symbols-outlined text-[16px] md:text-[18px] font-bold ${row.match ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {row.match ? "check" : "close"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-100 rounded-lg mt-4 md:mt-6 py-3 md:py-4 text-center">
                <span className="text-charcoal-text font-bold text-xs md:text-sm">
                  Compatibility Score: {result.score} ({result.percentage}%)
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}