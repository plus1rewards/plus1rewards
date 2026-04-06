// src/components/partner/pages/ShopProfile.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import LogoUpload from '../LogoUpload';
import SupplierExpiryBanner from '../SupplierExpiryBanner';

interface Partner {
  id: string;
  shop_name: string;
  category: string;
  responsible_person: string;
  phone: string;
  email: string;
  address: string;
  cashback_percent: number;
  status: string;
  store_logo_url?: string;
  store_description?: string;
  opening_hours?: any;
  delivery_enabled?: boolean;
  pickup_enabled?: boolean;
  minimum_order_value?: number;
  suppliers?: Supplier[];
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
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '', contact_person: '', phone: '', email: ''
  });
  const [canAddSuppliers, setCanAddSuppliers] = useState(true);

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
      setFormData(data);
      
      // Load suppliers
      if (data.suppliers && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      }

      // Check supplier expiry status
      const hasSuppliers = data.suppliers && Array.isArray(data.suppliers) && data.suppliers.length > 0;
      if (hasSuppliers && data.suppliers_updated_at) {
        const suppliersDate = new Date(data.suppliers_updated_at);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - suppliersDate.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = daysPassed >= 30;
        setCanAddSuppliers(isExpired || !hasSuppliers);
      } else {
        setCanAddSuppliers(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!partner || !formData) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        shop_name: formData.shop_name,
        category: formData.category,
        responsible_person: formData.responsible_person,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        store_description: formData.store_description,
        suppliers: suppliers
      };

      // Update suppliers_updated_at timestamp if suppliers were modified
      if (JSON.stringify(suppliers) !== JSON.stringify(partner.suppliers)) {
        updateData.suppliers_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partner.id);

      if (error) throw error;
      
      setPartner({ ...partner, ...formData, suppliers });
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(partner || {});
    setEditMode(false);
  };

  const handleLogoUpdate = (logoUrl: string) => {
    if (partner) {
      setPartner({ ...partner, store_logo_url: logoUrl });
    }
  };

  // Supplier management functions
  const handleAddSupplier = () => {
    if (!canAddSuppliers) {
      alert('Cannot add suppliers. Please clear expired suppliers first or wait for expiry.');
      return;
    }
    setEditingSupplier(null);
    setSupplierForm({ name: '', contact_person: '', phone: '', email: '' });
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email
    });
    setShowSupplierForm(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      alert('Supplier name is required');
      return;
    }

    if (!canAddSuppliers && !editingSupplier) {
      alert('Cannot add new suppliers. Please clear expired suppliers first or wait for expiry.');
      return;
    }

    let updatedSuppliers: Supplier[];

    if (editingSupplier) {
      updatedSuppliers = suppliers.map(s =>
        s.id === editingSupplier.id
          ? { ...s, ...supplierForm }
          : s
      );
    } else {
      if (suppliers.length >= 3) {
        alert('Maximum 3 suppliers allowed');
        return;
      }
      const newSupplier: Supplier = {
        id: `supplier-${Date.now()}`,
        ...supplierForm
      };
      updatedSuppliers = [...suppliers, newSupplier];
    }

    // Update suppliers in database immediately with timestamp
    try {
      const updateData: any = {
        suppliers: updatedSuppliers
      };

      // Only update timestamp if we're adding/modifying suppliers (not just editing existing ones)
      if (!editingSupplier || JSON.stringify(updatedSuppliers) !== JSON.stringify(suppliers)) {
        updateData.suppliers_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partner!.id);

      if (error) throw error;

      setSuppliers(updatedSuppliers);
      setPartner({ ...partner!, suppliers: updatedSuppliers });
      setShowSupplierForm(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '' });
      
      alert('Supplier saved successfully!');
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier. Please try again.');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
    
    try {
      const updateData: any = {
        suppliers: updatedSuppliers
      };

      // Update timestamp when suppliers are modified
      if (updatedSuppliers.length !== suppliers.length) {
        updateData.suppliers_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partner!.id);

      if (error) throw error;

      setSuppliers(updatedSuppliers);
      setPartner({ ...partner!, suppliers: updatedSuppliers });
      
      alert('Supplier deleted successfully!');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier. Please try again.');
    }
  };

  const handleExpiredSuppliersCleared = () => {
    // Refresh the partner data after expired suppliers are cleared
    loadPartnerProfile();
    setCanAddSuppliers(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: 'business' },
    { id: 'contact', label: 'Contact', icon: 'contact_phone' },
    { id: 'branding', label: 'Branding', icon: 'palette' },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/partner/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>
                <p className="text-sm text-gray-600">Manage your business information</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-[#1a558b] text-white rounded-lg font-semibold hover:bg-[#1a558b]/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-[#1a558b] text-white rounded-lg font-semibold hover:bg-[#1a558b]/90 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Status Banner */}
        <div className={`rounded-xl p-6 mb-8 ${
          partner.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
          partner.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
          'bg-gradient-to-r from-red-500 to-red-600'
        } text-white shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{partner.shop_name}</h2>
              <p className="text-white/90">Status: <span className="font-semibold capitalize">{partner.status}</span></p>
              <p className="text-white/90">Cashback Rate: <span className="font-bold">{partner.cashback_percent}%</span></p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1a558b] text-[#1a558b] bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">business</span>
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.shop_name || ''}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                      placeholder="Enter business name"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.shop_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  {editMode ? (
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Grocery Store">Grocery Store</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Retail">Retail</option>
                      <option value="Service">Service</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.category || 'Not specified'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
                  {editMode ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                      placeholder="Enter full business address"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.address || 'Not provided'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Description</label>
                  {editMode ? (
                    <textarea
                      value={formData.store_description || ''}
                      onChange={(e) => setFormData({ ...formData, store_description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                      placeholder="Describe your business, products, and services..."
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.store_description || 'No description provided'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">contact_phone</span>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Responsible Person *</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.responsible_person || ''}
                      onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                      placeholder="Full name of responsible person"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.responsible_person}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                      placeholder="e.g., 082 555 1234"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                      placeholder="business@example.com"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-3">{partner.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1a558b]">palette</span>
                Branding & Media
              </h3>
              
              <LogoUpload
                currentLogoUrl={partner.store_logo_url}
                onLogoUpdate={handleLogoUpdate}
                partnerId={partner.id}
              />
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="p-8">
              {/* Supplier Expiry Banner */}
              {partner && (
                <SupplierExpiryBanner 
                  partnerId={partner.id} 
                  onClearExpired={handleExpiredSuppliersCleared}
                />
              )}

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a558b]">local_shipping</span>
                  Supplier References ({suppliers.length}/3)
                </h3>
                <button
                  onClick={handleAddSupplier}
                  disabled={suppliers.length >= 3 || !canAddSuppliers}
                  className="px-4 py-2 bg-[#1a558b] text-white rounded-lg font-semibold hover:bg-[#1a558b]/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Supplier
                </button>
              </div>

              {suppliers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <span className="material-symbols-outlined text-4xl text-gray-400 block mb-4">local_shipping</span>
                  <p className="text-gray-600 font-semibold mb-2">No suppliers added yet</p>
                  <p className="text-sm text-gray-500">Add suppliers you work with to help them join +1 Rewards</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suppliers.map((supplier, idx) => (
                    <div key={supplier.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">Supplier {idx + 1}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                          <p className="text-sm text-gray-900">{supplier.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Contact Person</p>
                          <p className="text-sm text-gray-900">{supplier.contact_person || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                          <p className="text-sm text-gray-900">{supplier.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                          <p className="text-sm text-gray-900">{supplier.email || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier Name *</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g., ABC Wholesale"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="082 555 1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="supplier@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                  setSupplierForm({ name: '', contact_person: '', phone: '', email: '' });
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupplier}
                className="flex-1 px-4 py-3 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-semibold rounded-lg transition-colors"
              >
                {editingSupplier ? 'Update' : 'Add'} Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}