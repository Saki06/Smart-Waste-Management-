const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "smartbin";

const COLLECTION_SENSORS = process.env.MONGO_COLLECTION_SENSORS || "sensor_readings";
const COLLECTION_MOTION = process.env.MONGO_COLLECTION_MOTION || "motion_events";
const COLLECTION_STATUS = process.env.MONGO_COLLECTION_STATUS || "status_events";
const COLLECTION_FALLBACK = process.env.MONGO_COLLECTION_FALLBACK || "raw_messages";
const COLLECTION_REPORTS = "student_reports";
const COLLECTION_RATINGS = "student_ratings";

let dbInstance;

async function ensureIndexes(database) {
    await Promise.all([
        database.collection(COLLECTION_SENSORS).createIndex({ _received_at: -1 }),
        database.collection(COLLECTION_SENSORS).createIndex({ device_id: 1, _received_at: -1 }),
        database.collection(COLLECTION_MOTION).createIndex({ _received_at: -1 }),
    ]);
}

async function connectToMongo() {
    if (!MONGODB_URI || MONGODB_URI.includes("<")) {
        console.error("❌ Invalid MONGODB_URI in .env");
        process.exit(1);
    }
    const mongo = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    try {
        await mongo.connect();
        dbInstance = mongo.db(MONGODB_DB);
        await ensureIndexes(dbInstance);
        console.log(`Connected to MongoDB: ${MONGODB_DB}`);
        return dbInstance;
    } catch (err) {
        console.error("MongoDB Connection Failed:", err.message);
        process.exit(1);
    }
}

function getDb() {
    if (!dbInstance) {
        throw new Error("Database not initialized. Call connectToMongo first.");
    }
    return dbInstance;
}

module.exports = {
    connectToMongo,
    getDb,
    COLLECTION_SENSORS,
    COLLECTION_MOTION,
    COLLECTION_STATUS,
    COLLECTION_FALLBACK,
    COLLECTION_REPORTS,
    COLLECTION_RATINGS
};
