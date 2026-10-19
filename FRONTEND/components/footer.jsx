import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../src/context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-[#12020a] border-t-2 border-heritage-gold/30 w-full py-12 md:py-16 text-slate-300">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-gutter pt-2">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
          <div>
            <div className="font-display-lg text-heritage-gold text-xl font-semibold mb-2">{settings.siteName}</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Connecting hearts across cultures since 1998. The most trusted name in Indian matrimony.
            </p>
          </div>
          

          <div className="flex items-center gap-2.5 pt-1">
            <a
              href="https://www.facebook.com/profile.php?id=61586582102974"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 border border-heritage-gold/20 flex items-center justify-center text-heritage-gold hover:bg-heritage-gold hover:text-[#12020a] hover:scale-105 transition-all shadow-2xs"
              title="Facebook"
              aria-label="Facebook"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/bharath_marriage_?stkn=NWlpZnEwdHk3d2tr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 border border-heritage-gold/20 flex items-center justify-center text-heritage-gold hover:bg-heritage-gold hover:text-[#12020a] hover:scale-105 transition-all shadow-2xs"
              title="Instagram"
              aria-label="Instagram"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 border border-heritage-gold/20 flex items-center justify-center text-heritage-gold hover:bg-heritage-gold hover:text-[#12020a] hover:scale-105 transition-all shadow-2xs"
              title="YouTube"
              aria-label="YouTube"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a
              href="https://whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 border border-heritage-gold/20 flex items-center justify-center text-heritage-gold hover:bg-heritage-gold hover:text-[#12020a] hover:scale-105 transition-all shadow-2xs"
              title="WhatsApp"
              aria-label="WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-heritage-gold text-[11px] font-bold tracking-wider mb-4 uppercase">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/success-stories">Success Stories</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/safety-tips">Safety Tips</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/search">Find Matches</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/packages">Membership Plans</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] italic transition-colors" to="/advertise">Advertise With Us</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-heritage-gold text-[11px] font-bold tracking-wider mb-4 uppercase">Support &amp; Legal</h4>
          <ul className="space-y-2">
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/contact-us">Contact Support</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/terms-of-use">Terms of Use</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/refund-policy">Refund &amp; Cancellation</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/disclaimer">Disclaimer</Link></li>
            <li><Link className="text-slate-400 hover:text-heritage-gold text-[11px] transition-colors" to="/cyber-security">Data Privacy &amp; Cyber Security Policy</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-heritage-gold text-[11px] font-bold tracking-wider mb-4 uppercase">Support Desk</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
            Our support desk is available to assist you with any questions or inquiries.
          </p>
          <a 
            href={`mailto:${settings.supportEmail}`} 
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-heritage-gold text-on-secondary-fixed hover:brightness-110 text-xs font-bold rounded-lg shadow-md transition-all active:scale-[0.98] duration-200"
          >
            <span className="material-symbols-outlined text-[15px] leading-none text-on-secondary-fixed font-bold">mail</span>
            <span className="text-on-secondary-fixed font-bold">{settings.supportEmail}</span>
          </a>
        </div>
      </div>
      
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-12 pt-6 border-t border-white/5 text-center">
        <p className="text-slate-500 text-[10px] tracking-wide">
          {settings.copyright}
        </p>
      </div>
    </footer>
  );
}
