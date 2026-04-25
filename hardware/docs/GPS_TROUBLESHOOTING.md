# Ublox NEO-6M GPS Module - Troubleshooting Guide

## Problem: "Searching for GPS signal... Satellites in view: 0"

### Root Causes (in order of likelihood)

---

## 1. **No Clear Sky View** ❌ Most Common
**Symptom:** *No GPS data received or 0 satellites*

**Solution:**
- Place GPS **OUTSIDE** with clear view of sky
- Avoid indoor testing (walls block signals)
- Avoid near buildings, metal objects, or trees
- Antenna should point **UPWARD**
- Wait **2-5 minutes** for first fix (called "cold start")
  - Subsequent fixes take 10-30 seconds
- At night, signal is weaker - may need 5+ min

**Test:** Move 10 meters away from buildings, wait 3 minutes

---

## 2. **Power Supply Issues** 🔋

**Symptom:** *No GPS data received at all*

**Check:**
```
VCC: Should be 5V (or 3.3V depending on module)
GND: Connected to ESP32 GND
```

**Test with multimeter:**
- Measure voltage between GPS VCC and GND
- Should be stable (no flickering)
- If below 4.8V or 3.0V, power supply is weak

**Solution if power is weak:**
- Use separate 5V power supply for GPS
- Don't power from ESP32 directly
- Add capacitor: 100μF across GPS VCC/GND (near module)

---

## 3. **Wiring Connections** 🔌

**Correct Wiring (NEO-6M to ESP32):**
```
GPS VCC  → ESP32 5V       (or 3.3V)
GPS GND  → ESP32 GND      ✓ Must be same ground
GPS TX   → ESP32 RX2 (GPIO16)
GPS RX   → ESP32 TX2 (GPIO17)
```

**Test Wiring:**
- Verify TX/RX lines are NOT crossed
- GPS TX must go to ESP32 RX2, NOT TX2
- Check connections are not loose
- Use multimeter: Should see 3.3V on GPS TX line

---

## 4. **Baud Rate Mismatch** ⚙️

**Current Setting:** 9600 baud (NEO-6M default)

**If not working with 9600:**
- Some modules are pre-configured to **115200 baud**
- Check your GPS datasheet or product page
- Test program: `test_gps_diagnostic.cpp` (if available)

**Change in config.h:**
```cpp
#define GPS_BAUD_RATE 115200  // Change from 9600
```

---

## 5. **Defective or Uninitialized Module** 💻

**Test:**
1. Use test program: `test_gps.cpp`
   - Compile with: `platformio run -e test_gps`
   - Upload and check serial output
2. If test works but main.cpp doesn't:
   - GPS module is OK
   - Issue is in software integration

**If test also fails:**
- Module may be defective
- Try different USB port
- Try different ESP32 board

---

## 6. **Firmware Issue** 🐛

**Symptoms:**
- GPS data received but always searching
- Fix acquired then lost immediately

**Solution:**
- Update GPS module firmware (if available from manufacturer)
- Check for GPS module firmware updates on Ublox website

---

## How to Diagnose (Step by Step)

### Step 1: Check Serial Output
Look for these messages after startup:

```
⏳ GPS WARM-UP PERIOD: 60 seconds
   GPS warming up... 50 seconds remaining
   GPS warming up... 40 seconds remaining
   ...
✓ GPS warm-up complete! Ready for signal acquisition
```

### Step 2: After Warm-up Complete
Move **outside** into open sky, then check for:

**Success (Fix Acquired):**
```
✓ GPS FIX ACQUIRED!
Latitude:  6.927079°
Longitude: 80.771930°
Altitude:  45.20 meters
Satellites: 8
```

**Failure (Still searching):**
```
⏳ Searching for GPS signal...
⚠️ WARNING: No GPS data received!
Check:
  1. TX/RX wiring (GPS TX → ESP32 RX2/GPIO16)
  2. Power supply to GPS module (5V/3.3V stable)
  3. Baud rate (should be 9600)
  4. GPS antenna has clear sky view
```

---

## Step-by-Step Fix Checklist

- [ ] **Step 1:** Move GPS completely outside (no indoor testing)
- [ ] **Step 2:** Verify GPS antenna is attached and pointing upward
- [ ] **Step 3:** Wait 60 seconds warm-up + 3 more minutes outside
- [ ] **Step 4:** Check power: VCC = 5V (stable), GND = connected
- [ ] **Step 5:** Check wiring: TX→RX2, RX→TX2, GND→GND
- [ ] **Step 6:** Verify baud rate is 9600 in config.h
- [ ] **Step 7:** If still 0 satellites, try test program `test_gps.cpp`
- [ ] **Step 8:** If test works, issue is in main.cpp integration
- [ ] **Step 9:** If test fails, module may be defective

---

## Common Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `No GPS data received` | No power or wrong baud rate | Check 5V power, verify 9600 baud |
| `0 Satellites in view` | Indoors or blocked signal | Move outside, clear sky view |
| `Satellites: 3` | Not enough for fix | Wait longer, may need 5+ min |
| `Fixed but keeps dropping` | Weak power supply | Use external 5V power |
| `Wrong coordinates` | Cold storage, needs reset | Remove battery 10 sec, reinsert |

---

## Advanced: Direct GPS Testing

If software troubleshooting fails, use **AT Commands** to test GPS directly:

1. Upload `test_gps.cpp` to ESP32
2. Open Serial Monitor (115200 baud)
3. GPS will output raw NMEA sentences like:
   ```
   $GPRMC,123519,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
   ```
   - If you see these, GPS is outputting data (baud rate OK)
   - If searching for 5 min and no fix, move outside more

---

## GPS Module Specifications

| Parameter | Value |
|-----------|-------|
| **Baud Rate** | 9600 (default) |
| **Voltage** | 3.3V - 5V |
| **Current** | 30-50mA typical |
| **Warm-up Time** | 60 seconds |
| **Cold Start Time** | 30-120 seconds |
| **Satellites Needed** | 4+ for fix |
| **Accuracy** | ±2.5 meters typical |
