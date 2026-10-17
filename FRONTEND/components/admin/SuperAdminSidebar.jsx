import React, { useState, useEffect } from 'react';

// Flat top-level links stay as-is. Items with `children` render as a
// collapsible group (e.g. "Admin Panel" holding Payments & Settings).
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'staff', label: 'Staff Management', icon: 'badge' },
  { id: 'users', label: 'Customer Management', icon: 'group' },
  { id: 'marriage-requests', label: 'Marriage Requests', icon: 'favorite' },
  { id: 'reports', label: 'Reported Profiles', icon: 'report' },
  { id: 'contacts', label: 'General Enquiries', icon: 'mark_email_unread' },
  { id: 'packages', label: 'Packages & Pricing', icon: 'inventory_2' },
  { id: 'franchise', label: 'Franchise Management', icon: 'storefront' },
  { id: 'franchise-requests', label: 'Franchise Requests', icon: 'handshake' },
  { id: 'head-franchise', label: 'Pincode Allocation', icon: 'pin_drop' },
  {
    id: 'admin-panel',
    label: 'Admin Panel',
    icon: 'admin_panel_settings',
    children: [
      { id: 'payments', label: 'Payments & Revenue', icon: 'payments' },
      { id: 'castes', label: 'Caste Management', icon: 'category' },
      { id: 'settings', label: 'System Settings', icon: 'settings' }
    ]
  }
];

export default function SuperAdminSidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isOpen,
  setIsOpen
}) {
  // Track which group(s) are expanded. Auto-expand a group if its child
  // is the active tab (e.g. on initial load or if navigated to directly).
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    MENU_ITEMS.forEach(item => {
      if (item.children) {
        initial[item.id] = item.children.some(child => child.id === activeTab);
      }
    });
    return initial;
  });

  useEffect(() => {
    MENU_ITEMS.forEach(item => {
      if (item.children && item.children.some(child => child.id === activeTab)) {
        setOpenGroups(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [activeTab]);

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
              <span className="font-display-lg font-bold text-xs sm:text-sm tracking-wide text-slate-800 uppercase">
                Control Desk
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
                supervisor_account
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">Super Admin</p>
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-heritage-gold/15 text-heritage-gold text-[7px] sm:text-[8px] font-bold tracking-wider uppercase mt-0.5 border border-heritage-gold/10">
                Full Access
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 sm:p-4 space-y-1">
            {MENU_ITEMS.map((item) => {
              // Group with children -> collapsible section
              if (item.children) {
                const isGroupOpen = !!openGroups[item.id];
                const hasActiveChild = item.children.some(child => child.id === activeTab);

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className={`w-full flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer text-left select-none ${
                        hasActiveChild
                          ? 'bg-deep-maroon/5 text-deep-maroon border border-deep-maroon/10'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-deep-maroon border border-transparent'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-base sm:text-lg leading-none ${hasActiveChild ? 'text-deep-maroon' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate flex-1">{item.label}</span>
                      <span
                        className={`material-symbols-outlined text-base leading-none transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Submenu */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isGroupOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="pl-4 sm:pl-5 space-y-1 border-l-2 border-slate-100 ml-4 sm:ml-5">
                        {item.children.map((child) => {
                          const isChildActive = activeTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                setActiveTab(child.id);
                                setIsOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer text-left select-none ${
                                isChildActive
                                  ? 'bg-deep-maroon text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-deep-maroon'
                              }`}
                            >
                              <span className={`material-symbols-outlined text-sm sm:text-base leading-none ${isChildActive ? 'text-white' : 'text-slate-400'}`}>
                                {child.icon}
                              </span>
                              <span className="truncate">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular top-level link
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
                      ? 'bg-deep-maroon text-white shadow-sm border border-deep-maroon/20' 
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

        {/* Footer Logout Button */}
        <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-white">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/40 rounded-lg text-[10px] sm:text-[11px] font-bold text-rose-700 transition-all cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-xs sm:text-sm">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}