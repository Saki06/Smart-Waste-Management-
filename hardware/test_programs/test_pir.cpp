/*
 * HC-SR501 PIR Motion Sensor Test - FIXED VERSION
 * For Smart Waste Management - Detects motion near dustbin
 * 
 * Wiring:
 * PIR VCC  -> ESP32 5V
 * PIR GND  -> ESP32 GND
 * PIR OUT  -> ESP32 GPIO19
 * 
 * HARDWARE ADJUSTMENTS NEEDED:
 * 
 * 1. JUMPER SETTING (on back of PIR module):
 *    - Position 1 (L): Non-repeatable trigger (RECOMMENDED for your use case)
 *    - Position 2 (H): Repeatable trigger
 *    
 *    For waste bin monitoring, use NON-REPEATABLE (L) mode
 *    This prevents continuous triggers and saves power
 * 
 * 2. DELAY POTENTIOMETER:
 *    - Turn COUNTER-CLOCKWISE to minimum (about 3-5 seconds)
 *    - This reduces false continuous detection
 * 
 * 3. SENSITIVITY POTENTIOMETER:
 *    - Start at middle position
 *    - Adjust if needed (clockwise = more sensitive)
 * 
 * 4. WARM-UP TIME:
 *    - PIR needs 60 seconds (1 minute) warm-up
 *    - During warm-up, it may trigger 0-3 false times
 * 
 * Sensor Output:
 * - HIGH = Motion detected
 * - LOW = No motion
 */

#include <Arduino.h>

// Pin definition
#define PIR_PIN 19

// Configuration
#define MOTION_COOLDOWN 5000  // 5 seconds cooldown between detections

// Variables for motion detection
unsigned long lastMotionTime = 0;
unsigned long lastReportTime = 0;
int motionCount = 0;
bool previousState = LOW;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("HC-SR501 PIR Motion Sensor Test");
  Serial.println("Smart Waste Management System");
  Serial.println("========================================");
  Serial.println("\nHARDWARE SETUP CHECKLIST:");
  Serial.println("[ ] Jumper set to L (Non-repeatable)");
  Serial.println("[ ] Delay pot turned counter-clockwise (minimum)");
  Serial.println("[ ] Sensitivity pot at middle position");
  Serial.println("[ ] Sensor has clear view (no obstructions)");
  Serial.println("[ ] Sensor not facing lights or heat sources");
  Serial.println("[ ] Sensor not exposed to wind or fans");
  Serial.println("\n========================================\n");
  
  // Configure pin
  pinMode(PIR_PIN, INPUT);
  
  Serial.println("Sensor initialized!");
  Serial.println("⏳ WARM-UP PERIOD: 60 seconds");
  Serial.println("   Please keep still during warm-up...");
  Serial.println("   (Sensor may trigger 0-3 times - this is normal)\n");
  
  // Warm-up period - PIR datasheet specifies 60 seconds
  for (int i = 60; i > 0; i--) {
    Serial.printf("   Warming up... %d seconds remaining\r", i);
    delay(1000);
  }
  
  Serial.println("\n\n✓ Warm-up complete! Sensor is ready.");
  Serial.println("Monitoring for motion...\n");
}

void loop() {
  // Read PIR sensor state
  int currentState = digitalRead(PIR_PIN);
  unsigned long currentTime = millis();
  
  // Detect rising edge (motion starts)
  if (currentState == HIGH && previousState == LOW) {
    // Check if enough time has passed since last detection (debounce)
    if (currentTime - lastMotionTime > MOTION_COOLDOWN) {
      motionCount++;
      lastMotionTime = currentTime;
      
      Serial.println("========================================");
      Serial.println("🚨 MOTION DETECTED!");
      Serial.printf("Motion Event #%d\n", motionCount);
      Serial.printf("Time: %lu ms\n", currentTime);
      Serial.println("Status: Person or animal near dustbin");
      Serial.println("========================================\n");
    } else {
      // Motion detected but within cooldown period - likely false trigger
      Serial.println("⚠️  Motion detected but within cooldown - ignoring");
    }
  }
  
  // Detect falling edge (motion ends)
  if (currentState == LOW && previousState == HIGH) {
    unsigned long motionDuration = currentTime - lastMotionTime;
    Serial.printf("✓ Motion ended. Duration: %lu ms\n\n", motionDuration);
  }
  
  // Report status every 10 seconds when no motion
  if (currentState == LOW && (currentTime - lastReportTime > 10000)) {
    lastReportTime = currentTime;
    unsigned long timeSinceLastMotion = currentTime - lastMotionTime;
    
    Serial.println("------------------------------------------");
    Serial.println("Status: No motion detected");
    if (motionCount > 0) {
      Serial.printf("Last motion: %lu seconds ago\n", timeSinceLastMotion / 1000);
    }
    Serial.printf("Total motion events: %d\n", motionCount);
    Serial.println("------------------------------------------\n");
  }
  
  // Save current state
  previousState = currentState;
  
  // Small delay to avoid excessive CPU usage
  delay(100);
}
