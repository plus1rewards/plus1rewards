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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-2xl sm:max-w-3xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 sm:max-h-[95vh]">
        {/* Header - Fixed */}
        <div className="bg-[#1a568b] text-white p-4 sm:p-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 flex-shrink-0">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">verified</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black mb-0.5 leading-tight">One More Step!</h2>
                <p className="text-white/80 text-xs sm:text-sm font-medium">
                  Complete verification to activate your cover
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Success Message */}
            <div className="bg-[#37d270]/10 border-2 border-[#37d270] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-[#37d270] rounded-full p-2 flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-black text-sm sm:text-base mb-1.5">
                    🎉 Congratulations, {memberName}!
                  </p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Your cover plan is fully funded! You've earned enough cashback to reach 100%. Now we just need to verify your details with Day1Health.
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
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-black text-sm sm:text-base mb-1.5">What Happens Next?</p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-3">
                    Day1Health needs to verify your information before activating your medical cover. This is a quick process that ensures you're eligible for coverage.
                  </p>
                </div>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm mb-0.5">Click the Button</p>
                      <p className="text-gray-600 text-xs">Opens Day1Health verification page</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm mb-0.5">Find Your Account</p>
                      <p className="text-gray-600 text-xs break-all">Use: <span className="font-bold text-[#1a568b]">{memberPhone}</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm mb-0.5">Answer Questions</p>
                      <p className="text-gray-600 text-xs">Follow the simple steps</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-[#1a568b]/20">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-[#1a568b] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm mb-0.5">Wait for Approval</p>
                      <p className="text-gray-600 text-xs">Usually 1-2 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">schedule</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-black text-xs sm:text-sm mb-1.5">Your Status: Waiting for Verification</p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Your plan will stay in "pending" status until Day1Health approves you. Once approved, your coverage activates automatically and you can start using your benefits!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-4 sm:p-5 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
            <button
              onClick={handleGoToDay1Health}
              className="flex-1 bg-[#1a568b] hover:bg-[#1a568b]/90 text-white font-black py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">open_in_new</span>
              <span>Go to Verification</span>
            </button>

            <button
              onClick={() => {
                // Mark as dismissed so it doesn't reappear immediately
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(`pending_modal_dismissed_temp`, 'true');
                }
                onClose();
              }}
              className="sm:w-auto px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200 text-sm sm:text-base"
            >
              I'll Do This Later
            </button>
          </div>

          {/* Support Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 <span className="font-semibold">Need help?</span> Email us at <span className="font-bold text-[#1a568b]">plus1rewards@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
