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
 */
function Sidebar({ activeTab, onTabChange }) {
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

      {/* Settings Button */}
      <div className="px-3">
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
      </div>
    </nav>
  );
}

export default Sidebar;
