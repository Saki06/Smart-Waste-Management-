const { getDb, COLLECTION_MOTION } = require("../config/db");

const locationCoords = {
    'SLIIT Basement Canteen': '(6.914896, 79.973303)',
    'Main building': '(6.914844, 79.972690)',
    'New building': '(6.915313, 79.973920)',
    'SLIIT Main Gate': '(6.914164, 79.972383)',
    'Auditorium': '(6.914266, 79.972637)'
};

const formatLoc = (loc) => loc || 'Unknown';

const BIN_LOCATIONS = {
    "BIN_A01": { lat: 6.914896, lng: 79.973303, name: "SLIIT Basement Canteen" },
    "BIN_B02": { lat: 6.914844, lng: 79.972690, name: "Main Building" },
    "BIN_C03": { lat: 6.915313, lng: 79.973920, name: "New Building" },
    "BIN_D04": { lat: 6.914164, lng: 79.972383, name: "SLIIT Main Gate" },
    "BIN_001": { lat: 6.914266, lng: 79.972637, name: "Auditorium" }
};

async function formatBinDoc(doc) {
    if (!doc) return null;

    const db = getDb();
    const recentMotion = await db.collection(COLLECTION_MOTION).find({
        device_id: doc.device_id,
        _received_at: { $gte: new Date(Date.now() - 30000) }
    }).limit(1).next();

    const knownLoc = BIN_LOCATIONS[doc.device_id];

    return {
        id: doc.device_id,
        location: formatLoc(doc.location),
        fill: doc.fill_percentage ?? (doc.ultrasonic?.fill_percentage ?? 0),
        status: doc.fill_status || (doc.ultrasonic?.status || "UNKNOWN"),
        moisture: doc.moisture_percentage ?? (doc.moisture?.moisture_percentage ?? 0),
        moistureStatus: doc.moisture_status || (doc.moisture?.status || "UNKNOWN"),
        lat: doc.lat ?? doc.latitude ?? (doc.gps?.lat ?? doc.gps?.latitude ?? (knownLoc?.lat ?? null)),
        lng: doc.lng ?? doc.longitude ?? (doc.gps?.lng ?? doc.gps?.longitude ?? (knownLoc?.lng ?? null)),
        distance_cm: doc.distance_cm ?? (doc.ultrasonic?.distance_cm ?? doc.ultrasonic?.distance_cm_avg ?? null),
        moisture_adc: doc.adc_value ?? (doc.moisture?.adc_value ?? null),
        pir_state: recentMotion ? 1 : 0,
        motion_detected: !!recentMotion,
        last_updated: doc._received_at
    };
}

module.exports = {
    formatLoc,
    formatBinDoc,
    BIN_LOCATIONS,
    locationCoords
};
