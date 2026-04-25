# SmartBin Backend (API + MQTT Bridge)

This service runs the unified backend:
- Express REST API for the frontend
- Socket.IO real-time push
- MQTT subscriber for ESP32 topics
- MongoDB storage

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and fill your MongoDB connection string.

Required:
- `MONGODB_URI`

Optional defaults are already provided:
- `MONGODB_DB=smartbin`
- `MQTT_URL=mqtt://broker.hivemq.com:1883`
- `MQTT_TOPICS=smartbin/sensors,smartbin/motion,smartbin/status`

## 3. Run

```bash
npm start
```

If successful, you should see:
- `Connected to MongoDB`
- `Unified API & WebSocket Server running on http://localhost:5000`
- `MQTT connected`
- `Subscribed: smartbin/sensors` (and other topics)

## 4. Frontend Run

From `react-app`:

```bash
npm run dev
```

If port `5173` is busy, Vite will automatically use `5174`, `5175`, etc.

## Collections used

- `sensor_readings` for `smartbin/sensors`
- `motion_events` for `smartbin/motion`
- `status_events` for `smartbin/status`
- `raw_messages` fallback for unknown topics
