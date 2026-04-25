/*
 * RAT Test - Moisture Sensor ADC Direct Output
 * Rapid Application Test for moisture sensor
 * 
 * Purpose: Directly output raw ADC values from moisture sensor
 * Use this for quick sensor validation and calibration
 * 
 * Wiring:
 * Sensor VCC  -> ESP32 3.3V or 5V
 * Sensor GND  -> ESP32 GND
 * Sensor AOUT -> ESP32 GPIO34 (ADC1_CH6)
 * 
 * ADC Range: 0-4095 (12-bit resolution on ESP32)
 * - Higher value = Dry condition
 * - Lower value = Wet condition
 */

#include <Arduino.h>

// Pin definition
#define MOISTURE_PIN 34  // ADC pin (GPIO34 = ADC1_CH6)

// Test configuration
#define READ_INTERVAL 500  // Read every 500ms for quick testing

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== RAT Test: Moisture Sensor ADC Direct Output ===");
  Serial.println("Purpose: Direct ADC value reading for sensor validation");
  Serial.println("Pin: GPIO34 (ADC1_CH6)");
  Serial.println("ADC Range: 0-4095");
  Serial.println("================================================\n");
  
  // Configure ADC pin
  pinMode(MOISTURE_PIN, INPUT);
  
  Serial.println("Sensor ready! Reading ADC values...");
  Serial.println("Format: [Timestamp] ADC Value: XXXX\n");
}

void loop() {
  // Read raw ADC value (0-4095 on ESP32)
  int adcValue = analogRead(MOISTURE_PIN);
  
  // Get current timestamp in milliseconds
  unsigned long timestamp = millis();
  
  // Output ADC value directly
  Serial.printf("[%lu ms] ADC Value: %d\n", timestamp, adcValue);
  
  delay(READ_INTERVAL);
}
