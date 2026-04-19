import { supabase, supabaseAdmin } from '../../lib/supabase';
import { useState } from 'react';

interface UpgradePromptModalProps {
  currentPlanName: string;
  currentTarget: number;
  fundedAmount: number;
  overflowAmount: number;
  memberId: string;
  coverPlanId: string;
  onUpgrade: () => void;
  onDecline: () => void;
}

export default function UpgradePromptModal({
  currentPlanName,
  currentTarget,
  fundedAmount,
  overflowAmount,
  memberId,
  coverPlanId,
  onUpgrade,
  onDecline
}: UpgradePromptModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Always upgrade to Comprehensive (R665)
  const nextTarget = 665;
  const upgradeCost = nextTarget - currentTarget;
  const hasEnoughOverflow = overflowAmount >= upgradeCost;

  if (currentTarget >= 665) return null; // Already on highest plan

  const handleUpgradeNow = async () => {
    // Don't proceed if insufficient overflow
    if (!hasEnoughOverflow) return;
    setIsProcessing(true);
    try {
      const newOverflow = overflowAmount - upgradeCost;
      const comprehensivePlanId = '534780c5-df97-4ffe-9342-c1566b03e539'; // Comprehensive - Value Plus
      
      // 1. Update member_cover_plans with new plan reference, target amount, overflow, and status
      const { error: updatePlanError } = await supabaseAdmin
        .from('member_cover_plans')
        .update({
          cover_plan_id: comprehensivePlanId,
          target_amount: nextTarget,
          overflow_balance: newOverflow,
          status: 'pending_upgrade'
        })
        .eq('id', coverPlanId);

      if (updatePlanError) {
        console.error('Error updating member cover plan:', updatePlanError);
        throw updatePlanError;
      }

      // 2. Update members table with new plan info and status
      const { error: updateMemberError } = await supabase
        .from('members')
        .update({
          plan_status: 'pending_upgrade',
          cover_plan_name: 'Comprehensive - Value Plus',
          cover_plan_price: nextTarget.toString()
        })
        .eq('id', memberId);

      if (updateMemberError) {
        console.error('Error updating member plan info:', updateMemberError);
        throw updateMemberError;
      }

      // 3. Create wallet entry to record the upgrade deduction
      const { error: walletError } = await supabaseAdmin
        .from('cover_plan_wallet_entries')
        .insert({
          member_id: memberId,
          member_cover_plan_id: coverPlanId,
          entry_type: 'plan_upgrade',
          amount: -upgradeCost,
          balance_after: newOverflow
        });

      if (walletError) {
        console.error('Error creating wallet entry:', walletError);
        throw walletError;
      }

      // 4. Open Day1Health upgrade page in new tab (don't replace current tab)
      window.open('https://www.day1main.com/plus1upgrade', '_blank');
      
      // 5. Call the onUpgrade callback to refresh the dashboard
      onUpgrade();
      
      // 6. Close the modal after successful upgrade
      onDecline();
    } catch (error) {
      console.error('Error processing upgrade:', error);
      alert('Failed to process upgrade. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-2xl sm:max-w-2xl overflow-hidden shadow-2xl flex flex-col sm:max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Upgrade Your Cover</h2>
          <button
            onClick={onDecline}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Plan Info */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">Comprehensive - Value Plus</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Monthly Price: <span className="font-bold text-gray-900">R{nextTarget.toFixed(2)}</span></p>
              <p className="text-xs sm:text-sm text-gray-600">Upgrade Cost: <span className="font-bold text-blue-600">R{upgradeCost.toFixed(2)}</span></p>
            </div>

            {/* Cover Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">What You'll Get:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Doctor Visits</span> - 5 visits per year</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Medication</span> - Acute & chronic prescriptions</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Dental & Eye Care</span> - Basic treatment & tests</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Hospital Cover</span> - Up to R5,000 for 21 days</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Accident Cover</span> - Up to R150,000</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Emergency Ambulance</span> - 24/7 coverage</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Maternity</span> - Up to R25,000</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-base sm:text-lg flex-shrink-0 mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-gray-700"><span className="font-semibold">Funeral Cover</span> - Up to R20,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Your Current Plan:</span>
              <span className="font-bold text-gray-900 text-xs sm:text-sm">{currentPlanName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Upgrading To:</span>
              <span className="font-bold text-gray-900 text-xs sm:text-sm">Comprehensive</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Upgrade Cost:</span>
              <span className="font-bold text-blue-600 text-xs sm:text-sm">R{upgradeCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs sm:text-sm text-gray-600">Your Available Funds:</span>
              <span className="font-bold text-green-600 text-xs sm:text-sm">R{overflowAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Info Note */}
          <div className={`${hasEnoughOverflow ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border-2 rounded-xl p-4 flex items-start gap-3`}>
            <span className={`material-symbols-outlined ${hasEnoughOverflow ? 'text-blue-600' : 'text-red-600'} text-xl sm:text-2xl flex-shrink-0`}>
              {hasEnoughOverflow ? 'info' : 'error'}
            </span>
            <p className={`text-xs sm:text-sm ${hasEnoughOverflow ? 'text-blue-800' : 'text-red-800'} leading-relaxed`}>
              {hasEnoughOverflow 
                ? "Great news! You have enough funds to upgrade. The cost will be deducted from your overflow balance, and you'll be taken to Day1Health to complete the upgrade."
                : `You need R${upgradeCost.toFixed(2)} to upgrade, but you currently have R${overflowAmount.toFixed(2)}. Keep shopping at partner stores to earn more cashback!`
              }
            </p>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row gap-3 px-5 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
            disabled={isProcessing}
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgradeNow}
            disabled={isProcessing || !hasEnoughOverflow}
            className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </>
            ) : (
              'Upgrade Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
