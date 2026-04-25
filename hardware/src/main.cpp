/*
 * Smart Waste Management System - Stage 3 Integration
 *
 * Integrates 4 sensors:
 * 1. HC-SR04 Ultrasonic (Bin Fill Level) - Timed reading
 * 2. PIR Motion Sensor (Motion Detection) - Interrupt-driven
 * 3. Capacitive Moisture Sensor (Wetness) - Timed reading
 * 4. Ublox NEO-6M GPS (Location) - Timed reading
 *
 * Features:
 * - WiFi connectivity
 * - MQTT data transmission to HiveMQ broker
 * - JSON formatted data with GPS coordinates
 * - Configurable RAW/ANALYZED data mode
 * - Data validation and error handling
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <ESPAsyncWebServer.h>
#include <Update.h>
#include "config.h"

// Global objects
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// GPS objects
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

// OTA Web Server
AsyncWebServer otaServer(OTA_HTTP_PORT);
bool otaInProgress = false;

// NTP synchronized flag
bool timeInitialized = false;

// Time-series data structures
struct UltrasonicReading {
  String timestamp;
  float distance_cm;
  int fill_percentage;
  bool valid;
};

struct MoistureReading {
  String timestamp;
  int adc_value;
  int percentage;
  bool valid;
};

// Circular buffers
UltrasonicReading ultrasonicBuffer[ULTRASONIC_BUFFER_SIZE];
MoistureReading moistureBuffer[MOISTURE_BUFFER_SIZE];

int ultrasonicBufferIndex = 0;
int moistureBufferIndex = 0;
int ultrasonicBufferCount = 0;
int moistureBufferCount = 0;

// Current sensor data
struct SensorData {
  float distance_cm;
  float distance_cm_1;
  float distance_cm_2;
  int fill_percentage;
  String fill_status;
  bool distance_valid;
  bool distance_valid_1;
  bool distance_valid_2;

  int moisture_adc;
  int moisture_percentage;
  String moisture_status;
  bool moisture_valid;

  bool motion_detected;
  unsigned long last_motion_time;
  int pir_state;
  
  // GPS Location Data
  float gps_latitude;
  float gps_longitude;
  float gps_altitude;
  int gps_satellites;
  bool gps_valid;
} sensorData;

// Timing variables
unsigned long lastUltrasonicRead = 0;
unsigned long lastMoistureRead = 0;
unsigned long lastMqttPublish = 0;
unsigned long lastPirTrigger = 0;
unsigned long lastGpsRead = 0;
unsigned long lastMqttReconnectAttempt = 0;

// MQTT reconnect state
bool useSecondaryBroker = false;
char mqttClientIdRuntime[48] = {0};

// Interrupt flag
volatile bool pirInterruptFlag = false;

// Function declarations
void setupWiFi();
void setupNTP();
void setupMQTT();
void setupOTA();
void reconnectMQTT();
void readUltrasonicSensor();
float readUltrasonicDistance(int trigPin, int echoPin);
int calculateFillPercentage(float distanceCm);
void readMoistureSensor();
void readGPSSensor();
void handlePIRMotion();
void publishSensorData();
String getFillStatus(int percentage);
String getMoistureStatus(int percentage);
bool validateDistance(float distance);
bool validateMoisture(int percentage);
String getISOTimestamp();
void IRAM_ATTR pirISR();

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);

  DEBUG_PRINTLN("\n=== Smart Waste Management System ===");
  DEBUG_PRINTLN("Stage 2: Sensor Integration");
  DEBUG_PRINTF("Firmware Version: %s\n", FIRMWARE_VERSION);
  DEBUG_PRINTF("Device ID: %s\n", DEVICE_ID);
  DEBUG_PRINTF("Location: %s\n\n", DEVICE_LOCATION);

  #if SEND_RAW_DATA
    DEBUG_PRINTLN("Data Mode: RAW DATA");
    DEBUG_PRINTLN("  - Ultrasonic: Distance (cm)");
    DEBUG_PRINTLN("  - PIR: Digital state (0/1)");
    DEBUG_PRINTLN("  - Moisture: ADC value (0-4095)");
  #else
    DEBUG_PRINTLN("Data Mode: ANALYZED DATA");
    DEBUG_PRINTLN("  - Ultrasonic: Fill % + Status");
    DEBUG_PRINTLN("  - PIR: Motion events");
    DEBUG_PRINTLN("  - Moisture: Moisture % + Status");
  #endif
  DEBUG_PRINTLN();

  // Ultrasonic (Single Sensor)
  pinMode(TRIG_PIN_1, OUTPUT);
  pinMode(ECHO_PIN_1, INPUT);
  DEBUG_PRINTLN("HC-SR04 Ultrasonic sensor initialized (1 sensor)");

  // Moisture
  pinMode(MOISTURE_PIN, INPUT);
  DEBUG_PRINTLN("Moisture sensor initialized");

  // PIR - use CHANGE for proper edge detection
  pinMode(PIR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIR_PIN), pirISR, CHANGE);
  DEBUG_PRINTLN("PIR sensor initialized (CHANGE interrupt mode)");

  // GPS - initialize hardware serial at 9600 baud
  gpsSerial.begin(GPS_BAUD_RATE, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  DEBUG_PRINTLN("GPS module initialized");
  DEBUG_PRINTLN("⏳ GPS WARM-UP PERIOD: 60 seconds");
  DEBUG_PRINTLN("   Please keep sensor in clear sky view...");
  DEBUG_PRINTLN("   (Module may trigger false locks 0-3 times - normal)\n");
  
  // GPS warm-up period - allow initialization time
  for (int i = 60; i > 0; i--) {
    if (i % 10 == 0) {
      DEBUG_PRINTF("   GPS warming up... %d seconds remaining\n", i);
    }
    
    // Keep reading GPS data during warm-up
    while (gpsSerial.available() > 0) {
      gps.encode(gpsSerial.read());
    }
    
    delay(1000);
  }
  
  DEBUG_PRINTLN("✓ GPS warm-up complete! Ready for signal acquisition.\n");

  DEBUG_PRINTLN();

  // Initial sensor state
  sensorData.distance_valid = false;
  sensorData.distance_valid_1 = false;
  sensorData.distance_valid_2 = false;
  sensorData.distance_cm = 0.0;
  sensorData.distance_cm_1 = 0.0;
  sensorData.distance_cm_2 = 0.0;
  sensorData.fill_percentage = 0;
  sensorData.fill_status = "EMPTY";
  sensorData.moisture_valid = false;
  sensorData.motion_detected = false;
  sensorData.last_motion_time = 0;
  sensorData.pir_state = 0;
  sensorData.gps_valid = false;
  sensorData.gps_latitude = 0.0;
  sensorData.gps_longitude = 0.0;
  sensorData.gps_altitude = 0.0;
  sensorData.gps_satellites = 0;

  setupWiFi();
  setupNTP();
  setupMQTT();
  setupOTA();

  DEBUG_PRINTLN("\n=== System Ready ===\n");
  DEBUG_PRINT("OTA Update URL: http://");
  DEBUG_PRINTLN(WiFi.localIP());
}

void loop() {
  unsigned long currentTime = millis();

  // Skip sensor/MQTT processing during OTA update
  if (otaInProgress) {
    delay(100);
    return;
  }

  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Timed ultrasonic reading
  if (currentTime - lastUltrasonicRead >= ULTRASONIC_INTERVAL) {
    readUltrasonicSensor();
    lastUltrasonicRead = currentTime;
  }

  // Timed moisture reading
  if (currentTime - lastMoistureRead >= MOISTURE_INTERVAL) {
    readMoistureSensor();
    lastMoistureRead = currentTime;
  }

  // Timed GPS reading
  if (currentTime - lastGpsRead >= GPS_INTERVAL) {
    readGPSSensor();
    lastGpsRead = currentTime;
  }

  // PIR handling
  if (pirInterruptFlag) {
    handlePIRMotion();
    pirInterruptFlag = false;
  }

  // Timed MQTT publish
  if (currentTime - lastMqttPublish >= MQTT_PUBLISH_INTERVAL) {
    publishSensorData();
    lastMqttPublish = currentTime;
  }
}

void setupWiFi() {
  DEBUG_PRINT("Connecting to WiFi: ");
  DEBUG_PRINTLN(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    DEBUG_PRINT(".");

    if (millis() - startTime > WIFI_TIMEOUT_MS) {
      DEBUG_PRINTLN("\nWiFi connection timeout!");
      DEBUG_PRINTLN("Please check SSID and password in config.h");
      return;
    }
  }

  DEBUG_PRINTLN("\nWiFi connected!");
  DEBUG_PRINT("IP Address: ");
  DEBUG_PRINTLN(WiFi.localIP());
  DEBUG_PRINT("Signal Strength: ");
  DEBUG_PRINT(WiFi.RSSI());
  DEBUG_PRINTLN(" dBm");
}

void setupNTP() {
  DEBUG_PRINTLN("\nSynchronizing time with NTP...");
  DEBUG_PRINTF("NTP Server: %s\n", NTP_SERVER);
  DEBUG_PRINTLN("Timezone: UTC+5:30 (Sri Lanka)");

  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER, NTP_SERVER_BACKUP);

  struct tm timeinfo;
  int retries = 0;
  while (!getLocalTime(&timeinfo) && retries < 10) {
    DEBUG_PRINT(".");
    delay(1000);
    retries++;
  }

  if (retries >= 10) {
    DEBUG_PRINTLN("\nFailed to sync time with NTP");
    DEBUG_PRINTLN("Using millis() for timestamps");
    timeInitialized = false;
  } else {
    DEBUG_PRINTLN("\nTime synchronized!");
    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%A, %B %d %Y %H:%M:%S", &timeinfo);
    DEBUG_PRINT("Current time: ");
    DEBUG_PRINTLN(timeStr);
    timeInitialized = true;
  }
}

void setupMQTT() {
  mqttClient.setKeepAlive(MQTT_KEEPALIVE_INTERVAL);
  mqttClient.setBufferSize(2048);

  uint64_t mac = ESP.getEfuseMac();
  snprintf(mqttClientIdRuntime, sizeof(mqttClientIdRuntime), "%s_%06X", MQTT_CLIENT_ID, (uint32_t)(mac & 0xFFFFFF));

  DEBUG_PRINTF("MQTT Primary Broker: %s:%d\n", MQTT_BROKER, MQTT_PORT);
  DEBUG_PRINTF("MQTT Secondary Broker: %s:%d\n", MQTT_SECONDARY_BROKER, MQTT_PORT);
  DEBUG_PRINTF("Client ID: %s\n", mqttClientIdRuntime);
  DEBUG_PRINTLN("MQTT Buffer Size: 2048 bytes");

  reconnectMQTT();
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    DEBUG_PRINTLN("WiFi not connected, skipping MQTT");
    return;
  }

  if (mqttClient.connected()) {
    return;
  }

  unsigned long now = millis();
  if (now - lastMqttReconnectAttempt < MQTT_RECONNECT_DELAY) {
    return;
  }

  lastMqttReconnectAttempt = now;

  const char* selectedBroker = useSecondaryBroker ? MQTT_SECONDARY_BROKER : MQTT_BROKER;
  mqttClient.setServer(selectedBroker, MQTT_PORT);

  DEBUG_PRINTF("Connecting to MQTT broker (%s)...", selectedBroker);

  if (mqttClient.connect(mqttClientIdRuntime)) {
    DEBUG_PRINTLN(" Connected!");

    StaticJsonDocument<200> doc;
    doc["device_id"] = DEVICE_ID;
    doc["status"] = "online";
    doc["timestamp"] = millis();

    char buffer[200];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC_STATUS, buffer);
  } else {
    DEBUG_PRINT(" Failed, rc=");
    DEBUG_PRINTLN(mqttClient.state());
    useSecondaryBroker = !useSecondaryBroker;
    DEBUG_PRINTF("Next retry will use: %s\n", useSecondaryBroker ? MQTT_SECONDARY_BROKER : MQTT_BROKER);
  }
}

float readUltrasonicDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) {
    return -1.0;
  }

  return duration * 0.034 / 2.0;
}

int calculateFillPercentage(float distanceCm) {
  float wasteHeight = BIN_HEIGHT_CM - distanceCm + SENSOR_OFFSET_CM;
  wasteHeight = constrain(wasteHeight, 0, BIN_HEIGHT_CM);
  int fillPercentage = (int)((wasteHeight / BIN_HEIGHT_CM) * 100);
  return constrain(fillPercentage, VALID_FILL_MIN, VALID_FILL_MAX);
}

void readUltrasonicSensor() {
  String timestamp = getISOTimestamp();

  float distance1 = readUltrasonicDistance(TRIG_PIN_1, ECHO_PIN_1);
  bool isValid1 = validateDistance(distance1);

  if (!isValid1) {
    DEBUG_PRINTF("⚠️ Ultrasonic-1 out of range: %.2f cm\n", distance1);
  }

  int fillPercentage = isValid1 ? calculateFillPercentage(distance1) : 0;

  sensorData.distance_cm_1 = distance1;
  sensorData.distance_valid_1 = isValid1;
  // Sensor 2 removed from hardware; keep compatibility fields stable for backend.
  sensorData.distance_cm_2 = -1.0;
  sensorData.distance_valid_2 = false;
  sensorData.distance_cm = distance1;
  sensorData.distance_valid = isValid1;
  sensorData.fill_percentage = fillPercentage;
  sensorData.fill_status = getFillStatus(fillPercentage);

  #if ENABLE_DATA_BUFFERING
    if (BUFFER_INDEX_CHECK(ultrasonicBufferIndex, ULTRASONIC_BUFFER_SIZE)) {
      ultrasonicBuffer[ultrasonicBufferIndex].timestamp = timestamp;
      ultrasonicBuffer[ultrasonicBufferIndex].distance_cm = distance1;
      ultrasonicBuffer[ultrasonicBufferIndex].fill_percentage = fillPercentage;
      ultrasonicBuffer[ultrasonicBufferIndex].valid = isValid1;

      ultrasonicBufferIndex = (ultrasonicBufferIndex + 1) % ULTRASONIC_BUFFER_SIZE;
      if (ultrasonicBufferCount < ULTRASONIC_BUFFER_SIZE) {
        ultrasonicBufferCount++;
      }
    } else {
      DEBUG_PRINTLN("ERROR: Ultrasonic buffer index out of bounds!");
      ultrasonicBufferIndex = 0;
    }
  #endif

  DEBUG_PRINTLN("--- Ultrasonic Sensor ---");
  DEBUG_PRINTF("Timestamp: %s\n", timestamp.c_str());
  DEBUG_PRINTF("Distance-1: %.2f cm (Valid: %s)\n", distance1, isValid1 ? "YES" : "NO");
  DEBUG_PRINTF("Distance: %.2f cm\n", distance1);
  DEBUG_PRINTF("Fill Level: %d%%\n", fillPercentage);
  DEBUG_PRINTF("Status: %s\n", sensorData.fill_status.c_str());
  DEBUG_PRINTF("Buffer: %d/%d\n\n", ultrasonicBufferCount, ULTRASONIC_BUFFER_SIZE);
}

void readMoistureSensor() {
  String timestamp = getISOTimestamp();

  int adcValue = analogRead(MOISTURE_PIN);
  if (adcValue < 0 || adcValue > 4095) {
    DEBUG_PRINTF("⚠️ ADC value out of range: %d\n", adcValue);
    adcValue = constrain(adcValue, 0, 4095);
  }

  int percentage = map(adcValue, AIR_VALUE, WATER_VALUE, 0, 100);
  percentage = constrain(percentage, VALID_MOISTURE_MIN, VALID_MOISTURE_MAX);

  bool isValid = validateMoisture(percentage);
  if (!isValid) {
    DEBUG_PRINTF("⚠️ Moisture percentage out of range: %d%%\n", percentage);
  }

  sensorData.moisture_adc = adcValue;
  sensorData.moisture_percentage = percentage;
  sensorData.moisture_status = getMoistureStatus(percentage);
  sensorData.moisture_valid = isValid;

  #if ENABLE_DATA_BUFFERING
    if (BUFFER_INDEX_CHECK(moistureBufferIndex, MOISTURE_BUFFER_SIZE)) {
      moistureBuffer[moistureBufferIndex].timestamp = timestamp;
      moistureBuffer[moistureBufferIndex].adc_value = adcValue;
      moistureBuffer[moistureBufferIndex].percentage = percentage;
      moistureBuffer[moistureBufferIndex].valid = isValid;

      moistureBufferIndex = (moistureBufferIndex + 1) % MOISTURE_BUFFER_SIZE;
      if (moistureBufferCount < MOISTURE_BUFFER_SIZE) {
        moistureBufferCount++;
      }
    } else {
      DEBUG_PRINTLN("ERROR: Moisture buffer index out of bounds!");
      moistureBufferIndex = 0;
    }
  #endif

  DEBUG_PRINTLN("--- Moisture Sensor ---");
  DEBUG_PRINTF("Timestamp: %s\n", timestamp.c_str());
  DEBUG_PRINTF("ADC Value: %d (Valid: %s)\n", adcValue, isValid ? "YES" : "NO");
  DEBUG_PRINTF("Moisture Level: %d%%\n", percentage);
  DEBUG_PRINTF("Status: %s\n", sensorData.moisture_status.c_str());
  DEBUG_PRINTF("Buffer: %d/%d\n\n", moistureBufferCount, MOISTURE_BUFFER_SIZE);
}

void readGPSSensor() {
  // Process all available GPS data
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
  }

  String timestamp = getISOTimestamp();
  
  // Check if we have a valid GPS fix
  bool isValid = gps.location.isValid();
  
  // Store GPS location data
  if (isValid) {
    sensorData.gps_latitude = gps.location.lat();
    sensorData.gps_longitude = gps.location.lng();
    sensorData.gps_altitude = gps.altitude.meters();
  }
  
  // Always update satellite count
  if (gps.satellites.isValid()) {
    sensorData.gps_satellites = gps.satellites.value();
  }
  
  sensorData.gps_valid = isValid;
  
  DEBUG_PRINTLN("--- GPS Sensor ---");
  DEBUG_PRINTF("Timestamp: %s\n", timestamp.c_str());
  
  if (isValid) {
    DEBUG_PRINTLN("✓ GPS FIX ACQUIRED!");
    DEBUG_PRINTF("Latitude:  %.6f°\n", sensorData.gps_latitude);
    DEBUG_PRINTF("Longitude: %.6f°\n", sensorData.gps_longitude);
    DEBUG_PRINTF("Altitude:  %.2f meters\n", sensorData.gps_altitude);
    DEBUG_PRINTF("Satellites: %d\n", sensorData.gps_satellites);
    // Google Maps link
    DEBUG_PRINTF("Google Maps: https://maps.google.com/?q=%.6f,%.6f\n", 
                 sensorData.gps_latitude, sensorData.gps_longitude);
  } else {
    DEBUG_PRINTLN("⏳ Searching for GPS signal...");
    
    // Debug info for troubleshooting
    if (gps.charsProcessed() < 10) {
      DEBUG_PRINTLN("   ⚠️ WARNING: No GPS data received!");
      DEBUG_PRINTLN("   Check:");
      DEBUG_PRINTLN("     1. TX/RX wiring (GPS TX → ESP32 RX2/GPIO16)");
      DEBUG_PRINTLN("     2. Power supply to GPS module (5V/3.3V stable)");
      DEBUG_PRINTLN("     3. Baud rate (should be 9600)");
      DEBUG_PRINTLN("     4. GPS antenna has clear sky view");
    } else if (gps.satellites.isValid()) {
      DEBUG_PRINTF("   Satellites in view: %d\n", sensorData.gps_satellites);
      if (sensorData.gps_satellites < 4) {
        DEBUG_PRINTLN("   ⚠️ Not enough satellites (need 4+) - wait longer or move outside");
      }
    }
  }
  DEBUG_PRINTLN();
}

void handlePIRMotion() {
  String timestamp = getISOTimestamp();

  // debounce
  unsigned long now = millis();
  if (now - lastPirTrigger < PIR_DEBOUNCE_MS) {
    return;
  }

  lastPirTrigger = now;

  int pirState = digitalRead(PIR_PIN);
  if (pirState < 0 || pirState > 1) {
    DEBUG_PRINTLN("⚠️ Invalid PIR state read!");
    return;
  }

  sensorData.pir_state = pirState;
  sensorData.motion_detected = (pirState == HIGH);

  if (sensorData.motion_detected) {
    sensorData.last_motion_time = now;
  }

  DEBUG_PRINTLN("--- PIR Motion Sensor ---");
  DEBUG_PRINTF("Motion Detected: %s\n", pirState ? "YES" : "NO");
  DEBUG_PRINTF("Timestamp: %s\n", timestamp.c_str());

  StaticJsonDocument<300> doc;
  doc["device_id"] = DEVICE_ID;
  doc["location"] = DEVICE_LOCATION;
  doc["motion_detected"] = sensorData.motion_detected;
  doc["pir_state"] = pirState;
  doc["timestamp"] = timestamp;

  char buffer[300];
  size_t docSize = serializeJson(doc, buffer);

  if (docSize > sizeof(buffer)) {
    DEBUG_PRINTLN("ERROR: Motion JSON exceeds buffer size!");
    return;
  }

  bool published = mqttClient.publish(MQTT_TOPIC_MOTION, buffer);
  if (published) {
    DEBUG_PRINTLN("✓ Motion event published\n");
  } else {
    DEBUG_PRINTF("✗ Motion publish failed (MQTT state: %d)\n\n", mqttClient.state());
  }
}

void IRAM_ATTR pirISR() {
  pirInterruptFlag = true;
}

void publishSensorData() {
  if (!mqttClient.connected()) {
    DEBUG_PRINTLN("⚠️ MQTT not connected, skipping publish");
    return;
  }

  StaticJsonDocument<2048> doc;

  doc["device_id"] = DEVICE_ID;
  doc["location"] = DEVICE_LOCATION;
  doc["timestamp"] = getISOTimestamp();

  #if ENABLE_DATA_BUFFERING
    doc["data_mode"] = "timeseries";

    if (ultrasonicBufferCount > 0) {
      JsonArray ultrasonicArray = doc.createNestedArray("ultrasonic_readings");
      for (int i = 0; i < ultrasonicBufferCount; i++) {
        if (!BUFFER_INDEX_CHECK(i, ULTRASONIC_BUFFER_SIZE)) {
          DEBUG_PRINTF("ERROR: Ultrasonic buffer bounds exceeded at index %d\n", i);
          break;
        }

        JsonObject reading = ultrasonicArray.createNestedObject();
        reading["timestamp"] = ultrasonicBuffer[i].timestamp;

        #if SEND_RAW_DATA
          reading["distance_cm"] = ultrasonicBuffer[i].distance_cm;
        #else
          reading["distance_cm"] = ultrasonicBuffer[i].distance_cm;
          reading["fill_percentage"] = ultrasonicBuffer[i].fill_percentage;
        #endif

        reading["valid"] = ultrasonicBuffer[i].valid;
      }
    }

    if (moistureBufferCount > 0) {
      JsonArray moistureArray = doc.createNestedArray("moisture_readings");
      for (int i = 0; i < moistureBufferCount; i++) {
        if (!BUFFER_INDEX_CHECK(i, MOISTURE_BUFFER_SIZE)) {
          DEBUG_PRINTF("ERROR: Moisture buffer bounds exceeded at index %d\n", i);
          break;
        }

        JsonObject reading = moistureArray.createNestedObject();
        reading["timestamp"] = moistureBuffer[i].timestamp;

        #if SEND_RAW_DATA
          reading["adc_value"] = moistureBuffer[i].adc_value;
        #else
          reading["adc_value"] = moistureBuffer[i].adc_value;
          reading["percentage"] = moistureBuffer[i].percentage;
        #endif

        reading["valid"] = moistureBuffer[i].valid;
      }
    }

    ultrasonicBufferCount = 0;
    ultrasonicBufferIndex = 0;
    moistureBufferCount = 0;
    moistureBufferIndex = 0;

  #else
    doc["data_mode"] = SEND_RAW_DATA ? "raw" : "analyzed";

    #if SEND_RAW_DATA
      doc["ultrasonic"]["distance_cm_1"] = sensorData.distance_cm_1;
      doc["ultrasonic"]["distance_cm_2"] = sensorData.distance_cm_2;
      doc["ultrasonic"]["distance_cm_avg"] = sensorData.distance_cm;
      doc["ultrasonic"]["valid_1"] = sensorData.distance_valid_1;
      doc["ultrasonic"]["valid_2"] = sensorData.distance_valid_2;
      doc["ultrasonic"]["valid_avg"] = sensorData.distance_valid;

      if (sensorData.moisture_valid) {
        doc["moisture"]["adc_value"] = sensorData.moisture_adc;
      }

      doc["pir"]["state"] = sensorData.pir_state;

    #else
      doc["ultrasonic"]["distance_cm_1"] = sensorData.distance_cm_1;
      doc["ultrasonic"]["distance_cm_2"] = sensorData.distance_cm_2;
      doc["ultrasonic"]["distance_cm_avg"] = sensorData.distance_cm;
      doc["ultrasonic"]["valid_1"] = sensorData.distance_valid_1;
      doc["ultrasonic"]["valid_2"] = sensorData.distance_valid_2;
      doc["ultrasonic"]["valid_avg"] = sensorData.distance_valid;
      if (sensorData.distance_valid) {
        doc["ultrasonic"]["fill_percentage"] = sensorData.fill_percentage;
        doc["ultrasonic"]["status"] = sensorData.fill_status;
      }

      if (sensorData.moisture_valid) {
        doc["moisture"]["moisture_percentage"] = sensorData.moisture_percentage;
        doc["moisture"]["status"] = sensorData.moisture_status;
        doc["moisture"]["adc_value"] = sensorData.moisture_adc;
      }

      doc["pir"]["motion_detected"] = sensorData.motion_detected;
      doc["pir"]["pir_state"] = sensorData.pir_state;
    #endif

    // GPS Location Data
    if (sensorData.gps_valid) {
      doc["gps"]["latitude"] = sensorData.gps_latitude;
      doc["gps"]["longitude"] = sensorData.gps_longitude;
      doc["gps"]["altitude"] = sensorData.gps_altitude;
      doc["gps"]["satellites"] = sensorData.gps_satellites;
      doc["gps"]["fix"] = "acquired";
    } else {
      doc["gps"]["fix"] = "searching";
      doc["gps"]["satellites"] = sensorData.gps_satellites;
    }
  #endif

  JsonArray alerts = doc.createNestedArray("alerts");
  if (sensorData.fill_percentage >= ALERT_BIN_FULL_THRESHOLD) {
    alerts.add("BIN_FULL");
  }
  if (sensorData.moisture_percentage >= ALERT_MOISTURE_HIGH_THRESHOLD) {
    alerts.add("HIGH_MOISTURE");
  }

  char buffer[2048];
  size_t len = serializeJson(doc, buffer);

  DEBUG_PRINTLN("\n=== Publishing to MQTT ===");
  DEBUG_PRINTF("Topic: %s\n", MQTT_TOPIC_SENSORS);
  DEBUG_PRINTF("Payload (%d bytes):\n", len);
  DEBUG_PRINTLN(buffer);
  DEBUG_PRINTLN();

  if (len > sizeof(buffer)) {
    DEBUG_PRINTLN("ERROR: Payload exceeds buffer size!");
    DEBUG_PRINTF("Payload size: %d bytes, Buffer size: %d bytes\n", len, sizeof(buffer));
    return;
  }

  bool published = mqttClient.publish(MQTT_TOPIC_SENSORS, buffer);
  if (published) {
    DEBUG_PRINTLN("Published successfully\n");
  } else {
    DEBUG_PRINTLN("Publish failed!");
    DEBUG_PRINTF("MQTT State: %d\n", mqttClient.state());
    DEBUG_PRINTF("WiFi Status: %d\n", WiFi.status());
    DEBUG_PRINTF("Payload Size: %d bytes\n\n", len);
  }
}

String getFillStatus(int percentage) {
  if (percentage < FILL_EMPTY) return "EMPTY";
  else if (percentage < FILL_HALF) return "LOW";
  else if (percentage < FILL_ALMOST_FULL) return "HALF_FULL";
  else return "FULL";
}

String getMoistureStatus(int percentage) {
  if (percentage < MOISTURE_DRY) return "DRY";
  else if (percentage < MOISTURE_SLIGHTLY_WET) return "SLIGHTLY_WET";
  else if (percentage < MOISTURE_WET) return "WET";
  else return "VERY_WET";
}

bool validateDistance(float distance) {
  return (distance >= VALID_DISTANCE_MIN && distance <= VALID_DISTANCE_MAX && distance > 0);
}

bool validateMoisture(int percentage) {
  return (percentage >= VALID_MOISTURE_MIN && percentage <= VALID_MOISTURE_MAX);
}

String getISOTimestamp() {
  if (!timeInitialized) {
    return String(millis());
  }

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(millis());
  }

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S+05:30", &timeinfo);
  return String(buffer);
}

// ==================== OTA WEB UPDATE ====================

// HTML page stored in flash (PROGMEM) to save heap memory
const char OTA_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartBin OTA Update</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: #1e293b;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      border: 1px solid #334155;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 8px;
      color: #38bdf8;
    }
    .info {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .info span { color: #22d3ee; font-weight: 600; }
    .upload-area {
      border: 2px dashed #475569;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin-bottom: 20px;
      transition: border-color 0.3s;
      cursor: pointer;
    }
    .upload-area:hover, .upload-area.dragover {
      border-color: #38bdf8;
    }
    .upload-area p { color: #94a3b8; margin-bottom: 12px; }
    input[type="file"] { display: none; }
    .file-label {
      display: inline-block;
      background: #334155;
      color: #38bdf8;
      padding: 10px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }
    .file-label:hover { background: #475569; }
    .file-name {
      margin-top: 10px;
      font-size: 0.85rem;
      color: #22d3ee;
      word-break: break-all;
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.3s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled {
      background: #475569;
      cursor: not-allowed;
      opacity: 0.6;
    }
    .progress-wrap {
      display: none;
      margin-top: 20px;
    }
    .progress-bar {
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #06b6d4, #38bdf8);
      border-radius: 4px;
      transition: width 0.3s;
    }
    .progress-text {
      text-align: center;
      margin-top: 8px;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .status {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      display: none;
    }
    .status.success { display: block; background: #064e3b; color: #34d399; }
    .status.error { display: block; background: #450a0a; color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <h1>&#x1F5D1; SmartBin OTA Update</h1>
    <div class="info">
      Firmware: <span>)rawliteral" FIRMWARE_VERSION R"rawliteral(</span> &bull;
      Device: <span>)rawliteral" DEVICE_ID R"rawliteral(</span>
    </div>
    <form id="otaForm">
      <div class="upload-area" id="dropZone">
        <p>Drag &amp; drop .bin file here or</p>
        <label class="file-label" for="fileInput">Choose File</label>
        <input type="file" id="fileInput" name="firmware" accept=".bin">
        <div class="file-name" id="fileName"></div>
      </div>
      <button type="submit" class="btn" id="uploadBtn" disabled>Upload Firmware</button>
    </form>
    <div class="progress-wrap" id="progressWrap">
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      <div class="progress-text" id="progressText">Uploading... 0%</div>
    </div>
    <div class="status" id="statusMsg"></div>
  </div>
  <script>
    const form = document.getElementById('otaForm');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressWrap = document.getElementById('progressWrap');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statusMsg = document.getElementById('statusMsg');
    const dropZone = document.getElementById('dropZone');

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileName.textContent = fileInput.files[0].name + ' (' + (fileInput.files[0].size / 1024).toFixed(1) + ' KB)';
        uploadBtn.disabled = false;
      }
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].name.endsWith('.bin')) {
        fileInput.files = e.dataTransfer.files;
        fileName.textContent = fileInput.files[0].name + ' (' + (fileInput.files[0].size / 1024).toFixed(1) + ' KB)';
        uploadBtn.disabled = false;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!fileInput.files.length) return;

      const formData = new FormData();
      formData.append('firmware', fileInput.files[0]);

      uploadBtn.disabled = true;
      progressWrap.style.display = 'block';
      statusMsg.className = 'status';
      statusMsg.style.display = 'none';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/update');
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          progressFill.style.width = pct + '%';
          progressText.textContent = 'Uploading... ' + pct + '%';
        }
      });
      xhr.onload = () => {
        if (xhr.status === 200) {
          statusMsg.className = 'status success';
          statusMsg.textContent = 'Update successful! Rebooting...';
          progressText.textContent = 'Complete!';
          setTimeout(() => location.reload(), 15000);
        } else {
          statusMsg.className = 'status error';
          statusMsg.textContent = 'Update failed: ' + xhr.responseText;
          uploadBtn.disabled = false;
        }
      };
      xhr.onerror = () => {
        statusMsg.className = 'status error';
        statusMsg.textContent = 'Connection error. Device may be rebooting.';
        setTimeout(() => location.reload(), 15000);
      };
      xhr.send(formData);
    });
  </script>
</body>
</html>
)rawliteral";

void setupOTA() {
  if (WiFi.status() != WL_CONNECTED) {
    DEBUG_PRINTLN("WiFi not connected, skipping OTA setup");
    return;
  }

  // Serve the OTA web page
  otaServer.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    // Optional basic authentication
    #if defined(OTA_USERNAME) && defined(OTA_PASSWORD)
      if (strlen(OTA_USERNAME) > 0 && strlen(OTA_PASSWORD) > 0) {
        if (!request->authenticate(OTA_USERNAME, OTA_PASSWORD)) {
          return request->requestAuthentication();
        }
      }
    #endif
    request->send_P(200, "text/html", OTA_HTML);
  });

  // Handle firmware upload
  otaServer.on("/update", HTTP_POST,
    // Response handler (called after upload completes)
    [](AsyncWebServerRequest *request) {
      bool success = !Update.hasError();
      AsyncWebServerResponse *response = request->beginResponse(
        success ? 200 : 500,
        "text/plain",
        success ? "Update successful! Rebooting..." : "Update FAILED! Check serial monitor."
      );
      response->addHeader("Connection", "close");
      request->send(response);

      if (success) {
        DEBUG_PRINTLN("\n✓ OTA Update successful! Rebooting in 1 second...");
        delay(1000);
        ESP.restart();
      } else {
        DEBUG_PRINTLN("\n✗ OTA Update failed!");
        otaInProgress = false;
      }
    },
    // Upload handler (called for each chunk of uploaded data)
    [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
      if (!index) {
        // First chunk - start update
        otaInProgress = true;
        DEBUG_PRINTF("\n=== OTA Update Started ===\n");
        DEBUG_PRINTF("Firmware file: %s\n", filename.c_str());
        DEBUG_PRINTF("Content length: %u bytes\n", request->contentLength());

        // Validate file extension
        if (!filename.endsWith(".bin")) {
          DEBUG_PRINTLN("ERROR: Invalid file type! Only .bin files accepted.");
          Update.abort();
          return;
        }

        // Check available space
        size_t updateSize = request->contentLength();
        if (!Update.begin(updateSize)) {
          DEBUG_PRINTF("ERROR: Not enough space! Need %u bytes\n", updateSize);
          Update.printError(Serial);
          otaInProgress = false;
          return;
        }

        DEBUG_PRINTLN("Writing firmware...");
      }

      // Write chunk to flash
      if (Update.isRunning()) {
        if (Update.write(data, len) != len) {
          DEBUG_PRINTLN("ERROR: Write failed!");
          Update.printError(Serial);
          otaInProgress = false;
          return;
        }

        // Progress feedback (every ~100KB)
        if ((index + len) % (100 * 1024) < len) {
          DEBUG_PRINTF("  Written: %u KB\n", (index + len) / 1024);
        }
      }

      // Final chunk - finish update
      if (final) {
        if (Update.end(true)) {
          DEBUG_PRINTF("\nUpdate complete! Total: %u bytes\n", index + len);
        } else {
          DEBUG_PRINTLN("ERROR: Update finalization failed!");
          Update.printError(Serial);
          otaInProgress = false;
        }
      }
    }
  );

  // Device info endpoint (useful for monitoring)
  otaServer.on("/info", HTTP_GET, [](AsyncWebServerRequest *request) {
    String json = "{";
    json += "\"device_id\":\"" + String(DEVICE_ID) + "\"";
    json += ",\"firmware\":\"" + String(FIRMWARE_VERSION) + "\"";
    json += ",\"free_heap\":" + String(ESP.getFreeHeap());
    json += ",\"uptime_ms\":" + String(millis());
    json += ",\"wifi_rssi\":" + String(WiFi.RSSI());
    json += ",\"ip\":\"" + WiFi.localIP().toString() + "\"";
    json += "}";
    request->send(200, "application/json", json);
  });

  otaServer.begin();

  DEBUG_PRINTLN("\n=== OTA Web Server Started ===");
  DEBUG_PRINTF("URL: http://%s\n", WiFi.localIP().toString().c_str());
  DEBUG_PRINTF("Info: http://%s/info\n", WiFi.localIP().toString().c_str());
  if (strlen(OTA_USERNAME) > 0) {
    DEBUG_PRINTF("Auth: %s / %s\n", OTA_USERNAME, OTA_PASSWORD);
  }
}
