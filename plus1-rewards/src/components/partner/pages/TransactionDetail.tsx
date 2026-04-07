// src/components/partner/pages/TransactionDetail.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface Transaction {
  id: string;
  created_at: string;
  purchase_amount: number;
  cashback_percent: number;
  system_amount: number;
  agent_amount: number;
  member_amount: number;
  status: string;
  member_id: string;
  partner_id: string;
  agent_id: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactionDetail();
  }, [transactionId]);

  const loadTransactionDetail = async () => {
    try {
      // Get transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (txError) throw txError;
      setTransaction(txData);

      // Get member details
      if (txData.member_id) {
        const { data: memberData } = await supabase
          .from('members')
          .select('id, first_name, last_name, phone')
          .eq('id', txData.member_id)
          .single();

        if (memberData) setMember(memberData);
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-900 mb-4">Transaction not found</p>
          <button
            onClick={() => navigate('/partner/transaction-history')}
            className="bg-[#1a558b] text-white px-6 py-2 rounded-xl font-semibold"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transaction Detail</h1>
          <p className="text-sm text-gray-500 mt-1">View complete transaction information</p>
        </div>
        <button
          onClick={() => navigate('/partner/transaction-history')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
      </div>

      {/* Transaction ID Card */}
      <div className="bg-gradient-to-br from-[#1a558b] to-[#2563eb] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-3xl">receipt_long</span>
          <div>
            <p className="text-sm text-blue-100">Transaction ID</p>
            <p className="text-xl font-black">{transaction.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <p className="text-sm text-blue-100">
            {new Date(transaction.created_at).toLocaleString('en-ZA', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </p>
        </div>
      </div>

      {/* Member Information */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">person</span>
          Member Information
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Name</span>
            <span className="font-bold text-gray-900">{`${member?.first_name} ${member?.last_name}`.trim() || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone</span>
            <span className="font-bold text-gray-900">{member?.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Transaction Amounts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">payments</span>
          Transaction Amounts
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
            <span className="text-gray-600">Purchase Amount</span>
            <span className="text-2xl font-black text-gray-900">
              R{transaction.purchase_amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cashback Rate</span>
            <span className="font-bold text-[#1a558b]">{transaction.cashback_percent}%</span>
          </div>
        </div>
      </div>

      {/* Cashback Split */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">pie_chart</span>
          Cashback Split Breakdown
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">settings</span>
              <span className="text-gray-700 font-semibold">System Fee (1%)</span>
            </div>
            <span className="font-black text-[#1a558b]">R{transaction.system_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">support_agent</span>
              <span className="text-gray-700 font-semibold">Agent Commission (1%)</span>
            </div>
            <span className="font-black text-[#1a558b]">R{transaction.agent_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">person</span>
              <span className="text-gray-700 font-semibold">Member Reward</span>
            </div>
            <span className="font-black text-green-600 text-lg">R{transaction.member_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1a558b]">info</span>
          Status & Actions
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Transaction Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              transaction.status === 'synced' ? 'bg-green-100 text-green-700' :
              transaction.status === 'pending_sync' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {transaction.status}
            </span>
          </div>
          <button
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border-2 border-red-200"
          >
            <span className="material-symbols-outlined">report_problem</span>
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}
