// src/components/partner/pages/ShopProfile.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import LogoUpload from '../LogoUpload';
import SupplierExpiryBanner from '../SupplierExpiryBanner';
import { geocodeAddress } from '../../../utils/geocoding';
import AnimatedPartnerCard from '../../landing/AnimatedPartnerCard';

interface Partner {
  id: string;
  shop_name: string;
  category: string;
  responsible_person?: string;
  first_name?: string;
  phone?: string;
  cell_phone?: string;
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
  postal_code?: string;
  latitude?: number;
  longitude?: number;
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
  const [geocoding, setGeocoding] = useState(false);

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
        postal_code: formData.postal_code,
        latitude: formData.latitude,
        longitude: formData.longitude,
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

  const handleAutoGeocode = async () => {
    if (!formData.address) {
      alert('Please enter an address first');
      return;
    }

    setGeocoding(true);
    try {
      const coords = await geocodeAddress(formData.address);
      if (coords) {
        setFormData({
          ...formData,
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        alert('Coordinates found and updated!');
      } else {
        alert('Could not find coordinates for this address. Please enter them manually.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error finding coordinates. Please try again or enter them manually.');
    } finally {
      setGeocoding(false);
    }
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
    { id: 'suppliers', label: 'References', icon: 'local_shipping' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner - Matching Dashboard */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-gradient-to-r from-[#1a558b] to-[#2563eb] rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/partner/dashboard')}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
              </button>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Business Profile</h1>
                <p className="text-white/90 text-sm">Manage your shop information and settings</p>
              </div>
            </div>

            {/* Edit/Save Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-white text-[#1a558b] font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2 text-sm transition-all"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1a558b]/30 border-t-[#1a558b] rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-white text-[#1a558b] font-semibold rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm transition-all"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards - Simple inline display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-xs font-semibold mb-1">STATUS</p>
              <p className="text-white font-bold text-lg capitalize">{partner.status}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-xs font-semibold mb-1">CASHBACK RATE</p>
              <p className="text-white font-bold text-lg">{partner.cashback_percent}%</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-xs font-semibold mb-1">BUSINESS</p>
              <p className="text-white font-bold text-lg truncate">{partner.shop_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap border-b-2 transition-all text-xs sm:text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'border-[#1a558b] text-[#1a558b] bg-gradient-to-b from-blue-50 to-transparent'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className={`material-symbols-outlined text-base sm:text-lg transition-all ${
                  activeTab === tab.id ? 'text-[#1a558b]' : 'text-gray-500'
                }`}>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1a558b] to-[#2563eb] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg sm:text-xl">business</span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">Business Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Business Name *</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.shop_name || ''}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                      placeholder="Enter business name"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.shop_name}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Category</label>
                  {editMode ? (
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
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
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.category || 'Not specified'}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Business Address</label>
                  {editMode ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                      placeholder="Enter full business address"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.address || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Postal Code</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.postal_code || ''}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                      placeholder="e.g., 7530"
                      maxLength={4}
                      pattern="\d{4}"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.postal_code || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Latitude</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || undefined })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                      placeholder="e.g., -33.9249"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.latitude || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Longitude</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || undefined })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                      placeholder="e.g., 18.4241"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.longitude || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-blue-600 text-lg sm:text-xl flex-shrink-0">location_on</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-blue-900 font-black text-xs sm:text-sm mb-1 uppercase tracking-wide">Location Coordinates</h4>
                          <p className="text-blue-800 text-xs sm:text-sm mb-2">
                            Accurate coordinates help customers find your business on maps.
                          </p>
                          <button
                            type="button"
                            onClick={handleAutoGeocode}
                            disabled={geocoding || !formData.address}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
                          >
                            {geocoding ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="hidden sm:inline">Finding...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">my_location</span>
                                <span className="hidden sm:inline">Auto-find</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Business Description</label>
                  {editMode ? (
                    <textarea
                      value={formData.store_description || ''}
                      onChange={(e) => setFormData({ ...formData, store_description: e.target.value })}
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                      placeholder="Describe your business, products, and services..."
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.store_description || 'No description provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg sm:text-xl">contact_phone</span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Responsible Person *</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.responsible_person || ''}
                      onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Full name of responsible person"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.responsible_person || partner.first_name || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Phone Number *</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone || formData.cell_phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value, cell_phone: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="e.g., 082 555 1234"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.phone || partner.cell_phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Email Address *</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="business@example.com"
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-semibold text-sm">{partner.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg sm:text-xl">palette</span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">Branding & Media</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Logo Upload Section */}
                <div>
                  <LogoUpload
                    currentLogoUrl={partner.store_logo_url}
                    onLogoUpdate={handleLogoUpdate}
                    partnerId={partner.id}
                  />
                </div>

                {/* Card Preview Section */}
                <div>
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Live Card Preview</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">This is your actual live card with all animations and effects. Hover over it to see the interactions!</p>
                  
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <AnimatedPartnerCard
                      partner={{
                        id: partner.id,
                        shop_name: editMode ? (formData.shop_name || 'Your Business Name') : partner.shop_name,
                        category: editMode ? (formData.category || 'General Store') : (partner.category || 'General Store'),
                        address: editMode ? (formData.address || 'Address not provided') : (partner.address || 'Address not provided'),
                        cashback_percent: partner.cashback_percent,
                        status: partner.status,
                        store_logo_url: partner.store_logo_url,
                        phone: editMode ? (formData.phone || 'No phone') : (partner.phone || 'No phone')
                      }}
                      onClick={() => {
                        console.log('Preview card clicked');
                      }}
                    />
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="material-symbols-outlined text-green-600 text-lg sm:text-xl flex-shrink-0">auto_awesome</span>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-green-900 font-black text-xs sm:text-sm mb-1 uppercase tracking-wide">Live Interactive Preview</h5>
                        <ul className="text-green-800 text-xs sm:text-sm space-y-0.5">
                          <li>• Full animations and hover effects</li>
                          <li>• Updates in real-time as you edit</li>
                          <li>• Badge color adjusts by cashback %</li>
                          <li>• Upload logo to see it immediately</li>
                          <li>• Appears on homepage and directory</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="p-4 sm:p-6 md:p-8">
              {/* Supplier Expiry Banner */}
              {partner && (
                <SupplierExpiryBanner 
                  partnerId={partner.id} 
                  onClearExpired={handleExpiredSuppliersCleared}
                />
              )}

              <div className="flex items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-lg sm:text-xl">local_shipping</span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 truncate">Business References ({suppliers.length}/3)</h3>
                </div>
                <button
                  onClick={handleAddSupplier}
                  disabled={suppliers.length >= 3 || !canAddSuppliers}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a558b] text-white rounded-lg font-semibold hover:bg-[#1a558b]/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0 transition-all"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">add</span>
                  <span className="hidden sm:inline">Add Reference</span>
                </button>
              </div>

              {suppliers.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-gray-400 block mb-2 sm:mb-4">local_shipping</span>
                  <p className="text-gray-700 font-black text-sm sm:text-base mb-1">No references added yet</p>
                  <p className="text-xs sm:text-sm text-gray-500">Add business references to help build credibility</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {suppliers.map((supplier, idx) => (
                    <div key={supplier.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-white text-xs sm:text-sm">
                            {idx + 1}
                          </div>
                          <h4 className="font-black text-gray-900 text-sm sm:text-base truncate">Reference {idx + 1}</h4>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200">
                          <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Name</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{supplier.name}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200">
                          <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Contact Person</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{supplier.contact_person || '-'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200">
                          <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{supplier.phone || '-'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200">
                          <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Email</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{supplier.email || '-'}</p>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 mb-4 sm:mb-6">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Supplier Name *</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g., ABC Wholesale"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="082 555 1234"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="supplier@example.com"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                  setSupplierForm({ name: '', contact_person: '', phone: '', email: '' });
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupplier}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-semibold rounded-lg transition-all text-sm"
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