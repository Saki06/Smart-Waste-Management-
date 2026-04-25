/*
 * NEO-6M GPS Module - DIAGNOSTIC TEST
 * Tests if GPS is sending ANY data to ESP32
 * 
 * Wiring:
 * GPS VCC -> ESP32 5V (or 3.3V)
 * GPS GND -> ESP32 GND
 * GPS TX  -> ESP32 RX2 (GPIO16)
 * GPS RX  -> ESP32 TX2 (GPIO17)
 */

#include <Arduino.h>
#include <HardwareSerial.h>

// Hardware Serial for GPS
HardwareSerial gpsSerial(2);

// GPS pins
#define GPS_RX 16  // ESP32 RX2 <- GPS TX
#define GPS_TX 17  // ESP32 TX2 -> GPS RX

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("NEO-6M GPS - DIAGNOSTIC TEST");
  Serial.println("========================================\n");
  
  Serial.println("Testing GPS at different baud rates...\n");
  
  // Try 9600 baud (default for NEO-6M)
  Serial.println("1. Testing 9600 baud (default)...");
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  delay(2000);
  
  if (gpsSerial.available()) {
    Serial.println("   ✓ GPS responding at 9600 baud!");
    Serial.println("\n========================================");
    Serial.println("RAW GPS DATA (9600 baud):");
    Serial.println("========================================\n");
  } else {
    Serial.println("   ✗ No data at 9600 baud");
    
    // Try 4800 baud
    Serial.println("\n2. Testing 4800 baud...");
    gpsSerial.end();
    delay(100);
    gpsSerial.begin(4800, SERIAL_8N1, GPS_RX, GPS_TX);
    delay(2000);
    
    if (gpsSerial.available()) {
      Serial.println("   ✓ GPS responding at 4800 baud!");
      Serial.println("\n========================================");
      Serial.println("RAW GPS DATA (4800 baud):");
      Serial.println("========================================\n");
    } else {
      Serial.println("   ✗ No data at 4800 baud");
      
      // Try 115200 baud
      Serial.println("\n3. Testing 115200 baud...");
      gpsSerial.end();
      delay(100);
      gpsSerial.begin(115200, SERIAL_8N1, GPS_RX, GPS_TX);
      delay(2000);
      
      if (gpsSerial.available()) {
        Serial.println("   ✓ GPS responding at 115200 baud!");
        Serial.println("\n========================================");
        Serial.println("RAW GPS DATA (115200 baud):");
        Serial.println("========================================\n");
      } else {
        Serial.println("   ✗ No data at 115200 baud");
        Serial.println("\n========================================");
        Serial.println("❌ GPS MODULE NOT RESPONDING!");
        Serial.println("========================================\n");
        Serial.println("Possible problems:");
        Serial.println("1. GPS TX pin not connected to ESP32 GPIO16 (RX2)");
        Serial.println("2. GPS not powered (check VCC and GND)");
        Serial.println("3. GPS module defective");
        Serial.println("4. Wrong pins - check your wiring!");
        Serial.println("\nCurrent pin configuration:");
        Serial.println("  GPS TX  -> ESP32 GPIO16 (RX2)");
        Serial.println("  GPS RX  -> ESP32 GPIO17 (TX2)");
        Serial.println("  GPS VCC -> ESP32 5V");
        Serial.println("  GPS GND -> ESP32 GND");
        Serial.println("\n========================================\n");
      }
    }
  }
}

void loop() {
  // Forward any data from GPS to Serial Monitor
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    Serial.write(c);
  }
  
  // Check if still no data after 10 seconds
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 10000) {
    lastCheck = millis();
    
    if (!gpsSerial.available()) {
      Serial.println("\n⚠️  Still no GPS data after 10 seconds!");
      Serial.println("   Check wiring and power supply.\n");
    }
  }
}
