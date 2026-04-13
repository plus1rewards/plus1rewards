// plus1-rewards/src/components/member/MemberLayout.tsx
import { ReactNode } from 'react';
import MemberTopbar from './MemberTopbar';
import MemberFooter from './MemberFooter';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}

interface MemberLayoutProps {
  children: ReactNode;
  member: Member | null;
  isOnline: boolean;
  pendingTransactions: number;
  onSignOut: () => void;
  wide?: boolean;
}

export default function MemberLayout({ children, member, isOnline, pendingTransactions, onSignOut, wide }: MemberLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col" style={{ backgroundColor: '#f5f8fc' }}>
      <div className="layout-container flex h-full grow flex-col w-full">
        <MemberTopbar 
          member={member}
          isOnline={isOnline}
          pendingTransactions={pendingTransactions}
          onSignOut={onSignOut}
        />
        <main className={`flex-1 w-full mx-auto px-4 py-6 md:px-8 md:py-8 space-y-4 md:space-y-6 ${wide ? 'max-w-[1400px]' : 'max-w-5xl'}`} style={{ paddingTop: '4.5rem' }}>
          {children}
        </main>
        <MemberFooter />
      </div>
    </div>
  );
}
