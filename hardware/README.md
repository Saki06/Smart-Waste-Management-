# Smart Waste Management System - Hardware (ESP32)

Complete ESP32 firmware for the Smart Waste Management System with integrated sensors and MQTT connectivity.

## 📋 Features

- ✅ **Ultrasonic Sensor** - Bin fill level detection
- ✅ **Moisture Sensor** - Detects waste wetness (mosquito breeding risk)
- ✅ **PIR Motion Sensor** - Motion detection near dustbin
- ✅ **GPS Module** - Real-time location tracking
- ✅ **WiFi Connectivity** - Automatic WiFi reconnection
- ✅ **MQTT with Fallback** - Dual broker support (primary + secondary)
- ✅ **JSON Data Format** - Structured sensor data transmission
- ✅ **Non-Blocking Loop** - Prevents sensor freezing
- ✅ **Unique Client ID** - Runtime generation from MAC address

## 🔧 Hardware Requirements

### Microcontroller
- ESP32 Dev Board (240MHz, dual-core)

### Sensors
- **HC-SR04 Ultrasonic** (×1) - Bin fill level
- **Capacitive Moisture Sensor** - Waste wetness
- **HC-SR501 PIR Sensor** - Motion detection
- **Ublox NEO-6M GPS** - Location tracking

### Connections
- 5V power supply (USB or external)
- USB cable for programming

## 📦 Dependencies

Automatically installed via PlatformIO:

```ini
lib_deps = 
    bblanchon/ArduinoJson@^6.21.3
    knolleary/PubSubClient@^2.8
    mikalhart/TinyGPSPlus@^1.0.3
```

## 🔌 Wiring Diagram

See [docs/reference/WIRING_DIAGRAM.md](docs/reference/WIRING_DIAGRAM.md) for complete pinout.

**Quick Reference:**
```
HC-SR04 TRIG → GPIO5
HC-SR04 ECHO → GPIO18
Moisture AOUT → GPIO34
PIR OUT → GPIO19
GPS TX → GPIO16 (RX2)
GPS RX → GPIO17 (TX2)
```

## 🚀 Build & Upload

### Prerequisites
```bash
# Install PlatformIO CLI
pip install platformio

# Or use VS Code extension: PlatformIO IDE
```

### Build
```bash
# Build main firmware
platformio run --environment esp32dev

# Build and upload
platformio run --target upload --environment esp32dev

# Monitor serial output
platformio device monitor
```

### Test Individual Sensors
```bash
# Ultrasonic sensor test
platformio run -e test_ultrasonic -t upload && platformio device monitor

# Moisture sensor test
platformio run -e test_moisture -t upload && platformio device monitor

# PIR motion sensor test
platformio run -e test_pir -t upload && platformio device monitor

# GPS module test
platformio run -e test_gps -t upload && platformio device monitor
```

## ⚙️ Configuration

Edit [include/config.h](include/config.h) to customize:

```cpp
// WiFi Credentials
#define WIFI_SSID "Your_SSID"
#define WIFI_PASSWORD "Your_Password"

// MQTT Brokers
#define MQTT_BROKER "test.mosquitto.org"
#define MQTT_SECONDARY_BROKER "broker.hivemq.com"

// Device Identity
#define DEVICE_ID "BIN_001"
#define DEVICE_LOCATION "Campus Building"

// Sensor Thresholds
#define BIN_HEIGHT_CM 25
#define ALERT_BIN_FULL_THRESHOLD 85
#define ALERT_MOISTURE_HIGH_THRESHOLD 70
```

## 📊 MQTT Payload Example

```json
{
  "device_id": "BIN_001",
  "location": "Campus Building",
  "timestamp": "2026-03-12T15:30:45+05:30",
  "data_mode": "analyzed",
  "ultrasonic": {
    "distance_cm_1": 12.45,
    "distance_cm_2": 12.38,
    "distance_cm_avg": 12.41,
    "fill_percentage": 75,
    "status": "FULL",
    "valid_1": true,
    "valid_2": true,
    "valid_avg": true
  },
  "moisture": {
    "adc_value": 1550,
    "moisture_percentage": 45,
    "status": "SLIGHTLY_WET"
  },
  "pir": {
    "motion_detected": false,
    "pir_state": 0
  },
  "gps": {
    "latitude": 6.927079,
    "longitude": 80.771930,
    "altitude": 45.20,
    "satellites": 8,
    "fix": "acquired"
  },
  "alerts": ["BIN_FULL"]
}
```

