/*
 * Single HC-SR04 Ultrasonic Sensor Test
 *
 * HC-SR04 VCC  -> ESP32 5V
 * HC-SR04 GND  -> ESP32 GND
 * HC-SR04 TRIG -> ESP32 GPIO5
 * HC-SR04 ECHO -> ESP32 GPIO18
 */

#include <Arduino.h>

#define TRIG_PIN 5
#define ECHO_PIN 18
#define SOUND_SPEED_CM_PER_US 0.034f

float getDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long durationUs = pulseIn(ECHO_PIN, HIGH, 30000);
  if (durationUs == 0) {
    return -1.0f;
  }

  return (durationUs * SOUND_SPEED_CM_PER_US) / 2.0f;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println();
  Serial.println("========================================");
  Serial.println("Single HC-SR04 Ultrasonic Sensor Test");
  Serial.println("========================================");
  Serial.println("TRIG: GPIO5, ECHO: GPIO18");
  Serial.println("Reading every 2 seconds...");
  Serial.println();
}

void loop() {
  unsigned long readTime = millis();
  float distanceCm = getDistanceCm();

  Serial.printf("t=%lu ms | ", readTime);

  if (distanceCm < 0) {
    Serial.println("No echo (check wiring / out of range)");
  } else if (distanceCm < 2.0f || distanceCm > 400.0f) {
    Serial.printf("Distance: %.2f cm (outside reliable range 2-400 cm)\n", distanceCm);
  } else {
    Serial.printf("Distance: %.2f cm\n", distanceCm);
  }

  delay(2000);
}
