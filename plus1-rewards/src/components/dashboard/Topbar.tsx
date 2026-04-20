// plus1-rewards/src/components/dashboard/Topbar.tsx
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../../lib/adminAuth';

interface TopbarProps {
  onRefresh?: () => void;
}

export default function Topbar({ onRefresh }: TopbarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear admin session
    adminAuth.logout();
    // Redirect to login page
    navigate('/admin/login', { replace: true });
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <header className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-6 lg:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight uppercase text-gray-900 truncate">Admin Control Center</h1>
          <p className="font-medium mt-0.5 md:mt-1 text-[#1a558b] text-[11px] md:text-xs lg:text-sm">Complete Platform Management</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1 md:gap-1.5 lg:gap-2 px-2.5 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 font-bold rounded-lg border transition-all text-[11px] md:text-xs lg:text-sm hover:bg-[#1a558b]/5 bg-white text-[#1a558b] border-[#1a558b]"
          >
            <span className="material-symbols-outlined text-sm md:text-base lg:text-lg">refresh</span>
            <span className="hidden sm:inline">Refresh All Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 md:gap-1.5 lg:gap-2 px-2.5 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-2.5 bg-[#1a558b] rounded-lg hover:bg-[#1a558b]/90 transition-all text-[11px] md:text-xs lg:text-sm text-white font-bold"
          >
            <span className="material-symbols-outlined text-sm md:text-base lg:text-lg">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
