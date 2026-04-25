/*
 * HC-SR501 PIR Motion Sensor - RAW OUTPUT TEST
 * Continuously prints the output pin value
 * 
 * Wiring:
 * PIR VCC  -> ESP32 5V
 * PIR GND  -> ESP32 GND
 * PIR OUT  -> ESP32 GPIO19
 * 
 * This helps you understand what the sensor is doing!
 */

#include <Arduino.h>

// Pin definition
#define PIR_PIN 19

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("PIR Sensor - RAW OUTPUT Test");
  Serial.println("========================================");
  Serial.println("\nWhat the output values mean:");
  Serial.println("  0 = LOW  = No motion detected");
  Serial.println("  1 = HIGH = Motion detected!");
  Serial.println("\n========================================");
  Serial.println("Hardware Setup:");
  Serial.println("  [ ] Jumper on L or H (try both!)");
  Serial.println("  [ ] Delay pot adjusted");
  Serial.println("  [ ] Sensitivity pot adjusted");
  Serial.println("========================================\n");
  
  // Configure pin
  pinMode(PIR_PIN, INPUT);
  
  Serial.println("⏳ WARM-UP: 60 seconds");
  Serial.println("   Keep still during warm-up...\n");
  
  // Warm-up countdown
  for (int i = 60; i > 0; i--) {
    Serial.printf("   Warming up... %d seconds remaining\r", i);
    delay(1000);
  }
  
  Serial.println("\n\n✓ Sensor ready! Reading output every 0.5 seconds...\n");
  Serial.println("Time(s)  | Output | Status");
  Serial.println("---------|--------|---------------------------");
}

void loop() {
  // Read PIR sensor state
  int pirValue = digitalRead(PIR_PIN);
  
  // Get time in seconds
  float timeSeconds = millis() / 1000.0;
  
  // Print in table format
  Serial.printf("%7.1f  |   %d    | ", timeSeconds, pirValue);
  
  if (pirValue == 1) {
    Serial.println("HIGH - Motion detected! 🚨");
  } else {
    Serial.println("LOW  - No motion");
  }
  
  // Read every 500ms (2 times per second)
  delay(500);
}
