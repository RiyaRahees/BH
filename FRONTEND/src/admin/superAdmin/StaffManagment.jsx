import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';

export const AVAILABLE_PERMISSIONS = [
  { id: 'users', label: 'Customer Management', icon: 'group', category: 'Profiles & Users' },
  { id: 'marriage-requests', label: 'Marriage Requests', icon: 'favorite', category: 'Profiles & Users' },
  { id: 'reports', label: 'Reported Profiles', icon: 'report', category: 'Profiles & Users' },
  { id: 'contacts', label: 'General Enquiries', icon: 'mark_email_unread', category: 'Profiles & Users' },
  { id: 'packages', label: 'Packages & Pricing', icon: 'inventory_2', category: 'Finance & Pricing' },
  { id: 'payments', label: 'Payments & Revenue', icon: 'payments', category: 'Finance & Pricing' },
  { id: 'franchise', label: 'Franchise Management', icon: 'storefront', category: 'Franchise Network' },
  { id: 'franchise-requests', label: 'Franchise Requests', icon: 'handshake', category: 'Franchise Network' },
  { id: 'head-franchise', label: 'Pincode Allocation', icon: 'pin_drop', category: 'Franchise Network' },
  { id: 'castes', label: 'Caste Management', icon: 'category', category: 'System & Admin' },
  { id: 'settings', label: 'System Settings', icon: 'settings', category: 'System & Admin' }
];

export const ROLE_PRESETS = [
  { 
    label: 'User Management Staff', 
    value: 'USER MANAGEMENT', 
    permissions: ['users', 'marriage-requests', 'reports', 'contacts', 'castes'] 
  },
  { 
    label: 'Finance & Package Staff', 
    value: 'FINANCE & PACKAGE', 
    permissions: ['packages', 'payments'] 
  },
  { 
    label: 'Franchise Network Manager', 
    value: 'FRANCHISE MANAGER', 
    permissions: ['franchise', 'franchise-requests', 'head-franchise'] 
  },
  { 
    label: 'Full Access Admin Staff', 
    value: 'FULL ACCESS ADMIN', 
    permissions: ['users', 'marriage-requests', 'reports', 'contacts', 'packages', 'payments', 'franchise', 'franchise-requests', 'head-franchise', 'castes', 'settings'] 
  }
];

