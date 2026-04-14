// plus1-rewards/src/components/landing/PartnerCarousel.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import AnimatedPartnerCard from './AnimatedPartnerCard';

const BLUE = '#1a558b';

interface Partner {
  id: string;
  shop_name: string;
  category: string;
  address: string;
  cashback_percent: number;
  status: string;
  store_logo_url?: string;
  phone?: string;
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
        .select('id, shop_name, category, address, cashback_percent, status, store_logo_url, cell_phone')
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
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, partners.length - 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, partners.length - 3)) % Math.max(1, partners.length - 3));
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
    <section className="py-20 px-6 lg:px-20 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.span 
            className="inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
            style={{ backgroundColor: '#e0f2fe', color: BLUE }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
          >
            Partner Stores
          </motion.span>
          <motion.h2 
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Shop at Our Partners
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Discover local businesses where you can earn cashback toward your medical cover. Every purchase brings you closer to full coverage.
          </motion.p>
        </motion.div>

        {/* Carousel */}
        <motion.div 
          className="relative overflow-visible" 
          style={{ minHeight: '400px', paddingTop: '50px', paddingBottom: '50px' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {/* Navigation Buttons */}
          {partners.length > 4 && (
            <>
              <motion.button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
                style={{ color: BLUE }}
                whileHover={{ scale: 1.1, x: -5, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </motion.button>
              <motion.button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
                style={{ color: BLUE }}
                whileHover={{ scale: 1.1, x: 5, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </motion.button>
            </>
          )}

          {/* Partner Cards */}
          <div className="overflow-hidden relative px-4" style={{ minHeight: '300px', paddingTop: '30px', paddingBottom: '30px' }}>
            {/* Left fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            {/* Right fade effect */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
            
            <motion.div 
              className="flex gap-4 justify-center"
              animate={{ 
                x: `-${currentIndex * (100 / 4)}%`
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              style={{ 
                width: `${Math.max(100, (partners.length / 4) * 100)}%`,
                paddingLeft: '15px',
                paddingRight: '5px'
              }}
            >
              <AnimatePresence mode="popLayout">
                {partners.map((partner, index) => (
                  <motion.div
                    key={partner.id}
                    className="flex-shrink-0 flex justify-center"
                    style={{ width: `${100 / Math.max(4, partners.length)}%` }}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                    transition={{ 
                      duration: 0.5,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      zIndex: 10,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <AnimatedPartnerCard
                      partner={partner}
                      onClick={handlePartnerClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>

        {/* View All Button */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => navigate('/find-partners')}
            className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
            style={{ backgroundColor: BLUE }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: '0 20px 40px rgba(26, 85, 139, 0.3)',
              y: -5
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.span 
              className="material-symbols-outlined"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              store
            </motion.span>
            View All Partner Stores
            <motion.span 
              className="material-symbols-outlined"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              arrow_forward
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Dots Indicator */}
        {partners.length > 4 && (
          <motion.div 
            className="flex justify-center gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {Array.from({ length: Math.max(1, partners.length - 3) }).map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors`}
                style={{
                  backgroundColor: index === currentIndex ? '#2563eb' : '#d1d5db'
                }}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  width: index === currentIndex ? '24px' : '8px',
                  backgroundColor: index === currentIndex ? '#2563eb' : '#d1d5db'
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}