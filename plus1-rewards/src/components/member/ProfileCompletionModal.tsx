import { useNavigate } from 'react-router-dom';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BLUE = '#1a558b';

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleYes = () => {
    navigate('/member/profile');
  };

  const handleNo = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-2xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 relative" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <span className="material-symbols-outlined text-5xl animate-pulse" style={{ color: '#f59e0b' }}>
              notifications_active
            </span>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-4" style={{ borderColor: '#ffffff' }}>
              <span className="text-white text-sm font-bold">1</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#111827' }}>Complete Your Profile</h2>
          <p className="text-base leading-relaxed" style={{ color: '#6b7280' }}>
            To unlock all features and start earning rewards, please complete your profile with:
          </p>
          <div className="mt-6 space-y-3 text-left rounded-xl p-5" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl" style={{ color: BLUE }}>check_circle</span>
              <span style={{ color: '#374151' }}>Email Address</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl" style={{ color: BLUE }}>check_circle</span>
              <span style={{ color: '#374151' }}>SA ID Number</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl" style={{ color: BLUE }}>check_circle</span>
              <span style={{ color: '#374151' }}>City & Address Line 1</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleNo}
            className="flex-1 px-6 py-3 rounded-xl transition-all font-bold text-sm"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
          >
            Later
          </button>
          <button
            onClick={handleYes}
            className="flex-1 px-6 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 text-white hover:opacity-90 text-sm"
            style={{ backgroundColor: BLUE }}
          >
            Complete Now
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
