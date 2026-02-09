import {
    MessageSquare,
    LayoutDashboard,
    FileCheck,
    Settings
} from 'lucide-react';
import { AppTab } from '@/constants';

/**
 * Mobile bottom navigation component
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Tab change handler
 */
function MobileNav({ activeTab, onTabChange }) {
    const navItems = [
        { id: AppTab.ASSISTANT, icon: MessageSquare, label: 'Assistant' },
        { id: AppTab.DASHBOARD, icon: LayoutDashboard, label: 'Tracker' },
        { id: AppTab.RESUME, icon: FileCheck, label: 'Resume' },
        { id: AppTab.SETTINGS, icon: Settings, label: 'Settings' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-950/80 backdrop-blur-xl border-t border-white/5 z-50 px-2 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all ${activeTab === id
                                ? 'text-violet-400'
                                : 'text-gray-500'
                            }`}
                    >
                        <div className={`p-1 rounded-xl transition-all ${activeTab === id ? 'bg-violet-500/10' : ''
                            }`}>
                            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
                        </div>
                        <span className="text-[10px] font-medium tracking-tight">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

export default MobileNav;