export const formatTitleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function StaffManagment() {
  const [staffList, setStaffList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const staffRes = await axiosInstance.get('/admin/staff');
      const mappedStaff = staffRes.data.map(s => ({
        id: s.staff_id,
        name: formatTitleCase(s.name),
        role: s.role,
        permissions: s.permissions || [],
        email: s.email,
        phone: s.phone_number,
        status: s.account_status
      }));
      setStaffList(mappedStaff);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Dialog States
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '' });
  const [viewingPermissionsStaff, setViewingPermissionsStaff] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('USER MANAGEMENT');
  const [selectedPermissions, setSelectedPermissions] = useState(['users', 'marriage-requests', 'reports', 'contacts', 'castes']);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState({});

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingStaffId(null);
    setName('');
    setSelectedPreset('USER MANAGEMENT');
    setSelectedPermissions(['users', 'marriage-requests', 'reports', 'contacts', 'castes']);
    setEmail('');
    setPhone('');
    setStatus('active');
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setIsEditing(true);
    setEditingStaffId(staff.id);
    setName(staff.name);
    
    // Check if role matches one of the presets
    const matchedPreset = ROLE_PRESETS.find(p => p.value === staff.role);
    if (matchedPreset) {
      setSelectedPreset(matchedPreset.value);
    } else {
      setSelectedPreset('USER MANAGEMENT');
    }

    setSelectedPermissions(Array.isArray(staff.permissions) ? staff.permissions : []);
    setEmail(staff.email || '');
    setPhone(staff.phone ? String(staff.phone).replace(/\D/g, '').slice(0, 10) : '');
    setStatus(staff.status || 'active');
    setErrors({});
    setShowModal(true);
  };

  const handlePhoneChange = (e) => {
    // Strictly filter non-digits and cap at 10 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);

    if (!digitsOnly) {
      setErrors(prev => ({ ...prev, phone: 'Phone number is required.' }));
    } else if (digitsOnly.length < 10) {
      setErrors(prev => ({ ...prev, phone: `Must be exactly 10 digits (${digitsOnly.length}/10 entered).` }));
    } else if (!/^[6-9]/.test(digitsOnly)) {
      setErrors(prev => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9.' }));
    } else {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handlePresetChange = (presetValue) => {
    setSelectedPreset(presetValue);
    const preset = ROLE_PRESETS.find(p => p.value === presetValue);
    if (preset && preset.permissions.length > 0) {
      setSelectedPermissions([...preset.permissions]);
    }
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: '' }));
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermissions(prev => {
      const next = prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId];
      if (next.length > 0 && errors.permissions) {
        setErrors(err => ({ ...err, permissions: '' }));
      }
      return next;
    });
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.id));
    if (errors.permissions) setErrors(prev => ({ ...prev, permissions: '' }));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const validateForm = () => {
    const errs = {};

    // 1. Full Name Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s.]+$/.test(trimmedName)) {
      errs.name = 'Name should only contain alphabetic letters and spaces.';
    }

    // 2. Email Validation
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g. staff@example.com).';
    }

    // 3. Number Field (Phone Number) Validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      errs.phone = `Phone number must be exactly 10 digits (${cleanPhone.length}/10 entered).`;
    } else if (!/^[6-9]/.test(cleanPhone)) {
      errs.phone = 'Mobile number must start with 6, 7, 8, or 9.';
    }

    // 4. Permissions Validation
    if (selectedPermissions.length === 0) {
      errs.permissions = 'Please assign at least one feature permission for this staff member.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDeleteStaff = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Staff Member',
      message: 'Are you sure you want to remove this staff member? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/admin/staff/${id}`);
          fetchData();
        } catch (error) {
          console.error('Error deleting staff:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete staff member'
          });
        }
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    const finalRole = selectedPreset;
    const formattedName = formatTitleCase(name);

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await axiosInstance.put(`/admin/staff/${editingStaffId}`, {
          name: formattedName,
          role: finalRole,
          permissions: selectedPermissions,
          email: email.trim(),
          phone_number: phone.trim(),
          account_status: status,
          franchise: 'HEAD_OFFICE'
        });
      } else {
        await axiosInstance.post('/admin/staff', {
          name: formattedName,
          role: finalRole,
          permissions: selectedPermissions,
          email: email.trim(),
          phone_number: phone.trim(),
          account_status: status,
          franchise: 'HEAD_OFFICE'
        });
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving staff:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save staff member.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    );
  });

  const totalStaff = filteredStaff.length;
  const totalPages = Math.ceil(totalStaff / 10);
  const paginatedStaff = filteredStaff.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-deep-maroon">badge</span>
            Staff & Role Permissions Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create staff admin credentials and customize feature access permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-deep-maroon hover:bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer select-none active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        {/* Table Search & Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Staff Directory ({totalStaff})
          </span>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search staff by name, role, email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-3">Staff ID</th>
                <th className="py-3.5 px-3">Staff Name</th>
                <th className="py-3.5 px-3">Role Title</th>
                <th className="py-3.5 px-3">Assigned Permissions</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block">badge</span>
                    No staff members found.
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3 font-mono font-bold text-deep-maroon whitespace-nowrap align-middle">
                      {staff.id}
                    </td>
                    <td className="py-4 px-3 font-bold text-slate-800 align-middle whitespace-nowrap min-w-[140px] capitalize">
                      {formatTitleCase(staff.name)}
                    </td>
                    <td className="py-4 px-3 align-middle whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wide">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {staff.permissions?.length || 0} Modules
                        </span>
                        <button
                          onClick={() => setViewingPermissionsStaff(staff)}
                          className="text-[10px] font-bold text-deep-maroon hover:text-white bg-deep-maroon/10 hover:bg-deep-maroon px-3 py-1 rounded-full transition-colors cursor-pointer border border-deep-maroon/20"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-3 align-middle whitespace-nowrap">
                      <p className="text-slate-800 font-semibold">{staff.phone || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400">{staff.email}</p>
                    </td>
                    <td className="py-4 px-3 align-middle whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        staff.status === 'active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {staff.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-3 align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                          title="Edit Permissions & Details"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                          title="Delete Staff"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
            <span className="text-slate-500 font-semibold">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl relative z-10 animate-fade-in text-left max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-deep-maroon to-primary px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-heritage-gold text-xl">admin_panel_settings</span>
                <h3 className="font-bold text-sm sm:text-base tracking-wide uppercase">
                  {isEditing ? 'Edit Staff & Access Permissions' : 'Add New Staff Member & Roles'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Enter staff full name"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white text-slate-800 font-medium transition-colors ${
                      errors.name 
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-1 focus:ring-rose-400' 
                        : 'border-slate-200 focus:ring-1 focus:ring-deep-maroon'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Role Template / Preset <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white text-slate-800 font-semibold"
                  >
                    {ROLE_PRESETS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Granular Permission Toggles (Including Caste Management) */}
              <div className={`p-4 rounded-2xl border transition-colors space-y-3 ${
                errors.permissions 
                  ? 'bg-rose-50/30 border-rose-300' 
                  : 'bg-slate-50/80 border-slate-200/80'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Feature Access Permissions ({selectedPermissions.length} of {AVAILABLE_PERMISSIONS.length} Enabled)
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Select which modules this staff admin is allowed to see and manage on their sidebar.
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-[10px] font-bold text-deep-maroon hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {errors.permissions && (
                  <div className="p-2 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.permissions}
                  </div>
                )}

                {/* 2-Column Grid of Permissions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-deep-maroon/5 border-deep-maroon/30 text-deep-maroon font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by label onClick
                          className="rounded text-deep-maroon focus:ring-deep-maroon pointer-events-none"
                        />
                        <span className="material-symbols-outlined text-base text-deep-maroon">
                          {perm.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block text-[11px]">{perm.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="e.g. staff@bharathmarriage.com"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white text-slate-800 font-medium transition-colors ${
                      errors.email 
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-1 focus:ring-rose-400' 
                        : 'border-slate-200 focus:ring-1 focus:ring-deep-maroon'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* NUMBER FIELD: Phone Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] font-bold ${phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {phone.length}/10 digits
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={handlePhoneChange}
                      onKeyDown={(e) => {
                        // Allow control keys: backspace, delete, tab, arrows, enter
                        if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;
                        // Prevent all non-digit keys
                        if (!/^\d$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData || window.clipboardData).getData('text');
                        const digitsOnly = pasted.replace(/\D/g, '').slice(0, 10);
                        setPhone(digitsOnly);
                        if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
                          setErrors(prev => ({ ...prev, phone: '' }));
                        } else if (digitsOnly.length < 10) {
                          setErrors(prev => ({ ...prev, phone: `Must be exactly 10 digits (${digitsOnly.length}/10).` }));
                        }
                      }}
                      placeholder="9876543210"
                      className={`w-full bg-slate-50 border rounded-xl pl-11 pr-3 py-2 text-xs focus:outline-none focus:bg-white text-slate-800 font-semibold tracking-wider transition-colors ${
                        errors.phone 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-1 focus:ring-rose-400' 
                          : phone.length === 10 
                            ? 'border-emerald-300 focus:ring-1 focus:ring-emerald-500' 
                            : 'border-slate-200 focus:ring-1 focus:ring-deep-maroon'
                      }`}
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.phone}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">Enter 10-digit Indian mobile number (digits only)</p>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-deep-maroon focus:ring-deep-maroon"
                    />
                    <span className="font-semibold text-emerald-700">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-deep-maroon focus:ring-deep-maroon"
                    />
                    <span className="font-semibold text-rose-700">Inactive / Suspended</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-deep-maroon hover:bg-primary text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      {isEditing ? 'Update Staff Member' : 'Register Staff'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 text-left">
            <h3 className="text-base font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 mb-5">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 text-left">
            <h3 className="text-base font-bold text-slate-800 mb-2">{alertDialog.title}</h3>
            <p className="text-xs text-slate-600 mb-5">{alertDialog.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertDialog({ isOpen: false, title: '', message: '' })}
                className="px-4 py-1.5 bg-deep-maroon text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {viewingPermissionsStaff && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            onClick={() => setViewingPermissionsStaff(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm relative z-10 animate-fade-in flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-deep-maroon text-lg">admin_panel_settings</span>
                Assigned Permissions
              </h3>
              <button
                onClick={() => setViewingPermissionsStaff(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="mb-4">
                <p className="text-xs text-slate-500">Staff Member</p>
                <p className="text-sm font-bold text-slate-800 capitalize">{formatTitleCase(viewingPermissionsStaff.name)}</p>
                <p className="text-[10px] font-bold text-deep-maroon bg-deep-maroon/10 inline-block px-2 py-0.5 rounded uppercase mt-1">
                  {viewingPermissionsStaff.role}
                </p>
              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Granted Modules</p>
              <div className="flex flex-col gap-2">
                {viewingPermissionsStaff.permissions && viewingPermissionsStaff.permissions.length > 0 ? (
                  viewingPermissionsStaff.permissions.map(pId => {
                    const perm = AVAILABLE_PERMISSIONS.find(p => p.id === pId);
                    return (
                      <div key={pId} className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-deep-maroon/10 text-deep-maroon flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[15px]">{perm?.icon || 'check'}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{perm ? perm.label : pId}</p>
                          <p className="text-[10px] text-slate-500">{perm?.category || 'General'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">No specific permissions granted.</p>
                )}
              </div>
            </div>
            
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewingPermissionsStaff(null)}
                className="px-4 py-2 bg-deep-maroon hover:bg-primary text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}