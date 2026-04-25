import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-emerald-500/20 selection:text-emerald-900">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Subtle background glow effect */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                <Topbar />
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
