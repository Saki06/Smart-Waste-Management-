# 🌍 Smart Waste Management System

![Project Banner](https://img.shields.io/badge/Project-Smart%20Waste%20Management-brightgreen?style=for-the-badge&logo=appveyor)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Espressif](https://img.shields.io/badge/ESP32-000000?style=for-the-badge&logo=espressif&logoColor=red)

A comprehensive, full-stack IoT Smart Waste Management System. This project integrates real-time IoT sensor data, advanced Machine Learning analytics, and a dynamic React dashboard to optimize waste collection, predict fill levels, and monitor environmental hazards like mosquito risks and suspicious activities.

## ✨ Features

- **Real-Time Monitoring**: ESP32 hardware with ultrasonic sensors sending real-time fill level data via MQTT.
- **Machine Learning Analytics**: Python-based ML API (Random Forest Regressor) for predictive ETA on when bins will be full, usage trend forecasting, and anomaly detection.
- **Interactive Dashboard**: Built with React and Vite. Features interactive charts (Recharts), real-time updates via Socket.IO, and a polished UI using Tailwind CSS.
- **Geospatial Mapping**: Live tracking of bin locations and statuses across the campus using Leaflet maps.
- **Environmental Hazard Detection**: specialized components for identifying mosquito breeding risks (wet waste) and suspicious activities.
- **OTA Updates**: Over-The-Air firmware updates for the ESP32 hardware, ensuring seamless maintenance.

## 🏗️ Architecture & Technology Stack

### Hardware (`/hardware`)
- **Microcontroller**: ESP32
- **Sensors**: Ultrasonic Sensor (HC-SR04), Moisture Sensor
- **Connectivity**: Wi-Fi, MQTT
- **Features**: OTA (Over-The-Air) firmware updates.

### Backend (`/smartbin-backend`)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB
- **Communication**: MQTT (subscriber for IoT data), Socket.IO (for real-time React updates)
- **AI Integration**: `@google/generative-ai` (Gemini API)

### Machine Learning (`/model_training`)
- **Language**: Python
- **Algorithms**: Random Forest Regressor (predictive analytics), KMeans (clustering/anomaly detection)

### Frontend (`/react-app`)
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4, Lucide React (icons)
- **Data Visualization**: Recharts
- **Mapping**: React-Leaflet

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB instance (local or Atlas)
- PlatformIO (for ESP32 hardware)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saki06/Smart-Waste-Management-.git
   cd Smart-Waste-Management-
   ```

2. **Backend Setup**
   ```bash
   cd smartbin-backend
   npm install
   # Create a .env file with your MongoDB URI, MQTT Broker details, and Gemini API Key
   npm start
  
   ```

3. **Machine Learning Setup**
   ```bash
   cd smartbin-backend
   # Ensure Python dependencies are installed (e.g., scikit-learn, pandas, flask/fastapi)
   npm run ml # Runs python ml_api.py
   ```

4. **Frontend Setup**
   ```bash
   cd ../react-app
   npm install
   npm run dev
   ```

5. **Hardware Setup**
   - Open the `/hardware` folder in VS Code with the PlatformIO extension.
   - Configure the `.pio` environment or `platformio.ini` with your Wi-Fi and MQTT credentials.
   - Build and upload the code to your ESP32.

## 📊 Modules & Usage

- **Facility Manager Dashboard**: A high-level overview of total bins, critical alerts, and overall system health.
- **Analytics View**: Deep dive into the ML predictions, viewing estimated times until bins are full based on historical usage patterns.
- **Mosquito Panel**: Monitors moisture levels in bins to alert authorities about potential mosquito breeding grounds.
- **Suspicious Activity**: Logs and flags unexpected changes in bin levels (e.g., sudden massive drops or anomalies).

  
## 👥 Team Members

**Presented By: Group 2026_01**
- Madhuwarsha T - IT22364760
- S.K. Fernando - IT22129680
- I.M.M. Mujahid - IT22266750
- Sakiththiyan T - IT22319074

---

---
*Built for smarter, cleaner, and more efficient campuses.*
