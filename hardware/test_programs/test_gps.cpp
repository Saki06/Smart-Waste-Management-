/*
 * Ublox NEO-6M GPS Module Test
 * For Smart Waste Management - Gets dustbin location
 * 
 * Wiring:
 * GPS VCC -> ESP32 5V (or 3.3V)
 * GPS GND -> ESP32 GND
 * GPS TX  -> ESP32 RX2 (GPIO16)
 * GPS RX  -> ESP32 TX2 (GPIO17)
 * 
 * Uses Hardware Serial 2 (Serial2) on ESP32
 * 
 * Note: GPS needs clear sky view and may take 30-120 seconds for first fix
 */

#include <Arduino.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// GPS object
TinyGPSPlus gps;

// Hardware Serial for GPS (Serial2)
HardwareSerial gpsSerial(2);

// GPS pins
#define GPS_RX 16  // ESP32 RX2 <- GPS TX
#define GPS_TX 17  // ESP32 TX2 -> GPS RX

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Ublox NEO-6M GPS Module Test ===");
  Serial.println("Purpose: Get dustbin location coordinates");
  
  // Initialize GPS serial at 9600 baud (default for NEO-6M)
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  
  Serial.println("\nGPS Module initialized!");
  Serial.println("⏳ Waiting for GPS signal...");
  Serial.println("   (May take 30-120 seconds for first fix)");
  Serial.println("   (Ensure GPS has clear view of sky)\n");
}

void displayGPSInfo() {
  Serial.println("==========================================");
  
  if (gps.location.isValid()) {
    Serial.println("✓ GPS FIX ACQUIRED!");
    Serial.println("------------------------------------------");
    Serial.printf("Latitude:  %.6f°\n", gps.location.lat());
    Serial.printf("Longitude: %.6f°\n", gps.location.lng());
    Serial.printf("Altitude:  %.2f meters\n", gps.altitude.meters());
    
    if (gps.speed.isValid()) {
      Serial.printf("Speed:     %.2f km/h\n", gps.speed.kmph());
    }
    
    if (gps.satellites.isValid()) {
      Serial.printf("Satellites: %d\n", gps.satellites.value());
    }
    
    if (gps.hdop.isValid()) {
      Serial.printf("HDOP:      %.2f\n", (float)gps.hdop.hdop());
    }
    
    if (gps.date.isValid() && gps.time.isValid()) {
      Serial.printf("Date/Time: %02d/%02d/%04d %02d:%02d:%02d UTC\n",
                    gps.date.day(), gps.date.month(), gps.date.year(),
                    gps.time.hour(), gps.time.minute(), gps.time.second());
    }
    
    // Google Maps link
    Serial.println("------------------------------------------");
    Serial.print("Google Maps: https://maps.google.com/?q=");
    Serial.print(gps.location.lat(), 6);
    Serial.print(",");
    Serial.println(gps.location.lng(), 6);
    
  } else {
    Serial.println("⏳ Searching for GPS signal...");
    
    if (gps.satellites.isValid()) {
      Serial.printf("   Satellites in view: %d\n", gps.satellites.value());
    }
    
    if (gps.charsProcessed() < 10) {
      Serial.println("   ⚠️ No GPS data received - check wiring!");
    }
  }
  
  Serial.println("==========================================\n");
}

void loop() {
  // Read data from GPS module
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
    
    // Optional: Uncomment to see raw GPS data
    // Serial.write(c);
  }
  
  // Display GPS info every 2 seconds
  static unsigned long lastDisplay = 0;
  if (millis() - lastDisplay > 2000) {
    lastDisplay = millis();
    displayGPSInfo();
    
    // Check for GPS timeout
    if (millis() > 5000 && gps.charsProcessed() < 10) {
      Serial.println("⚠️  WARNING: No GPS data received!");
      Serial.println("   Check:");
      Serial.println("   1. TX/RX connections (GPS TX -> ESP32 RX)");
      Serial.println("   2. Power supply to GPS module");
      Serial.println("   3. GPS baud rate (should be 9600)\n");
    }
  }
}
