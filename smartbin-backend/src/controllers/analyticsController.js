const { getDb, COLLECTION_SENSORS, COLLECTION_MOTION } = require("../config/db");
const { formatLoc } = require("../services/dataFormatService");
const mlService = require("../services/mlService");

exports.getTrends = async (req, res) => {
    try {
        const db = getDb();
        const hoursBack = parseInt(req.query.hours || "24");
        const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

        const pipeline = [
            { $match: { _received_at: { $gte: since } } },
            { $group: {
                _id: { $hour: "$_received_at" },
                avgFill: { $avg: {
                    $ifNull: ["$ultrasonic.fill_percentage", { $ifNull: ["$fill_percentage", 0] }]
                }},
                avgMoisture: { $avg: {
                    $ifNull: ["$moisture.moisture_percentage", { $ifNull: ["$moisture_percentage", 0] }]
                }},
                maxFill: { $max: {
                    $ifNull: ["$ultrasonic.fill_percentage", { $ifNull: ["$fill_percentage", 0] }]
                }},
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ];

        const result = await db.collection(COLLECTION_SENSORS).aggregate(pipeline).toArray();
        const trends = result.map(r => ({
            hour: r._id,
            label: `${String(r._id).padStart(2, '0')}:00`,
            avgFill: Math.round(r.avgFill || 0),
            avgMoisture: Math.round(r.avgMoisture || 0),
            maxFill: Math.round(r.maxFill || 0),
            readings: r.count
        }));

        res.json(trends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCorrelations = async (req, res) => {
    try {
        const db = getDb();
        const uniqueDevices = await db.collection(COLLECTION_SENSORS).distinct("device_id");
        
        const binDocs = await Promise.all(uniqueDevices.map(async (id) => {
            return await db.collection(COLLECTION_SENSORS)
                .find({ device_id: id }).sort({ _received_at: -1 }).limit(1).next();
        }));
        
        const validDocs = binDocs.filter(d => d);
        if (validDocs.length === 0) return res.json([]);

        const correlations = await Promise.all(validDocs.map(async (doc) => {
            const fill = doc.fill_percentage ?? (doc.ultrasonic?.fill_percentage ?? 0);
            const moisture = doc.moisture_percentage ?? (doc.moisture?.moisture_percentage ?? 0);
            const pirState = doc.pir_state ?? (doc.pir?.pir_state ?? 0);
            const hour = new Date(doc._received_at).getHours();
            
            const clusterId = await mlService.getClusterId(fill, moisture, hour);
            
            const riskScore = Math.round((fill * 0.5) + (moisture * 0.5));
            let riskLevel = "LOW";
            if (riskScore >= 80) riskLevel = "CRITICAL";
            else if (riskScore >= 60) riskLevel = "HIGH";
            else if (riskScore >= 30) riskLevel = "MODERATE";

            const flags = [];
            flags.push(`ML_BEHAVIOR_CLUSTER_${clusterId}`);
            if (fill >= 80 && moisture >= 70) flags.push("WET_OVERFLOW_RISK");
            if (fill >= 80) flags.push("OVERFLOW_RISK");
            if (moisture >= 70) flags.push("HYGIENE_RISK");
            if (fill < 20 && pirState === 1) flags.push("NORMAL_USAGE");

            return {
                device_id: doc.device_id,
                location: formatLoc(doc.location),
                fill, moisture, pirState,
                riskScore, riskLevel, flags,
                ml_cluster: clusterId,
                last_updated: doc._received_at
            };
        }));

        res.json(correlations.sort((a, b) => b.riskScore - a.riskScore));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAnomalies = async (req, res) => {
    try {
        const db = getDb();
        const anomalies = [];
        const uniqueDevices = await db.collection(COLLECTION_SENSORS).distinct("device_id");

        for (const deviceId of uniqueDevices) {
            const recent = await db.collection(COLLECTION_SENSORS)
                .find({ device_id: deviceId }).sort({ _received_at: -1 }).limit(12).toArray();

            if (recent.length < 2) continue;

            if (recent.length >= 1) {
                const latestFill = recent[0].fill_percentage ?? (recent[0].ultrasonic?.fill_percentage ?? 0);
                const latestPir = recent[0].pir_state ?? (recent[0].pir?.pir_state ?? 0);
                const hour = new Date(recent[0]._received_at).getHours();
                
                const isAnomaly = await mlService.checkAnomaly(latestFill, latestPir, hour);
                if (isAnomaly) {
                    anomalies.push({
                        device_id: deviceId, location: formatLoc(recent[0].location),
                        type: "ML_ISOLATION_FOREST_ANOMALY", severity: "HIGH",
                        detail: `Statistically abnormal multivariate behavior detected by ML Model`,
                        timestamp: recent[0]._received_at
                    });
                }
            }

            const latestTime = new Date(recent[0]._received_at).getTime();
            const offlineMinutes = (Date.now() - latestTime) / (1000 * 60);
            if (offlineMinutes > 5) {
                anomalies.push({
                    device_id: deviceId, location: formatLoc(recent[0].location),
                    type: "OFFLINE", severity: offlineMinutes > 15 ? "HIGH" : "MEDIUM",
                    detail: `No data for ${Math.round(offlineMinutes)} minutes`,
                    timestamp: recent[0]._received_at
                });
            }

            if (recent.length >= 10) {
                const fills = recent.slice(0, 10).map(r => r.fill_percentage ?? (r.ultrasonic?.fill_percentage ?? -1));
                if (fills.every(f => f === fills[0] && f >= 0)) {
                    anomalies.push({
                        device_id: deviceId, location: formatLoc(recent[0].location),
                        type: "STUCK", severity: "MEDIUM",
                        detail: `Fill level stuck at ${fills[0]}% for 10 consecutive readings`,
                        timestamp: recent[0]._received_at
                    });
                }
            }

            for (let i = 0; i < recent.length - 1; i++) {
                const curr = recent[i].fill_percentage ?? (recent[i].ultrasonic?.fill_percentage ?? 0);
                const prev = recent[i + 1].fill_percentage ?? (recent[i + 1].ultrasonic?.fill_percentage ?? 0);
                if (prev - curr > 20) {
                    anomalies.push({
                        device_id: deviceId, location: formatLoc(recent[i].location),
                        type: "REVERSAL", severity: "LOW",
                        detail: `Fill dropped ${prev}% → ${curr}% without logged collection`,
                        timestamp: recent[i]._received_at
                    });
                }
            }
        }

        const recentMotion = await db.collection(COLLECTION_MOTION)
            .find().sort({ _received_at: -1 }).limit(50).toArray();
        for (const m of recentMotion) {
            const hr = new Date(m.timestamp || m._received_at).getHours();
            if (hr >= 0 && hr < 5) {
                anomalies.push({
                    device_id: m.device_id, location: formatLoc(m.location),
                    type: "UNUSUAL_HOURS", severity: "MEDIUM",
                    detail: `Motion at ${String(hr).padStart(2, '0')}:${String(new Date(m.timestamp || m._received_at).getMinutes()).padStart(2, '0')} — area should be vacant`,
                    timestamp: m._received_at
                });
            }
        }

        // Historical Continuous Motion Detection
        const motionDevices = [...new Set(recentMotion.map(m => m.device_id))];
        for (const mDev of motionDevices) {
            const devMotions = recentMotion.filter(m => m.device_id === mDev);
            if (devMotions.length >= 3) {
                const oldest = devMotions[devMotions.length - 1]._received_at.getTime();
                const newest = devMotions[0]._received_at.getTime();
                const durationSeconds = (newest - oldest) / 1000;
                const timeSinceLast = (Date.now() - newest) / 1000;
                
                if (durationSeconds >= 30 && durationSeconds < 120 && timeSinceLast < 300) {
                     anomalies.push({
                        device_id: mDev, 
                        location: formatLoc(devMotions[0].location),
                        type: "CONTINUOUS_MOTION", 
                        severity: "HIGH",
                        detail: `Continuous motion detected for ${Math.round(durationSeconds)}s. Possible tampering or loitering.`,
                        timestamp: devMotions[0]._received_at
                    });
                }
            }
        }

        anomalies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(anomalies.slice(0, 20));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPredictions = async (req, res) => {
    try {
        const db = getDb();
        const uniqueDevices = await db.collection(COLLECTION_SENSORS).distinct("device_id");
        const predictions = await Promise.all(uniqueDevices.map(async (id) => {
            const readings = await db.collection(COLLECTION_SENSORS)
                .find({ device_id: id }).sort({ _received_at: -1 }).limit(10).toArray();
            if (readings.length < 2) return null;

            const latest = readings[0];
            const fillNow = latest.fill_percentage ?? (latest.ultrasonic?.fill_percentage ?? 0);
            
            const prev = readings[1] || latest;
            const prevFill = prev.fill_percentage ?? (prev.ultrasonic?.fill_percentage ?? 0);
            const hour = new Date(latest._received_at).getHours();
            const dayOfWeek = new Date(latest._received_at).getDay();

            let fillRatePerHour = 0;
            let etaHours = null;

            const predictedNextFill = await mlService.predictFillRate(hour, dayOfWeek, formatLoc(latest.location), fillNow, prevFill);
            if (predictedNextFill !== null) {
                fillRatePerHour = predictedNextFill - fillNow;
                const remaining = 100 - fillNow;
                etaHours = fillRatePerHour > 0 ? remaining / fillRatePerHour : null;
            }

            return {
                device_id: id,
                location: formatLoc(latest.location),
                currentFill: fillNow,
                fillRatePerHour: Math.round(fillRatePerHour * 100) / 100,
                etaHours: etaHours !== null ? Math.round(etaHours * 10) / 10 : null,
                etaLabel: etaHours !== null
                    ? (etaHours < 1 ? `${Math.round(etaHours * 60)}m` : `${Math.round(etaHours)}h`)
                    : "Stable",
                trend: fillRatePerHour > 2 ? "FAST" : fillRatePerHour > 0 ? "SLOW" : fillRatePerHour < -1 ? "EMPTYING" : "STABLE",
                last_updated: latest._received_at
            };
        }));

        res.json(predictions.filter(p => p).sort((a, b) => (a.etaHours ?? 999) - (b.etaHours ?? 999)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
