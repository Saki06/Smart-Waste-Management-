import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Activity, Target, Zap, Waves, MoreHorizontal } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { getStats, getAlerts, getBins, subscribeToSensors, subscribeToAlerts } from '../api';

// Create custom Tailwind HTML markers for Leaflet map
const createMarker = (colorClass, pingClass) => L.divIcon({
    className: 'bg-transparent',
    html: `<div class="relative w-4 h-4 cursor-pointer">
           <div class="absolute inset-0 rounded-full ${colorClass} border-2 border-white shadow-md z-10"></div>
           ${pingClass ? `<div class="absolute -inset-1.5 ${pingClass} rounded-full animate-ping z-0"></div>` : ''}
         </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const redIcon = createMarker('bg-rose-500', 'bg-rose-500/40');
const amberIcon = createMarker('bg-amber-500', '');
const greenIcon = createMarker('bg-emerald-500', '');

export default function Dashboard() {
    // SLIIT Campus focal point
    const mapCenter = [6.9147, 79.9723];

    const [stats, setStats] = useState({
        criticalBins: '...',
        campusAvgFill: '...',
        moistureWarnings: '...',
        activeMotion: '...'
    });

    const [alerts, setAlerts] = useState([]);
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        try {
            const [newStats, newAlerts, newBins] = await Promise.all([
                getStats(),
                getAlerts(),
                getBins()
            ]);
            setStats(newStats);
            setAlerts(newAlerts);
            setBins(newBins);
        } catch (err) {
            console.error("Dashboard failed to fetch live data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        loadDashboardData();

        // Listen for live updates
        const unsubSensors = subscribeToSensors(() => {
            // When ANY sensor updates, quickly refetch stats to update KPI cards
            loadDashboardData();
        });

        const unsubAlerts = subscribeToAlerts((newAlert) => {
            setAlerts(prev => {
                const updated = [newAlert, ...prev.filter(a => a.id !== newAlert.id)];
                return updated.slice(0, 5); // Keep top 5
            });
        });

        return () => {
            unsubSensors();
            unsubAlerts();
        };
    }, []);

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Overview Dashboard</h1>
                    <p className="text-slate-500 text-sm">Real-time metrics and system health monitoring.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm">
                        <option>All Zones</option>
                        <option>Academic Block</option>
                        <option>Cafeteria Area</option>
                    </select>
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-slate-500/20">
                        Export Report
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* KPI Card 1 */}
                <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={20} strokeWidth={2.5} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                            Live
                        </span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Filled Bins</h3>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.criticalBins}</div>
                    </div>
                </div>

                {/* KPI Card 2 */}
                <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Campus Avg Fill</h3>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.campusAvgFill}<span className="text-xl text-slate-400 font-bold ml-1">%</span></div>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Across all monitored zones</p>
                    </div>
                </div>

                {/* KPI Card 3: Moisture Warnings */}
                <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                            <Waves size={20} strokeWidth={2.5} />
                        </div>
                        {stats.moistureWarnings > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md">
                                Risk
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Moisture Warnings</h3>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.moistureWarnings}</div>
                    </div>
                </div>

                {/* KPI Card 4: Active Motion */}
                <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        {stats.activeMotion > 0 && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Active Motion</h3>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.activeMotion}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map View */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Interactive Campus Map</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Live view of bin statuses</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal size={18} /></button>
                    </div>
                    <div className="flex-1 bg-slate-50 relative z-0">
                        <MapContainer
                            center={mapCenter}
                            zoom={17}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={false}
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                            <ZoomControl position="bottomright" />

                            {/* Dynamic Markers */}
                            {bins.map((bin) => {
                                const pos = bin.lat && bin.lng ? [bin.lat, bin.lng] : mapCenter;
                                const icon = bin.fill >= 80 ? redIcon : bin.fill >= 60 ? amberIcon : greenIcon;
                                const statusClass = bin.fill >= 80 ? 'bg-rose-100 text-rose-600' : bin.fill >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600';
                                const statusText = bin.fill >= 80 ? 'Critical' : bin.fill >= 60 ? 'Warning' : `${bin.fill}% Full`;

                                return (
                                    <Marker key={bin.id} position={pos} icon={icon}>
                                        <Popup className="rounded-xl border-none font-sans">
                                            <div className="p-1 font-bold text-slate-800">Bin {bin.id} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${statusClass}`}>{statusText}</span></div>
                                            <div className="text-xs text-slate-500 px-1">{bin.location}</div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>

                        {/* Label Overlay */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-[11px] font-bold text-slate-600 z-[400]">
                            SLIIT Campus, Malabe
                        </div>
                    </div>
                </div>

                {/* Priority Alerts */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div> Priority Alerts
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs italic">All systems clear. No active alerts.</div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${alert.type === 'OVERFLOW' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-sky-50 text-sky-500 border-sky-100'
                                        }`}>
                                        {alert.type === 'OVERFLOW' ? <AlertTriangle size={18} /> : <Waves size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-slate-800 truncate">
                                                {alert.type === 'OVERFLOW' ? `Bin ${alert.device_id} Overflow` : `Moisture Alert: ${alert.device_id}`}
                                            </h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${alert.type === 'OVERFLOW' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-sky-600 bg-sky-50 border-sky-100'
                                                }`}>
                                                {alert.type === 'OVERFLOW' ? 'Critical' : 'Warning'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            {alert.type === 'OVERFLOW' ? `${alert.value}% full at ${alert.location}.` : `High moisture (${alert.value}%) at ${alert.location}.`}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
                                            <Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                        <button className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                            View All Alerts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
