/*
 * Smart Waste Management System - Configuration File
 * Stage 2: Sensor Integration
 * 
 * All calibration parameters and configurable settings
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== PIN DEFINITIONS ====================

// HC-SR04 Ultrasonic Sensor (Bin Fill Level)
#define TRIG_PIN_1 5
#define ECHO_PIN_1 18

// Capacitive Moisture Sensor (Wetness Detection)
#define MOISTURE_PIN 34  // ADC1_CH6

// PIR Motion Sensor (Motion Detection)
#define PIR_PIN 19  // Interrupt-capable

// ==================== SENSOR CALIBRATION ====================

// Ultrasonic Sensor Calibration
#define BIN_HEIGHT_CM 23.50       // Total height of dustbin in cm
#define SENSOR_OFFSET_CM 2      // Distance from sensor to bin top
#define MIN_DISTANCE_CM 2       // Minimum measurable distance
#define MAX_DISTANCE_CM 400     // Maximum measurable distance

// Moisture Sensor Calibration (From RAT test results)
#define AIR_VALUE 2623          // ADC value in air (completely dry)
#define WATER_VALUE 994         // ADC value in water (completely wet)

// Moisture Thresholds (Percentage)
#define MOISTURE_DRY 20         // Below this = DRY
#define MOISTURE_SLIGHTLY_WET 50 // Below this = SLIGHTLY WET
#define MOISTURE_WET 70         // Below this = WET, above = VERY WET

// Fill Level Thresholds (Percentage)
#define FILL_EMPTY 20           // Below this = EMPTY
#define FILL_HALF 50            // Below this = HALF FULL
#define FILL_ALMOST_FULL 80     // Below this = ALMOST FULL, above = FULL

// ==================== TIMING CONFIGURATION ====================

// Sensor Reading Intervals (milliseconds)
#define ULTRASONIC_INTERVAL 5000    // Read every 5 seconds
#define MOISTURE_INTERVAL 10000     // Read every 10 seconds
#define GPS_INTERVAL 15000          // Read GPS every 15 seconds
#define MQTT_PUBLISH_INTERVAL 5000  // Publish to MQTT every 5 seconds

// PIR Settings
#define PIR_DEBOUNCE_MS 2000        // Ignore motion events within 2 seconds

// ==================== DATA BUFFERING ====================

// Buffer sizes for time-series data
#define ULTRASONIC_BUFFER_SIZE 10   // Store up to 10 ultrasonic readings
#define MOISTURE_BUFFER_SIZE 10     // Store up to 10 moisture readings

// Enable/disable buffering
#define ENABLE_DATA_BUFFERING 0     // 1 = buffer readings, 0 = send only latest

// ==================== WIFI CONFIGURATION ====================

// WiFi Credentials (Update with your WiFi details)
#define WIFI_SSID "Saki"
#define WIFI_PASSWORD "11111111"

// WiFi Connection Settings
#define WIFI_TIMEOUT_MS 20000       // Wait 20 seconds for WiFi connection
#define WIFI_RETRY_DELAY_MS 5000    // Wait 5 seconds between retries

// ==================== NTP TIME CONFIGURATION ====================

// NTP Server Settings
#define NTP_SERVER "pool.ntp.org"
#define NTP_SERVER_BACKUP "time.nist.gov"

// Sri Lanka Time Zone: UTC+5:30 (19800 seconds offset)
#define GMT_OFFSET_SEC 19800        // 5.5 hours * 3600 seconds
#define DAYLIGHT_OFFSET_SEC 0       // Sri Lanka doesn't use DST

// ==================== MQTT CONFIGURATION ====================

// HiveMQ Broker Settings (Free Public Broker)
#define MQTT_BROKER "test.mosquitto.org"
#define MQTT_SECONDARY_BROKER "broker.hivemq.com"
#define MQTT_PORT 1883
#define MQTT_CLIENT_ID "SmartBin_ESP32_001"  // Change for each device

// MQTT Topics
#define MQTT_TOPIC_SENSORS "smartbin/sensors"
#define MQTT_TOPIC_STATUS "smartbin/status"
#define MQTT_TOPIC_MOTION "smartbin/motion"
#define MQTT_TOPIC_GPS "smartbin/gps"
#define MQTT_TOPIC_ALERT "smartbin/alert"

// MQTT Settings
#define MQTT_KEEPALIVE_INTERVAL 60  // Keep-alive interval in seconds
#define MQTT_RECONNECT_DELAY 5000   // Wait 5 seconds before reconnecting

// ==================== DATA VALIDATION ====================

// Sensor Data Validation Ranges
#define VALID_DISTANCE_MIN 0
#define VALID_DISTANCE_MAX 400

#define VALID_MOISTURE_MIN 0
#define VALID_MOISTURE_MAX 100

#define VALID_FILL_MIN 0
#define VALID_FILL_MAX 100

// ==================== SYSTEM SETTINGS ====================

// Serial Communication
#define SERIAL_BAUD_RATE 115200

// Device Information
#define DEVICE_ID "BIN_001"
#define DEVICE_LOCATION "Test Location"
#define FIRMWARE_VERSION "3.0.0"

// Data Mode Selection
// Set to 1 for RAW data, 0 for ANALYZED data
#define SEND_RAW_DATA 0

/*
 * RAW DATA MODE (SEND_RAW_DATA = 1):
 *   - Ultrasonic: Distance in cm (calculated)
 *   - PIR: Digital pin state (0 or 1)
 *   - Moisture: ADC value (0-4095)
 * 
 * ANALYZED DATA MODE (SEND_RAW_DATA = 0):
 *   - Ultrasonic: Fill percentage (0-100%) + Status
 *   - PIR: Motion detected event with timestamp
 *   - Moisture: Moisture percentage (0-100%) + Status
 */

// Debug Mode (Set to 0 to disable debug prints)
#define DEBUG_MODE 1

// Debug Macros
#if DEBUG_MODE
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
  #define DEBUG_PRINTF(...) Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(...)
#endif

// ==================== ALERT THRESHOLDS ====================

// Conditions that trigger alerts
#define ALERT_BIN_FULL_THRESHOLD 85     // Alert when bin is 85% full
#define ALERT_MOISTURE_HIGH_THRESHOLD 70 // Alert when moisture > 70%

// ==================== SAFETY BOUNDS ====================

// PIR Interrupt timeout (maximum duration to hold interrupt flag)
#define PIR_INTERRUPT_TIMEOUT_MS 10000  // Reset interrupt after 10 seconds if not handled

// Buffer safety checks
#define BUFFER_INDEX_CHECK(idx, max) ((idx) >= 0 && (idx) < (max))

// Data validation with strict bounds
#define VALIDATE_DISTANCE(d) ((d) >= MIN_DISTANCE_CM && (d) <= MAX_DISTANCE_CM)
#define VALIDATE_PERCENTAGE(p) ((p) >= 0 && (p) <= 100)

// ==================== OTA CONFIGURATION ====================

// OTA Web Server Settings
#define OTA_HTTP_PORT 80                    // HTTP port for OTA web interface
#define OTA_HOSTNAME "smartbin-esp32"       // mDNS hostname (access via http://smartbin-esp32.local)

// OTA Authentication (optional - set to empty string "" to disable)
#define OTA_USERNAME "admin"
#define OTA_PASSWORD "smartbin123"

// ==================== GPS MODULE ====================

// GPS Module Settings
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define GPS_BAUD_RATE 9600

#endif  // CONFIG_H
