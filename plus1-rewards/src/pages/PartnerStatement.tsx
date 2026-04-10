import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  purchase_amount: number;
  cashback_percent: number;
  member_amount: number;
  agent_amount: number;
  system_amount: number;
  created_at: string;
  transaction_time: string;
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
    if (!data) { navigate('/partner/login'); return; }
    setPartner(JSON.parse(data));
  }, []);

  useEffect(() => {
    if (partner) loadStatement();
  }, [partner, selectedMonth]);

  const loadStatement = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

      const [{ data: inv }, { data: tx }, { data: invoiceList }] = await Promise.all([
        supabase.from('partner_invoices').select('*').eq('partner_id', partner.id).eq('invoice_month', selectedMonth).maybeSingle(),
        supabase.from('transactions').select('id, purchase_amount, cashback_percent, member_amount, agent_amount, system_amount, created_at, transaction_time, members(cell_phone)').eq('partner_id', partner.id).eq('status', 'completed').gte('created_at', startDate).lte('created_at', endDate).order('created_at', { ascending: false }),
        supabase.from('partner_invoices').select('invoice_month').eq('partner_id', partner.id).order('invoice_month', { ascending: false }),
      ]);

      setInvoice(inv);
      setTransactions(((tx || []) as any[]).map(t => ({ ...t, members: Array.isArray(t.members) ? t.members[0] ?? null : t.members })) as Transaction[]);
      if (invoiceList?.length) setAvailableMonths(invoiceList.map((i: any) => i.invoice_month));
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
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>📊 Monthly Statement</h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{partner?.shop_name}</p>
          </div>
          <button onClick={() => navigate('/partner/dashboard')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Month Selector */}
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>Statement Period</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.375rem 0.75rem', fontSize: '0.875rem', color: '#111827', background: '#f9fafb' }}
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
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', background: invoice.status === 'paid' ? '#dcfce7' : new Date(invoice.due_date) < new Date() ? '#fee2e2' : '#fef9c3', color: invoice.status === 'paid' ? '#166534' : new Date(invoice.due_date) < new Date() ? '#991b1b' : '#854d0e' }}>
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
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a568b', marginBottom: '1rem' }}>Statement Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Total Sales', value: `R ${fmt(totalSales)}`, color: '#111827' },
                    { label: 'Member Rewards', value: `R ${fmt(memberRewards)}`, color: '#1a568b' },
                    { label: 'Agent Commission', value: `R ${fmt(agentCommission)}`, color: '#1a568b' },
                    { label: 'Platform Fee', value: `R ${fmt(platformFee)}`, color: '#1a568b' },
                    { label: 'Total Cashback', value: `R ${fmt(totalCashback)}`, color: '#1a568b' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f0f7ff', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dce8f5' }}>
                      <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                      <p style={{ fontSize: '1rem', fontWeight: 800, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Total Due highlight */}
                <div style={{ background: totalDue === 0 ? '#f0fdf4' : '#f0f7ff', border: `2px solid ${totalDue === 0 ? '#86efac' : '#1a568b'}`, borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 2px' }}>Total Amount Due</p>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>Due: {dueDate} · Ref: <strong style={{ color: '#1a568b' }}>{ref}</strong></p>
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: invoice?.status === 'paid' ? '#16a34a' : '#1a568b', margin: 0 }}>R {fmt(totalDue)}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="card">
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a568b', marginBottom: '1rem' }}>Payment Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  {[
                    { label: 'Bank', value: 'FNB' },
                    { label: 'Account Holder', value: 'Plus1 Rewards (Pty) Ltd' },
                    { label: 'Account Number', value: '62XXXXXXXXXX' },
                    { label: 'Branch Code', value: '250655' },
                    { label: 'Reference', value: ref },
                    { label: 'Amount Due', value: `R ${fmt(totalDue)}` },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase' }}>{item.label}</p>
                      <p style={{ fontWeight: 700, color: '#111827', margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a568b', margin: 0 }}>Transaction Breakdown</h2>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{transactions.length} transactions</span>
                </div>

                {transactions.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📭</p>
                    <p style={{ margin: 0 }}>No transactions for this period</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f0f7ff' }}>
                          {['Date', 'Time', 'Member', 'Purchase', 'Rate', 'Member Reward', 'Agent', 'System', 'Total'].map(h => (
                            <th key={h} style={{ padding: '0.625rem 0.75rem', textAlign: h === 'Date' || h === 'Time' || h === 'Member' ? 'left' : 'right', fontSize: '0.7rem', fontWeight: 700, color: '#1a568b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #dce8f5', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t, i) => {
                          const total = parseFloat(String(t.member_amount)) + parseFloat(String(t.agent_amount)) + parseFloat(String(t.system_amount));
                          const date = new Date(t.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
                          const time = t.transaction_time ? t.transaction_time.substring(0, 5) : new Date(t.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '0.625rem 0.75rem', whiteSpace: 'nowrap' }}>{date}</td>
                              <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{time}</td>
                              <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{maskPhone(t.members?.cell_phone || '')}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>R {fmt(parseFloat(String(t.purchase_amount)))}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: '#6b7280' }}>{t.cashback_percent}%</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>R {fmt(parseFloat(String(t.member_amount)))}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: '#6b7280' }}>R {fmt(parseFloat(String(t.agent_amount)))}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: '#6b7280' }}>R {fmt(parseFloat(String(t.system_amount)))}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>R {fmt(total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f0f7ff', borderTop: '2px solid #dce8f5' }}>
                          <td colSpan={3} style={{ padding: '0.75rem', fontWeight: 700, color: '#1a568b', fontSize: '0.8125rem' }}>TOTALS</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>R {fmt(totalSales)}</td>
                          <td />
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>R {fmt(memberRewards)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>R {fmt(agentCommission)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>R {fmt(platformFee)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>R {fmt(totalCashback)}</td>
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
    </div>
  );
}
