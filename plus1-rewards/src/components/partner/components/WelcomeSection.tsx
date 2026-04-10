// src/components/shop/components/WelcomeSection.tsx
import { useNavigate } from 'react-router-dom';

interface WelcomeSectionProps {
  shopName?: string;
  partnerId?: string;
}

export default function WelcomeSection({ shopName = 'Partner', partnerId }: WelcomeSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-gray-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Welcome back, {shopName}</p>
        <div className="flex items-center gap-2">
          <span className="text-[#1a568b] text-sm font-medium px-2 py-0.5 bg-[#1a568b]/10 rounded border border-[#1a568b]/30">Shop ID: {partnerId?.substring(0, 8).toUpperCase() || 'N/A'}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/partner/transaction-history')}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          title="View all transactions"
        >
          <span className="material-symbols-outlined text-sm">history</span>
          Transaction History
        </button>
        <button
          onClick={() => navigate('/partner/statement')}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#1a568b] border border-[#1a568b] rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors shadow-sm"
          title="View monthly statement"
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          My Statement
        </button>
      </div>
    </div>
  );
}
