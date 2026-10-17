import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

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

// Reusable Multi-Select Pincode Component
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
      {/* Trigger Box - Fixed h-8 to perfectly align with other grid inputs */}
      <div
        onClick={() => {
          if (district) setIsOpen(!isOpen);
        }}
        className={`w-full h-8 px-2.5 text-xs border rounded flex items-center justify-between cursor-pointer bg-white transition-colors ${
          !district
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-deep-maroon ring-1 ring-deep-maroon'
            : 'border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex-1 truncate pr-1">
          {!district ? (
            <span className="text-slate-400 text-[11px]">Select District first</span>
          ) : selectedPincodes.length === 0 ? (
            <span className="text-slate-400 text-[11px]">Select pincode(s)...</span>
          ) : (
            <span className="text-slate-800 text-[11px] font-medium font-mono">
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
            <span className="bg-rose-50 border border-deep-maroon/30 text-deep-maroon px-1.5 py-0.5 rounded text-[10px] font-bold leading-none">
              {selectedPincodes.length}
            </span>
          )}
          <span className="material-symbols-outlined text-sm text-slate-400">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && district && (
        <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1 w-72 sm:w-84 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-2.5 text-xs animate-fade-in">
          {/* Quick Header */}
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

          {/* Selected Chips View inside Popover */}
          {selectedPincodes.length > 0 && (
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Selected ({selectedPincodes.length}):
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
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

          {/* Search Filter */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter pincodes (e.g. 676)..."
              className="w-full h-7 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-deep-maroon bg-slate-50 placeholder-slate-400"
            />
          </div>

          {/* Pincode Tag Badges List - Spacious & Fully Legible */}
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
              <div className="w-full py-4 text-center text-slate-400 text-[11px]">
                No matching pincodes for "{search}"
              </div>
            )}
          </div>

          {/* Custom Pincode Add */}
          <div className="pt-2 border-t border-slate-100 flex gap-1.5">
            <input
              type="text"
              maxLength="6"
              value={customPin}
              onChange={(e) => setCustomPin(e.target.value)}
              placeholder="Add other 6-digit pincode"
              className="flex-1 h-7 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-deep-maroon placeholder-slate-400 font-mono"
            />
            <button
              type="button"
              onClick={addCustomPin}
              className="px-2.5 h-7 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer"
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FranchiseRegister() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const token = params.token || searchParams.get('token') || '';

  const [activeTab, setActiveTab] = useState('organization'); // 'organization' | 'individual'
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [assignedRequestId, setAssignedRequestId] = useState('');

  // Pre-fill if token is valid
  useEffect(() => {
    if (token) {
      axiosInstance.get(`/public/franchise/verification/${token}`)
        .then(res => {
          if (res.data?.request) {
            const req = res.data.request;
            setAssignedRequestId(req.requestId || '');
            setOrgForm(prev => ({
              ...prev,
              contactName: req.name || prev.contactName,
              officialEmail: req.email || prev.officialEmail,
              contactEmail: req.email || prev.contactEmail,
              officeNumber: req.phone || prev.officeNumber,
              contactPhone: req.phone || prev.contactPhone,
              district: req.district || prev.district,
              preferredDistrict: req.district || prev.preferredDistrict,
              pincode: req.pincode || prev.pincode,
              address: req.location || prev.address
            }));
            setIndForm(prev => ({
              ...prev,
              fullName: req.name || prev.fullName,
              email: req.email || prev.email,
              mobileNumber: req.phone || prev.mobileNumber,
              district: req.district || prev.district,
              preferredDistrict: req.district || prev.preferredDistrict,
              pincode: req.pincode || prev.pincode,
              address: req.location || prev.address
            }));
          }
        })
        .catch(err => {
          console.warn('Could not prefill from token:', err);
        });
    }
  }, [token]);

  // Organization Form State
  const [orgForm, setOrgForm] = useState({
    orgName: '',
    orgType: 'Private Limited',
    regNumber: '',
    gstNumber: '',
    panNumber: '',
    dateOfEstablishment: '',
    natureOfBusiness: '',
    companyWebsite: '',
    // Office Details
    address: '',
    state: 'Kerala',
    district: '',
    pincode: '',
    customPincode: '',
    officeNumber: '',
    officialEmail: '',
    // Franchise Location Preferences
    preferredDistrict: '',
    landmark: '',
    preferredPincodes: [], // Multi-select array
    proposedLocation: '',
    // Authorized Person Details
    contactName: '',
    contactDesignation: '',
    contactPhone: '',
    contactEmail: '',
    aadharFile: null,
    panFile: null,
    regCertFile: null,
    gstCertFile: null,
    // Bank Details
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    agreed: false,
  });

  // Individual Form State
  const [indForm, setIndForm] = useState({
    // Personal Details
    fullName: '',
    dob: '',
    gender: 'Male',
    profilePhoto: null,
    aadharNumber: '',
    panNumber: '',
    occupation: '',
    education: '',
    // Contact Details
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    address: '',
    state: 'Kerala',
    district: '',
    pincode: '',
    customPincode: '',
    // Franchise Location Preferences
    preferredDistrict: '',
    landmark: '',
    preferredPincodes: [], // Multi-select array
    proposedLocation: '',
    // Work Details
    currentWork: '',
    previousExperience: '',
    expectedStartDate: '',
    // Documents & Bank Details
    aadharFile: null,
    panFile: null,
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    agreed: false,
  });

  const districts = Object.keys(KERALA_DISTRICT_PINCODES);

  const handleOrgChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setOrgForm(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setOrgForm(prev => ({ ...prev, [name]: files[0] || null }));
    } else if (name === 'district') {
      setOrgForm(prev => ({ ...prev, district: value, pincode: '', customPincode: '' }));
    } else if (name === 'preferredDistrict') {
      setOrgForm(prev => ({ ...prev, preferredDistrict: value, preferredPincodes: [] }));
    } else {
      setOrgForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIndChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setIndForm(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setIndForm(prev => ({ ...prev, [name]: files[0] || null }));
    } else if (name === 'district') {
      setIndForm(prev => ({ ...prev, district: value, pincode: '', customPincode: '' }));
    } else if (name === 'preferredDistrict') {
      setIndForm(prev => ({ ...prev, preferredDistrict: value, preferredPincodes: [] }));
    } else {
      setIndForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const isOrg = activeTab === 'organization';
      const name = isOrg ? orgForm.orgName : indForm.fullName;
      const phone = isOrg ? (orgForm.contactPhone || orgForm.officeNumber) : indForm.mobileNumber;
      const email = isOrg ? (orgForm.officialEmail || orgForm.contactEmail) : indForm.email;
      const district = isOrg ? (orgForm.preferredDistrict || orgForm.district) : (indForm.preferredDistrict || indForm.district);
      const pincodes = isOrg ? orgForm.preferredPincodes : indForm.preferredPincodes;
      const primaryPincode = pincodes && pincodes.length > 0 ? pincodes[0] : (isOrg ? (orgForm.pincode === 'Other' ? orgForm.customPincode : orgForm.pincode) : (indForm.pincode === 'Other' ? indForm.customPincode : indForm.pincode));
      const location = isOrg ? (orgForm.proposedLocation || orgForm.address) : (indForm.proposedLocation || indForm.address);

      setApplicantName(name);

      const data = new FormData();
      data.append('applicantType', isOrg ? 'organization' : 'individual');
      data.append('applicant_type', isOrg ? 'ORGANIZATION' : 'INDIVIDUAL');
      data.append('name', name);
      data.append('phone', phone);
      data.append('email', email);
      data.append('district', district);
      data.append('pincode', primaryPincode);
      data.append('location', location);
      data.append('preferredPincodes', JSON.stringify(pincodes || []));
      data.append('formData', JSON.stringify(isOrg ? orgForm : indForm));

      if (isOrg) {
        if (orgForm.aadharFile) data.append('aadharFile', orgForm.aadharFile);
        if (orgForm.panFile) data.append('panFile', orgForm.panFile);
        if (orgForm.regCertFile) data.append('regCertFile', orgForm.regCertFile);
        if (orgForm.gstCertFile) data.append('gstCertFile', orgForm.gstCertFile);
      } else {
        if (indForm.aadharFile) data.append('aadharFile', indForm.aadharFile);
        if (indForm.panFile) data.append('panFile', indForm.panFile);
        if (indForm.profilePhoto) data.append('profilePhoto', indForm.profilePhoto);
      }

      const endpoint = token ? `/public/franchise/verification/${token}/submit` : '/public/franchise-request';
      const res = await axiosInstance.post(endpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAssignedRequestId(res.data?.requestId || assignedRequestId || '');

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submission error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit form. Please check required fields.';
      setSubmitError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 text-xs py-5 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Sleek Top Header Bar */}
        <div className="bg-white border border-slate-200/90 rounded-lg px-4 py-3 mb-3.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Bharath Marriage</span>
                <span>•</span>
                <span className="text-deep-maroon">Partner Desk</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Franchise Registration
              </h1>
            </div>
          </div>

          <Link
            to="/franchise/login"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-deep-maroon transition-colors"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            <span className="hidden sm:inline">Partner</span> Login
          </Link>
        </div>

        {/* Successful Submission View */}
        {isSubmitted ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center shadow-xs">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2.5 border border-emerald-200">
              <span className="material-symbols-outlined text-xl">check</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">Application Submitted Successfully</h2>
            <p className="text-[11px] text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
              Thank you, <strong className="text-slate-800">{applicantName || 'Applicant'}</strong>. Your application for <strong>{activeTab === 'organization' ? 'Organization Franchise' : 'Individual Consultant'}</strong> has been registered. Our expansion team will contact you shortly.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="px-3 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                Submit New Form
              </button>
              <Link
                to="/"
                className="px-3 py-1.5 text-[11px] font-medium text-white bg-deep-maroon hover:bg-primary rounded-md transition-colors shadow-xs"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden">
            
            {/* Compact Segmented Switcher */}
            <div className="bg-slate-50/80 p-1 border-b border-slate-200 flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('organization')}
                className={`flex-1 py-1.5 px-3 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'organization'
                    ? 'bg-white text-deep-maroon shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">corporate_fare</span>
                <span>Organization</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-1.5 px-3 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'individual'
                    ? 'bg-white text-deep-maroon shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                <span>Individual</span>
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              
              {submitError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{submitError}</span>
                </div>
              )}
              
              {/* ========================================================= */}
              {/* ORGANIZATION TAB */}
              {/* ========================================================= */}
              {activeTab === 'organization' && (
                <>
                  {/* Section 1: Organization Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">business</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Organization Details
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          required
                          name="orgName"
                          value={orgForm.orgName}
                          onChange={handleOrgChange}
                          placeholder="e.g. Apex Services Pvt Ltd"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Type *
                        </label>
                        <select
                          name="orgType"
                          value={orgForm.orgType}
                          onChange={handleOrgChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="Private Limited">Private Limited</option>
                          <option value="Public Limited">Public Limited</option>
                          <option value="Partnership">Partnership</option>
                          <option value="LLP">LLP</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Registration No. *
                        </label>
                        <input
                          type="text"
                          required
                          name="regNumber"
                          value={orgForm.regNumber}
                          onChange={handleOrgChange}
                          placeholder="Reg / CIN Number"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          GST Number
                        </label>
                        <input
                          type="text"
                          name="gstNumber"
                          value={orgForm.gstNumber}
                          onChange={handleOrgChange}
                          placeholder="GSTIN (optional)"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          PAN Number *
                        </label>
                        <input
                          type="text"
                          required
                          name="panNumber"
                          maxLength="10"
                          value={orgForm.panNumber}
                          onChange={handleOrgChange}
                          placeholder="10-digit PAN"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Date of Establishment *
                        </label>
                        <input
                          type="date"
                          required
                          name="dateOfEstablishment"
                          value={orgForm.dateOfEstablishment}
                          onChange={handleOrgChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Nature of Business
                        </label>
                        <input
                          type="text"
                          name="natureOfBusiness"
                          value={orgForm.natureOfBusiness}
                          onChange={handleOrgChange}
                          placeholder="e.g. Consulting, Services"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Company Website
                        </label>
                        <input
                          type="url"
                          name="companyWebsite"
                          value={orgForm.companyWebsite}
                          onChange={handleOrgChange}
                          placeholder="https://company.com"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Office Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">location_on</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Office Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Office Address *
                        </label>
                        <input
                          type="text"
                          required
                          name="address"
                          value={orgForm.address}
                          onChange={handleOrgChange}
                          placeholder="Door No, Building, Street"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          State *
                        </label>
                        <select
                          name="state"
                          value={orgForm.state}
                          onChange={handleOrgChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="Kerala">Kerala</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          District *
                        </label>
                        <select
                          required
                          name="district"
                          value={orgForm.district}
                          onChange={handleOrgChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="">Select District</option>
                          {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* District-Linked Office Pincode Selection */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Office Pincode *
                        </label>
                        {orgForm.district && KERALA_DISTRICT_PINCODES[orgForm.district] ? (
                          orgForm.pincode === 'Other' ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                required
                                name="customPincode"
                                maxLength="6"
                                value={orgForm.customPincode}
                                onChange={handleOrgChange}
                                placeholder="6-digit pincode"
                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => setOrgForm(prev => ({ ...prev, pincode: '', customPincode: '' }))}
                                className="px-2 h-8 text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                                title="Back to list"
                              >
                                List
                              </button>
                            </div>
                          ) : (
                            <select
                              required
                              name="pincode"
                              value={orgForm.pincode}
                              onChange={handleOrgChange}
                              className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                            >
                              <option value="">Select Pincode</option>
                              {KERALA_DISTRICT_PINCODES[orgForm.district].map(pin => (
                                <option key={pin} value={pin}>{pin}</option>
                              ))}
                              <option value="Other">Other / Custom Pincode</option>
                            </select>
                          )
                        ) : (
                          <input
                            type="text"
                            required
                            name="pincode"
                            maxLength="6"
                            value={orgForm.pincode}
                            onChange={handleOrgChange}
                            placeholder={orgForm.district ? "Enter pincode" : "Select District first"}
                            disabled={!orgForm.district}
                            className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Office Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          name="officeNumber"
                          value={orgForm.officeNumber}
                          onChange={handleOrgChange}
                          placeholder="0484 2345678"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Official Email *
                        </label>
                        <input
                          type="email"
                          required
                          name="officialEmail"
                          value={orgForm.officialEmail}
                          onChange={handleOrgChange}
                          placeholder="office@company.com"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Franchise Location Preferences (Organization) */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">map</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Franchise Location Preferences
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Preferred District *
                        </label>
                        <select
                          required
                          name="preferredDistrict"
                          value={orgForm.preferredDistrict}
                          onChange={handleOrgChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="">Select District</option>
                          {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Landmark *
                        </label>
                        <input
                          type="text"
                          required
                          name="landmark"
                          value={orgForm.landmark}
                          onChange={handleOrgChange}
                          placeholder="e.g. Near Town Hall / Bus Stand"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      {/* MULTI-SELECT PREFERRED PINCODES */}
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Preferred Pincode(s) *
                        </label>
                        <PincodeMultiSelect
                          district={orgForm.preferredDistrict}
                          selectedPincodes={orgForm.preferredPincodes}
                          onChange={(pins) => setOrgForm(prev => ({ ...prev, preferredPincodes: pins }))}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Proposed Location *
                        </label>
                        <input
                          type="text"
                          required
                          name="proposedLocation"
                          value={orgForm.proposedLocation}
                          onChange={handleOrgChange}
                          placeholder="e.g. Near Town Hall"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Authorized Person & Verification Documents */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">badge</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Authorized Person & Verification
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Authorized Person *
                        </label>
                        <input
                          type="text"
                          required
                          name="contactName"
                          value={orgForm.contactName}
                          onChange={handleOrgChange}
                          placeholder="Full Name"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Designation *
                        </label>
                        <input
                          type="text"
                          required
                          name="contactDesignation"
                          value={orgForm.contactDesignation}
                          onChange={handleOrgChange}
                          placeholder="e.g. Director"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Mobile *
                        </label>
                        <input
                          type="tel"
                          required
                          name="contactPhone"
                          value={orgForm.contactPhone}
                          onChange={handleOrgChange}
                          placeholder="10-digit mobile"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          name="contactEmail"
                          value={orgForm.contactEmail}
                          onChange={handleOrgChange}
                          placeholder="person@email.com"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    {/* Compact File Uploads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="p-2 border border-slate-200 rounded bg-slate-50/60 text-[11px]">
                        <span className="font-semibold text-slate-700 block mb-0.5">Aadhaar Upload *</span>
                        <input
                          type="file"
                          name="aadharFile"
                          onChange={handleOrgChange}
                          accept=".pdf,image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>

                      <div className="p-2 border border-slate-200 rounded bg-slate-50/60 text-[11px]">
                        <span className="font-semibold text-slate-700 block mb-0.5">PAN Card Upload *</span>
                        <input
                          type="file"
                          name="panFile"
                          onChange={handleOrgChange}
                          accept=".pdf,image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>

                      <div className="p-2 border border-slate-200 rounded bg-slate-50/60 text-[11px]">
                        <span className="font-semibold text-slate-700 block mb-0.5">Reg Certificate</span>
                        <input
                          type="file"
                          name="regCertFile"
                          onChange={handleOrgChange}
                          accept=".pdf,image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>

                      <div className="p-2 border border-slate-200 rounded bg-slate-50/60 text-[11px]">
                        <span className="font-semibold text-slate-700 block mb-0.5">GST Certificate</span>
                        <input
                          type="file"
                          name="gstCertFile"
                          onChange={handleOrgChange}
                          accept=".pdf,image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Bank Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">account_balance</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Bank Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          required
                          name="bankName"
                          value={orgForm.bankName}
                          onChange={handleOrgChange}
                          placeholder="e.g. SBI, Federal Bank"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Account Holder *
                        </label>
                        <input
                          type="text"
                          required
                          name="accountHolder"
                          value={orgForm.accountHolder}
                          onChange={handleOrgChange}
                          placeholder="As in bank records"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          name="accountNumber"
                          value={orgForm.accountNumber}
                          onChange={handleOrgChange}
                          placeholder="Bank Account Number"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          required
                          name="ifscCode"
                          value={orgForm.ifscCode}
                          onChange={handleOrgChange}
                          placeholder="e.g. SBIN0001234"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 uppercase"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Branch Name *
                        </label>
                        <input
                          type="text"
                          required
                          name="branch"
                          value={orgForm.branch}
                          onChange={handleOrgChange}
                          placeholder="e.g. MG Road Branch, Kochi"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agreement & Submit */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <label className="flex items-start gap-2 cursor-pointer max-w-lg">
                      <input
                        type="checkbox"
                        required
                        name="agreed"
                        checked={orgForm.agreed}
                        onChange={handleOrgChange}
                        className="mt-0.5 text-deep-maroon focus:ring-deep-maroon cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] text-slate-600 leading-snug">
                        I confirm all details are authentic and agree to the{' '}
                        <Link
                          to="/franchise/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-deep-maroon font-semibold underline hover:text-primary transition-colors cursor-pointer"
                        >
                          Bharath Marriage franchise terms
                        </Link>.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-deep-maroon hover:bg-primary disabled:opacity-60 text-white text-[11px] font-semibold rounded-md shadow-xs transition-colors cursor-pointer shrink-0 self-end sm:self-auto flex items-center gap-1.5"
                    >
                      {isSubmitting && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                      <span>{isSubmitting ? 'Submitting Application...' : 'Submit Organization Form'}</span>
                    </button>
                  </div>
                </>
              )}

              {/* ========================================================= */}
              {/* INDIVIDUAL TAB */}
              {/* ========================================================= */}
              {activeTab === 'individual' && (
                <>
                  {/* Section 1: Personal Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">person</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Personal Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          name="fullName"
                          value={indForm.fullName}
                          onChange={handleIndChange}
                          placeholder="e.g. Suresh Kumar"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          name="dob"
                          value={indForm.dob}
                          onChange={handleIndChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Gender *
                        </label>
                        <div className="flex items-center gap-3 h-8">
                          {['Male', 'Female', 'Other'].map(g => (
                            <label key={g} className="flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="gender"
                                value={g}
                                checked={indForm.gender === g}
                                onChange={handleIndChange}
                                className="text-deep-maroon focus:ring-deep-maroon cursor-pointer"
                              />
                              {g}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Profile Photo
                        </label>
                        <input
                          type="file"
                          name="profilePhoto"
                          onChange={handleIndChange}
                          accept="image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Aadhaar Number *
                        </label>
                        <input
                          type="text"
                          required
                          name="aadharNumber"
                          maxLength="12"
                          value={indForm.aadharNumber}
                          onChange={handleIndChange}
                          placeholder="12-digit Aadhaar"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          PAN Number *
                        </label>
                        <input
                          type="text"
                          required
                          name="panNumber"
                          maxLength="10"
                          value={indForm.panNumber}
                          onChange={handleIndChange}
                          placeholder="10-digit PAN"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Occupation *
                        </label>
                        <input
                          type="text"
                          required
                          name="occupation"
                          value={indForm.occupation}
                          onChange={handleIndChange}
                          placeholder="e.g. Business / Service"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Educational Qualification *
                        </label>
                        <input
                          type="text"
                          required
                          name="education"
                          value={indForm.education}
                          onChange={handleIndChange}
                          placeholder="e.g. Graduate / Post Graduate"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">call</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Contact Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          name="mobileNumber"
                          value={indForm.mobileNumber}
                          onChange={handleIndChange}
                          placeholder="Primary mobile"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          name="whatsappNumber"
                          value={indForm.whatsappNumber}
                          onChange={handleIndChange}
                          placeholder="WhatsApp number"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          name="email"
                          value={indForm.email}
                          onChange={handleIndChange}
                          placeholder="name@email.com"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          State *
                        </label>
                        <select
                          name="state"
                          value={indForm.state}
                          onChange={handleIndChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="Kerala">Kerala</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          District *
                        </label>
                        <select
                          required
                          name="district"
                          value={indForm.district}
                          onChange={handleIndChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="">Select District</option>
                          {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* District-Linked Residential Pincode */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Residential Pincode *
                        </label>
                        {indForm.district && KERALA_DISTRICT_PINCODES[indForm.district] ? (
                          indForm.pincode === 'Other' ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                required
                                name="customPincode"
                                maxLength="6"
                                value={indForm.customPincode}
                                onChange={handleIndChange}
                                placeholder="6-digit pincode"
                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => setIndForm(prev => ({ ...prev, pincode: '', customPincode: '' }))}
                                className="px-2 h-8 text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                                title="Back to list"
                              >
                                List
                              </button>
                            </div>
                          ) : (
                            <select
                              required
                              name="pincode"
                              value={indForm.pincode}
                              onChange={handleIndChange}
                              className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                            >
                              <option value="">Select Pincode</option>
                              {KERALA_DISTRICT_PINCODES[indForm.district].map(pin => (
                                <option key={pin} value={pin}>{pin}</option>
                              ))}
                              <option value="Other">Other / Custom Pincode</option>
                            </select>
                          )
                        ) : (
                          <input
                            type="text"
                            required
                            name="pincode"
                            maxLength="6"
                            value={indForm.pincode}
                            onChange={handleIndChange}
                            placeholder={indForm.district ? "Enter pincode" : "Select District first"}
                            disabled={!indForm.district}
                            className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        )}
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Residential Address *
                        </label>
                        <input
                          type="text"
                          required
                          name="address"
                          value={indForm.address}
                          onChange={handleIndChange}
                          placeholder="House Name / Street Address"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Franchise & Location Preferences (Individual) */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">map</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Franchise Location Preferences
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Preferred District *
                        </label>
                        <select
                          required
                          name="preferredDistrict"
                          value={indForm.preferredDistrict}
                          onChange={handleIndChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        >
                          <option value="">Select District</option>
                          {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Landmark *
                        </label>
                        <input
                          type="text"
                          required
                          name="landmark"
                          value={indForm.landmark}
                          onChange={handleIndChange}
                          placeholder="e.g. Near Town Hall / Bus Stand"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      {/* MULTI-SELECT PREFERRED PINCODES (INDIVIDUAL) */}
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Preferred Pincode(s) *
                        </label>
                        <PincodeMultiSelect
                          district={indForm.preferredDistrict}
                          selectedPincodes={indForm.preferredPincodes}
                          onChange={(pins) => setIndForm(prev => ({ ...prev, preferredPincodes: pins }))}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Proposed Location *
                        </label>
                        <input
                          type="text"
                          required
                          name="proposedLocation"
                          value={indForm.proposedLocation}
                          onChange={handleIndChange}
                          placeholder="e.g. Near Town Hall"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Work & Experience Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">work</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Work & Experience
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Current Work Details *
                        </label>
                        <textarea
                          rows="2"
                          required
                          name="currentWork"
                          value={indForm.currentWork}
                          onChange={handleIndChange}
                          placeholder="Current employment or business role"
                          className="w-full p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Previous Experience (Matrimonial / Relational Expert)
                        </label>
                        <textarea
                          rows="2"
                          name="previousExperience"
                          value={indForm.previousExperience}
                          onChange={handleIndChange}
                          placeholder="Matchmaking or consultancy background"
                          className="w-full p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Expected Date to Start *
                        </label>
                        <input
                          type="date"
                          required
                          name="expectedStartDate"
                          value={indForm.expectedStartDate}
                          onChange={handleIndChange}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Documents & Bank Details */}
                  <div>
                    <div className="flex items-center gap-1.5 pb-1 mb-2.5 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-deep-maroon">folder_shared</span>
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Documents & Bank Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                      <div className="p-2 border border-slate-200 rounded bg-slate-50/60 text-[11px]">
                        <span className="font-semibold text-slate-700 block mb-0.5">Aadhaar Card Upload *</span>
                        <input
                          type="file"
                          name="aadharFile"
                          onChange={handleIndChange}
                          accept=".pdf,image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>

                      <div className="p-2 border border-slate-200 rounded bg-slate-50/60 text-[11px]">
                        <span className="font-semibold text-slate-700 block mb-0.5">PAN Card Upload *</span>
                        <input
                          type="file"
                          name="panFile"
                          onChange={handleIndChange}
                          accept=".pdf,image/*"
                          className="w-full text-[10px] text-slate-500 file:mr-1.5 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          required
                          name="bankName"
                          value={indForm.bankName}
                          onChange={handleIndChange}
                          placeholder="e.g. Federal Bank"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Account Holder *
                        </label>
                        <input
                          type="text"
                          required
                          name="accountHolder"
                          value={indForm.accountHolder}
                          onChange={handleIndChange}
                          placeholder="Full Name as in Bank"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          name="accountNumber"
                          value={indForm.accountNumber}
                          onChange={handleIndChange}
                          placeholder="Account Number"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          required
                          name="ifscCode"
                          value={indForm.ifscCode}
                          onChange={handleIndChange}
                          placeholder="e.g. FDRL0001234"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400 uppercase"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Branch Name *
                        </label>
                        <input
                          type="text"
                          required
                          name="branch"
                          value={indForm.branch}
                          onChange={handleIndChange}
                          placeholder="e.g. Aluva Branch"
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-deep-maroon focus:ring-1 focus:ring-deep-maroon bg-white text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agreement & Submit */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <label className="flex items-start gap-2 cursor-pointer max-w-lg">
                      <input
                        type="checkbox"
                        required
                        name="agreed"
                        checked={indForm.agreed}
                        onChange={handleIndChange}
                        className="mt-0.5 text-deep-maroon focus:ring-deep-maroon cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] text-slate-600 leading-snug">
                        I hereby confirm that all information provided is accurate and agree to{' '}
                        <Link
                          to="/franchise/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-deep-maroon font-semibold underline hover:text-primary transition-colors cursor-pointer"
                        >
                          Bharath Marriage franchise consultant terms
                        </Link>.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-deep-maroon hover:bg-primary disabled:opacity-60 text-white text-[11px] font-semibold rounded-md shadow-xs transition-colors cursor-pointer shrink-0 self-end sm:self-auto flex items-center gap-1.5"
                    >
                      {isSubmitting && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                      <span>{isSubmitting ? 'Submitting Application...' : 'Submit Individual Form'}</span>
                    </button>
                  </div>
                </>
              )}

            </form>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="mt-4 text-center text-[10px] text-slate-400">
          Bharath Marriage &copy; {new Date().getFullYear()} &middot; Regional Franchise Program
        </div>

      </div>
    </div>
  );
}
