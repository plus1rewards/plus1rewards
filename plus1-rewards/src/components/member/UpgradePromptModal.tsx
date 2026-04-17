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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Upgrade Your Cover Plan</h2>
          <button
            onClick={onDecline}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Plan Info */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Comprehensive - Value Plus</h3>
              <p className="text-sm text-gray-600 mb-1">Price: <span className="font-bold text-gray-900">R{nextTarget.toFixed(2)}</span>/month</p>
              <p className="text-sm text-gray-600">Upgrade Cost: <span className="font-bold text-blue-600">R{upgradeCost.toFixed(2)}</span></p>
            </div>

            {/* Cover Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">What's Included:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Doctor Managed Doctor Visits</span> - 5 visits per member per annum</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Acute Chronic Medication</span> - According to Day1Health formulary</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Dentistry / Optometry</span> - Basic treatment & eye tests</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Private Hospital Benefits</span> - Up to R5,000 for 21 days</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Accident/Trauma Benefit</span> - Up to R150,000 per member</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">24 Hour Emergency Ambulance</span> - Immediate cover</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Maternity Benefit</span> - Up to R25,000 (12 month waiting period)</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">check_circle</span>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Family Funeral Benefit</span> - Up to R20,000 principal member</p>
                </div>
              </div>
            </div>

            {/* View Brochure Button */}
            <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">description</span>
              View Full Brochure
            </button>
          </div>

          {/* Plan Comparison */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Current Plan:</span>
              <span className="font-bold text-gray-900">{currentPlanName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">New Plan:</span>
              <span className="font-bold text-gray-900">Comprehensive - Value Plus</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Upgrade Cost:</span>
              <span className="font-bold text-blue-600">R{upgradeCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Your Overflow Balance:</span>
              <span className="font-bold text-green-600">R{overflowAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Info Note */}
          <div className={`${hasEnoughOverflow ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3 flex items-start gap-2`}>
            <span className={`material-symbols-outlined ${hasEnoughOverflow ? 'text-amber-600' : 'text-red-600'} text-lg flex-shrink-0 mt-0.5`}>
              {hasEnoughOverflow ? 'info' : 'error'}
            </span>
            <p className={`text-xs ${hasEnoughOverflow ? 'text-amber-800' : 'text-red-800'} leading-relaxed`}>
              {hasEnoughOverflow 
                ? "Your overflow balance will be used to cover the upgrade cost. You'll be redirected to Day1Health to complete the upgrade."
                : `You need R${upgradeCost.toFixed(2)} to upgrade, but you only have R${overflowAmount.toFixed(2)} overflow. Keep earning cashback to reach the required amount!`
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isProcessing}
          >
            Remind Me Later
          </button>
          <button
            onClick={handleUpgradeNow}
            disabled={isProcessing || !hasEnoughOverflow}
            className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
