// src/components/partner/pages/ShopProfile.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface Partner {
  id: string;
  shop_name: string;
  name: string;
  location: string;
  category: string;
  responsible_person: string;
  phone: string;
  email: string;
  cashback_percent: number;
  status: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
}

export default function ShopProfile() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadPartnerProfile();
  }, []);

  const loadPartnerProfile = async () => {
    try {
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

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      setPartner(data);
      
      // Load suppliers
      if (data.suppliers && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-900 mb-4">Profile not found</p>
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="bg-[#1a558b] text-white px-6 py-2 rounded-xl font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact_person: '', phone: '', email: '' });
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email
    });
    setShowSupplierForm(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name.trim()) {
      alert('Supplier name is required');
      return;
    }

    if (!partner) return;

    try {
      let updatedSuppliers: Supplier[];

      if (editingSupplier) {
        updatedSuppliers = suppliers.map(s =>
          s.id === editingSupplier.id
            ? { ...s, ...formData }
            : s
        );
      } else {
        if (suppliers.length >= 3) {
          alert('Maximum 3 suppliers allowed');
          return;
        }
        const newSupplier: Supplier = {
          id: `supplier-${Date.now()}`,
          ...formData
        };
        updatedSuppliers = [...suppliers, newSupplier];
      }

      const { error } = await supabase
        .from('partners')
        .update({ suppliers: updatedSuppliers })
        .eq('id', partner.id);

      if (error) throw error;

      setSuppliers(updatedSuppliers);
      setShowSupplierForm(false);
      setEditingSupplier(null);
      setFormData({ name: '', contact_person: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    if (!partner) return;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Shop Profile</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your business details</p>
        </div>
        <button
          onClick={() => navigate('/partner/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-6 ${
        partner.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' :
        partner.status === 'pending' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
        'bg-gradient-to-br from-red-500 to-red-600'
      } text-white shadow-lg`}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">storefront</span>
          <div>
            <p className="text-sm opacity-90">Business Status</p>
            <p className="text-2xl font-black capitalize">{partner.status}</p>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">business</span>
          Business Details
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Business Name</label>
              <p className="text-gray-900 font-semibold mt-1">{partner.shop_name || partner.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
              <p className="text-gray-900 font-semibold mt-1">{partner.category || 'Not specified'}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
            <p className="text-gray-900 font-semibold mt-1">{partner.location || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Cashback Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">percent</span>
          Cashback Settings
        </h2>
        <div className="bg-gradient-to-br from-[#1a558b] to-[#2563eb] rounded-xl p-6 text-white mb-4">
          <p className="text-sm text-blue-100 mb-1">Current Cashback Rate</p>
          <p className="text-5xl font-black">{partner.cashback_percent}%</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-100">
          <p className="text-xs font-bold text-gray-700 mb-2">Split Breakdown:</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">System Fee</span>
              <span className="font-bold text-[#1a558b]">1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Agent Commission</span>
              <span className="font-bold text-[#1a558b]">1%</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-blue-200">
              <span className="text-gray-700 font-semibold">Member Reward</span>
              <span className="font-black text-[#1a558b]">{partner.cashback_percent - 2}%</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 italic">
          Note: Cashback rate changes require admin approval
        </p>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">contact_phone</span>
          Contact Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Responsible Person</label>
            <p className="text-gray-900 font-semibold mt-1">{partner.responsible_person}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
              <p className="text-gray-900 font-semibold mt-1">{partner.phone}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
              <p className="text-gray-900 font-semibold mt-1">{partner.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier References */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a558b]">local_shipping</span>
            Supplier References
          </h2>
          <button
            onClick={handleAddSupplier}
            disabled={suppliers.length >= 3}
            className="bg-[#1a558b] hover:bg-[#1a558b]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add
          </button>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-8 bg-blue-50 rounded-xl border-2 border-dashed border-[#1a558b]">
            <span className="material-symbols-outlined text-4xl text-[#1a558b] block mb-2">local_shipping</span>
            <p className="text-gray-600 font-semibold mb-1">No suppliers added yet</p>
            <p className="text-xs text-gray-500">Add suppliers you work with to help them join +1 Rewards</p>
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map((supplier, idx) => (
              <div key={supplier.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSupplier(expandedSupplier === idx ? null : idx)}
                  className="w-full px-4 py-3 flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: expandedSupplier === idx ? '#1a558b' : '#f3f4f6',
                    color: expandedSupplier === idx ? 'white' : '#1a558b'
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="material-symbols-outlined">
                      {supplier.name ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Supplier {idx + 1}</p>
                      <p className="text-sm font-semibold">{supplier.name || 'Click to view details'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined transition-transform" style={{
                    transform: expandedSupplier === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    expand_more
                  </span>
                </button>

                {expandedSupplier === idx && (
                  <div className="px-4 py-4 bg-white border-t-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Supplier Name</label>
                        <p className="text-gray-900 font-semibold mt-1">{supplier.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Contact Person</label>
                        <p className="text-gray-900 font-semibold mt-1">{supplier.contact_person || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                        <p className="text-gray-900 font-semibold mt-1">{supplier.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                        <p className="text-gray-900 font-semibold mt-1">{supplier.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="flex-1 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-black text-gray-900 mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Supplier Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ABC Wholesale"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1a558b] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1a558b] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="082 555 1234"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1a558b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="supplier@example.com"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1a558b] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                  setFormData({ name: '', contact_person: '', phone: '', email: '' });
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupplier}
                className="flex-1 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">settings</span>
          Actions
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/partner/support')}
            className="w-full bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">edit</span>
            Request Detail Change
          </button>
          <button
            onClick={() => navigate('/partner/support')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">support_agent</span>
            Contact Admin
          </button>
        </div>
      </div>
    </div>
  );
}
