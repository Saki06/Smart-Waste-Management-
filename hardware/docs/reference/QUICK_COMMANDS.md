# Quick Test Commands - Cheat Sheet

## 🚀 EASIEST WAY (Copy Method)

### Test 1: Ultrasonic Sensor (Bin Fill Level)
```bash
cp test_programs/test_hcsr04.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wiring:** TRIG→GPIO5, ECHO→GPIO18, VCC→5V, GND→GND

---

### Test 2: PIR Motion Sensor
```bash
cp test_programs/test_pir.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wiring:** OUT→GPIO19, VCC→5V, GND→GND  
**Wait 60s for warmup!**

---

### Test 2B: PIR RAW Output (Debug)
```bash
cp test_programs/test_pir_raw.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Shows continuous 0/1 output every 0.5 seconds**  
**Great for debugging sensor behavior!**

---

### Test 3: Moisture Sensor (Wetness)
```bash
cp test_programs/test_moisture.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wiring:** AOUT→GPIO34, VCC→3.3V, GND→GND  
**Needs calibration!**

---

### Test 4: GPS Module (Location)
```bash
cp test_programs/test_gps.cpp src/main.cpp
pio run -t upload && pio device monitor
```
**Wiring:** GPS_TX→GPIO16, GPS_RX→GPIO17, VCC→5V, GND→GND  
**Needs outdoor / clear sky!**

---

## 🎯 ADVANCED WAY (Environment Method)

```bash
# Ultrasonic
pio run -e test_ultrasonic -t upload && pio device monitor

# PIR Motion
pio run -e test_pir -t upload && pio device monitor

# PIR RAW Output (Debug)
pio run -e test_pir_raw -t upload && pio device monitor

# Moisture
pio run -e test_moisture -t upload && pio device monitor

# GPS
pio run -e test_gps -t upload && pio device monitor
```

---

## 📌 Common Commands

```bash
# Exit serial monitor
Ctrl + C

# Build only (no upload)
pio run

# Upload only
pio run -t upload

# Monitor only
pio device monitor

# List devices
pio device list

# Clean build
pio run -t clean
```

---

## ⚡ All-in-One Commands

```bash
# Build + Upload + Monitor in one go
pio run -t upload && pio device monitor

# Or with specific environment
pio run -e test_ultrasonic -t upload && pio device monitor
```

---

## 🔧 Pin Summary

| Sensor | Pin | ESP32 GPIO |
|--------|-----|------------|
| HC-SR04 TRIG | → | GPIO5 |
| HC-SR04 ECHO | → | GPIO18 |
| Moisture AOUT | → | GPIO34 |
| PIR OUT | → | GPIO19 |
| GPS TX | → | GPIO16 |
| GPS RX | → | GPIO17 |

All sensors need VCC (power) and GND (ground)!
