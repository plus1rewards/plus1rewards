// plus1-rewards/src/components/member/MemberTopbar.tsx
interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}

interface MemberTopbarProps {
  member: Member | null;
  isOnline: boolean;
  pendingTransactions: number;
  onSignOut: () => void;
}

const BLUE = '#1a558b';

export default function MemberTopbar({ member, isOnline, pendingTransactions, onSignOut }: MemberTopbarProps) {
  const avatarUrl = member
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=1a558b&color=ffffff&size=128&bold=true`
    : '';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-10 py-3"
      style={{
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <a href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
        <img src="/logo.png" alt="+1 Rewards" className="h-8 md:h-10 w-auto object-contain" />
      </a>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Member Portal</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26,85,139,0.1)', border: '1px solid rgba(26,85,139,0.2)' }}>
            <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: isOnline ? BLUE : '#6b7280' }} />
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: isOnline ? BLUE : '#6b7280' }}>
              {isOnline ? 'Online' : `Offline · ${pendingTransactions} pending`}
            </span>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="cursor-pointer flex items-center justify-center rounded-lg h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-bold transition-all hover:opacity-90 text-white"
          style={{ backgroundColor: BLUE }}
        >
          Sign out
        </button>
        {avatarUrl && (
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 md:size-10 flex-shrink-0"
            style={{ backgroundImage: `url("${avatarUrl}")`, border: `2px solid ${BLUE}40` }}
          />
        )}
      </div>
    </header>
  );
}
