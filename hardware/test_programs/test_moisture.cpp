/*
 * Capacitive Soil Moisture Sensor Test
 * For Smart Waste Management - Detects wetness in dustbin
 * 
 * Wiring:
 * Sensor VCC  -> ESP32 3.3V or 5V
 * Sensor GND  -> ESP32 GND
 * Sensor AOUT -> ESP32 GPIO34 (ADC1_CH6)
 * 
 * Analog reading: 
 * - Higher value = Dry
 * - Lower value = Wet
 */

#include <Arduino.h>

// Pin definition
#define MOISTURE_PIN 34  // ADC pin (use GPIO 32-39 for ADC on ESP32)

// Calibration values (calibrated from RAT test results)
#define AIR_VALUE 2623      // Sensor value in air (completely dry) - calibrated
#define WATER_VALUE 994     // Sensor value in water (completely wet) - calibrated

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Capacitive Moisture Sensor Test ===");
  Serial.println("Purpose: Detect wetness in dustbin");
  
  // Configure ADC
  pinMode(MOISTURE_PIN, INPUT);
  
  Serial.println("\nSensor initialized!");
  Serial.println("Reading moisture every 2 seconds...");
  Serial.println("\n[CALIBRATION NEEDED]");
  Serial.println("1. Place sensor in AIR and note the value -> Update AIR_VALUE");
  Serial.println("2. Place sensor in WATER and note the value -> Update WATER_VALUE\n");
}

int getMoisturePercentage(int rawValue) {
  // Convert raw ADC value to percentage
  // 0% = completely dry (air), 100% = completely wet (water)
  
  int percentage = map(rawValue, AIR_VALUE, WATER_VALUE, 0, 100);
  
  // Constrain to 0-100%
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  
  return percentage;
}

String getWetnessStatus(int percentage) {
  if (percentage < 20) {
    return "DRY - Normal";
  } else if (percentage < 50) {
    return "SLIGHTLY WET - Monitor";
  } else if (percentage < 70) {
    return "WET - Warning";
  } else {
    return "VERY WET - Alert! Risk of mosquito breeding";
  }
}

void loop() {
  // Read analog value (0-4095 on ESP32)
  int rawValue = analogRead(MOISTURE_PIN);
  
  // Convert to percentage
  int percentage = getMoisturePercentage(rawValue);
  
  // Get status
  String status = getWetnessStatus(percentage);
  
  // Display results
  Serial.println("------------------------------------------");
  Serial.printf("Raw ADC Value: %d\n", rawValue);
  Serial.printf("Moisture Level: %d%%\n", percentage);
  Serial.printf("Status: %s\n", status.c_str());
  Serial.println("------------------------------------------\n");
  
  delay(2000);
}
