// plus1-rewards/src/components/member/PendingVerificationModal.tsx

interface PendingVerificationModalProps {
  memberName: string;
  memberPhone: string;
  onClose: () => void;
}

export default function PendingVerificationModal({
  memberName,
  memberPhone,
  onClose
}: PendingVerificationModalProps) {
  
  const handleGoToDay1Health = () => {
    window.open('https://www.day1main.com/plus1confirm', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <span className="material-symbols-outlined text-4xl">pending_actions</span>
              </div>
              <div>
                <h2 className="text-2xl font-black mb-1">Verification Required!</h2>
                <p className="text-white/90 text-sm font-medium">
                  Your cover plan is ready for activation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-600 text-3xl">celebration</span>
              <div>
                <p className="text-green-900 font-bold mb-2">
                  🎉 Congratulations! You've reached 100% funding!
                </p>
                <p className="text-green-800 text-sm">
                  Your cover plan has been fully funded through your cashback rewards. You're one step away from activation!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
              <div>
                <p className="text-blue-900 font-bold mb-2">Next Step: Day1Health Verification</p>
                <p className="text-blue-800 text-sm mb-3">
                  To activate your medical cover, you need to complete verification with our insurance provider, Day1Health. This ensures you're eligible for coverage.
                </p>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Visit the Day1Health verification portal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Find your account using your phone number: <span className="font-bold">{memberPhone}</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Complete the verification steps</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>Wait for admin approval (usually within 24-48 hours)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-600 text-2xl">schedule</span>
              <div>
                <p className="text-yellow-900 font-bold mb-1">Status: Pending Verification</p>
                <p className="text-yellow-800 text-sm">
                  Your policy will remain in "pending" status until Day1Health approves your verification. Once approved, your policy will automatically activate!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToDay1Health}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-2xl">open_in_new</span>
              <span>Go to Day1Health Verification</span>
            </button>

            <button
              onClick={() => {
                // Mark as dismissed so it doesn't reappear immediately
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(`pending_modal_dismissed_temp`, 'true');
                }
                onClose();
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200"
            >
              I'll Do This Later
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact support at support@plus1rewards.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
