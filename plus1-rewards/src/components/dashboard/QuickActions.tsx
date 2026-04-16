// plus1-rewards/src/components/dashboard/QuickActions.tsx
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch (action) {
      case 'invoices':
        navigate('/admin/invoices');
        break;
      case 'suspensions':
        navigate('/admin/partners');
        break;
      case 'payouts':
        navigate('/admin/commissions');
        break;
      case 'export':
        navigate('/admin/exports');
        break;
      case 'providers':
        navigate('/admin/providers');
        break;
      case 'policies':
        navigate('/admin/settings');
        break;
      case 'transactions':
        navigate('/admin/transactions');
        break;
      case 'members':
        navigate('/admin/members');
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <span className="material-symbols-outlined text-[#1a558b] text-lg md:text-xl">bolt</span>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-2 md:gap-3">
        <button 
          onClick={() => handleAction('invoices')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">receipt</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Generate Invoices</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Bulk process billing</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('suspensions')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">block</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Manage Partners</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Handle suspensions &amp; status</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('payouts')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">paid</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Agent Commissions</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Process commission payouts</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('export')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">ios_share</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Export System Data</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">CSV/Excel system export</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('providers')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">corporate_fare</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Policy Providers</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Edit insurance partners</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('policies')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">settings_suggest</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Policy Management</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Configuration &amp; pricing</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('transactions')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">monitoring</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Transactions</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Real-time flow audit</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
        
        <button 
          onClick={() => handleAction('members')}
          className="flex items-center justify-between w-full p-3 md:p-4 bg-white rounded-lg md:rounded-xl hover:border-[#1a558b] transition-all group text-left border border-gray-200" 
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="size-8 md:size-10 flex items-center justify-center rounded-lg bg-[#1a558b]/10 text-[#1a558b] group-hover:bg-[#1a558b] group-hover:text-white transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-base md:text-lg">person_search</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs md:text-sm text-gray-900">Members</p>
              <p className="text-[10px] md:text-[11px] text-gray-600">Profiles &amp; rewards history</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#1a558b] transition-all text-base md:text-lg flex-shrink-0">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
