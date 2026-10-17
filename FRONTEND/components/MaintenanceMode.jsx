import React from 'react';
import { useSettings } from '../src/context/SettingsContext';

export default function MaintenanceMode() {
  const { settings } = useSettings();

  return (
    <div className="fixed inset-0 z-[999999] bg-gradient-to-br from-slate-900 via-deep-maroon to-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in overflow-y-auto">
      {/* Glow background circles */}
      <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-96 h-96 bg-heritage-gold/15 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-6">
        {/* Maintenance Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-deep-maroon flex items-center justify-center shadow-xl shadow-amber-500/20">
          <span className="material-symbols-outlined text-3xl sm:text-4xl font-bold">engineering</span>
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
            System Maintenance In Progress
          </span>
          <h1 className="font-display-lg text-xl sm:text-3xl font-bold text-white leading-tight">
            {settings.siteName || 'Bharath Marriage'} is Under Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1 sm:pt-2">
            We are currently upgrading our platform to serve you better. Access to user features is temporarily paused. Please check back shortly!
          </p>
        </div>

        {/* Contact details */}
        <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left min-w-0">
            <span className="material-symbols-outlined text-heritage-gold text-lg shrink-0">mail</span>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Support Email</span>
              <a 
                href={`mailto:${settings.supportEmail}`} 
                className="font-semibold text-white hover:underline block text-[11px] sm:text-xs truncate"
                title={settings.supportEmail}
              >
                {settings.supportEmail}
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left min-w-0">
            <span className="material-symbols-outlined text-heritage-gold text-lg shrink-0">phone_in_talk</span>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Contact Helpline</span>
              <a 
                href={`tel:${settings.contactPhone}`} 
                className="font-semibold text-white hover:underline block text-[11px] sm:text-xs truncate"
                title={settings.contactPhone}
              >
                {settings.contactPhone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
