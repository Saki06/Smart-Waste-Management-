import { useState, useEffect, useRef } from 'react';
import { MapPin, Target, LocateFixed, Trash2, AlertTriangle, Droplets } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import { getBins, subscribeToSensors } from '../api';

// Create custom Tailwind HTML markers for Leaflet map
const createMarker = (colorClass, pingClass) => L.divIcon({
    className: 'bg-transparent',
    html: `<div class="relative w-4 h-4 cursor-pointer">
           <div class="absolute inset-0 rounded-full ${colorClass} border-2 border-white shadow-md z-10 transition-colors duration-500"></div>
           ${pingClass ? `<div class="absolute -inset-1.5 ${pingClass} rounded-full animate-ping z-0"></div>` : ''}
         </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const redIcon = createMarker('bg-rose-500', 'bg-rose-500/40');
const amberIcon = createMarker('bg-amber-500', 'bg-amber-500/40');
const greenIcon = createMarker('bg-emerald-500', null);

export default function RiskMap() {
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);
    const sliitCenter = [6.9147, 79.9723];

    useEffect(() => {
        const loadBins = async () => {
            try {
                const data = await getBins();
                setBins(data);
            } catch (err) {
                console.error("Risk Map failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadBins();

        const unsubscribe = subscribeToSensors((newSensorData) => {
            setBins(prevBins => {
                const index = prevBins.findIndex(b => b.id === newSensorData.id);
                if (index >= 0) {
                    const merged = [...prevBins];
                    merged[index] = { ...merged[index], ...newSensorData };
                    return merged;
                }
                return [newSensorData, ...prevBins];
            });
        });

        return () => unsubscribe();
    }, []);

    const handleCenter = () => {
        if (mapRef.current) {
            mapRef.current.setView(sliitCenter, 17);
        }
    };

    const criticalBinsCount = bins.filter(b => b.fill >= 80).length;
    const warningBinsCount = bins.filter(b => b.fill >= 60 && b.fill < 80).length;

    return (
        <div className="animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Risk Hotspot Map</h1>
                    <p className="text-slate-500 text-sm">Geospatial overview of bin health and risk detection.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-rose-50 transition-colors">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        {criticalBinsCount} Overfill Risks
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-amber-200 text-amber-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-amber-50 transition-colors">
                        {warningBinsCount} Warning Level
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-[500px]">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <MapPin size={16} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Interactive Layer</h2>
                    </div>
                    <button
                        onClick={handleCenter}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-md border border-slate-100 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <LocateFixed size={14} /> Center Malabe Campus
                    </button>
                </div>

                <div className="flex-1 bg-slate-50 relative z-0">
                    <MapContainer
                        center={sliitCenter}
                        zoom={17}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                        ref={mapRef}
                    >
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        <ZoomControl position="bottomright" />

                        {bins.map((bin) => {
                            // If we don't have lat/lng from backend, we might need a fallback.
                            // Assuming backend sends some meaningful coordinates or we use defaults for SLIIT.
                            const pos = bin.lat && bin.lng ? [bin.lat, bin.lng] : sliitCenter;
                            const icon = bin.fill >= 80 ? redIcon : bin.fill >= 60 ? amberIcon : greenIcon;

                            return (
                                <Marker key={bin.id} position={pos} icon={icon}>
                                    <Popup className="rounded-xl border-none font-sans">
                                        <div className="p-2 min-w-[150px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><Trash2 size={16} /></div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">Bin {bin.id}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{bin.location}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-lg font-black text-slate-900">{bin.fill}%</div>
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${bin.fill >= 80 ? 'bg-rose-500' : bin.fill >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${bin.fill}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status: {bin.status}</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-3 rounded-xl border border-slate-200 shadow-md z-[400] max-w-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                                <Target size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">SLIIT Hotspot Analysis</h3>
                                <p className="text-[10px] text-slate-500 font-medium">Real-time geospatial monitor active.</p>
                            </div>
                        </div>
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 px-1">
                                <span>Critical Areas</span>
                                <span className="text-rose-600">{criticalBinsCount}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (criticalBinsCount / (bins.length || 1)) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
