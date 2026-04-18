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
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header - Fixed */}
        <div className="bg-[#1a568b] text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 flex-shrink-0">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <div>
                <h2 className="text-xl font-black mb-0.5">Verification Required</h2>
                <p className="text-white/80 text-xs font-medium">
                  Complete Day1Health verification to activate your cover
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Success Message */}
          <div className="bg-[#37d270]/10 border-2 border-[#37d270] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#37d270] rounded-full p-2 flex-shrink-0">
                <span className="material-symbols-outlined text-white text-xl">check_circle</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-black text-base mb-1.5">
                  🎉 Congratulations, {memberName}!
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  You've reached 100% funding! Your cover plan has been fully funded through your cashback rewards. You're one step away from activation.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="bg-[#1a568b]/5 border-2 border-[#1a568b]/30 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-[#1a568b] rounded-full p-2 flex-shrink-0">
                <span className="material-symbols-outlined text-white text-xl">task_alt</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-black text-base mb-1.5">Next Step: Day1Health Verification</p>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  To activate your medical cover, complete verification with Day1Health. This ensures you're eligible for coverage and complies with insurance regulations.
                </p>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-2 gap-2.5">
              <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">Visit Portal</p>
                    <p className="text-gray-600 text-xs">Click the button below to open Day1Health verification</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">Find Your Account</p>
                    <p className="text-gray-600 text-xs">Use phone: <span className="font-bold text-[#1a568b]">{memberPhone}</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">Complete Verification</p>
                    <p className="text-gray-600 text-xs">Follow the on-screen instructions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">Wait for Approval</p>
                    <p className="text-gray-600 text-xs">Usually within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-orange-500 rounded-full p-2 flex-shrink-0">
                <span className="material-symbols-outlined text-white text-xl">schedule</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-black text-sm mb-1.5">Current Status: Pending Verification</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your policy will remain in "pending" status until Day1Health approves your verification. Once approved, your policy will automatically activate and you'll receive full coverage!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
            <button
              onClick={handleGoToDay1Health}
              className="flex-1 bg-[#1a568b] hover:bg-[#1a568b]/90 text-white font-black py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
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
              className="sm:w-auto px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200"
            >
              I'll Do This Later
            </button>
          </div>

          {/* Support Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact support at <span className="font-bold text-[#1a568b]">plus1rewards@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
