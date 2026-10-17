import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ isOpen, onClose, requiredPlan, featureName }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    navigate('/packages');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-charcoal-text/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header styling */}
        <div className="bg-gradient-to-r from-heritage-gold/20 to-deep-maroon/10 p-6 flex flex-col items-center border-b border-heritage-gold/30">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3 border border-heritage-gold/40">
            <span className="material-symbols-outlined text-4xl text-heritage-gold">workspace_premium</span>
          </div>
          <h2 className="text-2xl font-display-lg font-bold text-deep-maroon text-center">Premium Feature</h2>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <p className="text-charcoal-text text-sm font-medium">
            You need a <span className="font-bold text-deep-maroon">{requiredPlan}</span> plan or higher to unlock <span className="font-bold">"{featureName}"</span>.
          </p>
          <p className="text-soft-gray text-xs leading-relaxed">
            Upgrade your package to connect with this profile, view contact details, and unlock all premium features of Bharath Marriage!
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-charcoal-text hover:bg-slate-100 transition-colors font-bold text-sm w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgradeClick}
            className="px-5 py-2.5 rounded-xl bg-deep-maroon hover:bg-primary text-white transition-all shadow-md active:scale-95 flex justify-center items-center gap-2 font-bold text-sm w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            View Packages
          </button>
        </div>
      </div>
    </div>
  );
}
