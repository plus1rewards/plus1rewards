interface UpgradePromptModalProps {
  currentPlanName: string;
  currentTarget: number;
  fundedAmount: number;
  overflowAmount: number;
  onUpgrade: () => void;
  onDecline: () => void;
}

export default function UpgradePromptModal({
  currentPlanName,
  currentTarget,
  fundedAmount,
  overflowAmount,
  onUpgrade,
  onDecline
}: UpgradePromptModalProps) {
  const nextTarget = currentTarget === 390 ? 665 : 0;
  const additionalNeeded = nextTarget - fundedAmount;

  if (nextTarget === 0) return null; // Already on highest plan

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="bg-[#1a558b] text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">celebration</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Congratulations!</h2>
              <p className="text-sm text-white/90">Your plan is fully funded with overflow cashback</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center">
            Would you like to upgrade to a higher plan?
          </p>

          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Plan:</span>
              <span className="font-bold text-gray-900">{currentPlanName} (R{currentTarget})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your Balance:</span>
              <span className="font-bold text-green-600">R{fundedAmount.toFixed(2)} (fully funded)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overflow Amount:</span>
              <span className="font-bold text-purple-600">R{overflowAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Upgrade Option */}
          <div className="bg-blue-50 border-2 border-[#1a558b] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#1a558b]">upgrade</span>
              <p className="font-bold text-gray-900">Upgrade Option</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Upgrade to:</span> Comprehensive - Value Plus (R{nextTarget})
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">Additional needed:</span> R{additionalNeeded.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-yellow-600 text-sm mt-0.5">info</span>
            <p className="text-xs text-yellow-800">
              This prompt will show again on your next login if you don't upgrade now
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              No, Keep Current Plan
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 px-4 py-3 rounded-xl bg-[#1a558b] text-white font-bold hover:bg-[#1a558b]/90 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Yes, Upgrade My Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
