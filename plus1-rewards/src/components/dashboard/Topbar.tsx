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
    <header className="flex flex-col gap-4 mb-6 md:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight uppercase text-gray-900">Admin Control Center</h1>
          <p className="font-medium mt-1 text-[#1a558b] text-sm md:text-base">Complete Platform Management</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 font-bold rounded-lg border transition-all text-xs md:text-sm hover:bg-[#1a558b]/5 bg-white text-[#1a558b] border-[#1a558b]"
          >
            <span className="material-symbols-outlined text-base md:text-lg">refresh</span>
            <span className="hidden sm:inline">Refresh All Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-[#1a558b] rounded-lg hover:bg-[#1a558b]/90 transition-all text-xs md:text-sm text-white font-bold"
          >
            <span className="material-symbols-outlined text-base md:text-lg">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
          
          <div className="size-9 md:size-11 rounded-full border-2 border-[#1a558b] p-0.5 ml-1 md:ml-2 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-cover bg-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBZTVGWF5d9bUsTI1U_LA3u4Y-VW_tV7rVaCbr2bBcopKZ6aUEHak7Ad9ln4DGdmBcA4N_9IKOEwo_ZTgYugg0o3iWvRKoqrWDyBrw7mtjHatTwJ33VZI6nS8OIhyQl1DNFVnLMy5g9mboPCvWqWHPBke7YtYx4A7Ny8R8SF3z24w7nM33LYsSZVYbQQMyEhfI9bUKhfbdf6UBFROSXG5deW8I1Twmv3QDRJbOGQADi06UdXRXlEIqzBN95vQGSGpy4mn-lBnbfZr0r')"}}></div>
          </div>
        </div>
      </div>
    </header>
  );
}
