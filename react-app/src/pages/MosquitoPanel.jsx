import { useState, useEffect } from 'react';
import { Bug, Droplet, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { getAlerts, subscribeToAlerts } from '../api';

export default function MosquitoPanel() {
    const [moistureAlerts, setMoistureAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMoistureData = async () => {
            try {
                const allAlerts = await getAlerts();
                const filtered = allAlerts.filter(a => a.type === 'MOISTURE');
                
                // Group by device_id to only keep the latest alert per bin
                const uniqueAlertsMap = new Map();
                filtered.forEach(alert => {
                    if (!uniqueAlertsMap.has(alert.device_id) || new Date(alert.timestamp) > new Date(uniqueAlertsMap.get(alert.device_id).timestamp)) {
                        uniqueAlertsMap.set(alert.device_id, alert);
                    }
                });
                
                setMoistureAlerts(Array.from(uniqueAlertsMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            } catch (err) {
                console.error("Mosquito page failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadMoistureData();

        const unsubscribe = subscribeToAlerts((newAlert) => {
            if (newAlert.type === 'MOISTURE') {
                setMoistureAlerts(prev => {
                    const updated = [newAlert, ...prev.filter(a => a.device_id !== newAlert.device_id)];
                    return updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                });
            }
        });

        return () => unsubscribe();
    }, []);

    // Derived stats
    const breedingRiskCount = moistureAlerts.filter(a => a.value > 80).length;
    const wetWasteCount = moistureAlerts.length;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Hygiene & Mosquito Risk</h1>
                    <p className="text-slate-500 text-sm">Monitoring wet waste and stagnancy to prevent health hazards.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500"></div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Wet Waste Bins</h3>
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform">
                            <Droplet size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="pl-2">
                        <div className="text-4xl font-black leading-none mb-1 text-slate-900 tracking-tight">{wetWasteCount}</div>
                        <p className="text-xs text-slate-500 font-medium">Elevated moisture detected</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Breeding Risk</h3>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform">
                            <Bug size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="pl-2">
                        <div className="text-4xl font-black leading-none mb-1 text-slate-900 tracking-tight">{breedingRiskCount}</div>
                        <p className={`text-xs font-semibold px-2 rounded-md mt-1 inline-block ${breedingRiskCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {breedingRiskCount > 0 ? 'High Risk detected' : 'System Clear'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">System Status</h3>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                            <CheckCircle size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="pl-2">
                        <div className="text-4xl font-black leading-none mb-1 text-slate-900 tracking-tight">{wetWasteCount === 0 ? '✓' : '!'}</div>
                        <p className={`text-xs font-semibold px-2 rounded-md mt-1 inline-block ${wetWasteCount === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                            {wetWasteCount === 0 ? 'All bins dry — No risk' : `${wetWasteCount} bin(s) need attention`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                            <ShieldAlert size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Requires Immediate Action</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Bins showing signs of persistent moisture.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 flex flex-col gap-4 bg-slate-50/50 min-h-[100px]">
                    {moistureAlerts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm italic text-slate-400 text-sm">
                            No hygiene issues currently detected. All bins are dry.
                        </div>
                    ) : (
                        moistureAlerts.map(alert => (
                            <div key={alert.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-white shadow-sm ring-1 hover:shadow-md transition-shadow ${alert.value > 80 ? 'border-rose-100 ring-rose-50' : 'border-sky-100 ring-sky-50'
                                }`}>
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full shadow-inner flex items-center justify-center shrink-0 border ${alert.value > 80 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-sky-50 text-sky-500 border-sky-100'
                                        }`}>
                                        {alert.value > 80 ? <Bug size={24} /> : <Droplet size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-slate-800 text-base">Bin {alert.device_id} — {alert.location}</h4>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${alert.value > 80 ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                                                }`}>
                                                {alert.value}% Moisture
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl font-medium">
                                            {alert.value > 80
                                                ? "Sustained high moisture reading. Critical mosquito breeding risk identified."
                                                : "Elevated moisture reading. Keep under observation or schedule preventative cleaning."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    {alert.value > 80 ? (
                                        <button className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">
                                            Dispatch Fumigation
                                        </button>
                                    ) : (
                                        <button className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                            Evaluate <ArrowRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
