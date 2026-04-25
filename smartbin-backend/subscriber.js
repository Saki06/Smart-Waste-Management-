require("dotenv").config();

const mqtt = require("mqtt");
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "smartbin";

const MQTT_URL = process.env.MQTT_URL || "mqtt://broker.hivemq.com:1883";
const MQTT_TOPICS = (
  process.env.MQTT_TOPICS ||
  "smartbin/sensors,smartbin/motion,smartbin/status"
)
  .split(",")
  .map((topic) => topic.trim())
  .filter(Boolean);

const COLLECTION_SENSORS =
  process.env.MONGO_COLLECTION_SENSORS || "sensor_readings";
const COLLECTION_MOTION =
  process.env.MONGO_COLLECTION_MOTION || "motion_events";
const COLLECTION_STATUS =
  process.env.MONGO_COLLECTION_STATUS || "status_events";
const COLLECTION_FALLBACK =
  process.env.MONGO_COLLECTION_FALLBACK || "raw_messages";

const hasPlaceholderUri =
  !MONGODB_URI ||
  MONGODB_URI.includes("<") ||
  MONGODB_URI.includes(">") ||
  MONGODB_URI.includes("your_mongodb") ||
  MONGODB_URI.includes("cluster-url");

if (hasPlaceholderUri) {
  console.error(
    "Invalid MONGODB_URI in .env. Replace placeholder values with your real MongoDB Atlas URI."
  );
  process.exit(1);
}

function collectionNameForTopic(topic) {
  if (topic === "smartbin/sensors") return COLLECTION_SENSORS;
  if (topic === "smartbin/motion") return COLLECTION_MOTION;
  if (topic === "smartbin/status") return COLLECTION_STATUS;
  return COLLECTION_FALLBACK;
}

function toDocument(topic, payload) {
  const raw = payload.toString();

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      return {
        ...parsed,
        _topic: topic,
        _received_at: new Date(),
        _payload_size: payload.length,
      };
    }

    return {
      value: parsed,
      _topic: topic,
      _received_at: new Date(),
      _payload_size: payload.length,
    };
  } catch (error) {
    return {
      raw_payload: raw,
      _parse_error: true,
      _topic: topic,
      _received_at: new Date(),
      _payload_size: payload.length,
    };
  }
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection(COLLECTION_SENSORS).createIndex({ _received_at: -1 }),
    db.collection(COLLECTION_SENSORS).createIndex({
      device_id: 1,
      timestamp: -1,
    }),
    db.collection(COLLECTION_MOTION).createIndex({ _received_at: -1 }),
    db.collection(COLLECTION_STATUS).createIndex({ _received_at: -1 }),
    db.collection(COLLECTION_FALLBACK).createIndex({ _received_at: -1 }),
  ]);
}

async function main() {
  console.log(`Node.js ${process.version} | OpenSSL ${process.versions.openssl}`);
  console.log(`Connecting to MongoDB: ${MONGODB_DB}...`);

  const mongo = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
  });

  try {
    await mongo.connect();
  } catch (err) {
    if (
      err.message.includes("SSL") ||
      err.message.includes("alert number") ||
      err.message.includes("tls")
    ) {
      console.error("\n=== MongoDB TLS/SSL Connection Error ===");
      console.error(
        "This can happen because of Node.js/OpenSSL compatibility or local certificate issues."
      );
      console.error("Recommended fixes:");
      console.error("  1. Use Node.js v20.19.0 or newer");
      console.error("  2. Check your MongoDB Atlas URI");
      console.error("  3. Check your system CA certificates");
      console.error(`\nOriginal error: ${err.message}\n`);
    }
    throw err;
  }

  const db = mongo.db(MONGODB_DB);
  await ensureIndexes(db);

  console.log(`MongoDB connected: db=${MONGODB_DB}`);

  const mqttClient = mqtt.connect(MQTT_URL, {
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    keepalive: 60,
    clean: true,
    clientId:
      process.env.BRIDGE_CLIENT_ID ||
      `smartbin_bridge_${Math.random().toString(16).slice(2, 8)}`,
  });

  mqttClient.on("connect", () => {
    console.log(`MQTT connected: ${MQTT_URL}`);

    for (const topic of MQTT_TOPICS) {
      mqttClient.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`Subscribe failed: ${topic} | ${err.message}`);
          return;
        }
        console.log(`Subscribed: ${topic}`);
      });
    }
  });

  mqttClient.on("reconnect", () => {
    console.log("MQTT reconnecting...");
  });

  mqttClient.on("close", () => {
    console.log("MQTT connection closed");
  });

  mqttClient.on("offline", () => {
    console.log("MQTT offline");
  });

  mqttClient.on("error", (err) => {
    console.error("MQTT error:", err.message);
  });

  mqttClient.on("message", async (topic, payload) => {
    try {
      const doc = toDocument(topic, payload);
      const collectionName = collectionNameForTopic(topic);
      const result = await db.collection(collectionName).insertOne(doc);

      console.log(
        `[${new Date().toISOString()}] Inserted into ${collectionName} | id=${result.insertedId}`
      );
    } catch (err) {
      console.error("Insert failed:", err.message);
    }
  });

  const shutdown = async () => {
    console.log("Shutting down...");

    try {
      mqttClient.end(true);
      await mongo.close();
      console.log("Connections closed successfully");
    } catch (err) {
      console.error("Shutdown error:", err.message);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});