import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance.js';

const KERALA_DISTRICT_PINCODES = {
  'Alappuzha': ['688001', '688002', '688003', '688004', '688005', '688006', '688007', '688008', '688009', '688010', '688011', '688012', '688013', '688521', '688522', '688523', '688524', '688531', '688534', '688539', '688561', '689121', '689122', '689571', '690502', '690511', '690572'],
  'Ernakulam': ['682001', '682002', '682003', '682004', '682005', '682006', '682011', '682012', '682013', '682014', '682015', '682016', '682017', '682018', '682019', '682020', '682021', '682022', '682024', '682025', '682028', '682030', '682031', '682035', '682036', '682037', '682301', '682304', '683101', '683102', '683511', '683513', '683542', '683562', '686661', '686691'],
  'Idukki': ['685501', '685502', '685503', '685505', '685508', '685514', '685531', '685551', '685554', '685561', '685565', '685584', '685588', '685602', '685603', '685608', '685612'],
  'Kannur': ['670001', '670002', '670003', '670004', '670005', '670006', '670007', '670011', '670012', '670014', '670101', '670102', '670141', '670301', '670307', '670562', '670571', '670643', '670671', '670702'],
  'Kasaragod': ['671121', '671122', '671123', '671124', '671313', '671314', '671315', '671316', '671321', '671328', '671531', '671532', '671541', '671542', '671543'],
  'Kollam': ['691001', '691002', '691003', '691004', '691005', '691006', '691007', '691008', '691009', '691010', '691011', '691012', '691013', '691014', '691015', '691019', '691020', '691021', '691301', '691302', '691303', '691304', '691305', '691306', '691308', '691331', '691501', '691502', '691505', '691506', '691531', '691536', '691571', '691583'],
  'Kottayam': ['686001', '686002', '686003', '686004', '686005', '686006', '686007', '686008', '686009', '686010', '686011', '686012', '686013', '686014', '686015', '686016', '686101', '686501', '686502', '686503', '686512', '686513', '686531', '686561', '686574', '686575', '686631'],
  'Kozhikode': ['673001', '673002', '673003', '673004', '673005', '673006', '673007', '673008', '673009', '673010', '673011', '673012', '673014', '673015', '673016', '673017', '673018', '673019', '673020', '673021', '673028', '673301', '673307', '673508', '673571', '673572', '673573', '673582', '673601', '673602', '673611', '673612', '673639'],
  'Malappuram': ['676101', '676102', '676121', '676122', '676304', '676305', '676501', '676503', '676505', '676506', '676507', '676508', '676509', '676517', '676519', '676521', '676528', '676542', '676551', '676553', '679322', '679328', '679329', '679330', '679334'],
  'Palakkad': ['678001', '678002', '678003', '678004', '678005', '678006', '678007', '678010', '678012', '678013', '678101', '678102', '678501', '678502', '678531', '678541', '678551', '678581', '678591', '679101', '679303', '679338'],
  'Pathanamthitta': ['689101', '689102', '689103', '689104', '689111', '689121', '689501', '689508', '689531', '689532', '689541', '689581', '689621', '689641', '689642', '689643', '689645', '689653', '689672', '689691', '689695', '689696', '689698'],
  'Thiruvananthapuram': ['695001', '695002', '695003', '695004', '695005', '695006', '695007', '695008', '695009', '695010', '695011', '695012', '695013', '695014', '695015', '695016', '695017', '695018', '695019', '695020', '695021', '695022', '695023', '695024', '695025', '695028', '695030', '695033', '695034', '695035', '695036', '695043', '695101', '695121', '695141', '695301', '695501', '695502', '695512', '695541', '695572', '695581', '695582', '695583'],
  'Thrissur': ['680001', '680002', '680003', '680004', '680005', '680006', '680007', '680008', '680009', '680011', '680012', '680020', '680101', '680102', '680121', '680301', '680306', '680503', '680506', '680561', '680664', '680683', '680684', '680721'],
  'Wayanad': ['673121', '673122', '673123', '673124', '673576', '673579', '673591', '673592', '673593', '673595', '673596']
};