## 📝 Project Structure

```
hardware/
├── platformio.ini          ← Build configuration
├── src/
│   └── main.cpp           ← Main firmware
├── include/
│   └── config.h           ← Configuration & calibration
├── lib/                   ← Local libraries
├── test/                  ← Unit tests (PlatformIO)
├── test_programs/         ← Individual sensor tests
│   ├── test_hcsr04.cpp
│   ├── test_moisture.cpp
│   ├── test_pir.cpp
│   ├── test_pir_raw.cpp
│   ├── test_gps.cpp
│   ├── test_gps_diagnostic.cpp
│   └── rat_test_moisture_adc.cpp
└── docs/
    ├── GPS_TROUBLESHOOTING.md
    └── reference/
        ├── HOW_TO_RUN_TESTS.md
        ├── QUICK_COMMANDS.md
        ├── TESTING_GUIDE.md
        └── WIRING_DIAGRAM.md
```

## 🧪 Testing

### Step 1: Test Sensors Individually

```bash
# Copy test to main
cp test_programs/test_hcsr04.cpp src/main.cpp

# Build and upload
platformio run -t upload && platformio device monitor
```

See [docs/reference/HOW_TO_RUN_TESTS.md](docs/reference/HOW_TO_RUN_TESTS.md) for complete testing guide.

### Step 2: Verify MQTT Connection

Expected output when connected:
```
MQTT Primary Broker: test.mosquitto.org:1883
MQTT Secondary Broker: broker.hivemq.com:1883
Client ID: SmartBin_ESP32_001_6E353C
Connecting to MQTT broker (test.mosquitto.org)... Connected!
```

### Step 3: Test GPS

```bash
# Outside with clear sky view
platformio run -e test_gps -t upload && platformio device monitor

# Wait 30-120 seconds for first fix
✓ GPS FIX ACQUIRED!
Latitude: 6.927079°
Longitude: 80.771930°
Satellites: 8
```

## 🐛 Troubleshooting

### Build Errors
- Ensure PlatformIO is updated: `platformio upgrade`
- Clean build: `platformio run -t clean`
- Check dependencies are installed: `platformio lib list`

### Upload Failures
- Press and hold BOOT button during upload
- Check USB cable supports data (not just power)
- Verify ESP32 is detected: `platformio device list`

### GPS Not Acquiring Fix
- **Problem:** Indoor testing - GPS needs clear sky view
- **Solution:** Test outside, away from buildings
- See [docs/GPS_TROUBLESHOOTING.md](docs/GPS_TROUBLESHOOTING.md) for complete guide

### MQTT Connection Issues
- Verify WiFi is connected (check serial output)
- Try both brokers (automatic fallback after 5 seconds)
- Check network doesn't block MQTT port 1883
- Increase MQTT_RECONNECT_DELAY in config.h if needed

### Sensor Readings Wrong
- Check calibration in config.h
- Run individual sensor tests first
- See wiring diagram for pin verification

## 📚 Documentation

- [WIRING_DIAGRAM.md](docs/reference/WIRING_DIAGRAM.md) - Complete pin connections
- [HOW_TO_RUN_TESTS.md](docs/reference/HOW_TO_RUN_TESTS.md) - Test execution guide
- [QUICK_COMMANDS.md](docs/reference/QUICK_COMMANDS.md) - Command cheat sheet
- [TESTING_GUIDE.md](docs/reference/TESTING_GUIDE.md) - Comprehensive testing
- [GPS_TROUBLESHOOTING.md](docs/GPS_TROUBLESHOOTING.md) - GPS-specific fixes

## 🔄 Future Enhancements

- [ ] TLS encryption for MQTT (port 8883)
- [ ] Configurable sampling intervals
- [ ] Data buffering & local storage (SPIFFS)
- [ ] Over-the-air (OTA) firmware updates
- [ ] Web-based configuration portal
- [ ] Multi-bin aggregation

## 📞 Support

For issues:
1. Check [docs/reference/HOW_TO_RUN_TESTS.md](docs/reference/HOW_TO_RUN_TESTS.md)
2. Review relevant test program
3. Check [docs/GPS_TROUBLESHOOTING.md](docs/GPS_TROUBLESHOOTING.md) for GPS issues
4. Review serial monitor output for diagnostic messages

---

**Last Updated:** March 2026  
**Status:** Production Ready (v2.0.0)
