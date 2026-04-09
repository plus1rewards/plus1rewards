// plus1-rewards/src/components/member/ProfileIncompleteModal.tsx

interface ProfileIncompleteModalProps {
  memberName: string;
  percentComplete: number;
  missingFields: string[];
  onClose: () => void;
  onForceClose?: () => void; // Force close even when blocking
  onChangePlan?: () => void; // Option to change plan at 90%
  currentPlanName?: string;
  canChangePlan?: boolean; // Whether user can still change plan
  planId?: string; // Plan ID for dismissal tracking
}

export default function ProfileIncompleteModal({
  percentComplete,
  missingFields,
  onClose,
  onForceClose,
  onChangePlan,
  currentPlanName,
  canChangePlan = true,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`${isSuspended ? 'bg-gradient-to-r from-red-600 to-red-500' : isCritical95 ? 'bg-gradient-to-r from-red-600 to-orange-600' : isBlocking ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'} text-white p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <span className="material-symbols-outlined text-4xl">
                  {isSuspended ? 'pause_circle' : isCritical95 ? 'warning' : isBlocking ? 'block' : 'warning'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-black mb-1">
                  {isSuspended ? 'Plan PAUSED!' : isCritical95 ? 'URGENT: Complete Now!' : 'Action Needed!'}
                </h2>
                <p className="text-white/90 text-sm font-medium">
                  {isSuspended 
                    ? 'Your plan reached 100% but profile is incomplete'
                    : isCritical95
                    ? 'Your policy will be PAUSED at 100% if incomplete'
                    : 'Your cover plan is almost ready!'
                  }
                </p>
              </div>
            </div>
            {!isBlocking && !isSuspended && !isCritical95 && (
              <button 
                onClick={handleCloseModal} 
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Cover Plan Progress</span>
              <span className="text-lg font-black text-[#1a558b]">{percentComplete.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  isSuspended ? 'bg-gradient-to-r from-red-600 to-red-500' : isCritical95 ? 'bg-gradient-to-r from-red-600 to-orange-600' : isBlocking ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}
                style={{ width: `${Math.min(percentComplete, 100)}%` }}
              />
            </div>
          </div>

          <div className={`${isSuspended ? 'bg-red-50 border-red-200' : isCritical95 ? 'bg-red-50 border-red-300' : isBlocking ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border-2 rounded-xl p-4 mb-6`}>
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined ${isSuspended ? 'text-red-600' : isCritical95 ? 'text-red-700' : isBlocking ? 'text-red-600' : 'text-yellow-600'} text-2xl`}>
                {isSuspended ? 'pause_circle' : isCritical95 ? 'error' : isBlocking ? 'block' : 'info'}
              </span>
              <div>
                <p className={`${isSuspended ? 'text-red-900' : isCritical95 ? 'text-red-900 font-black' : 'text-yellow-900'} font-bold mb-2`}>
                  {isSuspended
                    ? '⏸️ Your cover plan has been PAUSED because it reached 100% with incomplete profile information.'
                    : isCritical95
                    ? '🚨 CRITICAL: Your policy will be AUTOMATICALLY PAUSED at 100% if you do not complete your profile NOW!'
                    : '⚠️ Your cover plan is at 90%+ completion. Please complete your dashboard now!'
                  }
                </p>
                <p className={`${isSuspended ? 'text-red-800' : isCritical95 ? 'text-red-800 text-sm' : 'text-yellow-800'} text-sm`}>
                  {isSuspended
                    ? 'Complete your profile information to change your plan status to pending. Once complete, you can proceed with Day1Health verification.'
                    : isCritical95
                    ? 'You are at 95%+ completion. At 100%, your entire policy will be PAUSED if your profile is incomplete. Complete your information immediately to avoid being paused.'
                    : 'To ensure smooth activation when you reach 100%, please fill in your details now.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-gray-900 mb-3">Missing Information:</p>
            <ul className="space-y-2">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="material-symbols-outlined text-red-500 text-lg">close</span>
                  <span>{field}</span>
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
                  ? 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700'
                  : isBlocking 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-[#1a558b] to-[#2d7ab8] hover:from-[#1a558b]/90 hover:to-[#2d7ab8]/90'
              } text-white font-black py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
            >
              <span className="material-symbols-outlined text-2xl">dashboard</span>
              <span>{isCritical95 ? 'Complete Profile NOW' : 'Go to Member Dashboard'}</span>
            </button>

            {!isBlocking && !isSuspended && !isCritical95 && onChangePlan && (
              <button
                onClick={onChangePlan}
                disabled={!canChangePlan}
                className={`w-full ${
                  canChangePlan
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
                    : 'bg-gray-400 text-gray-600 py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2'
                }`}
                title={!canChangePlan ? 'You can only change your plan once' : ''}
              >
                <span className="material-symbols-outlined text-2xl">swap_horiz</span>
                <span>{canChangePlan ? 'Change Plan' : 'Plan Already Changed'}</span>
              </button>
            )}

            {!isBlocking && !isSuspended && percentComplete < 95 && (
              <button
                onClick={handleRemindMeLater}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200"
              >
                Remind Me Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
