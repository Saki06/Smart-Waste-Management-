# Smart Waste Management System - Wiring Diagram

## Complete Pin Connection Table

| Sensor/Module | Sensor Pin | ESP32 Pin | Type | Notes |
|---------------|------------|-----------|------|-------|
| **HC-SR04 Ultrasonic** | | | | |
| | VCC | 5V | Power | |
| | GND | GND | Ground | |
| | TRIG | GPIO5 | Digital Out | Trigger pin |
| | ECHO | GPIO18 | Digital In | Echo pin |
| **Moisture Sensor** | | | | |
| | VCC | 3.3V or 5V | Power | Check sensor specs |
| | GND | GND | Ground | |
| | AOUT | GPIO34 | Analog In | ADC1_CH6 |
| **PIR Motion Sensor** | | | | |
| | VCC | 5V | Power | |
| | GND | GND | Ground | |
| | OUT | GPIO19 | Digital In | Motion signal |
| **GPS Module NEO-6M** | | | | |
| | VCC | 5V or 3.3V | Power | Check module voltage |
| | GND | GND | Ground | |
| | TX | GPIO16 (RX2) | Serial In | GPS transmits to ESP32 |
| | RX | GPIO17 (TX2) | Serial Out | ESP32 transmits to GPS |

---

## ESP32 Pin Map (Visual Reference)

```
                        ESP32 DevKit V1
                    ┌─────────────────────┐
                    │                     │
                    │      ┌─────┐        │
                    │      │ USB │        │
                    │      └─────┘        │
        ┌───────────┴─────────────────────┴───────────┐
        │                                              │
    3V3 │●                                          ●│ GND
    EN  │●                                          ●│ GPIO23
 GPIO36 │●                                          ●│ GPIO22
 GPIO39 │●                                          ●│ TX0
 GPIO34 │●  ← MOISTURE SENSOR                      ●│ RX0
 GPIO35 │●                                          ●│ GPIO21
 GPIO32 │●                                          ●│ GND
 GPIO33 │●                                          ●│ GPIO19  ← PIR SENSOR
 GPIO25 │●                                          ●│ GPIO18  ← HC-SR04 ECHO
 GPIO26 │●                                          ●│ GPIO5   ← HC-SR04 TRIG
 GPIO27 │●                                          ●│ GPIO17  ← GPS RX
 GPIO14 │●                                          ●│ GPIO16  ← GPS TX
 GPIO12 │●                                          ●│ GPIO4
    GND │●                                          ●│ GPIO0
 GPIO13 │●                                          ●│ GPIO2
   GPIO9│●                                          ●│ GPIO15
  GPIO10│●                                          ●│ GPIO8
  GPIO11│●                                          ●│ GPIO7
     5V │●                                          ●│ GPIO6
        │                                              │
        └──────────────────────────────────────────────┘
```

---

## Connection Diagram (Text Format)

### HC-SR04 Ultrasonic Sensor
```
HC-SR04          ESP32
┌─────────┐    ┌──────┐
│   VCC   │───→│  5V  │
│   GND   │───→│ GND  │
│   TRIG  │───→│ GP5  │
│   ECHO  │───→│ GP18 │
└─────────┘    └──────┘
```

### Capacitive Moisture Sensor
```
Moisture Sensor   ESP32
┌─────────┐     ┌──────┐
│   VCC   │────→│ 3.3V │ (or 5V depending on sensor)
│   GND   │────→│ GND  │
│   AOUT  │────→│ GP34 │ (Analog)
└─────────┘     └──────┘
```

### HC-SR501 PIR Motion Sensor
```
PIR Sensor      ESP32
┌─────────┐   ┌──────┐
│   VCC   │──→│  5V  │
│   GND   │──→│ GND  │
│   OUT   │──→│ GP19 │
└─────────┘   └──────┘
```

### NEO-6M GPS Module
```
GPS Module      ESP32
┌─────────┐   ┌──────┐
│   VCC   │──→│  5V  │ (or 3.3V)
│   GND   │──→│ GND  │
│   TX    │──→│ GP16 │ (RX2) ← GPS transmits TO ESP32
│   RX    │──→│ GP17 │ (TX2) ← ESP32 transmits TO GPS
└─────────┘   └──────┘

Note: GPS TX connects to ESP32 RX (receive)
      GPS RX connects to ESP32 TX (transmit)
```

---

## Power Distribution

**Important Power Notes:**
1. ESP32 can supply limited current from 3.3V pin (~200mA)
2. 5V pin passes through USB voltage (500mA limit)
3. If all sensors draw too much current, use external 5V power supply

**Current Requirements:**
- HC-SR04: ~15mA (5V)
- Moisture Sensor: ~5mA (3.3V/5V)
- PIR Sensor: ~50-65mA (5V)
- GPS Module: ~40-50mA (5V)
- **Total: ~125mA** ✓ Safe for USB power

---

## Recommended Testing Setup

### Phase 1: Test ONE sensor at a time
Connect and test each sensor individually to verify it works.

### Phase 2: Connect all sensors together
Use breadboard for organized connections:

```
Power Rails:
━━━━━━━━━━━━━━━━━━━━━━━━━━
[+5V Rail]  ← from ESP32 5V pin
- HC-SR04 VCC
- PIR VCC
- GPS VCC

[GND Rail]  ← from ESP32 GND
- All sensor GND pins
- ESP32 GND

[+3.3V Rail] ← from ESP32 3.3V pin  
- Moisture Sensor VCC (if 3.3V version)
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Breadboard Layout (Recommended)

```
┌─────────────────────────────────────────────────────┐
│                   Breadboard                         │
│                                                       │
│  [+5V]  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Red    │
│  [+3.3V]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Orange │
│                                                       │
│         HC-SR04      Moisture     PIR       GPS      │
│            │            │          │         │       │
│         [Pins]       [Pins]     [Pins]    [Pins]    │
│            │            │          │         │       │
│  [GND]  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Blue   │
│                                                       │
│  Signal wires to ESP32 GPIO pins                     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting Hardware Issues

### Sensor not responding?
1. Check power: Use multimeter to verify 3.3V or 5V on sensor VCC
2. Check ground: Ensure common ground between ESP32 and sensor
3. Check signal: Use multimeter or LED to verify GPIO pin state
4. Try different GPIO pin: Some pins have special functions

### ESP32 won't boot?
- Some pins (GPIO0, GPIO2, GPIO15) affect boot mode
- Disconnect sensors and try booting
- Avoid using: GPIO0, GPIO2, GPIO12, GPIO15 during boot

### Interference or unstable readings?
- Add 0.1µF capacitor between sensor VCC and GND
- Keep wires short
- Separate power and signal wires
- Use twisted pair for long connections

### GPS not getting fix?
- GPS antenna must face sky
- Clear view of sky required (no roof)
- May not work indoors
