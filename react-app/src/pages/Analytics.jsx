import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Clock, AlertTriangle, Zap, Radio, RefreshCw, ArrowDownRight, ArrowUpRight, Minus, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getTrends, getCorrelations, getAnomalies, getPredictions, subscribeToSensors, subscribeToAnomalies } from '../api';

export default function Analytics() {
    const [trends, setTrends] = useState([]);
    const [correlations, setCorrelations] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const loadAll = async () => {
        try {
            const [t, c, a, p] = await Promise.all([
                getTrends(), getCorrelations(), getAnomalies(), getPredictions()
            ]);
            setTrends(t);
            setCorrelations(c);
            setAnomalies(a);
            setPredictions(p);
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Analytics failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();

        const unsubSensors = subscribeToSensors(() => loadAll());
        const unsubAnomalies = subscribeToAnomalies((newAnomaly) => {
            setAnomalies(prev => [newAnomaly, ...prev].slice(0, 20));
        });

        return () => {
            unsubSensors();
            unsubAnomalies();
        };
    }, []);

    const riskColor = (level) => {
        if (level === 'CRITICAL') return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', bar: 'bg-rose-500' };
        if (level === 'HIGH') return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', bar: 'bg-orange-500' };
        if (level === 'MODERATE') return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', bar: 'bg-amber-500' };
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', bar: 'bg-emerald-500' };
    };

    const severityStyle = (sev) => {
        if (sev === 'HIGH') return 'bg-rose-50 text-rose-600 border-rose-100';
        if (sev === 'MEDIUM') return 'bg-amber-50 text-amber-600 border-amber-100';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const anomalyIcon = (type) => {
        if (type === 'SPIKE') return <Zap size={14} />;
        if (type === 'OFFLINE') return <Radio size={14} />;
        if (type === 'UNUSUAL_HOURS') return <ShieldAlert size={14} />;
        if (type === 'STUCK') return <Minus size={14} />;
        return <AlertTriangle size={14} />;
    };

    const trendIcon = (trend) => {
        if (trend === 'FAST') return <ArrowUpRight size={16} className="text-rose-500" />;
        if (trend === 'SLOW') return <ArrowUpRight size={16} className="text-amber-500" />;
        if (trend === 'EMPTYING') return <ArrowDownRight size={16} className="text-emerald-500" />;
        return <Minus size={16} className="text-slate-400" />;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-slate-800 mb-2">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold" style={{ color: p.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                        {p.name}: {p.value}%
                    </div>
                ))}
            </div>
        );
    };

    // Derived visualization data
    const riskDistribution = [
        { name: 'CRITICAL', value: correlations.filter(c => c.riskLevel === 'CRITICAL').length, color: '#f43f5e' },
        { name: 'HIGH', value: correlations.filter(c => c.riskLevel === 'HIGH').length, color: '#f97316' },
        { name: 'MODERATE', value: correlations.filter(c => c.riskLevel === 'MODERATE').length, color: '#f59e0b' },
        { name: 'LOW', value: correlations.filter(c => c.riskLevel === 'LOW').length, color: '#10b981' }
    ].filter(d => d.value > 0);

    const locationFillData = correlations.map(c => ({
        location: c.location,
        fill: c.fill,
        deviceId: c.device_id
    }));

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Data Analysis & Insights</h1>
                    <p className="text-slate-500 text-sm">Temporal trends, correlations, predictions, and anomaly detection.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-medium">
                        Updated {lastRefresh.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={loadAll}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* ===== SECTION 1: TEMPORAL TRENDS ===== */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shadow-sm">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Temporal Trends</h2>
                            <p className="text-[11px] text-slate-500">Hourly average fill and moisture levels (last 24h)</p>
                        </div>
                    </div>
                </div>
                <div className="p-6" style={{ height: 320 }}>
                    {trends.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                            No trend data available yet. Data will appear once sensor readings are collected.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                                <Area type="monotone" dataKey="avgFill" name="Avg Fill" stroke="#f43f5e" strokeWidth={2.5} fill="url(#fillGrad)" dot={{ r: 3, fill: '#f43f5e' }} />
                                <Area type="monotone" dataKey="avgMoisture" name="Avg Moisture" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#moistureGrad)" dot={{ r: 3, fill: '#0ea5e9' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ===== SECTION 2: ADDITIONAL VISUALIZATIONS (BAR & PIE) ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* BAR CHART */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shadow-sm">
                                <BarChart3 size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Current Fill Levels</h2>
                                <p className="text-[11px] text-slate-500">Comparing capacity across all active locations</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col justify-center" style={{ height: 320 }}>
                        {locationFillData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">No data available.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={locationFillData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="location" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="fill" name="Fill Level" radius={[4, 4, 0, 0]}>
                                        {locationFillData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill > 80 ? '#f43f5e' : entry.fill > 60 ? '#f59e0b' : '#10b981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* PIE CHART */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100 shadow-sm">
                                <PieChartIcon size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Risk Distribution</h2>
                                <p className="text-[11px] text-slate-500">Proportion of campus bins by alert severity</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center" style={{ height: 320 }}>
                        {riskDistribution.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">No data available.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={riskDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [`${value} Devices`, `${name} Risk`]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== SECTION 3 + 4: CORRELATIONS & PREDICTIONS GRID ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* CORRELATION RISK CARDS */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-sm">
                            <Activity size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Correlation Risk Scores</h2>
                            <p className="text-[11px] text-slate-500">Composite score: Fill(40%) + Moisture(30%) + Motion(20%) + Age(10%)</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {correlations.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm italic">No device data available.</div>
                        ) : (
                            correlations.map(c => {
                                const colors = riskColor(c.riskLevel);
                                return (
                                    <div key={c.device_id} className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-md`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <span className="text-sm font-extrabold text-slate-800">{c.device_id}</span>
                                                <span className="text-xs text-slate-500 ml-2 font-medium">{c.location}</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${colors.border} ${colors.text} ${colors.bg}`}>
                                                {c.riskLevel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                                                <div className={`h-full rounded-full ${colors.bar} transition-all duration-700`} style={{ width: `${Math.min(100, c.riskScore)}%` }}></div>
                                            </div>
                                            <span className={`text-lg font-black ${colors.text}`}>{c.riskScore}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[10px] font-bold bg-white/80 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Fill: {c.fill}%</span>
                                            <span className="text-[10px] font-bold bg-white/80 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Moisture: {c.moisture}%</span>
                                            <span className="text-[10px] font-bold bg-white/80 text-slate-600 px-2 py-0.5 rounded border border-slate-200">PIR: {c.pirState ? 'ACTIVE' : 'IDLE'}</span>
                                            {c.flags.map(f => (
                                                <span key={f} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${f.includes('RISK') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    {f.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* FILL PREDICTIONS */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm">
                            <Clock size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Fill Rate Predictions</h2>
                            <p className="text-[11px] text-slate-500">Estimated time until each bin reaches capacity</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {predictions.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm italic">Need at least 2 readings per device to compute predictions.</div>
                        ) : (
                            predictions.map(p => (
                                <div key={p.device_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-all group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-inner ${
                                                p.trend === 'FAST' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                p.trend === 'SLOW' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {trendIcon(p.trend)}
                                            </div>
                                            <div>
                                                <span className="text-sm font-extrabold text-slate-800">{p.device_id}</span>
                                                <div className="text-[11px] text-slate-500 font-medium">{p.location}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-black tracking-tight ${
                                                p.etaHours !== null && p.etaHours < 2 ? 'text-rose-500' :
                                                p.etaHours !== null && p.etaHours < 6 ? 'text-amber-500' :
                                                'text-emerald-500'
                                            }`}>
                                                {p.etaLabel}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {p.etaHours !== null ? 'Until Full' : 'No Growth'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${
                                                p.currentFill > 80 ? 'bg-rose-500' :
                                                p.currentFill > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} style={{ width: `${p.currentFill}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 w-12 text-right">{p.currentFill}%</span>
                                    </div>
                                    <div className="mt-2 flex gap-3 text-[10px] font-bold text-slate-400">
                                        <span>Rate: {p.fillRatePerHour > 0 ? '+' : ''}{p.fillRatePerHour}%/hr</span>
                                        <span>Trend: {p.trend}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ===== SECTION 4: ANOMALY LOG ===== */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
                            <ShieldAlert size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Anomaly Detection Log</h2>
                            <p className="text-[11px] text-slate-500">Rule-based detection: spikes, dropouts, stuck sensors, unusual activity</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                        {anomalies.length} detected
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white">
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Time</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Device</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Severity</th>
                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {anomalies.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400 text-sm italic">
                                        No anomalies detected. The system is operating normally.
                                    </td>
                                </tr>
                            ) : (
                                anomalies.map((a, idx) => (
                                    <tr key={`${a.device_id}-${a.type}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-slate-800">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{new Date(a.timestamp).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{a.device_id}</span>
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">{a.location}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border bg-slate-50 text-slate-700 border-slate-200 shadow-inner">
                                                {anomalyIcon(a.type)} {a.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${severityStyle(a.severity)}`}>
                                                {a.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 font-medium max-w-xs truncate">
                                            {a.detail}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
