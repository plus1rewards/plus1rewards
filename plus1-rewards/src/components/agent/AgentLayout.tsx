import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
}

interface AgentLayoutProps {
  children: ReactNode;
  agent: Agent | null;
  onSignOut: () => void;
}

export default function AgentLayout({ children, agent, onSignOut }: AgentLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col" style={{ backgroundColor: '#f5f8fc' }}>
      <div className="layout-container flex h-full grow flex-col w-full">
        {/* Header */}
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-10 py-3 md:py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Left: Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="+1 Rewards" className="h-8 md:h-10 w-auto object-contain" />
            </a>
            <div className="hidden sm:block h-6 md:h-8 w-px bg-gray-300"></div>
          </div>

          {/* Right: Portal label, online badge, sign out, avatar */}
          <div className="flex flex-1 justify-end items-center gap-2 md:gap-4 lg:gap-6">
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Agent Portal</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26, 85, 139, 0.1)', border: '1px solid rgba(26, 85, 139, 0.2)' }}>
                <span className="flex h-2 w-2 rounded-full bg-[#1a558b]"></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1a558b]">Online</span>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="flex min-w-[70px] md:min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-bold transition-all hover:opacity-90 text-white bg-[#1a558b]"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Exit</span>
            </button>
            {agent && (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 md:size-10"
                style={{
                  backgroundImage: `url("https://ui-avatars.com/api/?name=${encodeURIComponent(`${agent.name} ${agent.surname}`)}&background=1a558b&color=ffffff&size=128&bold=true")`,
                  border: '2px solid rgba(26, 85, 139, 0.25)'
                }}
              ></div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8 space-y-4 sm:space-y-6 md:space-y-8" style={{ paddingTop: '4rem', paddingBottom: '2rem' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                © 2026 +1 Rewards • Agent Portal
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
