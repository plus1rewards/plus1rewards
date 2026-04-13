// plus1-rewards/src/components/dashboard/pages/InvoicesPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import StatCard from '../components/StatCard';
import { supabaseAdmin } from '../../../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailType, setTestEmailType] = useState<'due' | 'overdue' | 'payment_received' | 'suspended' | 'reactivated' | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invoicesData } = await supabaseAdmin
        .from('partner_invoices')
        .select('*, partners(shop_name, phone, email)')
        .order('invoice_month', { ascending: false });

      const totalInvoices = invoicesData?.length || 0;
      const paid = invoicesData?.filter(i => i.status === 'paid').length || 0;
      const overdue = invoicesData?.filter(i => {
        if (i.status === 'paid') return false;
        return new Date(i.due_date) < new Date();
      }).length || 0;
      const totalAmount = invoicesData?.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0) || 0;

      setStats({ totalInvoices, paid, overdue, totalAmount });
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkPaid = async (invoiceId: string) => {
    if (confirm('Mark this invoice as paid?')) {
      try {
        const { error } = await supabaseAdmin
          .from('partner_invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', invoiceId);

        if (error) throw error;
        alert('Invoice marked as paid');
        fetchData();
      } catch (error) {
        console.error('Error marking invoice as paid:', error);
        alert('Failed to update invoice');
      }
    }
  };

  const handleSuspendPartner = async (partnerId: string) => {
    if (confirm('Suspend this partner due to non-payment?')) {
      try {
        const { error } = await supabaseAdmin
          .from('partners')
          .update({ status: 'suspended' })
          .eq('id', partnerId);

        if (error) throw error;
        alert('Partner suspended');
        fetchData();
      } catch (error) {
        console.error('Error suspending partner:', error);
        alert('Failed to suspend partner');
      }
    }
  };

  // Shared: build filled HTML from template + data
  const buildStatementHtml = async (partnerId: string, invoiceMonth: string) => {
    const [year, month] = invoiceMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    const [{ data: partner }, { data: invoice }, { data: transactions }] = await Promise.all([
      supabaseAdmin.from('partners').select('id, shop_name, email, cell_phone, address, contact_person').eq('id', partnerId).single(),
      supabaseAdmin.from('partner_invoices').select('*').eq('partner_id', partnerId).eq('invoice_month', invoiceMonth).maybeSingle(),
      supabaseAdmin.from('transactions').select('purchase_amount, cashback_percent, member_amount, agent_amount, system_amount, created_at, transaction_time, members(cell_phone)').eq('partner_id', partnerId).eq('status', 'completed').gte('created_at', startDate).lte('created_at', endDate).order('created_at', { ascending: true }),
    ]);

    if (!partner) throw new Error('Partner not found');

    const fmt = (v: number) => v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const maskPhone = (p: string) => { const d = p.replace(/\D/g, ''); return d.length === 10 ? `+27 ${d[1]}** *** ${d.slice(7)}` : '***'; };

    const txList = (transactions || []).map((t: any) => ({ ...t, member_phone: t.members?.cell_phone || '' }));
    const totalSales = txList.reduce((s: number, t: any) => s + parseFloat(t.purchase_amount), 0);
    const memberRewards = txList.reduce((s: number, t: any) => s + parseFloat(t.member_amount), 0);
    const agentCommission = txList.reduce((s: number, t: any) => s + parseFloat(t.agent_amount), 0);
    const platformFee = txList.reduce((s: number, t: any) => s + parseFloat(t.system_amount), 0);
    const totalCashback = memberRewards + agentCommission + platformFee;
    const totalDue = invoice ? parseFloat(invoice.total_amount) : totalCashback;
    const dueDate = invoice ? new Date(invoice.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const issueDate = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    const ref = `PLUS1-${partner.shop_name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}-${invoiceMonth}`;

    const rows = txList.length === 0
      ? `<tr><td colspan="9" style="padding:15px; text-align:center; color:#999; font-size:12px;">No transactions this period</td></tr>`
      : txList.map((t: any, i: number) => {
          const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
          const date = new Date(t.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
          const time = t.transaction_time ? t.transaction_time.substring(0, 5) : new Date(t.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
          const total = parseFloat(t.member_amount) + parseFloat(t.agent_amount) + parseFloat(t.system_amount);
          return `<tr style="background:${bg};">
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;">${date}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;">${time}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;">${maskPhone(t.member_phone)}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;" align="right">R ${fmt(parseFloat(t.purchase_amount))}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;" align="right">${t.cashback_percent}%</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;" align="right">R ${fmt(parseFloat(t.member_amount))}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;" align="right">R ${fmt(parseFloat(t.agent_amount))}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px;" align="right">R ${fmt(parseFloat(t.system_amount))}</td>
            <td style="padding:8px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#16a34a; font-weight:bold;" align="right">R ${fmt(total)}</td>
          </tr>`;
        }).join('');

    const templateRes = await fetch('/statement.html');
    if (!templateRes.ok) throw new Error('Could not load statement template');
    let html = await templateRes.text();

    const vars: Record<string, string> = {
      Month_Year: invoiceMonth, Statement_Reference: ref,
      Responsible_Person_Name: partner.contact_person || partner.shop_name,
      Business_Name: partner.shop_name, Issue_Date: issueDate, Due_Date: dueDate,
      Total_Sales: fmt(totalSales), Total_Cashback: fmt(totalCashback),
      Member_Rewards: fmt(memberRewards), Agent_Commission: fmt(agentCommission),
      Platform_Fee: fmt(platformFee), Total_Amount_Due: fmt(totalDue),
      Transaction_Rows: rows,
      Bank_Name: 'FNB', Account_Holder: 'Plus1 Rewards (Pty) Ltd',
      Account_Number: '62XXXXXXXXXX', Branch_Code: '250655',
    };

    html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => vars[key] ?? '');
    return { html, partner, totalDue: fmt(totalDue), dueDate, ref, invoiceMonth };
  };

  // Render HTML in hidden div → html2canvas → jsPDF → base64
  const generatePdfBase64 = async (html: string): Promise<string> => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed; left:-9999px; top:0; width:794px; background:#f4f4f4;';
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#f4f4f4' });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      let yPos = 0;
      let remaining = imgH;
      while (remaining > 0) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yPos, pageW, imgH);
        yPos += pageH;
        remaining -= pageH;
      }

      return pdf.output('datauristring').split(',')[1];
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleSendTestPdfStatement = async () => {
    setSendingTestEmail(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/process-partner-invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPartnerId: '4f04b3a3-2ba3-48e9-bf2a-0db036a4d576',
          invoiceMonth: new Date().toISOString().slice(0, 7),
          overrideEmail: 'theodt.bmm@gmail.com',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      alert(`2 emails sent to theodt.bmm@gmail.com\n\nStatus: ${data.results?.[0]?.status}`);
      setShowTestEmailModal(false);
    } catch (error) {
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSendTestEmail = async (emailType: 'due' | 'overdue' | 'payment_received' | 'suspended' | 'reactivated') => {
    // These legacy template tests use the Growithus partner's real email
    setSendingTestEmail(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Trigger via process-partner-invoices so it uses the partner's real email
      const templateMap = {
        due: 'partner-invoice-due',
        overdue: 'partner-invoice-overdue',
        payment_received: 'partner-payment-received',
        suspended: 'partner-suspended',
        reactivated: 'partner-reactivated',
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/send-statement-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Partner email fetched server-side from DB - no hardcoded address
          partnerEmail: invoices.find(i => i.partners?.email)?.partners?.email || '',
          templateId: templateMap[emailType],
          resendApiKey: import.meta.env.VITE_RESEND_API_KEY,
          variables: {
            Month_Year: new Date().toISOString().slice(0, 7),
            Issue_Date: new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }),
            Due_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }),
            Responsible_Person_Name: 'Partner',
            Total_Amount: 'R0.00',
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send test email');

      alert(`Test email (${emailType}) sent to partner's registered email`);
      setShowTestEmailModal(false);
      setTestEmailType(null);
    } catch (error) {
      alert(`Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSendStatement = async () => {
    if (!selectedPartner) { alert('Please select a partner'); return; }
    setSendingEmail(true);
    try {
      const { html, partner, totalDue, dueDate, ref } = await buildStatementHtml(
        selectedPartner.partner_id,
        selectedPartner.invoice_month
      );

      const pdfBase64 = await generatePdfBase64(html);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-statement-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerEmail: selectedPartner.partners?.email,
          templateId: 'statement',
          resendApiKey,
          pdfBase64,
          pdfFilename: `Plus1-Statement-${selectedPartner.invoice_month}.pdf`,
          partnerName: partner.shop_name,
          totalDue, dueDate, ref,
          invoiceMonth: selectedPartner.invoice_month,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send email');

      alert(`Statement sent to ${selectedPartner.partners?.email}`);
      setShowSendModal(false);
      setSelectedPartner(null);
    } catch (error) {
      console.error('Error sending statement:', error);
      alert(`Failed to send statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRefresh = () => fetchData();
  const handleLogout = () => navigate('/');

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
  };

  const closeInvoiceModal = () => {
    setSelectedInvoice(null);
  };

  const filteredInvoices = invoices.filter(inv => {
    const searchLower = searchTerm.toLowerCase();
    return searchLower === '' ||
      inv.partners?.shop_name?.toLowerCase().includes(searchLower) ||
      inv.invoice_month?.toLowerCase().includes(searchLower);
  });

  const statsData = [
    { icon: 'receipt', title: 'Total Invoices', value: stats.totalInvoices.toString(), change: '', description: 'All time' },
    { icon: 'check_circle', title: 'Paid', value: stats.paid.toString(), change: '', description: 'Settled invoices' },
    { icon: 'warning', title: 'Overdue', value: stats.overdue.toString(), change: '', description: 'Past due date' },
    { icon: 'payments', title: 'Total Amount', value: `R${stats.totalAmount.toFixed(2)}`, change: '', description: 'All invoices' }
  ];

  return (
    <>
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search invoices by partner or month..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
            <button
              onClick={() => setShowTestEmailModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-orange-500 bg-white text-orange-500 hover:bg-orange-500 hover:text-white transition-all text-sm"
              title="Send test emails to partner's registered email"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              Test Emails
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 pb-10">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Partner Billing & Invoices</h2>
            <p className="text-gray-600 mt-1">Manage monthly partner invoices and payment tracking</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => (
              <StatCard key={index} icon={stat.icon} title={stat.title} value={stat.value} change={stat.change} description={stat.description} />
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">list_alt</span>
                All Invoices ({filteredInvoices.length})
              </h3>
              <button 
                onClick={() => setShowSendModal(true)}
                className="text-xs text-gray-600 hover:text-[#1a558b] flex items-center gap-1 font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Send Statement
              </button>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-600">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Invoice #</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Partner</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Month</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Due Date</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Status</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => {
                      const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date();
                      
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="text-xs font-mono font-bold text-[#1a558b]">{invoice.id.substring(0, 8).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{invoice.partners?.name || 'Unknown'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-900">{invoice.invoice_month}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">R{parseFloat(invoice.total_amount).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              invoice.status === 'paid'
                                ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                                : isOverdue
                                ? 'bg-red-500/20 text-red-700 border border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                invoice.status === 'paid' ? 'bg-green-600' : isOverdue ? 'bg-red-600' : 'bg-yellow-500'
                              }`}></span>
                              {invoice.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {invoice.status !== 'paid' && (
                                <>
                                  <button
                                    onClick={() => handleMarkPaid(invoice.id)}
                                    className="p-2 text-gray-600 hover:text-green-600 transition-colors rounded-lg bg-gray-100 hover:bg-green-50"
                                    title="Mark as Paid"
                                  >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                  </button>
                                  {isOverdue && (
                                    <button
                                      onClick={() => handleSuspendPartner(invoice.partner_id)}
                                      className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg bg-gray-100 hover:bg-red-50"
                                      title="Suspend Partner"
                                    >
                                      <span className="material-symbols-outlined text-sm">block</span>
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleViewInvoice(invoice)}
                                className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest text-center">
                Showing {filteredInvoices.length} of {invoices.length} total invoices
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-yellow-600">info</span>
            <div>
              <h4 className="text-sm font-bold text-yellow-900 mb-1">Invoice & Billing Cycle</h4>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Partners issue cashback during the month</li>
                <li>• Invoices generated at month end</li>
                <li>• Grace period applies before suspension</li>
                <li>• Suspended partners cannot process transactions</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2026 +1 Rewards Platform Management • Secured Admin Access
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>

    {/* Invoice Details Modal */}
    {selectedInvoice && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-600 mt-1">Invoice #{selectedInvoice.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <button
              onClick={closeInvoiceModal}
              className="size-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6 bg-gray-50">
            {/* Partner Information */}
            <section>
              <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">storefront</span>
                Partner Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Partner Name</p>
                  <p className="text-sm text-gray-900 font-semibold">{selectedInvoice.partners?.shop_name || 'Unknown'}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Contact Phone</p>
                  <p className="text-sm text-gray-900">{selectedInvoice.partners?.cell_phone || 'Not provided'}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Email</p>
                  <p className="text-sm text-gray-900">{selectedInvoice.partners?.email || 'Not provided'}</p>
                </div>
              </div>
            </section>

            {/* Invoice Details */}
            <section>
              <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">receipt</span>
                Invoice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Invoice Month</p>
                  <p className="text-sm text-gray-900 font-semibold">{selectedInvoice.invoice_month}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Due Date</p>
                  <p className="text-sm text-gray-900">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Amount</p>
                  <p className="text-2xl text-[#1a558b] font-bold">R{parseFloat(selectedInvoice.total_amount).toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedInvoice.status === 'paid'
                      ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                      : new Date(selectedInvoice.due_date) < new Date()
                      ? 'bg-red-500/20 text-red-700 border border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                  }`}>
                    {selectedInvoice.status === 'paid' ? 'Paid' : new Date(selectedInvoice.due_date) < new Date() ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                {selectedInvoice.paid_at && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">Paid At</p>
                    <p className="text-sm text-green-700 font-semibold">{new Date(selectedInvoice.paid_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Timestamps */}
            <section>
              <h3 className="text-lg font-bold text-[#1a558b] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">schedule</span>
                Timestamps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Created At</p>
                  <p className="text-sm text-gray-900">{new Date(selectedInvoice.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-bold mb-1">Updated At</p>
                  <p className="text-sm text-gray-900">{new Date(selectedInvoice.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* Actions */}
            {selectedInvoice.status !== 'paid' && (
              <section className="flex gap-4 justify-center pt-4">
                <button
                  onClick={() => {
                    handleMarkPaid(selectedInvoice.id);
                    closeInvoiceModal();
                  }}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Mark as Paid
                </button>
                {new Date(selectedInvoice.due_date) < new Date() && (
                  <button
                    onClick={() => {
                      handleSuspendPartner(selectedInvoice.partner_id);
                      closeInvoiceModal();
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">block</span>
                    Suspend Partner
                  </button>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Send Statement Modal */}
    {showSendModal && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full shadow-2xl">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">Send Statement</h2>
            <button
              onClick={() => {
                setShowSendModal(false);
                setSelectedPartner(null);
              }}
              className="size-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Select Partner
              </label>
              <select
                value={selectedPartner?.id || ''}
                onChange={(e) => {
                  const partner = invoices.find(inv => inv.id === e.target.value);
                  setSelectedPartner(partner);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all"
              >
                <option value="">Choose a partner...</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.partners?.shop_name} - {invoice.invoice_month} (R{parseFloat(invoice.total_amount).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedPartner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-xs text-blue-600 font-bold uppercase">Statement Details</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Partner:</span> {selectedPartner.partners?.shop_name}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Email:</span> {selectedPartner.partners?.email}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Month:</span> {selectedPartner.invoice_month}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Amount:</span> R{parseFloat(selectedPartner.total_amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Due Date:</span> {new Date(selectedPartner.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowSendModal(false);
                setSelectedPartner(null);
              }}
              className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendStatement}
              disabled={!selectedPartner || sendingEmail}
              className="px-4 py-2 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Send Statement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Test Email Modal */}
    {showTestEmailModal && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full shadow-2xl">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">Test Email Templates</h2>
            <button
              onClick={() => {
                setShowTestEmailModal(false);
                setTestEmailType(null);
              }}
              className="size-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-6 space-y-3">
            <p className="text-sm text-gray-600 mb-4">Sends to the partner's registered email address</p>

            <button
              onClick={handleSendTestPdfStatement}
              disabled={sendingTestEmail}
              className="w-full px-4 py-3 bg-[#1a568b] border border-[#1a568b] text-white rounded-lg hover:opacity-90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              {sendingTestEmail ? 'Sending...' : 'Send 2 Statement Emails (Test)'}
            </button>

            <hr className="border-gray-200"/>

            <button
              onClick={() => handleSendTestEmail('due')}
              disabled={sendingTestEmail}
              className="w-full px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Partner Invoice Due
            </button>

            <button
              onClick={() => handleSendTestEmail('overdue')}
              disabled={sendingTestEmail}
              className="w-full px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Partner Invoice Overdue
            </button>

            <button
              onClick={() => handleSendTestEmail('payment_received')}
              disabled={sendingTestEmail}
              className="w-full px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Partner Payment Received
            </button>

            <button
              onClick={() => handleSendTestEmail('suspended')}
              disabled={sendingTestEmail}
              className="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Partner Suspended
            </button>

            <button
              onClick={() => handleSendTestEmail('reactivated')}
              disabled={sendingTestEmail}
              className="w-full px-4 py-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Partner Reactivated
            </button>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={() => {
                setShowTestEmailModal(false);
                setTestEmailType(null);
              }}
              className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
