import React from 'react';

export const ALL_STAFF_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'users', label: 'Customer Management', icon: 'group' },
  { id: 'marriage-requests', label: 'Marriage Requests', icon: 'favorite' },
  { id: 'reports', label: 'Reported Profiles', icon: 'report' },
  { id: 'contacts', label: 'General Enquiries', icon: 'mark_email_unread' },
  { id: 'packages', label: 'Packages & Pricing', icon: 'inventory_2' },
  { id: 'franchise', label: 'Franchise Management', icon: 'storefront' },
  { id: 'franchise-requests', label: 'Franchise Requests', icon: 'handshake' },
  { id: 'head-franchise', label: 'Pincode Allocation', icon: 'pin_drop' },
  { id: 'payments', label: 'Payments & Revenue', icon: 'payments' },
  { id: 'castes', label: 'Caste Management', icon: 'category' },
  { id: 'settings', label: 'System Settings', icon: 'settings' }
];

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isOpen,
  setIsOpen,
  role,
  name,
  permissions = []
}) {
  // Parse permissions from props or localStorage
  let userPerms = permissions;
  if (!userPerms || userPerms.length === 0) {
    try {
      const stored = localStorage.getItem('adminPermissions');
      if (stored) userPerms = JSON.parse(stored);
    } catch {
      userPerms = [];
    }
  }

  // Filter menu items by permissions
  const menuItems = ALL_STAFF_MODULES.filter(item => {
    if (item.id === 'dashboard') return true;
    if (userPerms && Array.isArray(userPerms) && userPerms.length > 0) {
      return userPerms.includes(item.id);
    }
    // Fallback based on legacy role string
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper.includes('FINANCE')) {
      return ['packages', 'payments'].includes(item.id);
    }
    if (roleUpper.includes('FRANCHISE')) {
      return ['franchise', 'franchise-requests', 'head-franchise'].includes(item.id);
    }
    if (roleUpper.includes('FULL') || roleUpper.includes('SUPER') || roleUpper.includes('ALL')) {
      return true;
    }
    return ['users', 'reports', 'contacts'].includes(item.id);
  });

  const staffName = name || localStorage.getItem('adminName') || 'Staff Admin';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-60 sm:w-64 flex flex-col justify-between z-40 transform lg:transform-none transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Scrollable Container for Navigation & Profile */}
        <div className="overflow-y-auto flex-1 scrollbar-hidden">
          {/* Top Branding Section */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-deep-maroon text-xl sm:text-2xl font-bold">
                admin_panel_settings
              </span>
              <span className="font-bold text-xs sm:text-sm tracking-wider text-slate-800 uppercase">
                Staff Desk
              </span>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Profile Mini Card */}
          <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-deep-maroon/5 flex items-center justify-center border-2 border-deep-maroon/10 shrink-0">
              <span className="material-symbols-outlined text-deep-maroon text-lg sm:text-xl">
                badge
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate" title={staffName}>
                {staffName}
              </p>
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[7px] sm:text-[8px] font-bold tracking-wider uppercase mt-0.5 border border-slate-200 truncate max-w-[130px]" title={role}>
                {role || 'Staff Member'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 sm:p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false); // Auto close sidebar on mobile
                  }}
                  className={`w-full flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer text-left select-none ${
                    isActive 
                      ? 'bg-deep-maroon text-white shadow-xs border border-deep-maroon/20' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-deep-maroon border border-transparent'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base sm:text-lg leading-none ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
