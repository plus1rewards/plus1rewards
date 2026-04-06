// src/components/partner/SupplierExpiryBanner.tsx
import { useSupplierExpiry } from '../../hooks/useSupplierExpiry';

interface SupplierExpiryBannerProps {
  partnerId: string;
  onClearExpired?: () => void;
}

export default function SupplierExpiryBanner({ partnerId, onClearExpired }: SupplierExpiryBannerProps) {
  const { daysRemaining, isExpired, canAddSuppliers, loading, clearExpiredSuppliers } = useSupplierExpiry(partnerId);

  if (loading || daysRemaining === -1) {
    return null;
  }

  const handleClearExpired = async () => {
    const success = await clearExpiredSuppliers();
    if (success && onClearExpired) {
      onClearExpired();
    }
  };

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600 text-xl">schedule</span>
          <div className="flex-1">
            <h4 className="text-red-800 font-semibold text-sm mb-1">Supplier Referrals Expired</h4>
            <p className="text-red-700 text-sm mb-3">
              Your supplier referrals have expired after 30 days. You can now add new suppliers.
            </p>
            <button
              onClick={handleClearExpired}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Clear Expired & Add New Suppliers
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-600 text-xl">warning</span>
          <div className="flex-1">
            <h4 className="text-orange-800 font-semibold text-sm mb-1">Supplier Referrals Expiring Soon</h4>
            <p className="text-orange-700 text-sm">
              Your supplier referrals will expire in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>. 
              After expiry, you'll be able to add new suppliers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (daysRemaining > 7) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
          <div className="flex-1">
            <h4 className="text-blue-800 font-semibold text-sm mb-1">Supplier Referrals Active</h4>
            <p className="text-blue-700 text-sm">
              Your supplier referrals are active for <strong>{daysRemaining} more days</strong>. 
              You can add new suppliers after they expire.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}