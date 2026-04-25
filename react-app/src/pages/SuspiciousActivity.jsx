import { useState, useEffect } from 'react';
import { Shield, Eye, Flame, FileWarning } from 'lucide-react';
import { getAnomalies, subscribeToAnomalies } from '../api';

export default function SuspiciousActivity() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const [anomalyData] = await Promise.all([
                    getAnomalies()
                ]);

                // Transform anomaly data into event format
                const events = anomalyData.map(a => ({
                    id: String(a.id ?? a._id ?? `${a.device_id}-${a.timestamp}`),
                    timestamp: a.timestamp,
                    time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    period: new Date(a.timestamp).getHours() >= 12 ? 'PM' : 'AM',
                    binId: a.device_id,
                    location: a.location,
                    type: a.type,
                    label: a.type === 'SPIKE' ? 'Rapid Fill Spike' : 
                           a.type === 'OFFLINE' ? 'Signal Lost' : 
                           a.type === 'CONTINUOUS_MOTION' ? 'Repeated PIR' : 'System Alert',
                    details: a.type === 'SPIKE' ? 'Fill level jumped significantly in a short interval. Possible illegal dumping.' :
                             a.type === 'OFFLINE' ? 'Node offline for >4 hours. Possible battery failure or disconnection.' :
                             a.detail || 'Unusual sensor behavior detected.',
                    icon: a.type === 'SPIKE' ? <Flame size={12} /> : 
                          a.type === 'OFFLINE' ? <Shield size={12} /> : 
                          a.type === 'CONTINUOUS_MOTION' ? <Eye size={12} /> : <FileWarning size={12} />,
                    colorClass: a.type === 'SPIKE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                a.type === 'CONTINUOUS_MOTION' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                }));

                setEvents(events.slice(0, 10)); // Top 10 recent
            } catch (err) {
                console.error("Suspicious Activity page failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();

        // Instant WebSocket subscriptions
        const unsubAnomalies = subscribeToAnomalies(() => loadEvents());

        return () => {
            unsubAnomalies();
        };
    }, []);

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Suspicious Events</h1>
                    <p className="text-slate-500 text-sm">Detected anomalies via PIR sensors and AI algorithms.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        {events.length} Active Reports
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
                        <Eye size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Active Anomalies Log</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">Real-time system generated reports</p>
                    </div>
                </div>

                <div className="overflow-x-auto p-4 bg-slate-50/50">
                    <table className="w-full text-left border-collapse min-w-[800px] border-spacing-y-2 border-separate">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-transparent">Time</th>
                                <th className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-transparent">Bin ID / Loc</th>
                                <th className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-transparent">Event Type</th>
                                <th className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-transparent">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100 italic text-slate-400 text-sm">
                                        Loading suspicious activity...
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100 italic text-slate-400 text-sm">
                                        No suspicious activity detected in the last 24 hours.
                                    </td>
                                </tr>
                            ) : (
                                events.map((event, idx) => (
                                    <tr key={`${event.id}-${idx}`} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-300 transition-colors group relative overflow-hidden mb-3">
                                        <td className="p-4 align-top w-24">
                                            <div className="text-sm font-bold text-slate-800">{event.time}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{event.period}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="inline-flex items-center gap-2">
                                                <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{event.binId}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{event.location}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-inner ${event.colorClass}`}>
                                                {event.icon} {event.label}
                                            </span>
                                        </td>
                                        <td className="p-4 align-top w-1/3">
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                {event.details}
                                            </p>
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
