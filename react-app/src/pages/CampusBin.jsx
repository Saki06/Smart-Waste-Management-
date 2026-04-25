import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, ChevronRight, Activity, Thermometer, CheckCircle2 } from 'lucide-react';
import { getBins, subscribeToSensors } from '../api';

export default function CampusBin() {
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Load initial data via REST API
        const loadBins = async () => {
            try {
                const data = await getBins();
                setBins(data);
            } catch (err) {
                console.error("Bins page failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadBins();

        // 2. Listen for instantaneous push updates via WebSocket
        const unsubscribe = subscribeToSensors((newSensorData) => {
            // Find the bin if it exists, or append it if it's new
            setBins(prevBins => {
                const existingIndex = prevBins.findIndex(b => b.id === newSensorData.id);
                if (existingIndex >= 0) {
                    const merged = [...prevBins];
                    merged[existingIndex] = { ...merged[existingIndex], ...newSensorData };
                    return merged;
                }
                return [newSensorData, ...prevBins];
            });
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    // Calculate zone stats dynamically from fetched bins
    const getZoneStats = (zoneName) => {
        const zoneBins = bins.filter(b => b.location.toLowerCase().includes(zoneName.toLowerCase()));
        const criticalCount = zoneBins.filter(b => b.fill >= 80).length;
        const avgFill = zoneBins.length > 0 ? Math.round(zoneBins.reduce((acc, b) => acc + b.fill, 0) / zoneBins.length) : 0;
        return { count: zoneBins.length, critical: criticalCount, avg: avgFill };
    };

    const canteenStats = getZoneStats('Canteen');
    const mainBuildingStats = getZoneStats('Main building');
    const newBuildingStats = getZoneStats('New building');
    const mainGateStats = getZoneStats('Main Gate');

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Campus Bins</h1>
                    <p className="text-slate-500 text-sm">Monitor specific bin volumes across all campus zones.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Campus Avg Fill */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-6 flex flex-col justify-between group">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Campus Average Volume</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Overall capacity of SLIIT campus</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100 group-hover:scale-105 transition-transform">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-end gap-2 mb-3">
                            <span className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                                {bins.length > 0 ? Math.round(bins.reduce((acc, b) => acc + b.fill, 0) / bins.length) : '...'}
                            </span>
                            <span className="text-xl font-bold text-slate-400 mb-1">%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${(bins.reduce((acc, b) => acc + b.fill, 0) / (bins.length || 1)) > 70 ? 'bg-rose-500' : 'bg-amber-500'
                                    }`}
                                style={{ width: `${bins.length > 0 ? (bins.reduce((acc, b) => acc + b.fill, 0) / bins.length) : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Campus-wide average is monitored live. Collection expected when threshold is exceeded.
                        </p>
                    </div>
                </div>

                {/* Zones List */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-6 flex flex-col h-full">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-6">Zone Status Breakdown</h2>
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-sm shadow-inner">A</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Canteen</div>
                                    <div className="text-[11px] font-medium text-slate-500">{canteenStats.critical} Bins critical</div>
                                </div>
                            </div>
                            <span className={`font-bold text-base ${canteenStats.avg > 80 ? 'text-rose-500' : 'text-amber-500'}`}>{canteenStats.avg}%</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm shadow-inner">B</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Main Building</div>
                                    <div className="text-[11px] font-medium text-slate-500">{mainBuildingStats.critical > 0 ? `${mainBuildingStats.critical} Bins filling fast` : 'All clear'}</div>
                                </div>
                            </div>
                            <span className={`font-bold text-base ${mainBuildingStats.avg > 80 ? 'text-rose-500' : 'text-amber-500'}`}>{mainBuildingStats.avg}%</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-sm shadow-inner">C</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">New Building</div>
                                    <div className="text-[11px] font-medium text-slate-500">{newBuildingStats.avg > 0 ? 'Active' : 'All clear'}</div>
                                </div>
                            </div>
                            <span className={`font-bold text-base ${newBuildingStats.avg > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>{newBuildingStats.avg}%</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shadow-inner">D</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">SLIIT Main Gate</div>
                                    <div className="text-[11px] font-medium text-slate-500">{mainGateStats.avg > 0 ? 'Active' : 'All clear'}</div>
                                </div>
                            </div>
                            <span className={`font-bold text-base ${mainGateStats.avg > 80 ? 'text-rose-500' : 'text-indigo-500'}`}>{mainGateStats.avg}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bin List Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Active Bins Detail</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">Showing top risk bins</p>
                    </div>
                    <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                        View Directory <ChevronRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white">
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Bin ID</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Location</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Capacity</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Health</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bins.map((bin) => (
                                <tr key={bin.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bin.fill > 80 ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                bin.fill > 60 ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                                    'bg-emerald-50 text-emerald-500 border-emerald-100'
                                                }`}><Trash2 size={16} /></div>
                                            <span className="text-sm font-extrabold text-slate-800">{bin.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-600">{bin.location}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${bin.fill > 80 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            bin.fill > 60 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${bin.fill > 80 ? 'bg-rose-500' : bin.fill > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></span> {bin.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`text-sm font-bold ${bin.fill > 80 ? 'text-rose-500' : bin.fill > 60 ? 'text-amber-500' : 'text-emerald-500'
                                                }`}>{bin.fill}%</div>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${bin.fill > 80 ? 'bg-rose-500' : bin.fill > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${bin.fill}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                                                {bin.fill > 80 ? (
                                                    <><AlertCircle size={14} className="text-rose-500" /> <span className="text-slate-700">Overflow imminent</span></>
                                                ) : (
                                                    <><CheckCircle2 size={14} className="text-emerald-500" /> <span className="text-slate-700">Optimal condition</span></>
                                                )}
                                            </span>
                                            <div className="flex items-center gap-3 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 w-max shadow-sm">
                                                <div className="flex items-center gap-1.5" title="Ultrasonic (Distance)">
                                                    <div className="w-5 h-5 rounded-md bg-blue-100/60 flex items-center justify-center text-blue-600 font-bold border border-blue-200/50">↕</div>
                                                    <span className="text-xs font-bold text-slate-700">{bin.distance_cm !== null ? `${bin.distance_cm} cm` : '--'}</span>
                                                </div>
                                                <div className="w-px h-6 bg-slate-200"></div>
                                                <div className="flex items-center gap-1.5" title="Moisture (Raw ADC)">
                                                    <div className="w-5 h-5 rounded-md bg-sky-100/60 flex items-center justify-center text-sky-600 border border-sky-200/50"><Thermometer size={12} /></div>
                                                    <span className="text-xs font-bold text-slate-700">{bin.moisture_adc !== null ? `${bin.moisture_adc} ADC` : '--'}</span>
                                                </div>
                                                <div className="w-px h-6 bg-slate-200"></div>
                                                <div className="flex items-center gap-1.5" title="PIR Motion Sensor">
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${bin.pir_state === 1 ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-200/50 text-slate-500 border-slate-200'}`}>
                                                        <Activity size={12} />
                                                    </div>
                                                    <span className={`text-xs font-bold ${bin.pir_state === 1 ? 'text-rose-600' : 'text-slate-500'}`}>
                                                        {bin.pir_state === 1 ? 'MOTION' : 'CLEAR'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

