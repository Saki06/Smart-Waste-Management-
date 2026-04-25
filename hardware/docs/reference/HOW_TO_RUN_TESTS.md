# How to Run Each Test Program

## Method 1: Copy to main.cpp (EASIEST - Recommended for Beginners)

Simply copy the test code you want to run into `src/main.cpp`, then upload.

### Commands:

```bash
# Test 1: HC-SR04 Ultrasonic Sensor
cp test_programs/test_hcsr04.cpp src/main.cpp
pio run -t upload && pio device monitor

# Test 2: Moisture Sensor
cp test_programs/test_moisture.cpp src/main.cpp
pio run -t upload && pio device monitor

# Test 3: PIR Motion Sensor
cp test_programs/test_pir.cpp src/main.cpp
pio run -t upload && pio device monitor

# Test 4: GPS Module
cp test_programs/test_gps.cpp src/main.cpp
pio run -t upload && pio device monitor
```

**Tip:** Press `Ctrl+C` to exit the serial monitor between tests.

---

## Method 2: Use Test Environments (ADVANCED)

I've configured separate test environments in `platformio.ini`. You can now run each test directly without copying files!

### Commands:

```bash
# Test 1: HC-SR04 Ultrasonic Sensor
pio run -e test_ultrasonic -t upload && pio device monitor -e test_ultrasonic

# Test 2: Moisture Sensor
pio run -e test_moisture -t upload && pio device monitor -e test_moisture

# Test 3: PIR Motion Sensor
pio run -e test_pir -t upload && pio device monitor -e test_pir

# Test 4: GPS Module
pio run -e test_gps -t upload && pio device monitor -e test_gps
```

### What's the difference?

- `-e test_ultrasonic` tells PlatformIO to use the "test_ultrasonic" environment
- Each environment points to a different test file
- No need to copy files!

---

## Step-by-Step Example: Test Ultrasonic Sensor

### Using Method 1 (Recommended):

```bash
# 1. Wire the HC-SR04 sensor
#    VCC  -> ESP32 5V
#    GND  -> ESP32 GND
#    TRIG -> GPIO5
#    ECHO -> GPIO18

# 2. Copy test code to main.cpp
cp test_programs/test_hcsr04.cpp src/main.cpp

# 3. Upload to ESP32
pio run -t upload

# 4. Open serial monitor
pio device monitor

# 5. Move your hand in front of sensor - watch distance readings!
```

### Using Method 2 (Advanced):

```bash
# 1. Wire the HC-SR04 sensor (same as above)

# 2. Upload and monitor in one command
pio run -e test_ultrasonic -t upload && pio device monitor -e test_ultrasonic

# 3. Move your hand in front of sensor - watch distance readings!
```

---

## Testing Sequence (Recommended Order)

### Test 1: HC-SR04 Ultrasonic (EASIEST)
```bash
cp test_programs/test_hcsr04.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wire:** VCC→5V, GND→GND, TRIG→GPIO5, ECHO→GPIO18  
**Test:** Move hand closer/farther, watch distance change  
**Expected:** Distance readings 2-400 cm

---

### Test 2: PIR Motion Sensor (EASY)
```bash
cp test_programs/test_pir.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wire:** VCC→5V, GND→GND, OUT→GPIO19  
**Test:** Wait 30s for warmup, then wave hand  
**Expected:** "MOTION DETECTED!" when you move

---

### Test 3: Moisture Sensor (MEDIUM - needs calibration)
```bash
cp test_programs/test_moisture.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wire:** VCC→3.3V, GND→GND, AOUT→GPIO34  
**Test:** 
1. Place in air, note RAW value
2. Place in water, note RAW value  
3. Update AIR_VALUE and WATER_VALUE in code
4. Re-upload and test dry/wet conditions

**Expected:** 0-20% dry, 70-100% wet

---

### Test 4: GPS Module (HARDEST - needs outdoor)
```bash
cp test_programs/test_gps.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wire:** VCC→5V, GND→GND, GPS_TX→GPIO16, GPS_RX→GPIO17  
**Test:** Take ESP32 outside with clear sky view, wait 30-120 seconds  
**Expected:** Latitude/Longitude coordinates, Google Maps link

**Note:** GPS may NOT work indoors! Needs clear sky view.

---

## Quick Command Reference

```bash
# List available environments
pio run --list-targets

# Build without uploading
pio run -e test_ultrasonic

# Upload only (must build first)
pio run -e test_ultrasonic -t upload

# Just monitor (if already uploaded)
pio device monitor

# Clean build files
pio run -t clean

# List connected devices
pio device list
```

---

## Troubleshooting

### "cp: command not found" (Windows)
Use this instead:
```bash
copy test_programs\test_hcsr04.cpp src\main.cpp
```

Or just **manually copy-paste** the code:
1. Open `test_programs/test_hcsr04.cpp`
2. Copy all the code (Ctrl+A, Ctrl+C)
3. Open `src/main.cpp`
4. Paste the code (Ctrl+A, Ctrl+V)
5. Save (Ctrl+S)
6. Run `pio run -t upload`

### Upload Failed
- Press and hold BOOT button on ESP32 during upload
- Check USB cable
- Try: `pio device list` to see if ESP32 is detected

### No Serial Output
- Ensure baud rate is 115200
- Press EN (reset) button on ESP32
- Check USB cable supports data

### LSP Errors (red squiggles)
- Normal before first build
- Run `pio run` once to fix
