import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { COUNTRY_CODES } from '../utils/countryCodes';
import axiosInstance from '../utils/axiosInstance';
import { useSettings } from '../context/SettingsContext';

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

export default function Contact() {
  const { settings } = useSettings();
  const supportEmail = settings?.supportEmail || 'support@bharathmarriage.com';
  const contactPhone = settings?.contactPhone || '+91 98450 12345';

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'franchise'
  const [copiedEmail, setCopiedEmail] = useState(false);

  // General Contact State
  const [generalSubmitted, setGeneralSubmitted] = useState(false);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [generalErrors, setGeneralErrors] = useState({});
  const [generalForm, setGeneralForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  // Franchise Request State
  const [franchiseForm, setFranchiseForm] = useState({ name: '', email: '', phone: '', district: '', pincode: '', customPincode: '', message: '' });
  const [isCustomPincode, setIsCustomPincode] = useState(false);

  const [generalCountryCode, setGeneralCountryCode] = useState('+91');
  const [franchiseCountryCode, setFranchiseCountryCode] = useState('+91');
  const [franchiseSubmitted, setFranchiseSubmitted] = useState(false);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [franchiseError, setFranchiseError] = useState('');
  const [franchiseErrors, setFranchiseErrors] = useState({});

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(supportEmail);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = supportEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleGeneralChange = (e) => {
    let { name, value } = e.target;
    if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 15);
    }
    setGeneralForm(prev => ({ ...prev, [name]: value }));
    if (generalErrors[name]) {
      setGeneralErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFranchiseChange = (e) => {
    let { name, value } = e.target;
    if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 15);
    }
    if (name === 'customPincode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }
    setFranchiseForm(prev => ({ ...prev, [name]: value }));
    if (franchiseErrors[name]) {
      setFranchiseErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateGeneralForm = () => {
    const errors = {};
    const nameTrim = generalForm.name.trim();
    if (!nameTrim) {
      errors.name = 'Full name is required';
    } else if (nameTrim.length < 3) {
      errors.name = 'Full name must be at least 3 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrim)) {
      errors.name = 'Full name should contain letters only';
    }

    const emailTrim = generalForm.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailTrim) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(emailTrim)) {
      errors.email = 'Please enter a valid email address';
    }

    const phoneTrim = generalForm.phone.trim();
    if (phoneTrim && !/^\d{8,15}$/.test(phoneTrim)) {
      errors.phone = 'Please enter a valid phone number (8-15 digits)';
    }

    if (!generalForm.subject || generalForm.subject.trim() === '') {
      errors.subject = 'Please select an enquiry topic';
    }

    const msgTrim = generalForm.message.trim();
    if (!msgTrim) {
      errors.message = 'Please enter your message';
    } else if (msgTrim.length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    setGeneralErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateFranchiseForm = () => {
    const errors = {};
    const nameTrim = franchiseForm.name.trim();
    if (!nameTrim) {
      errors.name = 'Full name is required';
    } else if (nameTrim.length < 3) {
      errors.name = 'Full name must be at least 3 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrim)) {
      errors.name = 'Full name should contain letters only';
    }

    const phoneTrim = franchiseForm.phone.trim();
    if (!phoneTrim) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{8,15}$/.test(phoneTrim)) {
      errors.phone = 'Please enter a valid mobile number (8-15 digits)';
    }

    const emailTrim = franchiseForm.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailTrim) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(emailTrim)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!franchiseForm.district || franchiseForm.district.trim() === '') {
      errors.district = 'Please select a district';
    }

    const pincodeVal = isCustomPincode ? franchiseForm.customPincode : franchiseForm.pincode;
    if (!pincodeVal || pincodeVal.trim() === '' || pincodeVal.trim() === 'OTHER') {
      errors.pincode = 'Please select or enter a pin code';
    } else if (!/^\d{6}$/.test(pincodeVal.trim())) {
      errors.pincode = 'Pin code must be exactly 6 digits';
    }

    setFranchiseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    if (!validateGeneralForm()) return;
    try {
      setGeneralLoading(true);
      setGeneralError('');
      await axiosInstance.post('/public/contact', {
        ...generalForm,
        phone: `${generalCountryCode} ${generalForm.phone}`.trim()
      });
      setGeneralSubmitted(true);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setGeneralError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleFranchiseSubmit = async (e) => {
    e.preventDefault();
    if (!validateFranchiseForm()) return;
    try {
      setFranchiseLoading(true);
      setFranchiseError('');
      const finalPincode = isCustomPincode ? franchiseForm.customPincode : franchiseForm.pincode;
      await axiosInstance.post('/public/franchise-request', {
        name: franchiseForm.name,
        email: franchiseForm.email,
        phone: `${franchiseCountryCode} ${franchiseForm.phone}`.trim(),
        district: franchiseForm.district,
        pincode: finalPincode,
        message: franchiseForm.message
      });
      setFranchiseSubmitted(true);
    } catch (err) {
      console.error('Error submitting franchise request:', err);
      setFranchiseError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setFranchiseLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#fbfaf9]">
      <Helmet>
        <title>Contact Bharath Marriage | Kerala Matrimony Service</title>
        <meta
          name="description"
          content="Contact Bharath Marriage for profile registration, membership plans, and trusted matrimonial assistance in Kerala."
        />
      </Helmet>

      {/* ── HERO BANNER ── */}
      <section className="relative bg-gradient-to-br from-primary via-deep-maroon to-[#6b0030] pt-28 pb-14 md:pt-36 md:pb-16 overflow-hidden">
        {/* Decorative background dots */}
        <div className="absolute inset-0 opacity-10 hero-pattern pointer-events-none" />
        {/* Soft glow blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-heritage-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 font-label-caps text-[10px] tracking-[0.2em] text-heritage-gold font-semibold uppercase mb-5">
            <span className="w-8 h-px bg-heritage-gold/50" />
            Get In Touch
            <span className="w-8 h-px bg-heritage-gold/50" />
          </span>

          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4">
            We're Here To <span className="text-heritage-gold">Help You</span>
          </h1>

          <p className="max-w-xl mx-auto text-white/70 text-sm leading-relaxed">
            Questions about your membership, profile verification, or finding the right match?
            Our support team is always ready to assist you.
          </p>
        </div>
      </section>

      {/* ── FORM + TRUST PANEL ── */}
      <section className="py-14 md:py-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-start">

          {/* Contact Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
            
            {/* Enhanced Contact Email Header */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3.5 bg-gradient-to-r from-slate-50 via-rose-50/20 to-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[16px] sm:text-[20px]">mail</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Official Support Email</p>
                  </div>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-deep-maroon text-[14px] sm:text-[15px] font-bold hover:underline whitespace-nowrap block mt-0.5 leading-tight tracking-tight sm:tracking-normal"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy email address"
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    copiedEmail
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-deep-maroon'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedEmail ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Form header strip with Tabs */}
            <div className="bg-gradient-to-r from-primary to-deep-maroon px-4 py-3 flex items-end">
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-3 px-2 rounded-t-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'general' ? 'bg-white text-deep-maroon shadow-sm' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  General Enquiry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('franchise')}
                  className={`flex-1 py-3 px-2 rounded-t-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
                    activeTab === 'franchise' ? 'bg-white text-deep-maroon shadow-sm' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm sm:text-base hidden sm:inline-block">storefront</span>
                  Franchise Enquiry
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 relative min-h-[400px]">
              {/* --- GENERAL CONTACT TAB --- */}
              {activeTab === 'general' && (
                <div className="animate-fade-in">
                  {generalSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-[32px] text-emerald-500">check_circle</span>
                      </div>
                      <h3 className="font-semibold text-charcoal-text text-lg mb-1">Message Sent!</h3>
                      <p className="text-soft-gray text-sm">We'll get back to you within 24 hours.</p>
                      <button
                        onClick={() => { setGeneralSubmitted(false); setGeneralForm({ name: '', email: '', phone: '', subject: '', message: '' }); setGeneralErrors({}); }}
                        className="mt-6 text-deep-maroon text-xs font-semibold hover:underline cursor-pointer"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleGeneralSubmit} noValidate className="space-y-4">
                      {generalError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                          {generalError}
                        </div>
                      )}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Full Name *
                          </label>
                          <input
                            name="name"
                            value={generalForm.name}
                            onChange={handleGeneralChange}
                            placeholder="e.g. Ananya Menon"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text placeholder-slate-300 focus:outline-none transition-all ${
                              generalErrors.name
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          />
                          {generalErrors.name && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {generalErrors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Email Address *
                          </label>
                          <input
                            name="email"
                            type="email"
                            value={generalForm.email}
                            onChange={handleGeneralChange}
                            placeholder="you@example.com"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text placeholder-slate-300 focus:outline-none transition-all ${
                              generalErrors.email
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          />
                          {generalErrors.email && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {generalErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Phone Number
                          </label>
                          <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${
                            generalErrors.phone
                              ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200'
                              : 'border-slate-200 focus-within:ring-2 focus-within:ring-deep-maroon/30 focus-within:border-deep-maroon'
                          }`}>
                            <select
                              value={generalCountryCode}
                              onChange={(e) => setGeneralCountryCode(e.target.value)}
                              className="bg-slate-50 border-r border-slate-200 text-slate-700 text-xs py-2.5 px-2 font-semibold focus:outline-none cursor-pointer"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                              ))}
                            </select>
                            <input
                              name="phone"
                              type="tel"
                              maxLength="15"
                              value={generalForm.phone}
                              onChange={handleGeneralChange}
                              placeholder="9876543210"
                              className="w-full px-3 py-2 text-sm text-charcoal-text placeholder-slate-300 focus:outline-none bg-transparent border-none"
                            />
                          </div>
                          {generalErrors.phone && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {generalErrors.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Subject *
                          </label>
                          <select
                            name="subject"
                            value={generalForm.subject}
                            onChange={handleGeneralChange}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text focus:outline-none transition-all cursor-pointer ${
                              generalErrors.subject
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          >
                            <option value="">Select a topic</option>
                            <option value="Account / Login Help">Account / Login Help</option>
                            <option value="Profile Verification">Profile Verification</option>
                            <option value="Membership & Plans">Membership & Plans</option>
                            <option value="Privacy & Safety">Privacy & Safety</option>
                            <option value="Finding Matches">Finding Matches</option>
                            <option value="Other Enquiries">Other Enquiries</option>
                          </select>
                          {generalErrors.subject && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {generalErrors.subject}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Your Message *
                        </label>
                        <textarea
                          name="message"
                          value={generalForm.message}
                          onChange={handleGeneralChange}
                          rows={4}
                          placeholder="Tell us how we can help you…"
                          className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text placeholder-slate-300 resize-none focus:outline-none transition-all ${
                            generalErrors.message
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                          }`}
                        />
                        {generalErrors.message && (
                          <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">error</span>
                            {generalErrors.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={generalLoading}
                        className="w-full bg-deep-maroon hover:bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generalLoading ? 'Sending...' : 'Send Message'}
                        <span className="material-symbols-outlined text-[18px] leading-none">send</span>
                      </button>

                      <p className="text-center text-[10px] text-slate-400 mt-2">
                        We respect your privacy. Your data will never be shared.
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* --- FRANCHISE REQUEST TAB --- */}
              {activeTab === 'franchise' && (
                <div className="animate-fade-in">
                  {franchiseSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4 shadow-xs">
                        <span className="material-symbols-outlined text-[32px] text-emerald-500">check_circle</span>
                      </div>
                      <h3 className="font-semibold text-charcoal-text text-lg mb-1.5">Request Submitted Successfully!</h3>
                      <p className="text-slate-600 text-xs sm:text-sm mb-2 max-w-md leading-relaxed">
                        Thank you for your interest in becoming a Bharath Marriage franchise partner. A confirmation email with your application reference has been sent to your email.
                      </p>
                      <p className="text-deep-maroon font-semibold text-xs mb-4 bg-rose-50/80 px-3 py-1.5 rounded-lg border border-rose-100">
                        Our franchise relations team will review your application and contact you soon.
                      </p>
                      <button
                        onClick={() => {
                          setFranchiseSubmitted(false);
                          setFranchiseForm({ name: '', email: '', phone: '', district: '', pincode: '', customPincode: '', message: '' });
                          setFranchiseErrors({});
                          setIsCustomPincode(false);
                        }}
                        className="mt-2 px-6 py-2.5 bg-deep-maroon text-white font-bold text-xs rounded-xl hover:bg-primary transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFranchiseSubmit} noValidate className="space-y-4">
                      {franchiseError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                          {franchiseError}
                        </div>
                      )}
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Full Name *
                          </label>
                          <input
                            name="name"
                            value={franchiseForm.name}
                            onChange={handleFranchiseChange}
                            placeholder="e.g. Rahul Nair"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text placeholder-slate-300 focus:outline-none transition-all ${
                              franchiseErrors.name
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          />
                          {franchiseErrors.name && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {franchiseErrors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Phone Number *
                          </label>
                          <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${
                            franchiseErrors.phone
                              ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200'
                              : 'border-slate-200 focus-within:ring-2 focus-within:ring-deep-maroon/30 focus-within:border-deep-maroon'
                          }`}>
                            <select
                              value={franchiseCountryCode}
                              onChange={(e) => setFranchiseCountryCode(e.target.value)}
                              className="bg-slate-50 border-r border-slate-200 text-slate-700 text-xs py-2.5 px-2 font-semibold focus:outline-none cursor-pointer"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                              ))}
                            </select>
                            <input
                              name="phone"
                              type="tel"
                              maxLength="15"
                              value={franchiseForm.phone}
                              onChange={handleFranchiseChange}
                              placeholder="9876543210"
                              className="w-full px-3 py-2 text-sm text-charcoal-text placeholder-slate-300 focus:outline-none bg-transparent border-none"
                            />
                          </div>
                          {franchiseErrors.phone && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {franchiseErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Email Address *
                          </label>
                          <input
                            name="email"
                            type="email"
                            value={franchiseForm.email}
                            onChange={handleFranchiseChange}
                            placeholder="you@example.com"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text placeholder-slate-300 focus:outline-none transition-all ${
                              franchiseErrors.email
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          />
                          {franchiseErrors.email && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {franchiseErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                            District *
                          </label>
                          <select
                            value={franchiseForm.district}
                            onChange={(e) => {
                              const dist = e.target.value;
                              setFranchiseForm({ ...franchiseForm, district: dist, pincode: '', customPincode: '' });
                              setFranchiseErrors(prev => ({ ...prev, district: '', pincode: '' }));
                              setIsCustomPincode(false);
                            }}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text bg-white focus:outline-none cursor-pointer ${
                              franchiseErrors.district
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          >
                            <option value="">Select District</option>
                            {Object.keys(KERALA_DISTRICT_PINCODES).map((dist) => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                          {franchiseErrors.district && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {franchiseErrors.district}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                            Pin Code *
                          </label>
                          <select
                            disabled={!franchiseForm.district}
                            value={isCustomPincode ? 'OTHER' : franchiseForm.pincode}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'OTHER') {
                                setIsCustomPincode(true);
                                setFranchiseForm({ ...franchiseForm, pincode: 'OTHER' });
                              } else {
                                setIsCustomPincode(false);
                                setFranchiseForm({ ...franchiseForm, pincode: val, customPincode: '' });
                              }
                              setFranchiseErrors(prev => ({ ...prev, pincode: '' }));
                            }}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text bg-white focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed ${
                              franchiseErrors.pincode
                                ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                            }`}
                          >
                            <option value="">
                              {franchiseForm.district ? 'Select Pin Code' : 'Select District First'}
                            </option>
                            {franchiseForm.district &&
                              (KERALA_DISTRICT_PINCODES[franchiseForm.district] || []).map((code) => (
                                <option key={code} value={code}>{code}</option>
                              ))}
                            {franchiseForm.district && (
                              <option value="OTHER">Other / Enter Custom Pincode...</option>
                            )}
                          </select>

                          {isCustomPincode && (
                            <input
                              type="text"
                              name="customPincode"
                              value={franchiseForm.customPincode}
                              onChange={handleFranchiseChange}
                              placeholder="Type 6-digit Pincode"
                              className={`mt-3 w-full border rounded-lg px-3 py-2.5 text-sm text-charcoal-text bg-white focus:outline-none ${
                                franchiseErrors.pincode
                                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                                  : 'border-slate-200 focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon'
                              }`}
                            />
                          )}
                          {franchiseErrors.pincode && (
                            <p className="text-rose-600 text-[11px] font-medium mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              {franchiseErrors.pincode}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Additional Message (Optional)
                        </label>
                        <textarea
                          name="message"
                          value={franchiseForm.message}
                          onChange={handleFranchiseChange}
                          rows={3}
                          placeholder="Tell us about your background or inquiry..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-charcoal-text placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-deep-maroon/30 focus:border-deep-maroon transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={franchiseLoading}
                        className="w-full bg-deep-maroon hover:bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {franchiseLoading ? 'Submitting...' : 'Submit Partnership Request'}
                        <span className="material-symbols-outlined text-[18px] leading-none">handshake</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — Trust & Info panel */}
          <div className="flex flex-col gap-5 pt-0 lg:pt-2">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-heritage-gold font-semibold">
                WHY REACH OUT?
              </span>
              <h2 className="font-display-lg text-2xl md:text-3xl text-charcoal-text mt-2 mb-3 leading-tight">
                Dedicated Support<br />For Every Step
              </h2>
              <p className="text-soft-gray text-sm leading-relaxed">
                Whether you need help with your account, profile verification,
                membership plans, or finding the perfect match — our team
                responds quickly and with care.
              </p>
            </div>

            {/* Trust items */}
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: 'verified_user',
                  color: 'text-deep-maroon',
                  bg: 'bg-deep-maroon/8',
                  title: 'Safe & Verified',
                  desc: 'Every profile goes through a manual verification process.',
                },
                {
                  icon: 'support_agent',
                  color: 'text-heritage-gold',
                  bg: 'bg-heritage-gold/10',
                  title: 'Expert Support',
                  desc: 'Dedicated relationship counsellors available 6 days a week.',
                },
                {
                  icon: 'lock',
                  color: 'text-deep-maroon',
                  bg: 'bg-deep-maroon/8',
                  title: '100% Privacy',
                  desc: 'Your contact details are hidden until you choose to reveal them.',
                },
                {
                  icon: 'favorite',
                  color: 'text-heritage-gold',
                  bg: 'bg-heritage-gold/10',
                  title: 'Trusted Matchmaking',
                  desc: 'Thousands of families have found matches through us.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow duration-300"
                >
                  <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-text text-sm">{item.title}</h4>
                    <p className="text-soft-gray text-xs leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}

              {/* Advertise With Us Card Callout */}
              <div className="mt-2 p-5 rounded-2xl bg-gradient-to-br from-[#1f0412] via-[#2c081a] to-[#12020a] border border-heritage-gold/40 text-white shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-heritage-gold bg-heritage-gold/15 px-2 py-0.5 rounded">
                    Business Opportunity
                  </span>
                  <span className="material-symbols-outlined text-lg text-heritage-gold">campaign</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Want to Advertise With Us?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Showcase your wedding hall, bridal boutique, jewellery, or photography directly to thousands of verified Kerala families.
                </p>
                <Link
                  to="/advertise"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-heritage-gold via-amber-400 to-amber-500 hover:brightness-110 text-[#12020a] font-bold text-xs rounded-xl transition-all shadow"
                >
                  <span>View Ad Plans & Book Slot</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 md:py-18 bg-white border-t border-slate-100 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-label-caps text-[10px] tracking-widest text-heritage-gold font-semibold">
              QUICK ANSWERS
            </span>
            <h2 className="font-display-lg text-2xl md:text-3xl text-charcoal-text mt-2">
              Common Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                q: 'Are all profiles on Bharath Marriage verified?',
                a: 'Yes. Every profile undergoes a manual review. Verified profiles are marked with a green badge so you can trust the information.',
              },
              {
                q: 'How do I contact a match?',
                a: 'Once you express interest and they accept, you can exchange contact details through our secure messaging system.',
              },
              {
                q: 'Can I hide my photos from everyone?',
                a: 'Absolutely. You control who can see your photos. Navigate to Privacy Settings in your dashboard to manage this.',
              },
              {
                q: 'What are the membership plan options?',
                a: 'We offer Free, Silver, and Gold plans. Premium plans unlock unlimited message requests, phone number visibility, and priority listing.',
              },
              {
                q: 'How do I delete my account?',
                a: 'You can permanently delete your account from Settings → Account → Delete Account. All your data will be removed within 48 hours.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group py-4 cursor-pointer list-none"
              >
                <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-charcoal-text select-none list-none">
                  {item.q}
                  <span className="material-symbols-outlined text-[18px] text-deep-maroon shrink-0 group-open:rotate-180 transition-transform duration-200">
                    keyboard_arrow_down
                  </span>
                </summary>
                <p className="mt-2.5 text-soft-gray text-sm leading-relaxed pr-8">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative bg-gradient-to-r from-primary to-deep-maroon py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 hero-pattern pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-heritage-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <span className="font-label-caps text-[10px] tracking-widest text-heritage-gold font-semibold block mb-3">
            JOIN BHARATH MARRIAGE
          </span>
          <h2 className="font-display-lg text-2xl md:text-4xl text-white mb-4 leading-tight">
            Ready To Begin Your Journey?
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Join thousands of families who found meaningful relationships built
            on trust, compatibility, and shared values.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/login"
              className="bg-white text-deep-maroon font-semibold text-sm px-7 py-3 rounded-xl hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Register Free
            </Link>
            <Link
              to="/search"
              className="border border-white/30 text-white font-semibold text-sm px-7 py-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              Browse Profiles
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}