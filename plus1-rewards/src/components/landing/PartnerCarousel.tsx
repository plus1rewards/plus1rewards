// plus1-rewards/src/components/landing/PartnerCarousel.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const BLUE = '#1a558b';

interface Partner {
  id: string;
  shop_name: string;
  category: string;
  address: string;
  cashback_percent: number;
  status: string;
  store_logo_url?: string;
}

export default function PartnerCarousel() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, shop_name, category, address, cashback_percent, status, store_logo_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, partners.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, partners.length - 2)) % Math.max(1, partners.length - 2));
  };

  const handlePartnerClick = (partnerId: string) => {
    // Navigate to find-partner page with the selected partner highlighted
    navigate(`/find-partner?highlight=${partnerId}`);
  };

  if (loading) {
    return (
      <section className="py-20 px-6 lg:px-20 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading partner stores...</p>
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return null; // Don't show section if no partners
  }

  return (
    <section className="py-20 px-6 lg:px-20 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span 
            className="inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
            style={{ backgroundColor: '#e0f2fe', color: BLUE }}
          >
            Partner Stores
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Shop at Our Partners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover local businesses where you can earn cashback toward your medical cover. Every purchase brings you closer to full coverage.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {partners.length > 3 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ color: BLUE }}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ color: BLUE }}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}

          {/* Partner Cards */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out gap-6"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / 3)}%)`,
                width: `${Math.max(100, (partners.length / 3) * 100)}%`
              }}
            >
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  style={{ width: `${100 / Math.max(3, partners.length)}%` }}
                  onClick={() => handlePartnerClick(partner.id)}
                >
                  {/* Partner Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {partner.shop_name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {partner.category || 'General Store'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {/* Partner Logo */}
                        {partner.store_logo_url && (
                          <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                            <img
                              src={partner.store_logo_url}
                              alt={partner.shop_name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {/* Member Cashback Percentage */}
                        <div 
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
                          style={{ backgroundColor: '#e0f2fe', color: BLUE }}
                        >
                          <span className="material-symbols-outlined text-sm">percent</span>
                          {Math.max(0, partner.cashback_percent - 2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="truncate">{partner.address}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-semibold">Active Partner</span>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-600 transition-colors">
                        arrow_forward
                      </span>
                    </div>
                  </div>

                  {/* Cashback Info */}
                  <div 
                    className="px-6 py-4 border-t border-gray-100"
                    style={{ backgroundColor: '#f8fafc' }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Earn cashback on every purchase</span>
                      <span className="font-bold" style={{ color: BLUE }}>
                        Up to {Math.max(0, partner.cashback_percent - 2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/find-partners')}
            className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg"
            style={{ backgroundColor: BLUE }}
          >
            <span className="material-symbols-outlined">store</span>
            View All Partner Stores
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        {/* Dots Indicator */}
        {partners.length > 3 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.max(1, partners.length - 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}