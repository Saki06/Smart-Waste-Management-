const { getDb, COLLECTION_SENSORS, COLLECTION_MOTION } = require("../config/db");
const { formatBinDoc, formatLoc } = require("../services/dataFormatService");
const { FILL_THRESHOLD, MOISTURE_THRESHOLD } = require("../services/alertService");

exports.getStats = async (req, res) => {
    try {
        const db = getDb();
        const uniqueDevices = await db.collection(COLLECTION_SENSORS).distinct("device_id");
        const latestReadings = await Promise.all(
            uniqueDevices.map(id => db.collection(COLLECTION_SENSORS).find({ device_id: id }).sort({ _received_at: -1 }).limit(1).next())
        );
        const activeReadings = latestReadings.filter(r => r);

        const criticalBins = activeReadings.filter(r => {
            const fill = r.fill_percentage ?? (r.ultrasonic?.fill_percentage ?? 0);
            return fill >= FILL_THRESHOLD;
        }).length;

        const moistureWarnings = activeReadings.filter(r => {
            const moisture = r.moisture_percentage ?? (r.moisture?.moisture_percentage ?? 0);
            return moisture >= MOISTURE_THRESHOLD;
        }).length;

        const recentMotionDevices = await db.collection(COLLECTION_MOTION).distinct("device_id", {
            _received_at: { $gte: new Date(Date.now() - 30000) }
        });
        const activeMotion = recentMotionDevices.length;

        const totalFill = activeReadings.reduce((acc, r) => {
            const fill = r.fill_percentage ?? (r.ultrasonic?.fill_percentage ?? 0);
            return acc + fill;
        }, 0);
        const avgFill = activeReadings.length > 0 ? Math.round(totalFill / activeReadings.length) : 0;

        res.json({
            criticalBins,
            campusAvgFill: avgFill,
            moistureWarnings,
            activeMotion,
            activeDevices: uniqueDevices.length,
            timestamp: new Date()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBins = async (req, res) => {
    try {
        const db = getDb();
        const uniqueDevices = await db.collection(COLLECTION_SENSORS).distinct("device_id");
        const binData = await Promise.all(
            uniqueDevices.map(async (id) => {
                const doc = await db.collection(COLLECTION_SENSORS).find({ device_id: id }).sort({ _received_at: -1 }).limit(1).next();
                return await formatBinDoc(doc);
            })
        );
        res.json(binData.filter(b => b));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentMotion = async (req, res) => {
    try {
        const db = getDb();
        const events = await db.collection(COLLECTION_MOTION).find().sort({ _received_at: -1 }).limit(20).toArray();
        res.json(events.map(e => ({ ...e, id: e._id, timestamp: e.timestamp || e._received_at })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const db = getDb();
        const criticalSensors = await db.collection(COLLECTION_SENSORS)
            .find({
                $or: [
                    { "ultrasonic.fill_percentage": { $gte: FILL_THRESHOLD } },
                    { "moisture.moisture_percentage": { $gte: MOISTURE_THRESHOLD } },
                    { "fill_percentage": { $gte: FILL_THRESHOLD } },
                    { "moisture_percentage": { $gte: MOISTURE_THRESHOLD } }
                ]
            })
            .sort({ _received_at: -1 })
            .limit(10)
            .toArray();

        res.json(criticalSensors.map(c => ({
            id: c._id,
            device_id: c.device_id,
            location: formatLoc(c.location),
            type: (c.fill_percentage >= FILL_THRESHOLD || (c.ultrasonic && c.ultrasonic.fill_percentage >= FILL_THRESHOLD)) ? "OVERFLOW" : "MOISTURE",
            value: (c.fill_percentage >= FILL_THRESHOLD || (c.ultrasonic && c.ultrasonic.fill_percentage >= FILL_THRESHOLD))
                ? (c.fill_percentage || c.ultrasonic?.fill_percentage)
                : (c.moisture_percentage || c.moisture?.moisture_percentage),
            timestamp: c._received_at
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
