import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Trash2, LayoutDashboard, Settings, ShieldAlert, UserCircle, BarChart3 } from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Campus Maps', path: '/map', icon: Map },
        { name: 'Bin Status', path: '/bins', icon: Trash2 },
        { name: 'Mosquito Risk', path: '/mosquito-panel', icon: LayoutDashboard },
        { name: 'Suspicious Activity', path: '/suspicious-activity', icon: ShieldAlert },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Student Portal', path: '/student-portal', icon: UserCircle },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-all duration-300">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg shadow-emerald-500/20">
                    S
                </div>
                <span className="text-white font-bold text-lg tracking-tight">SmartBin</span>
            </div>

            <div className="px-4 py-6 flex-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main Menu</div>
                <nav className="space-y-1">
                    {navItems.map(item => {
                        const isActive = location.pathname.includes(item.path) || (item.name === 'Dashboard' && location.pathname === '/dashboard');
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                    : 'hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full" />}
                                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'} strokeWidth={2.5} />
                                <span className="text-sm">{item.name}</span>
                                {item.badge && (
                                    <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-800">
                <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-slate-800 hover:text-white text-slate-400">
                    <Settings size={18} strokeWidth={2.5} />
                    <span className="text-sm">Settings</span>
                </Link>
                <div className="mt-4 flex items-center gap-3 px-3 py-2">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=10b981&color=fff" alt="User" className="w-9 h-9 rounded-full ring-2 ring-slate-800" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Administrator</p>
                        <p className="text-xs text-slate-500 truncate">admin@sliit.lk</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
