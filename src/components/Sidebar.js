import { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  LayoutDashboard,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AppTab } from '@/constants';
import { useSettings } from '@/contexts';

/**
 * Navigation sidebar component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Tab change handler
 */
function Sidebar({ activeTab, onTabChange }) {
  const { settings } = useSettings();
  const { userName, userEmail } = settings;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: AppTab.ASSISTANT, icon: MessageSquare, label: 'Assistant' },
    { id: AppTab.DASHBOARD, icon: LayoutDashboard, label: 'Tracker' },
    { id: AppTab.RESUME, icon: FileCheck, label: 'Resume Lab' }
  ];

  return (
    <nav className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-64'} border-r border-white/5 glass flex-col py-6 z-20 relative transition-all duration-300`} role="tablist" aria-label="Main navigation">
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-gray-800 border border-white/10 rounded-full p-1.5 text-gray-400 hover:text-white z-50 shadow-lg hover:scale-110 transition-all"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className={`px-6 mb-12 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
        <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/20 shrink-0">
          <Sparkles className="text-white" size={24} />
        </div>
        {!isCollapsed && (
          <h1 className="text-xl font-bold tracking-tight hidden md:block whitespace-nowrap">
            Astra <span className="text-violet-400 font-light">AI</span>
          </h1>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 space-y-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            role="tab"
            aria-selected={activeTab === id}
            aria-label={label}
            className={`w-full flex items-center gap-4 py-3 rounded-2xl transition-all ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${activeTab === id
              ? 'bg-violet-600 text-white glow'
              : 'text-gray-400 hover:bg-white/5'
              }`}
            title={isCollapsed ? label : undefined}
          >
            <Icon size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-medium hidden md:block whitespace-nowrap">{label}</span>}
          </button>
        ))}
      </div>

      {/* Settings & Profile */}
      <div className="px-3 space-y-2">
        <button
          onClick={() => onTabChange(AppTab.SETTINGS)}
          role="tab"
          aria-selected={activeTab === AppTab.SETTINGS}
          aria-label="Settings"
          className={`w-full flex items-center gap-4 py-3 rounded-2xl transition-all ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${activeTab === AppTab.SETTINGS
            ? 'bg-violet-600 text-white glow'
            : 'text-gray-400 hover:bg-white/5'
            }`}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium hidden md:block whitespace-nowrap">Settings</span>}
        </button>

        {userName && (
          <div className={`hidden md:flex items-center gap-3 py-4 mt-6 border-t border-white/5 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
            <div className="h-9 w-9 shrink-0 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold" title={isCollapsed ? userName : undefined}>
              {userName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate">{userName}</span>
                <span className="text-[10px] text-gray-500 truncate">{userEmail}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
