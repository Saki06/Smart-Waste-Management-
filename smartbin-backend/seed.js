require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "smartbin";
const COLLECTION_SENSORS = process.env.MONGO_COLLECTION_SENSORS || "sensor_readings";
const COLLECTION_MOTION = process.env.MONGO_COLLECTION_MOTION || "motion_events";

async function main() {
    const action = process.argv[2] || "seed"; // 'seed' or 'clear'

    if (!MONGODB_URI || MONGODB_URI.includes("<")) {
        console.error("❌ Invalid MONGODB_URI in .env");
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        console.log(`✅ Connected to MongoDB: ${MONGODB_DB}`);

        if (action === "clear") {
            const res1 = await db.collection(COLLECTION_SENSORS).deleteMany({ _isMock: true });
            const res2 = await db.collection(COLLECTION_MOTION).deleteMany({ _isMock: true });
            console.log(`🧹 Cleared mock data:`);
            console.log(`   - ${res1.deletedCount} sensor readings deleted`);
            console.log(`   - ${res2.deletedCount} motion events deleted`);
        } else if (action === "seed") {
            console.log("🌱 Generating mock data for the last 7 days...");
            
            // Clear previous mock data first to avoid duplicates
            await db.collection(COLLECTION_SENSORS).deleteMany({ _isMock: true });
            await db.collection(COLLECTION_MOTION).deleteMany({ _isMock: true });

            const now = Date.now();
            const sensorDocs = [];
            const motionDocs = [];

            const bins = [
                { id: "BIN_A01", loc: "SLIIT Basement Canteen", lat: 6.914896, lng: 79.973303 },
                { id: "BIN_B02", loc: "Main building", lat: 6.914844, lng: 79.972690 },
                { id: "BIN_C03", loc: "New building", lat: 6.915313, lng: 79.973920 },
                { id: "BIN_D04", loc: "SLIIT Main Gate", lat: 6.914164, lng: 79.972383 }
            ];

            // Generate 7 days of data (1 reading per hour per bin to simulate trends)
            const totalHours = 168; // 7 days * 24 hours
            for (let hourOffset = totalHours; hourOffset >= 0; hourOffset--) {
                const timestamp = new Date(now - hourOffset * 60 * 60 * 1000);
                const isNight = timestamp.getHours() >= 0 && timestamp.getHours() < 5;
                const isLunch = timestamp.getHours() >= 12 && timestamp.getHours() <= 14;

                bins.forEach(bin => {
                    // Simulate a periodic emptying cycle every ~48 hours
                    const hoursSinceEmpty = (totalHours - hourOffset) % 48;
                    
                    let fill = Math.min(100, Math.max(0, 5 + hoursSinceEmpty * 1.9 + (Math.random() * 8)));
                    let moisture = Math.min(100, Math.max(0, 10 + hoursSinceEmpty * 1.2 + (Math.random() * 10)));
                    let pirState = isNight ? 0 : (Math.random() > 0.6 ? 1 : 0);

                    // --- Anomaly Generations ---
                    
                    // 1. STUCK: BIN_B02 is stuck at 45% fill for the last 15 hours
                    if (bin.id === "BIN_B02" && hourOffset <= 15) {
                        fill = 45;
                    }

                    // 2. SPIKE: BIN_C03 has a huge spike in the last hour
                    if (bin.id === "BIN_C03" && hourOffset === 0) {
                        fill = 95; // jumped suddenly
                    } else if (bin.id === "BIN_C03") {
                        fill = 30; // was low before
                    }

                    // 3. REVERSAL: BIN_D04 goes down magically
                    if (bin.id === "BIN_D04" && hourOffset === 2) {
                        fill = 80;
                    } else if (bin.id === "BIN_D04" && hourOffset === 1) {
                        fill = 30; // dropped!
                    }

                    // 4. UNUSUAL HOURS MOTION: BIN_A01 at 3 AM
                    if (bin.id === "BIN_A01" && timestamp.getHours() === 3) {
                        pirState = 1;
                        motionDocs.push({
                            _isMock: true,
                            device_id: bin.id,
                            location: bin.loc,
                            motion_detected: true,
                            timestamp: timestamp.toISOString(),
                            _received_at: timestamp
                        });
                    }

                    // 5. OFFLINE: BIN_D04 hasn't reported in the last 2 hours
                    if (bin.id === "BIN_D04" && hourOffset < 2) {
                        return; // Skip reading to trigger offline anomaly
                    }

                    // 6. HIGH MOISTURE (Risk Correlation without triggering OVERFLOW priority)
                    if (bin.id === "BIN_A01" && (isLunch || hourOffset === 0)) {
                        fill = 80; // Keep below 85 so it prioritizes MOISTURE alert
                        moisture = 85; // High wet waste risk
                    }

                    // Derived values for realistic table rendering
                    const distance = Math.round(100 - fill); // fake distance
                    const adc = Math.round(4095 - (moisture * 40.95)); // fake adc
                    const fillStatus = fill >= 80 ? "FULL" : fill >= 50 ? "MEDIUM" : "EMPTY";
                    const moistStatus = moisture >= 70 ? "WET" : "DRY";

                    sensorDocs.push({
                        _isMock: true,
                        device_id: bin.id,
                        location: bin.loc,
                        fill_percentage: Math.round(fill),
                        distance_cm: distance,
                        fill_status: fillStatus,
                        moisture_percentage: Math.round(moisture),
                        adc_value: adc,
                        moisture_status: moistStatus,
                        pir_state: pirState,
                        _received_at: timestamp
                    });
                });
            }

            // Insert into DB
            if (sensorDocs.length > 0) {
                const r1 = await db.collection(COLLECTION_SENSORS).insertMany(sensorDocs);
                console.log(`✅ Inserted ${r1.insertedCount} mock sensor readings.`);
            }
            if (motionDocs.length > 0) {
                const r2 = await db.collection(COLLECTION_MOTION).insertMany(motionDocs);
                console.log(`✅ Inserted ${r2.insertedCount} mock motion events.`);
            }

            console.log("\n🎉 Seed complete! Check your Analytics & Dashboard pages now.");
            console.log("To remove this data later, run: npm run clear");
        } else {
            console.log(`❌ Unknown action: ${action}. Use 'seed' or 'clear'.`);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

main();
