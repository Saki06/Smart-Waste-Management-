const { getDb, COLLECTION_SENSORS, COLLECTION_MOTION } = require("../config/db");
const { formatLoc } = require("./dataFormatService");

// Alert thresholds
const FILL_THRESHOLD = parseInt(process.env.ALERT_FILL_THRESHOLD || "85");
const MOISTURE_THRESHOLD = parseInt(process.env.ALERT_MOISTURE_THRESHOLD || "70");

// The alert checking logic from mqtt callback
async function checkThresholdsAndAnomalies(doc, io) {
    const db = getDb();
    const fill = doc.fill_percentage ?? (doc.ultrasonic?.fill_percentage ?? 0);
    const moisture = doc.moisture_percentage ?? (doc.moisture?.moisture_percentage ?? 0);
    
    // Check for threshold alerts
    if (fill >= FILL_THRESHOLD || moisture >= MOISTURE_THRESHOLD) {
        io.emit("new_alert", {
            id: doc._id ?? Math.random().toString(),
            device_id: doc.device_id,
            location: formatLoc(doc.location),
            type: fill >= FILL_THRESHOLD ? "OVERFLOW" : "MOISTURE",
            value: fill >= FILL_THRESHOLD ? fill : moisture,
            timestamp: doc._received_at
        });
    }

    // ANOMALY DETECTION — fill spike
    try {
        const prev = await db.collection(COLLECTION_SENSORS)
            .find({ device_id: doc.device_id, _received_at: { $lt: doc._received_at } })
            .sort({ _received_at: -1 }).limit(1).next();
        if (prev) {
            const prevFill = prev.fill_percentage ?? (prev.ultrasonic?.fill_percentage ?? 0);
            const delta = fill - prevFill;
            if (delta > 30) {
                const anomaly = {
                    device_id: doc.device_id, location: formatLoc(doc.location),
                    type: "SPIKE", severity: "HIGH",
                    detail: `Fill jumped ${prevFill}% → ${fill}% (Δ${delta}%)`,
                    value_before: prevFill, value_after: fill, delta,
                    timestamp: doc._received_at
                };
                io.emit("new_anomaly", anomaly);
            }
        }
    } catch (e) { /* non-critical */ }
}

async function checkMotionAnomaly(doc, io) {
    const db = getDb();
    
    const hour = new Date(doc.timestamp || doc._received_at).getHours();
    if (hour >= 0 && hour < 5) {
        io.emit("new_anomaly", {
            device_id: doc.device_id, location: formatLoc(doc.location),
            type: "UNUSUAL_HOURS", severity: "MEDIUM",
            detail: `Motion detected at ${hour}:00 — campus expected to be vacant`,
            timestamp: doc._received_at
        });
    }

    // CONTINUOUS_MOTION check (30+ seconds)
    try {
        const fortyFiveSecsAgo = new Date(Date.now() - 45000);
        const recentMotions = await db.collection(COLLECTION_MOTION)
            .find({ 
                device_id: doc.device_id, 
                _received_at: { $gte: fortyFiveSecsAgo } 
            })
            .sort({ _received_at: 1 }) // oldest first
            .toArray();

        if (recentMotions.length >= 3) {
            const oldest = recentMotions[0]._received_at.getTime();
            const newest = recentMotions[recentMotions.length - 1]._received_at.getTime();
            const durationSeconds = (newest - oldest) / 1000;
            
            // If duration is > 30 seconds, it's continuous
            if (durationSeconds >= 30) {
                io.emit("new_anomaly", {
                    device_id: doc.device_id, 
                    location: formatLoc(doc.location),
                    type: "CONTINUOUS_MOTION", 
                    severity: "HIGH",
                    detail: `Continuous motion detected for ${Math.round(durationSeconds)}s. Possible tampering or loitering.`,
                    timestamp: doc._received_at
                });
            }
        }
    } catch (e) {
        // fail silently
    }
}

module.exports = {
    FILL_THRESHOLD,
    MOISTURE_THRESHOLD,
    checkThresholdsAndAnomalies,
    checkMotionAnomaly
};
