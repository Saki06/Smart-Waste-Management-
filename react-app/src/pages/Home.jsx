import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Activity } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-emerald-500/20">
            {/* Decorative background blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Navigation */}
            <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
                        S
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">SmartBin</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/student-portal" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden md:block">
                        Student Portal
                    </Link>
                    <Link to="/dashboard" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-md">
                        Staff Portal
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 pt-10 pb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium text-sm mb-8 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Real-time AI monitoring active on SLIIT Campus
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-4xl mx-auto">
                    Smart Waste <br className="hidden md:block" /> Management System
                </h1>

                <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Predictive analytics and real-time sensor data working together for a cleaner, greener, and more sustainable campus.
                </p>

                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Link to="/dashboard" className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-3.5 rounded-full text-base font-semibold hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
                        Open Dashboard <ArrowRight size={18} />
                    </Link>
                </div>
            </main>

            {/* Feature grid */}
            <div className="bg-white border-t border-slate-100 py-20 relative z-10">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-5 border border-emerald-100">
                            <Activity size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Real-Time Insights</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">Monitor bin fill levels instantly. Prevent overflows before they happen with live sensor data.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 mb-5 border border-sky-100">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Hygiene Detection</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">Automated alerts for unauthorized dumping and mosquito breeding risks based on moisture levels.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-5 border border-amber-100">
                            <Leaf size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Eco-Friendly</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">Optimize collection routes, reduce fuel consumption, and lower the campus carbon footprint.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
