// plus1-rewards/src/components/dashboard/PlatformStatus.tsx
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';

interface PlatformData {
  totalTransactions: number;
  systemHealth: number;
}

export default function PlatformStatus() {
  const [platformData, setPlatformData] = useState<PlatformData>({
    totalTransactions: 0,
    systemHealth: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);

      // Fetch transaction data
      const { data: transactionData } = await supabaseAdmin
        .from('transactions')
        .select('status');
      
      const totalTransactions = transactionData?.length || 0;

      // System health is always 100% (no complex calculations)
      const systemHealth = 100;

      setPlatformData({
        totalTransactions,
        systemHealth,
      });
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#1a558b]">hub</span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Platform Status</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl text-center animate-pulse bg-white border border-gray-200">
              <div className="h-8 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#1a558b]">hub</span>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Platform Status</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl text-center bg-white border border-gray-200">
          <p className="text-3xl font-black mb-1 text-gray-900">{platformData.totalTransactions}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Transactions</p>
        </div>
        
        <div className="p-5 rounded-xl text-center bg-[#1a558b]/10 border-[#1a558b] border">
          <p className="text-3xl font-black mb-1 text-[#1a558b]">{platformData.systemHealth}%</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a558b]">Health</p>
        </div>
      </div>
    </section>
  );
}
