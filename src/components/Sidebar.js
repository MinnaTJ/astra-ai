import {
  Sparkles,
  MessageSquare,
  LayoutDashboard,
  FileCheck,
  Settings
} from 'lucide-react';
import { AppTab } from '@/constants';

/**
 * Navigation sidebar component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Tab change handler
 * @param {string} props.userName - User's name
 * @param {string} props.userEmail - User's email
 */
function Sidebar({ activeTab, onTabChange, userName, userEmail }) {
  const navItems = [
    { id: AppTab.ASSISTANT, icon: MessageSquare, label: 'Assistant' },
    { id: AppTab.DASHBOARD, icon: LayoutDashboard, label: 'Tracker' },
    { id: AppTab.RESUME, icon: FileCheck, label: 'Resume Lab' }
  ];

  return (
    <nav className="w-20 md:w-64 border-r border-white/5 glass flex flex-col items-center md:items-stretch py-6 z-20">
      {/* Logo */}
      <div className="px-6 mb-12 flex items-center gap-3">
        <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/20">
          <Sparkles className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight hidden md:block">
          Astra <span className="text-violet-400 font-light">AI</span>
        </h1>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 space-y-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === id
              ? 'bg-violet-600 text-white glow'
              : 'text-gray-400 hover:bg-white/5'
              }`}
          >
            <Icon size={20} />
            <span className="font-medium hidden md:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Settings & Profile */}
      <div className="px-3 space-y-2">
        <button
          onClick={() => onTabChange(AppTab.SETTINGS)}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === AppTab.SETTINGS
            ? 'bg-violet-600 text-white glow'
            : 'text-gray-400 hover:bg-white/5'
            }`}
        >
          <Settings size={20} />
          <span className="font-medium hidden md:block">Settings</span>
        </button>

        {userName && (
          <div className="hidden md:flex items-center gap-3 px-4 py-4 mt-6 border-t border-white/5">
            <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{userName}</span>
              <span className="text-[10px] text-gray-500 truncate">{userEmail}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
