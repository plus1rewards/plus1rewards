import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import { encodePartnerQR } from '../lib/config';

interface Partner { 
  id: string; 
  shop_name: string; 
  cashback_percent: number; 
  status: 'active' | 'suspended' | 'pending';
  phone: string;
  user_id: string;
}
interface Agent {
  id: string;
  full_name: string;
  mobile_number: string;
}
interface Transaction { 
  id: string; 
  member_id: string; 
  purchase_amount: number; 
  member_amount: number;
  agent_amount: number;
  system_amount: number;
  created_at: string; 
  member_name?: string;
}

export function PartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);
  const [monthlyCashbackLiability, setMonthlyCashbackLiability] = useState(0);

  useEffect(() => { 
    loadPartnerData(); 
  }, []);

  const loadPartnerData = async () => {
    setLoading(true);
    try {
      // Check for partner session
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      if (!partnerSessionData) { 
        navigate('/partner/login'); 
        return; 
      }
      
      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id;
      
      if (!partnerId) {
        navigate('/partner/login');
        return;
      }
      
      // Load partner details
      const { data: partnerDetails } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (partnerDetails) {
        setPartner(partnerDetails);

        // Load assigned agent
        console.log('Loading agent for partner:', partnerId);
        const { data: agentLink, error: linkError } = await supabase
          .from('partner_agent_links')
          .select('agent_id')
          .eq('partner_id', partnerId)
          .eq('status', 'active')
          .single();

        console.log('Agent link query result:', { agentLink, linkError });

        if (linkError) {
          console.error('Error fetching agent link:', linkError);
        }

        if (agentLink?.agent_id) {
          console.log('Found agent link, fetching agent data for:', agentLink.agent_id);
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('id, full_name, mobile_number')
            .eq('id', agentLink.agent_id)
            .single();

          console.log('Agent data query result:', { agentData, agentError });

          if (agentError) {
            console.error('Error fetching agent data:', agentError);
          }

          if (agentData) {
            console.log('Setting agent:', agentData);
            setAgent({
              id: agentData.id,
              full_name: agentData.full_name,
              mobile_number: agentData.mobile_number
            });
          } else {
            console.log('No agent data returned');
          }
        } else {
          console.log('No agent link found for partner:', partnerId, 'Error:', linkError);
        }

        // Load this month's transactions
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // e.g., "2026-03"
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        
        const { data: monthlyTransactions, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('partner_id', partnerId)
          .gte('created_at', `${currentMonth}-01T00:00:00Z`)
          .lt('created_at', nextMonth);

        if (txError) {
          console.error('Error loading monthly transactions:', txError);
        }

        if (monthlyTransactions) {
          console.log('Monthly transactions loaded:', monthlyTransactions.length);
          setMonthlyTransactionCount(monthlyTransactions.length);
          
          // Calculate total cashback liability (what partner owes)
          const totalLiability = monthlyTransactions.reduce((sum, t) => {
            const purchaseAmount = parseFloat(t.purchase_amount) || 0;
            const cashbackPercent = parseFloat(t.cashback_percent) || 0;
            return sum + (purchaseAmount * cashbackPercent / 100);
          }, 0);
          setMonthlyCashbackLiability(totalLiability);
        }

        // Load recent transactions (last 5)
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (transactions) {
          const memberIds = [...new Set(transactions.map(t => t.member_id))];
          if (memberIds.length > 0) {
            const { data: members } = await supabase
              .from('members')
              .select('id, full_name')
              .in('id', memberIds);
            
            const memberMap = new Map(members?.map(m => [m.id, m.full_name]) || []);
            setRecentTransactions(transactions.map(t => ({ 
              ...t, 
              member_name: memberMap.get(t.member_id) || 'Unknown' 
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('partnerSession');
    localStorage.removeItem('partnerSession');
    navigate('/partner/login');
  };

  if (loading) return (
    <div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--blue-light)', borderTopColor: 'var(--blue)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--gray-text)' }}>Loading Partner Dashboard...</p>
    </div>
  );

  const isSuspended = partner?.status === 'suspended';

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>Partner Dashboard</h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Welcome back, {partner?.shop_name}</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Status Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--blue)' }}>check_circle</span>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-text)', margin: 0 }}>Account Status</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: isSuspended ? '#f59e0b' : '#10b981', margin: 0 }}>
                  {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-text)', margin: 0 }}>{partner?.phone}</p>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-text)', margin: '0 0 0.25rem' }}>Cashback Rate: {partner?.cashback_percent}%</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="stat-card">
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--blue)', marginBottom: '0.5rem' }}>receipt</span>
              <p className="stat-value" style={{ color: 'var(--blue)' }}>{monthlyTransactionCount}</p>
              <p className="stat-label">This Month's Transactions</p>
            </div>
            <div className="stat-card">
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>payments</span>
              <p className="stat-value" style={{ color: '#f59e0b' }}>R{monthlyCashbackLiability.toFixed(2)}</p>
              <p className="stat-label">Cashback Liability</p>
            </div>
            <div className="stat-card">
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#10b981', marginBottom: '0.5rem' }}>support_agent</span>
              <p className="stat-value" style={{ color: '#10b981', fontSize: '1rem' }}>{agent ? agent.full_name : 'Not assigned'}</p>
              <p className="stat-label">Assigned Agent</p>
              {agent && <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', marginTop: '0.25rem' }}>{agent.mobile_number}</p>}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <h2 className="section-title">Recent Transactions</h2>
            {recentTransactions.length === 0 ? (
              <p style={{ color: 'var(--gray-light)', textAlign: 'center', padding: '2rem 0' }}>No transactions yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {recentTransactions.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#fafbff', border: '1px solid var(--gray-border)', borderRadius: '10px' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 2px', fontSize: '0.9375rem' }}>{tx.member_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', margin: 0 }}>
                        {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--green-dark)', margin: '0 0 2px' }}>+R{(parseFloat(tx.member_amount) || 0).toFixed(2)}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', margin: 0 }}>Purchase: R{(parseFloat(tx.purchase_amount) || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid var(--gray-border)', padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--gray-light)', fontSize: '0.8125rem' }}>© 2026 +1 Rewards · Partner Portal</p>
      </footer>
    </div>
  );
}
