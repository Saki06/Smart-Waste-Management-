# Smart Waste Management System - Sensor Testing Guide

## Project Overview
IoT-based Smart Waste Management System that monitors dustbin conditions in real-time.

**Team Assignment:** IT4021 - Stage 2 (Progress + Prototype Demo)

---

## Hardware Components

1. **HC-SR04 Ultrasonic Sensor** - Measures bin fill level
2. **Capacitive Soil Moisture Sensor** - Detects waste wetness
3. **HC-SR501 PIR Motion Sensor** - Detects motion near bin
4. **Ublox NEO-6M GPS Module** - Tracks bin location
5. **ESP32 Dev Board** - Main microcontroller

---

## How to Test Each Sensor

### Step 1: Test HC-SR04 Ultrasonic Sensor (Bin Fill Level)

**Purpose:** Measure distance to calculate bin fill percentage

**Wiring:**
```
HC-SR04 VCC  -> ESP32 5V
HC-SR04 GND  -> ESP32 GND
HC-SR04 TRIG -> ESP32 GPIO5
HC-SR04 ECHO -> ESP32 GPIO18
```

**To test:**
1. The code is already in `src/main.cpp`
2. Build and upload: `pio run -t upload`
3. Open serial monitor: `pio device monitor`
4. Move your hand in front of sensor to see distance readings
5. **Expected output:** Distance in centimeters (2-400 cm range)

**What to verify:**
- ✓ Readings change when you move objects closer/farther
- ✓ Distance is reasonably accurate (±1-2 cm)
- ✓ No timeout errors

---

### Step 2: Test Capacitive Moisture Sensor (Wetness Detection)

**Purpose:** Detect if waste is wet (mosquito breeding risk)

**Wiring:**
```
Sensor VCC  -> ESP32 3.3V or 5V
Sensor GND  -> ESP32 GND
Sensor AOUT -> ESP32 GPIO34
```

**To test:**
1. Copy code from `test_programs/test_moisture.cpp` to `src/main.cpp`
2. Build and upload: `pio run -t upload`
3. Open serial monitor: `pio device monitor`
4. **Calibration required:**
   - Place sensor in air → note the RAW value → update `AIR_VALUE`
   - Place sensor in water → note the RAW value → update `WATER_VALUE`
5. Test with dry and wet conditions

**Expected output:** 
- Dry: 0-20% moisture
- Wet: 70-100% moisture
- Alert when >70% (mosquito risk)

**What to verify:**
- ✓ Raw ADC values change between dry/wet
- ✓ Percentage calculation works after calibration
- ✓ Status messages appear correctly

---

### Step 3: Test HC-SR501 PIR Motion Sensor

**Purpose:** Detect people or animals near dustbin

**Wiring:**
```
PIR VCC -> ESP32 5V
PIR GND -> ESP32 GND
PIR OUT -> ESP32 GPIO19
```

**To test:**
1. Copy code from `test_programs/test_pir.cpp` to `src/main.cpp`
2. Build and upload: `pio run -t upload`
3. Open serial monitor: `pio device monitor`
4. **Important:** Wait 30-60 seconds for sensor warm-up
5. Wave your hand or move near the sensor

**Expected output:**
- Motion detected: "🚨 MOTION DETECTED!"
- No motion: "✓ No motion detected"
- Motion count increases

**What to verify:**
- ✓ Detects motion reliably
- ✓ No false triggers when still
- ✓ Detection range is reasonable (3-7 meters)

**PIR Sensor Adjustments:**
- **Sensitivity potentiometer:** Adjust detection range
- **Time delay potentiometer:** Adjust how long output stays HIGH
- **Jumper:** Repeatable trigger mode (recommended)

---

### Step 4: Test Ublox NEO-6M GPS Module

**Purpose:** Get GPS coordinates of dustbin location

**Wiring:**
```
GPS VCC -> ESP32 5V (or 3.3V)
GPS GND -> ESP32 GND
GPS TX  -> ESP32 RX2 (GPIO16)
GPS RX  -> ESP32 TX2 (GPIO17)
```

**To test:**
1. Copy code from `test_programs/test_gps.cpp` to `src/main.cpp`
2. Build and upload: `pio run -t upload`
3. Open serial monitor: `pio device monitor`
4. **Important:** GPS needs clear view of sky
5. Wait 30-120 seconds for first GPS fix
6. Check Google Maps link in output

**Expected output:**
- Searching: "⏳ Searching for GPS signal..."
- Fix acquired: "✓ GPS FIX ACQUIRED!"
- Latitude/Longitude coordinates
- Number of satellites
- Google Maps link

**What to verify:**
- ✓ GPS gets satellite fix (needs open sky)
- ✓ Coordinates are accurate
- ✓ Satellite count is 4 or more

**Troubleshooting:**
- If no data: Check TX/RX connections (GPS TX → ESP32 RX)
- If no fix: Move to open area with clear sky view
- Indoor testing: May not work (try near window)

---

## Next Steps After Individual Testing

### Step 5: Integrate All Sensors
Once all sensors work individually, create a combined program that reads all sensors.

### Step 6: Add Data Formatting
Format sensor data as JSON for transmission:
```json
{
  "bin_id": "BIN001",
  "fill_level": 75,
  "moisture": 45,
  "motion_detected": true,
  "latitude": 6.9271,
  "longitude": 79.8612,
  "timestamp": "2026-03-12T10:30:00Z"
}
```

### Step 7: Implement Communication
- Add WiFi connectivity
- Choose protocol: MQTT or HTTP/REST
- Send data to cloud/server
- Test reliability and retries

---

## Pin Summary Table

| Component | ESP32 Pin | Notes |
|-----------|-----------|-------|
| HC-SR04 TRIG | GPIO5 | Digital output |
| HC-SR04 ECHO | GPIO18 | Digital input |
| Moisture Sensor | GPIO34 (ADC) | Analog input |
| PIR Sensor | GPIO19 | Digital input |
| GPS TX | GPIO16 (RX2) | Hardware serial |
| GPS RX | GPIO17 (TX2) | Hardware serial |

---

## Build Commands

```bash
# Build project
pio run

# Upload to ESP32
