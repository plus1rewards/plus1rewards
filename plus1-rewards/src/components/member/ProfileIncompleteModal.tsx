// plus1-rewards/src/components/member/ProfileIncompleteModal.tsx

interface ProfileIncompleteModalProps {
  memberName: string;
  percentComplete: number;
  missingFields: string[];
  onClose: () => void;
  onForceClose?: () => void; // Force close even when blocking
  planId?: string; // Plan ID for dismissal tracking
}

export default function ProfileIncompleteModal({
  percentComplete,
  missingFields,
  onClose,
  onForceClose,
  planId
}: ProfileIncompleteModalProps) {
  const handleGoToProfile = () => {
    // Force close the modal (even when blocking)
    if (onForceClose) {
      onForceClose();
    } else {
      onClose();
    }
    
    // Scroll to the edit profile section on the dashboard
    setTimeout(() => {
      const element = document.getElementById('edit-profile-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight the section briefly
        element.classList.add('ring-4', 'ring-orange-500', 'ring-offset-4');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-4');
        }, 2000);
      }
    }, 100);
  };

  const handleRemindMeLater = () => {
    onClose();
  };

  const handleCloseModal = () => {
    // Don't allow closing if paused (100% with incomplete profile)
    if (isBlocking) {
      return;
    }
    if (onForceClose) {
      onForceClose();
    } else {
      onClose();
    }
  };

  const isBlocking = percentComplete >= 100;
  const isSuspended = isBlocking; // Suspended when reaching 100% with incomplete profile
  const isCritical95 = percentComplete >= 95 && percentComplete < 100;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-2xl sm:max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className={`${isSuspended ? 'bg-gradient-to-r from-red-600 to-red-500' : isCritical95 ? 'bg-gradient-to-r from-red-600 to-orange-600' : isBlocking ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'} text-white p-5 sm:p-6 flex-shrink-0`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
                <span className="material-symbols-outlined text-3xl sm:text-4xl">
                  {isSuspended ? 'pause_circle' : isCritical95 ? 'warning' : isBlocking ? 'block' : 'warning'}
                </span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black mb-1 leading-tight">
                  {isSuspended ? 'Plan On Hold!' : isCritical95 ? 'Almost There!' : 'Almost Ready!'}
                </h2>
                <p className="text-white/90 text-xs sm:text-sm font-medium">
                  {isSuspended 
                    ? 'We need a few more details from you'
                    : isCritical95
                    ? 'Just a few more details needed'
                    : 'Your cover is almost fully funded!'
                  }
                </p>
              </div>
            </div>
            {!isBlocking && !isSuspended && !isCritical95 && (
              <button 
                onClick={handleCloseModal} 
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6">
            <div className="mb-5 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold text-gray-600">Your Cover Plan Progress</span>
                <span className="text-xl sm:text-2xl font-black text-[#1a558b]">{percentComplete.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                <div 
                  className={`h-3 sm:h-4 rounded-full transition-all duration-500 ${
                    isSuspended ? 'bg-gradient-to-r from-red-600 to-red-500' : isCritical95 ? 'bg-gradient-to-r from-red-600 to-orange-600' : isBlocking ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(percentComplete, 100)}%` }}
                />
              </div>
            </div>

            <div className={`${isSuspended ? 'bg-red-50 border-red-200' : isCritical95 ? 'bg-orange-50 border-orange-300' : isBlocking ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-300'} border-2 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6`}>
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined ${isSuspended ? 'text-red-600' : isCritical95 ? 'text-orange-600' : isBlocking ? 'text-red-600' : 'text-yellow-600'} text-2xl sm:text-3xl flex-shrink-0`}>
                  {isSuspended ? 'pause_circle' : isCritical95 ? 'error' : isBlocking ? 'block' : 'info'}
                </span>
                <div className="min-w-0">
                  <p className={`${isSuspended ? 'text-red-900' : isCritical95 ? 'text-orange-900' : 'text-yellow-900'} font-bold text-sm sm:text-base mb-2 sm:mb-3 leading-relaxed`}>
                    {isSuspended
                      ? 'Good news! Your cover plan is fully funded. However, we need some personal information before we can activate your cover.'
                      : isCritical95
                      ? 'Your cover plan is almost fully funded! To avoid any delays when it reaches 100%, please add your personal information now.'
                      : 'Great progress! Your cover plan is at 90% funded. To make sure everything goes smoothly when you reach 100%, we need a few personal details from you.'
                    }
                  </p>
                  <p className={`${isSuspended ? 'text-red-800' : isCritical95 ? 'text-orange-800' : 'text-yellow-800'} text-xs sm:text-sm leading-relaxed`}>
                    {isSuspended
                      ? 'Once you fill in the missing information below, we can send your details to Day1Health for final approval.'
                      : isCritical95
                      ? 'This will only take 2 minutes. Without this information, your cover will be put on hold when it reaches 100%.'
                      : 'This will only take 2 minutes and ensures your cover activates immediately when fully funded.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6">
              <p className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-xl sm:text-2xl">edit_note</span>
                We still need:
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {missingFields.map((field, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200">
                    <span className="material-symbols-outlined text-red-500 text-lg sm:text-xl flex-shrink-0">close</span>
                    <span className="font-semibold">{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToProfile}
                className={`w-full ${
                  isSuspended
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
                    : isCritical95
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
                    : isBlocking 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' 
                    : 'bg-gradient-to-r from-[#1a558b] to-[#2d7ab8] hover:from-[#1a558b]/90 hover:to-[#2d7ab8]/90'
                } text-white font-black py-3.5 sm:py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base sm:text-lg`}
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">edit</span>
                <span>Add My Information Now</span>
              </button>

              {!isBlocking && !isSuspended && percentComplete < 95 && (
                <button
                  onClick={handleRemindMeLater}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200 text-sm sm:text-base"
                >
                  I'll Do This Later
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                💡 <span className="font-semibold">Need help?</span> Click the button above and we'll show you exactly where to add your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
