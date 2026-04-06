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

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
}

interface SupplierFormModalProps {
  supplier: Supplier | null;
  onSave: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  onCancel: () => void;
}

function SupplierFormModal({ supplier, onSave, onCancel }: SupplierFormModalProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Supplier name is required');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', margin: 0 }}>
          {supplier ? 'Edit Supplier' : 'Add Supplier'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1a558b' }}>
              Supplier Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., ABC Wholesale"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #1a558b',
                fontSize: '0.9375rem',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1a558b' }}>
              Contact Person
            </label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="e.g., John Smith"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #1a558b',
                fontSize: '0.9375rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1a558b' }}>
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="082 555 1234"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #1a558b',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1a558b' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="supplier@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #1a558b',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #1a558b',
                backgroundColor: 'transparent',
                color: '#1a558b',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1a558b',
                color: 'white',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);
  const [monthlyCashbackLiability, setMonthlyCashbackLiability] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

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
        
        // Load suppliers
        if (partnerDetails.suppliers && Array.isArray(partnerDetails.suppliers)) {
          setSuppliers(partnerDetails.suppliers);
        }

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

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    if (!partner) return;

    try {
      let updatedSuppliers: Supplier[];
      
      if (editingSupplier) {
        // Update existing supplier
        updatedSuppliers = suppliers.map(s => 
          s.id === editingSupplier.id 
            ? { ...s, ...supplierData }
            : s
        );
      } else {
        // Add new supplier
        if (suppliers.length >= 3) {
          alert('Maximum 3 suppliers allowed');
          return;
        }
        const newSupplier: Supplier = {
          id: `supplier-${Date.now()}`,
          ...supplierData
        };
        updatedSuppliers = [...suppliers, newSupplier];
      }

      // Update in database
      const { error } = await supabase
        .from('partners')
        .update({ suppliers: updatedSuppliers })
        .eq('id', partner.id);

      if (error) throw error;

      setSuppliers(updatedSuppliers);
      setShowSupplierForm(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!partner) return;
    
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
      
      const { error } = await supabase
        .from('partners')
        .update({ suppliers: updatedSuppliers })
        .eq('id', partner.id);

      if (error) throw error;

      setSuppliers(updatedSuppliers);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier');
    }
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

          {/* Suppliers Section */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Suppliers</h2>
              <button
                onClick={handleAddSupplier}
                disabled={suppliers.length >= 3}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: suppliers.length >= 3 ? 'not-allowed' : 'pointer',
                  backgroundColor: suppliers.length >= 3 ? '#e5e7eb' : 'var(--blue)',
                  color: suppliers.length >= 3 ? '#9ca3af' : 'white'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                Add Supplier
              </button>
            </div>

            {suppliers.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'rgba(26, 85, 139, 0.08)', borderRadius: '10px', border: '2px dashed var(--blue)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--blue)', display: 'block', marginBottom: '0.5rem' }}>local_shipping</span>
                <p style={{ fontWeight: 600, color: 'var(--blue)', margin: '0.5rem 0 0.25rem' }}>No suppliers added yet</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-light)', margin: 0 }}>Click "Add Supplier" to get started</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {suppliers.map((supplier, idx) => (
                  <div key={supplier.id} style={{ border: '1px solid var(--gray-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedSupplier(expandedSupplier === idx ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: expandedSupplier === idx ? 'var(--blue)' : 'rgba(26, 85, 139, 0.08)',
                        color: expandedSupplier === idx ? 'white' : 'var(--blue)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, textAlign: 'left' }}>
                        <span className="material-symbols-outlined">{supplier.name ? 'check_circle' : 'radio_button_unchecked'}</span>
                        <div>
                          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Supplier {idx + 1}</p>
                          <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0.25rem 0 0' }}>{supplier.name || 'Click to view details'}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined" style={{ transition: 'transform 0.2s ease', transform: expandedSupplier === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                    </button>

                    {expandedSupplier === idx && (
                      <div style={{ padding: '1rem', backgroundColor: '#fff', borderTop: '1px solid var(--gray-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-text)', margin: '0 0 0.25rem', textTransform: 'uppercase' }}>Supplier Name</p>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>{supplier.name}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-text)', margin: '0 0 0.25rem', textTransform: 'uppercase' }}>Contact Person</p>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>{supplier.contact_person || '-'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-text)', margin: '0 0 0.25rem', textTransform: 'uppercase' }}>Phone</p>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>{supplier.phone || '-'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-text)', margin: '0 0 0.25rem', textTransform: 'uppercase' }}>Email</p>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>{supplier.email || '-'}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: '1px solid var(--blue)',
                              backgroundColor: 'transparent',
                              color: 'var(--blue)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: '1px solid #ef4444',
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Form Modal */}
          {showSupplierForm && (
            <SupplierFormModal
              supplier={editingSupplier}
              onSave={handleSaveSupplier}
              onCancel={() => {
                setShowSupplierForm(false);
                setEditingSupplier(null);
              }}
            />
          )}
        </div>
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid var(--gray-border)', padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--gray-light)', fontSize: '0.8125rem' }}>© 2026 +1 Rewards · Partner Portal</p>
      </footer>
    </div>
  );
}
