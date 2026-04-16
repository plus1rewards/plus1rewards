// plus1-rewards/src/components/dashboard/components/PageHeader.tsx
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onRefresh,
  showSearch = true,
  actions
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      {/* Top Action Bar */}
      <header className="flex flex-col gap-2 md:gap-3 lg:gap-4 p-3 md:p-6 lg:p-10 pb-3 md:pb-4 lg:pb-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3">
          {showSearch && onSearchChange ? (
            <div className="flex-1 max-w-2xl w-full">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base md:text-lg lg:text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 md:py-2 lg:py-2.5 pl-8 md:pl-9 lg:pl-10 pr-3 md:pr-4 text-xs md:text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                  placeholder={searchPlaceholder}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto">
            {actions}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-[11px] md:text-xs lg:text-sm"
              >
                <span className="material-symbols-outlined text-sm md:text-base lg:text-lg">refresh</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-[11px] md:text-xs lg:text-sm font-bold"
            >
              <span className="material-symbols-outlined text-sm md:text-base lg:text-lg">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Title Section */}
      <div className="px-3 md:px-6 lg:px-10 pt-4 md:pt-6 lg:pt-8 pb-3 md:pb-4 lg:pb-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">{title}</h2>
        <p className="text-xs md:text-sm lg:text-base text-gray-600 mt-0.5 md:mt-1">{description}</p>
      </div>
    </>
  );
}
