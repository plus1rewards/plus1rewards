// src/hooks/useSupplierExpiry.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SupplierExpiryData {
  daysRemaining: number;
  isExpired: boolean;
  suppliersUpdatedAt: string | null;
  canAddSuppliers: boolean;
}

export function useSupplierExpiry(partnerId: string) {
  const [expiryData, setExpiryData] = useState<SupplierExpiryData>({
    daysRemaining: -1,
    isExpired: false,
    suppliersUpdatedAt: null,
    canAddSuppliers: true
  });
  const [loading, setLoading] = useState(true);

  const checkSupplierExpiry = async () => {
    if (!partnerId) return;

    try {
      setLoading(true);

      // Get partner data with suppliers info
      const { data: partner, error } = await supabase
        .from('partners')
        .select('suppliers, suppliers_updated_at')
        .eq('id', partnerId)
        .single();

      if (error) throw error;

      if (!partner) {
        setExpiryData({
          daysRemaining: -1,
          isExpired: false,
          suppliersUpdatedAt: null,
          canAddSuppliers: true
        });
        return;
      }

      const hasSuppliers = partner.suppliers && 
                          Array.isArray(partner.suppliers) && 
                          partner.suppliers.length > 0;

      if (!hasSuppliers || !partner.suppliers_updated_at) {
        // No suppliers or no timestamp - can add suppliers
        setExpiryData({
          daysRemaining: -1,
          isExpired: false,
          suppliersUpdatedAt: partner.suppliers_updated_at,
          canAddSuppliers: true
        });
        return;
      }

      // Calculate days remaining
      const suppliersDate = new Date(partner.suppliers_updated_at);
      const now = new Date();
      const daysPassed = Math.floor((now.getTime() - suppliersDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - daysPassed);
      const isExpired = daysPassed >= 30;

      setExpiryData({
        daysRemaining,
        isExpired,
        suppliersUpdatedAt: partner.suppliers_updated_at,
        canAddSuppliers: isExpired || !hasSuppliers
      });

    } catch (error) {
      console.error('Error checking supplier expiry:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearExpiredSuppliers = async () => {
    if (!partnerId) return false;

    try {
      const { error } = await supabase
        .from('partners')
        .update({ 
          suppliers: [],
          suppliers_updated_at: null
        })
        .eq('id', partnerId);

      if (error) throw error;

      // Refresh expiry data
      await checkSupplierExpiry();
      return true;
    } catch (error) {
      console.error('Error clearing expired suppliers:', error);
      return false;
    }
  };

  useEffect(() => {
    checkSupplierExpiry();
  }, [partnerId]);

  return {
    ...expiryData,
    loading,
    refreshExpiry: checkSupplierExpiry,
    clearExpiredSuppliers
  };
}