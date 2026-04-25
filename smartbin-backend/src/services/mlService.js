async function getClusterId(fill, moisture, hour) {
    try {
        const mlRes = await fetch('http://127.0.0.1:5001/cluster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fill_percentage: fill, moisture_percentage: moisture, hour: hour })
        });
        if (mlRes.ok) {
            const data = await mlRes.json();
            return data.cluster_id;
        }
    } catch (err) {
        console.error("Cluster ML API failed", err.message);
    }
    return 0; // Default
}

async function checkAnomaly(fill, pir, hour) {
    try {
        const mlRes = await fetch('http://127.0.0.1:5001/anomaly', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fill_percentage: fill, pir_state: pir, hour: hour })
        });
        if (mlRes.ok) {
            const data = await mlRes.json();
            return data.is_anomaly;
        }
    } catch (err) {
        console.error("Anomaly ML API failed", err.message);
    }
    return false;
}

async function predictFillRate(hour, dayOfWeek, location, fillNow, prevFill) {
    try {
        const mlResponse = await fetch('http://127.0.0.1:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hour: hour,
                day_of_week: dayOfWeek,
                location: location,
                current_fill: fillNow,
                prev_fill: prevFill
            })
        });

        if (mlResponse.ok) {
            const result = await mlResponse.json();
            return result.predicted_fill;
        } else {
            console.error("ML API Error:", await mlResponse.text());
        }
    } catch (err) {
        console.error("Failed to connect to Python ML API. Is it running on port 5001?");
    }
    return null;
}

module.exports = {
    getClusterId,
    checkAnomaly,
    predictFillRate
};
