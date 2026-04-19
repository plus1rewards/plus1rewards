import { useState } from 'react';

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

interface AnimatedPartnerCardProps {
  partner: Partner;
  onClick: (partnerId: string) => void;
}

export default function AnimatedPartnerCard({ partner, onClick }: AnimatedPartnerCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      pharmacy: '#10b981',
      grocery: '#f59e0b',
      restaurant: '#ef4444',
      retail: '#8b5cf6',
      default: '#6b7280'
    };
    return colors[category?.toLowerCase() as keyof typeof colors] || colors.default;
  };

  const getBadgeColor = (cashbackPercent: number) => {
    if (cashbackPercent >= 5) return '#f59e0b'; // Orange for high cashback
    if (cashbackPercent >= 4) return '#3b82f6'; // Blue for medium cashback
    return '#10b981'; // Green for standard cashback
  };

  const badgeColor = getBadgeColor(partner.cashback_percent);

  return (
    <div 
      className="animated-card"
      onClick={() => onClick(partner.id)}
    >
      <div className="card__shine"></div>
      <div className="card__glow"></div>
      <div className="card__content">
        <div className="card__badge" style={{ backgroundColor: badgeColor }}>
          {partner.cashback_percent > 3 ? `${Math.max(0, partner.cashback_percent - 2)}%` : 'NEW'}
        </div>
        
        <div 
          className="card__image"
          style={{ '--bg-color': getCategoryColor(partner.category) } as React.CSSProperties}
        >
          {partner.store_logo_url && !imageError ? (
            <img
              src={partner.store_logo_url}
              alt={partner.shop_name}
              className="w-full h-full object-cover"
              style={{ 
                width: '100%', 
                height: '100%',
                objectPosition: 'center'
              }}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">store</span>
            </div>
          )}
        </div>
        
        <div className="card__text">
          <p className="card__title">{partner.shop_name}</p>
          <p className="card__description">
            {partner.category || 'General Store'}
          </p>
          <p className="card__address">
            {partner.address.split(',').slice(0, 2).join(', ')}
          </p>
        </div>
        
        <div className="card__status">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="card__status-text">Active Partner</span>
          </div>
        </div>
        
        <div className="card__footer">
          <div className="card__price">{partner.cell_phone || 'No phone'}</div>
          <div className="card__button">
            <svg height="16" width="16" viewBox="0 0 24 24">
              <path
                strokeWidth="2"
                stroke="currentColor"
                d="M4 12H20M12 4V20"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}