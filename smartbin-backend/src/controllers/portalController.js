const { getDb, COLLECTION_REPORTS, COLLECTION_RATINGS } = require("../config/db");
const { formatLoc } = require("../services/dataFormatService");

exports.submitReport = async (req, res) => {
    try {
        const db = getDb();
        const { problemType, location, details, studentId } = req.body;
        if (!problemType || !location) {
            return res.status(400).json({ error: "problemType and location are required" });
        }
        const report = {
            problemType,
            location,
            details: details || "",
            studentId: studentId || "anonymous",
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await db.collection(COLLECTION_REPORTS).insertOne(report);
        
        // Use the global io instance attached to app, or passed via req.app.get("io")
        const io = req.app.get("io");
        if (io) {
            io.emit("new_report", { ...report, _id: result.insertedId });
        }

        res.status(201).json({ success: true, id: result.insertedId, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const db = getDb();
        const reports = await db.collection(COLLECTION_REPORTS)
            .find()
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        res.json(reports.map(r => ({
            id: r._id,
            problemType: r.problemType,
            location: formatLoc(r.location),
            details: r.details,
            studentId: r.studentId,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitRating = async (req, res) => {
    try {
        const db = getDb();
        const { location, rating, comment } = req.body;
        if (!location || !rating) {
            return res.status(400).json({ error: "location and rating are required" });
        }
        const ratingDoc = {
            location,
            rating: Math.min(5, Math.max(1, parseInt(rating))),
            comment: comment || "",
            createdAt: new Date()
        };
        await db.collection(COLLECTION_RATINGS).insertOne(ratingDoc);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRatings = async (req, res) => {
    try {
        const db = getDb();
        const ratings = await db.collection(COLLECTION_RATINGS)
            .find()
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();
        res.json(ratings.map(r => ({
            id: r._id,
            location: formatLoc(r.location),
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const db = getDb();
        const totalReports = await db.collection(COLLECTION_REPORTS).countDocuments();
        const pendingReports = await db.collection(COLLECTION_REPORTS).countDocuments({ status: "PENDING" });
        const resolvedReports = await db.collection(COLLECTION_REPORTS).countDocuments({ status: "RESOLVED" });

        const ratingsPipeline = [
            { $group: { _id: "$location", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ];
        const ratingsByLocation = await db.collection(COLLECTION_RATINGS).aggregate(ratingsPipeline).toArray();

        res.json({
            totalReports,
            pendingReports,
            resolvedReports,
            ratingsByLocation: ratingsByLocation.map(r => ({
                location: formatLoc(r._id),
                avgRating: Math.round(r.avgRating * 10) / 10,
                totalVotes: r.count
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
