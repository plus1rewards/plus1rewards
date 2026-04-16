import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '../lib/supabase';

interface Transaction {
  id: string;
  purchase_amount: number;
  cashback_percent: number;
  member_amount: number;
  agent_amount: number;
  system_amount: number;
  created_at: string;
  members: { cell_phone: string } | null;
}

function fmt(v: number) {
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function maskPhone(p: string) {
  const d = p.replace(/\D/g, '');
  return d.length === 10 ? `+27 ${d[1]}** *** ${d.slice(7)}` : '***';
}

export default function PartnerStatement() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
    if (!data) { 
      navigate('/partner/login'); 
      return; 
    }
    const parsedSession = JSON.parse(data);
    // Extract the partner object from the session
    setPartner(parsedSession.partner || parsedSession);
  }, [navigate]);

  useEffect(() => {
    if (!partner || !partner.id) {
      return;
    }
    loadStatement();
  }, [partner, selectedMonth]);

  const loadStatement = async () => {
    if (!partner || !partner.id) {
      return;
    }
    
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      // Start of the month in UTC
      const startDate = `${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`;
      // Start of next month (exclusive upper bound) in UTC
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`;

      // Fetch invoices
      const { data: inv, error: invError } = await supabaseAdmin
        .from('partner_invoices')
        .select('*')
        .eq('partner_id', partner.id)
        .eq('invoice_month', selectedMonth)
        .maybeSingle();

      // Fetch transactions - simplified query
      const { data: tx, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('id, purchase_amount, cashback_percent, member_amount, agent_amount, system_amount, created_at, member_id')
        .eq('partner_id', partner.id)
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .lt('created_at', nextMonthStart)
        .order('created_at', { ascending: false });

      // Fetch invoice list
      const { data: invoiceList, error: invoiceListError } = await supabaseAdmin
        .from('partner_invoices')
        .select('invoice_month')
        .eq('partner_id', partner.id)
        .order('invoice_month', { ascending: false });

      // Fetch member details if we have transactions
      let transactionsWithMembers = tx || [];
      if (transactionsWithMembers.length > 0) {
        const memberIds = [...new Set(transactionsWithMembers.map((t: any) => t.member_id).filter(Boolean))];
        const { data: membersData } = await supabaseAdmin
          .from('members')
          .select('id, cell_phone')
          .in('id', memberIds);
        
        const membersMap = new Map(membersData?.map(m => [m.id, m]) || []);
        transactionsWithMembers = transactionsWithMembers.map((t: any) => ({
          ...t,
          members: membersMap.get(t.member_id) || null
        }));
      }

      setInvoice(inv);
      setTransactions(transactionsWithMembers as Transaction[]);
      if (invoiceList?.length) setAvailableMonths(invoiceList.map((i: any) => i.invoice_month));
    } catch (error) {
      console.error('Error loading statement:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = transactions.reduce((s, t) => s + parseFloat(String(t.purchase_amount)), 0);
  const memberRewards = transactions.reduce((s, t) => s + parseFloat(String(t.member_amount)), 0);
  const agentCommission = transactions.reduce((s, t) => s + parseFloat(String(t.agent_amount)), 0);
  const platformFee = transactions.reduce((s, t) => s + parseFloat(String(t.system_amount)), 0);
  const totalCashback = memberRewards + agentCommission + platformFee;
  const totalDue = invoice ? parseFloat(invoice.total_amount) : totalCashback;
  const dueDate = invoice ? new Date(invoice.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const ref = `PLUS1-${(partner?.shop_name || '').replace(/\s+/g, '').toUpperCase().substring(0, 8)}-${selectedMonth}`;

  return (
    <div className="page-wrapper min-h-screen bg-gray-50">
      <header className="page-header bg-gradient-to-r from-[#1a558b] to-[#2563eb] sticky top-0 z-50 shadow-lg">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button 
              onClick={() => navigate('/partner/dashboard')} 
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <span className="material-symbols-outlined text-white text-xl sm:text-2xl">arrow_back</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)', fontWeight: 800, margin: 0, color: 'white' }}>📊 Monthly Statement</h1>
              <p style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.8125rem)', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }} className="truncate">{partner?.shop_name}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/partner/dashboard')} 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-semibold text-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: 'clamp(1rem, 3vw, 1.5rem) clamp(0.75rem, 2vw, 1rem)', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(0.875rem, 2.5vw, 1.25rem)' }}>

          {/* Month Selector */}
          <div className="card" style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.25rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', fontWeight: 700, color: '#374151' }}>Statement Period</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.375rem 0.75rem', fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', color: '#111827', background: '#f9fafb', minWidth: '140px' }}
              >
                {/* Always show current month */}
                {!availableMonths.includes(selectedMonth) && (
                  <option value={selectedMonth}>{selectedMonth} (Current)</option>
                )}
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {invoice && (
                <span style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', background: invoice.status === 'paid' ? '#dcfce7' : new Date(invoice.due_date) < new Date() ? '#fee2e2' : '#fef9c3', color: invoice.status === 'paid' ? '#166534' : new Date(invoice.due_date) < new Date() ? '#991b1b' : '#854d0e' }}>
                  {invoice.status === 'paid' ? '✓ Paid' : new Date(invoice.due_date) < new Date() ? 'Overdue' : 'Pending'}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dce8f5', borderTopColor: '#1a568b', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#6b7280' }}>Loading statement...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="card">
                <h2 style={{ fontSize: 'clamp(0.9375rem, 2.5vw, 1rem)', fontWeight: 800, color: '#1a568b', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>Statement Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', marginBottom: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                  {[
                    { label: 'Total Sales', value: `R ${fmt(totalSales)}`, color: '#111827' },
                    { label: 'Member Rewards', value: `R ${fmt(memberRewards)}`, color: '#1a568b' },
                    { label: 'Agent Commission', value: `R ${fmt(agentCommission)}`, color: '#1a568b' },
                    { label: 'Platform Fee', value: `R ${fmt(platformFee)}`, color: '#1a568b' },
                    { label: 'Total Cashback', value: `R ${fmt(totalCashback)}`, color: '#1a568b' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f0f7ff', borderRadius: '10px', padding: 'clamp(0.625rem, 1.8vw, 0.875rem)', border: '1px solid #dce8f5' }}>
                      <p style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                      <p style={{ fontSize: 'clamp(0.875rem, 2.2vw, 1rem)', fontWeight: 800, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Total Due highlight */}
                <div style={{ background: totalDue === 0 ? '#f0fdf4' : '#f0f7ff', border: `2px solid ${totalDue === 0 ? '#86efac' : '#1a568b'}`, borderRadius: '12px', padding: 'clamp(1rem, 2.5vw, 1.25rem)', display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 640 ? 'flex-start' : 'center', gap: window.innerWidth < 640 ? '0.75rem' : '0' }}>
                  <div>
                    <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)', color: '#6b7280', margin: '0 0 2px' }}>Total Amount Due</p>
                    <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)', color: '#6b7280', margin: 0, wordBreak: 'break-word' }}>Due: {dueDate} · Ref: <strong style={{ color: '#1a568b' }}>{ref}</strong></p>
                  </div>
                  <p style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: invoice?.status === 'paid' ? '#16a34a' : '#1a568b', margin: 0 }}>R {fmt(totalDue)}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="card">
                <h2 style={{ fontSize: 'clamp(0.9375rem, 2.5vw, 1rem)', fontWeight: 800, color: '#1a568b', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>Payment Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)' }}>
                  {[
                    { label: 'Bank', value: 'FNB' },
                    { label: 'Account Holder', value: 'Plus1 Rewards (Pty) Ltd' },
                    { label: 'Account Number', value: '62XXXXXXXXXX' },
                    { label: 'Branch Code', value: '250655' },
                    { label: 'Reference', value: ref },
                    { label: 'Amount Due', value: `R ${fmt(totalDue)}` },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase' }}>{item.label}</p>
                      <p style={{ fontWeight: 700, color: '#111827', margin: 0, wordBreak: 'break-word' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.25rem)', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: 'clamp(0.9375rem, 2.5vw, 1rem)', fontWeight: 800, color: '#1a568b', margin: 0 }}>Transaction Breakdown</h2>
                  <span style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)', color: '#6b7280', fontWeight: 600 }}>{transactions.length} transactions</span>
                </div>

                {transactions.length === 0 ? (
                  <div style={{ padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', color: '#9ca3af' }}>
                    <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '0 0 0.5rem' }}>📭</p>
                    <p style={{ margin: 0, fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>No transactions for this period</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(0.75rem, 1.8vw, 0.8125rem)' }}>
                      <thead>
                        <tr style={{ background: '#f0f7ff' }}>
                          {['Date', 'Time', 'Member', 'Purchase', 'Rate', 'Member Reward', 'Agent', 'System', 'Total'].map(h => (
                            <th key={h} style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: h === 'Date' || h === 'Time' || h === 'Member' ? 'left' : 'right', fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)', fontWeight: 700, color: '#1a568b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #dce8f5', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t, i) => {
                          const total = parseFloat(String(t.member_amount)) + parseFloat(String(t.agent_amount)) + parseFloat(String(t.system_amount));
                          const date = new Date(t.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
                          const time = new Date(t.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', whiteSpace: 'nowrap', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>{date}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', color: '#6b7280', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>{time}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', color: '#6b7280', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>{maskPhone(t.members?.cell_phone || '')}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 600, fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>R {fmt(parseFloat(String(t.purchase_amount)))}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', color: '#6b7280', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>{t.cashback_percent}%</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>R {fmt(parseFloat(String(t.member_amount)))}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', color: '#6b7280', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>R {fmt(parseFloat(String(t.agent_amount)))}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', color: '#6b7280', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>R {fmt(parseFloat(String(t.system_amount)))}</td>
                              <td style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 'clamp(0.7rem, 1.8vw, 0.8125rem)' }}>R {fmt(total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f0f7ff', borderTop: '2px solid #dce8f5' }}>
                          <td colSpan={3} style={{ padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', fontWeight: 700, color: '#1a568b', fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)' }}>TOTALS</td>
                          <td style={{ padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 700, fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)' }}>R {fmt(totalSales)}</td>
                          <td />
                          <td style={{ padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 700, fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)' }}>R {fmt(memberRewards)}</td>
                          <td style={{ padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 700, fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)' }}>R {fmt(agentCommission)}</td>
                          <td style={{ padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 700, fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)' }}>R {fmt(platformFee)}</td>
                          <td style={{ padding: 'clamp(0.625rem, 1.8vw, 0.75rem)', textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)' }}>R {fmt(totalCashback)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.8125rem', margin: 0 }}>© 2026 +1 Rewards · Partner Portal · Read-only view</p>
      </footer>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-white shadow-[0px_-4px_20px_rgba(0,31,40,0.06)] border-t border-gray-200">
        <button 
          onClick={() => navigate('/partner/dashboard')} 
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Home</span>
        </button>
        <button 
          onClick={() => navigate('/partner/sales-terminal')} 
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">point_of_sale</span>
          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Sales</span>
        </button>
        <button 
          onClick={() => navigate('/partner/transaction-history')} 
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">history</span>
          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">History</span>
        </button>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-[#1a558b] transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Statement</span>
        </button>
        <button 
          onClick={() => navigate('/partner/support')} 
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">support_agent</span>
          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Support</span>
        </button>
      </nav>
    </div>
  );
}