function PincodeMultiSelect({ district, selectedPincodes = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customPin, setCustomPin] = useState('');
  const wrapperRef = useRef(null);

  const availablePins = district && KERALA_DISTRICT_PINCODES[district]
    ? KERALA_DISTRICT_PINCODES[district]
    : [];

  const filteredPins = availablePins.filter(pin => pin.includes(search.trim()));

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePin = (pin) => {
    if (selectedPincodes.includes(pin)) {
      onChange(selectedPincodes.filter(p => p !== pin));
    } else {
      onChange([...selectedPincodes, pin]);
    }
  };

  const handleSelectAll = () => {
    const all = Array.from(new Set([...selectedPincodes, ...availablePins]));
    onChange(all);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const addCustomPin = (e) => {
    e.preventDefault();
    const clean = customPin.trim();
    if (clean && !selectedPincodes.includes(clean)) {
      onChange([...selectedPincodes, clean]);
      setCustomPin('');
    }
  };

  const removePin = (pin, e) => {
    e.stopPropagation();
    onChange(selectedPincodes.filter(p => p !== pin));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        onClick={() => {
          if (district) setIsOpen(!isOpen);
        }}
        className={`w-full h-9 px-3 text-xs border rounded-lg flex items-center justify-between cursor-pointer bg-white transition-all ${
          !district
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-deep-maroon ring-1 ring-deep-maroon'
            : 'border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex-1 truncate pr-1 font-mono">
          {!district ? (
            <span className="text-slate-400 text-xs font-sans">Select District first</span>
          ) : selectedPincodes.length === 0 ? (
            <span className="text-slate-400 text-xs font-sans">Choose territory pincodes...</span>
          ) : (
            <span className="text-slate-800 text-xs font-medium">
              {selectedPincodes.length === 1
                ? selectedPincodes[0]
                : selectedPincodes.length === 2
                ? `${selectedPincodes[0]}, ${selectedPincodes[1]}`
                : `${selectedPincodes.slice(0, 2).join(', ')} (+${selectedPincodes.length - 2} more)`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedPincodes.length > 0 && (
            <span className="bg-rose-50 border border-deep-maroon/30 text-deep-maroon px-2 py-0.5 rounded text-[11px] font-bold leading-none font-mono">
              {selectedPincodes.length}
            </span>
          )}
          <span className="material-symbols-outlined text-base text-slate-400">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {isOpen && district && (
        <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-72 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-2.5 text-xs animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
            <span className="font-bold text-slate-800">
              {district} <span className="text-slate-500 font-normal">({availablePins.length} pincodes)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-deep-maroon hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {selectedPincodes.length > 0 && (
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Selected Territory ({selectedPincodes.length}):
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedPincodes.map(pin => (
                  <span
                    key={pin}
                    className="inline-flex items-center gap-1 bg-white border border-deep-maroon/30 text-deep-maroon px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono shadow-2xs"
                  >
                    {pin}
                    <span
                      onClick={(e) => removePin(pin, e)}
                      className="hover:text-rose-900 cursor-pointer font-bold leading-none"
                    >
                      &times;
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter pincodes (e.g. 682)..."
              className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-deep-maroon bg-slate-50 placeholder-slate-400 font-mono"
            />
          </div>

          <div className="max-h-48 overflow-y-auto pr-1 flex flex-wrap gap-1.5 content-start">
            {filteredPins.map(pin => {
              const isSelected = selectedPincodes.includes(pin);
              return (
                <button
                  key={pin}
                  type="button"
                  onClick={() => togglePin(pin)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1 select-none ${
                    isSelected
                      ? 'bg-deep-maroon text-white border-deep-maroon shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <span className="text-[11px] font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">+</span>
                  )}
                  <span>{pin}</span>
                </button>
              );
            })}
            {filteredPins.length === 0 && (
              <div className="w-full py-4 text-center text-slate-400 text-xs">
                No matching pincodes for "{search}"
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-1.5">
            <input
              type="text"
              maxLength="6"
              value={customPin}
              onChange={(e) => setCustomPin(e.target.value)}
              placeholder="Add other 6-digit PIN"
              className="flex-1 h-8 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-deep-maroon placeholder-slate-400 font-mono"
            />
            <button
              type="button"
              onClick={addCustomPin}
              className="px-3 h-8 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer"
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FranchiseVerification() {
  const { token } = useParams();

  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState(null);
  const [originalRequest, setOriginalRequest] = useState(null);

  const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'organization'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    organizationName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
    registrationNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    district: '',
    address: '',
    preferredDistrict: '',
    preferredPincodes: [],
    panCard: null,
    aadhaarCard: null,
    addressProof: null,
    bankPassbook: null,
    regCert: null,
    agreed: false
  });

  const districts = Object.keys(KERALA_DISTRICT_PINCODES);

  // Validate Verification Token on Mount
  useEffect(() => {
    if (!token) {
      setTokenLoading(false);
      setTokenError('Missing verification token in URL.');
      return;
    }

    const validateToken = async () => {
      try {
        setTokenLoading(true);
        setTokenError(null);
        const response = await axiosInstance.get(`/public/franchise/verification/${token}`);
        if (response.data?.valid) {
          const reqData = response.data.request;
          setOriginalRequest(reqData);

          setForm(prev => ({
            ...prev,
            fullName: reqData.name || '',
            organizationName: reqData.name || '',
            mobileNumber: reqData.phone || '',
            whatsappNumber: reqData.phone || '',
            email: reqData.email || '',
            district: reqData.district || 'Ernakulam',
            preferredDistrict: reqData.district || 'Ernakulam',
            preferredPincodes: reqData.pincode ? [reqData.pincode] : [],
            address: reqData.location || ''
          }));
        } else {
          setTokenError(response.data?.message || 'Invalid or expired verification link.');
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        const msg = err.response?.data?.error || err.response?.data?.message || 'Invalid or expired verification link. Please contact support.';
        setTokenError(msg);
      } finally {
        setTokenLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setForm(prev => ({ ...prev, [name]: files[0] || null }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.agreed) {
      setSubmitError('Please accept the franchise terms and accuracy confirmation to proceed.');
      return;
    }

    if (form.preferredPincodes.length === 0) {
      setSubmitError('Please select at least one preferred territory pincode.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('applicantType', activeTab.toUpperCase());
      formData.append('fullName', form.fullName);
      formData.append('organizationName', form.organizationName);
      formData.append('mobileNumber', form.mobileNumber);
      formData.append('whatsappNumber', form.whatsappNumber);
      formData.append('email', form.email);
      formData.append('panNumber', form.panNumber);
      formData.append('aadhaarNumber', form.aadhaarNumber);
      formData.append('gstNumber', form.gstNumber);
      formData.append('registrationNumber', form.registrationNumber);
      formData.append('bankName', form.bankName);
      formData.append('accountNumber', form.accountNumber);
      formData.append('ifscCode', form.ifscCode);
      formData.append('accountHolderName', form.accountHolderName);
      formData.append('district', form.district);
      formData.append('address', form.address);
      formData.append('preferredDistrict', form.preferredDistrict);
      formData.append('preferredPincodes', JSON.stringify(form.preferredPincodes));

      // Append documents
      if (form.panCard) formData.append('panCard', form.panCard);
      if (form.aadhaarCard) formData.append('aadhaarCard', form.aadhaarCard);
      if (form.addressProof) formData.append('addressProof', form.addressProof);
      if (form.bankPassbook) formData.append('bankPassbook', form.bankPassbook);
      if (form.regCert) formData.append('regCertFile', form.regCert);

      const response = await axiosInstance.post(
        `/public/franchise/verification/${token}/submit`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data?.success) {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Verification submit error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit verification form. Please ensure all documents and fields are filled.';
      setSubmitError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Render Loading & Error States
  // -------------------------------------------------------------
  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-md w-full text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-deep-maroon animate-spin mb-3 block">
            sync
          </span>
          <h2 className="text-base font-bold text-slate-800">Verifying Security Token</h2>
          <p className="text-xs text-slate-500 mt-1.5">
            Validating your franchise invitation token. Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Verification Link Unavailable</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{tokenError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/franchise/register"
              className="w-full py-2.5 bg-deep-maroon text-white font-bold text-xs rounded-lg hover:bg-rose-950 transition-colors"
            >
              Submit New Franchise Enquiry
            </Link>
            <Link
              to="/"
              className="w-full py-2 text-slate-600 text-xs font-semibold hover:text-slate-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 max-w-lg w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Franchise KYC Submitted Successfully</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Thank you, <strong>{form.fullName || form.organizationName}</strong>. Your KYC documents and territory preferences have been submitted to the Bharat Marriage administration for final review.
          </p>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 my-5 text-left text-xs space-y-1.5">
            <div className="font-bold text-slate-800">What Happens Next?</div>
            <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
              <li>Our administration reviews your submitted KYC documents and preferred PIN codes.</li>
              <li>Upon final verification approval, your official <strong>Franchise ID</strong> and <strong>portal login credentials</strong> will be emailed to <strong>{form.email}</strong>.</li>
              <li>You can then log in to the Franchise Portal to start operating in your assigned territory.</li>
            </ul>
          </div>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-deep-maroon text-white font-bold text-xs rounded-lg hover:bg-rose-950 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 text-xs py-6 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Branding Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl font-bold">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-maroon uppercase tracking-wider">
                <span>Bharat Marriage</span>
                <span>•</span>
                <span>Stage 2 KYC Verification</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Franchise Verification & Territory Allocation
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Application Reference: <strong className="text-slate-700 font-mono">{originalRequest?.request_id}</strong>
              </p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-medium mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Applicant Category Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Applicant Structure / Type:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('individual')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'individual'
                    ? 'bg-deep-maroon text-white border-deep-maroon shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-base">person</span>
                <span>Individual / Sole Proprietor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('organization')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'organization'
                    ? 'bg-deep-maroon text-white border-deep-maroon shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-base">domain</span>
                <span>Company / Partnership Firm</span>
              </button>
            </div>
          </div>

          {/* Section 1: Basic Applicant & Organization Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {activeTab === 'organization' ? 'Authorized Person Name *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon"
                />
              </div>

              {activeTab === 'organization' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Organization / Firm Name *
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    required
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon"
                />
              </div>
            </div>
          </div>

          {/* Section 2: KYC & Identification Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. KYC & Business Identification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PAN Number *
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                  required
                  maxLength="10"
                  placeholder="e.g. ABCDE1234F"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aadhaar Number *
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={form.aadhaarNumber}
                  onChange={handleChange}
                  required
                  maxLength="12"
                  placeholder="12-digit Aadhaar Number"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon font-mono"
                />
              </div>

              {activeTab === 'organization' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={form.gstNumber}
                      onChange={handleChange}
                      placeholder="15-digit GSTIN"
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Company / MSME Reg Number
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={form.registrationNumber}
                      onChange={handleChange}
                      placeholder="Registration Number"
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Bank Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Bank Account for Revenue Settlements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. State Bank of India"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={form.ifscCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g. SBIN0001234"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={form.accountHolderName}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Territory Selection */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              4. Territory Preference & Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Kerala District *
                </label>
                <select
                  name="preferredDistrict"
                  value={form.preferredDistrict}
                  onChange={(e) => {
                    const dist = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      preferredDistrict: dist,
                      preferredPincodes: []
                    }));
                  }}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon bg-white"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Preferred Territory PIN Code(s) *
                </label>
                <PincodeMultiSelect
                  district={form.preferredDistrict}
                  selectedPincodes={form.preferredPincodes}
                  onChange={(pins) => setForm(prev => ({ ...prev, preferredPincodes: pins }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Office Address / Location *
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="Building, Street, Town/City"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-deep-maroon"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Document Uploads */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              5. KYC Document Attachments (PDF, JPG, PNG)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PAN Card Document *
                </label>
                <input
                  type="file"
                  name="panCard"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  onChange={handleChange}
                  required
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aadhaar Card Document *
                </label>
                <input
                  type="file"
                  name="aadhaarCard"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  onChange={handleChange}
                  required
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Address Proof (Electricity Bill / Rent Agreement)
                </label>
                <input
                  type="file"
                  name="addressProof"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  onChange={handleChange}
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank Passbook / Cancelled Cheque
                </label>
                <input
                  type="file"
                  name="bankPassbook"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  onChange={handleChange}
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              {activeTab === 'organization' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Business Registration / GST Certificate
                  </label>
                  <input
                    type="file"
                    name="regCert"
                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                    onChange={handleChange}
                    className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-relaxed">
              <input
                type="checkbox"
                name="agreed"
                checked={form.agreed}
                onChange={handleChange}
                className="mt-0.5 rounded border-slate-300 text-deep-maroon focus:ring-deep-maroon"
              />
              <span>
                I hereby declare that the information and documents provided above are true, complete, and accurate. I understand that false information may lead to rejection or termination of franchise partnership.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-deep-maroon hover:bg-rose-950 text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  <span>Submitting Verification...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Submit Verification to Administration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
