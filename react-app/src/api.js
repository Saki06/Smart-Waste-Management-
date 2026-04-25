// Centralized API utility for SmartBin
// Provides real data fetching with fallback to mock data

/**
 * Common fetch wrapper with fallback logic
 */
const fetchData = async (endpoint, fallbackData) => {
    try {
        const response = await fetch(`/api${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Use mock fallback ONLY if there is no data or a connection failure.
        // We WANT to return empty arrays if the database is genuinely empty.
        if (!data) return fallbackData;

        return data;
    } catch (error) {
        console.warn(`API call to ${endpoint} failed, using mock data. Error:`, error.message);
        return fallbackData;
    }
};

/**
 * Dashboard & KPI Stats
 */
export const getStats = () => fetchData('/stats', {
    criticalBins: 0,
    campusAvgFill: 0,
    activeDevices: 0,
    avgResponseTime: 14,
    systemEfficiency: 96
});

/**
 * All Bins Data
 */
export const getBins = () => fetchData('/bins', []);

/**
 * Recent Motion/Suspicious Activity
 */
export const getMotion = () => fetchData('/motion/recent', []);

/**
 * Priority Alerts
 */
export const getAlerts = () => fetchData('/alerts', []);

/**
 * ==================== SOCKET.IO REAL-TIME ====================
 * Expose WebSocket connections so React components can listen
 * to instantaneous pushes directly from the merged backend.
 */
import { io } from 'socket.io-client';

// Connect to the backend server
const socket = io('http://localhost:5000');

export const subscribeToSensors = (callback) => {
    socket.on('new_sensor_data', callback);
    return () => socket.off('new_sensor_data', callback);
};

export const subscribeToMotion = (callback) => {
    socket.on('new_motion', callback);
    return () => socket.off('new_motion', callback);
};

export const subscribeToAlerts = (callback) => {
    socket.on('new_alert', callback);
    return () => socket.off('new_alert', callback);
};

/**
 * ==================== ANALYTICS API ====================
 */
export const getTrends = () => fetchData('/analytics/trends', []);
export const getCorrelations = () => fetchData('/analytics/correlations', []);
export const getAnomalies = () => fetchData('/analytics/anomalies', []);
export const getPredictions = () => fetchData('/analytics/predictions', []);

export const subscribeToAnomalies = (callback) => {
    socket.on('new_anomaly', callback);
    return () => socket.off('new_anomaly', callback);
};

/**
 * ==================== STUDENT PORTAL API ====================
 */
export const submitReport = async (reportData) => {
    const response = await fetch('/api/portal/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

export const getReports = () => fetchData('/portal/reports', []);

export const submitRating = async (ratingData) => {
    const response = await fetch('/api/portal/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

export const getRatings = () => fetchData('/portal/ratings', []);
export const getPortalStats = () => fetchData('/portal/stats', { totalReports: 0, pendingReports: 0, resolvedReports: 0, ratingsByLocation: [] });

