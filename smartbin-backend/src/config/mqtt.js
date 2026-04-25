const mqtt = require("mqtt");
const { getDb, COLLECTION_FALLBACK, COLLECTION_SENSORS, COLLECTION_MOTION, COLLECTION_STATUS } = require("./db");
const { formatBinDoc } = require("../services/dataFormatService");
const { checkThresholdsAndAnomalies, checkMotionAnomaly } = require("../services/alertService");

function setupMQTT(io) {
    const MQTT_URL = process.env.MQTT_URL || "mqtt://broker.hivemq.com:1883";
    const MQTT_TOPICS = (process.env.MQTT_TOPICS || "smartbin/sensors,smartbin/motion,smartbin/status")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

    const mqttClient = mqtt.connect(MQTT_URL, {
        reconnectPeriod: 5000,
        clientId: process.env.BRIDGE_CLIENT_ID || `smartbin_bridge_${Math.random().toString(16).slice(2, 8)}`,
    });

    const db = getDb();

    mqttClient.on("connect", () => {
        console.log(`MQTT connected: ${MQTT_URL}`);
        MQTT_TOPICS.forEach((topic) => {
            mqttClient.subscribe(topic, (err) => {
                if (err) {
                    console.error(`Subscribe failed: ${topic} | ${err.message}`);
                    return;
                }
                console.log(`Subscribed: ${topic}`);
            });
        });
    });

    mqttClient.on("reconnect", () => {
        console.log("MQTT reconnecting...");
    });

    mqttClient.on("offline", () => {
        console.log("MQTT offline");
    });

    mqttClient.on("error", (err) => {
        console.error("MQTT error:", err.message);
    });

    mqttClient.on("message", async (topic, message) => {
        try {
            const parsed = JSON.parse(message.toString());
            const doc = { ...parsed, _topic: topic, _received_at: new Date() };

            let collectionName = COLLECTION_FALLBACK;
            if (topic === "smartbin/sensors") collectionName = COLLECTION_SENSORS;
            else if (topic === "smartbin/motion") collectionName = COLLECTION_MOTION;
            else if (topic === "smartbin/status") collectionName = COLLECTION_STATUS;

            await db.collection(collectionName).insertOne(doc);

            // REAL-TIME WEBSOCKET PUSH
            if (topic === "smartbin/sensors") {
                const formattedRecord = await formatBinDoc(doc);
                io.emit("new_sensor_data", formattedRecord);

                await checkThresholdsAndAnomalies(doc, io);

            } else if (topic === "smartbin/motion") {
                io.emit("new_motion", {
                    ...doc,
                    id: doc._id ?? Math.random().toString(),
                    timestamp: doc.timestamp || doc._received_at
                });

                checkMotionAnomaly(doc, io);
            }

        } catch (err) {
            console.error("Failed to process MQTT message:", err.message);
        }
    });

    return mqttClient;
}

module.exports = { setupMQTT };
