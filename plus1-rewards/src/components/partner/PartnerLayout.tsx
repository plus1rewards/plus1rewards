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
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#1a558b]/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#1a558b] text-2xl">storefront</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{partner.name}</h1>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-sm ${
                        partner.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {partner.status === 'active' ? 'check_circle' : 'schedule'}
                      </span>
                      <span className="text-gray-600">
                        Status: <span className="font-semibold text-gray-900">{partner.status?.toUpperCase()}</span>
                      </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-600">
                      Cashback Rate: <span className="font-semibold text-gray-900">{partner.cashback_percent || partner.commission_rate}%</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/partner/profile')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a558b] hover:bg-[#143f66] text-white rounded-lg font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">store</span>
                  <span className="hidden sm:inline">Shop Profile</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8" style={{ paddingTop: '5rem' }}>
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