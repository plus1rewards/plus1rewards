import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';
import { Notification, useNotification } from '../components/Notification';

interface Partner {
  id: string;
  name: string;
  commission_rate: number;
  status: 'active' | 'suspended';
  phone?: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  qr_code: string;
}

export function MemberFindPartners() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [shops, setShops] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [connectedPartnerIds, setconnectedPartnerIds] = useState<Set<string>>(new Set());
  const [requestingShopId, setRequestingShopId] = useState<string | null>(null);
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  useEffect(() => { 
    loadMemberAndShops(); 
  }, []);

  const loadMemberAndShops = async () => {
    setLoading(true);
    try {
      const session = getSession();
      
      if (!session || !session.user) { 
        navigate('/member/login'); 
        return; 
      }

      console.log('Loading member and shops for:', session.user.id);

      // Load member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, phone, qr_code')
        .eq('id', session.user.id)
        .single();
      
      if (memberError) {
        console.error('Member error:', memberError);
      }
      
      if (memberData) {
        setMember({
          id: memberData.id,
          name: memberData.full_name,
          phone: memberData.phone,
          qr_code: memberData.qr_code
        });
      }

      // Get all active shops
      console.log('Fetching active partners...');
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('id, shop_name, cashback_percent, status, phone')
        .eq('status', 'active')
        .order('shop_name');

      console.log('Partners query result:', { partnersData, partnersError });

      if (partnersData) {
        // Map to expected interface format
        const mappedPartners = partnersData.map(p => ({
          id: p.id,
          name: p.shop_name,
          commission_rate: Number(p.cashback_percent),
          status: p.status as 'active' | 'suspended',
          phone: p.phone
        }));
        console.log('Mapped partners:', mappedPartners);
        setShops(mappedPartners);
      }

      // Get member's already-connected shop IDs from member_partner_connections table
      console.log('Fetching member-partner connections...');
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('member_partner_connections')
        .select('partner_id')
        .eq('member_id', session.user.id)
        .eq('status', 'active');

      console.log('Connections query result:', { connectionsData, connectionsError });

      if (connectionsData && connectionsData.length > 0) {
        // Extract unique partner IDs from connections
        const connectedIds = new Set(connectionsData.map(conn => conn.partner_id));
        console.log('Connected partner IDs:', Array.from(connectedIds));
        setconnectedPartnerIds(connectedIds);
      } else {
        setconnectedPartnerIds(new Set());
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally { 
      setLoading(false); 
    }
  };

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const memberEarns = (rate: number) => Math.max(rate - 2, 1);

  const handleConnectToShop = async (partnerId: string, partnerName: string) => {
    if (!member) return;
    
    try {
      setRequestingShopId(partnerId);

      // Create connection in member_partner_connections table
      const { error: connectionError } = await supabase
        .from('member_partner_connections')
        .insert({
          member_id: member.id,
          partner_id: partnerId,
          status: 'active'
        });

      if (connectionError) {
        // Check if already connected
        if (connectionError.code === '23505') { // Unique constraint violation
          showSuccess(
            'Already Connected!',
            `You're already connected to ${partnerName}. Visit their store to start earning cashback!`
          );
        } else {
          throw connectionError;
        }
      } else {
        showSuccess(
          'Connected Successfully!',
          `You're now connected to ${partnerName}! Visit their store and make a purchase to start earning cashback rewards. Show your QR code at checkout.`
        );
      }
      
      // Add to connected list immediately
      setconnectedPartnerIds(prev => new Set([...prev, partnerId]));
      
    } catch (err: any) {
      console.error('Error connecting to partner:', err);
      showError(
        'Connection Error',
        'Failed to connect to partner. Please try again.'
      );
    } finally {
      setRequestingShopId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f5f8fc] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <MemberLayout 
      member={member}
      isOnline={navigator.onLine}
      pendingTransactions={0}
      onSignOut={() => supabase.auth.signOut().then(() => navigate('/member/login'))}
    >
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Partner Shops</h1>
          <p className="text-gray-600">{shops.length} active shops in your area</p>
        </div>
        <button 
          onClick={() => navigate('/member/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input
            type="text" 
            placeholder="Search partners by name..."
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="member-input-override w-full bg-[#f5f8fc] border-2 border-[#1a558b] rounded-lg pl-12 pr-12 py-4 text-gray-900 placeholder:text-gray-400 text-lg focus:outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        {search && (
          <p className="text-gray-600 text-sm mt-3">
            {filtered.length} Partner{filtered.length !== 1 ? 's' : ''} found for "{search}"
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#1a558b]/10 to-[#1a558b]/5 border border-[#1a558b]/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-1">Ready to Shop?</h3>
            <p className="text-gray-700">Show your QR code at any partner store to earn cashback</p>
          </div>
          <button 
            onClick={() => navigate('/member/qr')}
            className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">qr_code</span>
            Show My QR Code
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1a558b]/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1a558b] text-xl">store</span>
            </div>
            <div>
              <p className="text-gray-900 font-bold text-2xl">{shops.length}</p>
              <p className="text-gray-600 text-sm">Active Shops</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-xl">link</span>
            </div>
            <div>
              <p className="text-gray-900 font-bold text-2xl">{connectedPartnerIds.size}</p>
              <p className="text-gray-600 text-sm">Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {search ? `Search Results (${filtered.length})` : 'All Partner Businesses'}
            </h2>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading partners...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-gray-400 text-2xl">store</span>
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-2">
              {search ? 'No partners match your search' : 'No active partners yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {search ? 'Try a different search term or browse all partners' : 'Check back later for new partner businesses'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Show All Shops
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filtered.map((partner) => {
              const isConnected = connectedPartnerIds.has(partner.id);
              const isRequesting = requestingShopId === partner.id;
              const earns = memberEarns(partner.commission_rate);
              
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

              const badgeColor = getBadgeColor(partner.commission_rate);
              
              return (
                <div key={partner.id} className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  {/* Badge */}
                  <div 
                    className="absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-bold z-10"
                    style={{ backgroundColor: badgeColor }}
                  >
                    {partner.commission_rate > 3 ? `${earns}%` : 'NEW'}
                  </div>
                  
                  {/* Connected Badge */}
                  {isConnected && (
                    <div className="absolute top-4 left-4 bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase z-10">
                      ✓ Connected
                    </div>
                  )}
                  
                  {/* Image/Icon Section */}
                  <div 
                    className="h-32 flex items-center justify-center relative"
                    style={{ backgroundColor: getCategoryColor('default') + '20' }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1a558b]/20 to-[#1a558b]/10 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#1a558b] text-2xl">storefront</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-gray-900 font-bold text-lg mb-1">{partner.name}</h3>
                      <p className="text-gray-600 text-sm capitalize">General Store</p>
                      <p className="text-gray-500 text-xs mt-1">Location not specified</p>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 text-xs font-bold uppercase">Active Partner</span>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600 text-sm">
                        {partner.phone || 'No phone'}
                      </div>
                      
                      {/* Action Button */}
                      {isConnected ? (
                        <div className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-xs font-bold">
                          Ready to earn
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnectToShop(partner.id, partner.name)}
                          disabled={isRequesting}
                          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {isRequesting ? (
                            <>
                              <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-xs">add</span>
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
