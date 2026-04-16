// src/components/partner/PartnerLayout.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Partner {
  id: string;
  name: string;
  status: string;
  commission_rate: number;
}

interface PartnerLayoutProps {
  children: ReactNode;
}

export default function PartnerLayout({ children }: PartnerLayoutProps) {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadShop();
  }, []);

  const checkAuthAndLoadShop = async () => {
    try {
      // Check for partner session (custom auth)
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      
      if (!partnerSessionData) {
        navigate('/partner/login');
        return;
      }

      const session = JSON.parse(partnerSessionData);
      
      // Check if session has expired
      if (session.expiresAt) {
        const expiryDate = new Date(session.expiresAt);
        const now = new Date();
        
        if (now > expiryDate) {
          // Session expired, clear it
          localStorage.removeItem('partnerSession');
          sessionStorage.removeItem('partnerSession');
          navigate('/partner/login');
          return;
        }
      }

      const partnerId = session.partner?.id;
      
      if (!partnerId) {
        navigate('/partner/login');
        return;
      }

      // Get fresh partner data from database
      const { data: partnerRecord, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partnerRecord) {
        navigate('/partner/login');
        return;
      }

      setPartner(partnerRecord);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/partner/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('partnerSession');
    sessionStorage.removeItem('partnerSession');
    navigate('/partner/login');
  };

  if (loading) {
    return (
      <div className="bg-[#f5f8fc] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Partner Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-[#f5f8fc] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 mb-4">Partner not found</p>
          <button 
            onClick={() => navigate('/partner/login')}
            className="bg-[#1a558b] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#1a558b]/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if partner is suspended
  if (partner.status === 'suspended') {
    return (
      <div className="bg-[#f5f8fc] min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-red-600">block</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-6">
            Your account has been suspended and you cannot process transactions. Please contact the admin for more information.
          </p>
          <button 
            onClick={handleSignOut}
            className="bg-[#1a558b] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#1a558b]/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col" style={{ backgroundColor: '#f5f8fc' }}>
      <div className="layout-container flex h-full grow flex-col w-full">
        {/* Shop Header */}
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-10 py-3 md:py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Left: Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="+1 Rewards" className="h-8 md:h-10 w-auto object-contain" />
            </a>
            <div className="hidden sm:block h-6 md:h-8 w-px bg-gray-300"></div>
          </div>

          {/* Right: Portal label, online badge, sign out, avatar */}
          <div className="flex flex-1 justify-end items-center gap-2 md:gap-4 lg:gap-6">
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Partner Portal</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26, 85, 139, 0.1)', border: '1px solid rgba(26, 85, 139, 0.2)' }}>
                <span className="flex h-2 w-2 rounded-full bg-[#1a558b]"></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1a558b]">Online</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex min-w-[70px] md:min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-bold transition-all hover:opacity-90 text-white bg-[#1a558b]"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Exit</span>
            </button>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 md:size-10"
              style={{
                backgroundImage: `url("https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || 'P')}&background=1a558b&color=ffffff&size=128&bold=true")`,
                border: '2px solid rgba(26, 85, 139, 0.25)'
              }}
            ></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8 space-y-4 sm:space-y-6 md:space-y-8" style={{ paddingTop: '4rem', paddingBottom: '2rem' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                © 2026 +1 Rewards • Partner Portal
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}