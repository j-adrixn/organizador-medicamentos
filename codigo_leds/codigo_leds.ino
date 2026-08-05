#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <FastLED.h>

// Llamamos a nuestro archivo de configuración secreto
#include "secrets.h" 

// ==========================================
// PINES Y VARIABLES DE HARDWARE
// ==========================================
#define PIN_LED 4          // Pin "Din" de la tira LED inteligente
#define NUM_LEDS 5         // Cantidad de LEDs en tu fragmento de tira
#define PIN_BUZZER 14
#define PIN_SENSOR_CAJON 12 

CRGB leds[NUM_LEDS];

WiFiClientSecure espClient;
PubSubClient client(espClient);

enum EstadoOrganizador { MODO_NORMAL, ALARMA_SONANDO, ALARMA_SILENCIADA_ESPERANDO_CIERRE };
EstadoOrganizador estadoActual = MODO_NORMAL;

int activaR = 0, activaG = 0, activaB = 0;
unsigned long tiempoAnteriorBuzzer = 0;
bool estadoBuzzer = false;

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

// Nueva función adaptada para FastLED
void fijarColorLED(int r, int g, int b) {
  fill_solid(leds, NUM_LEDS, CRGB(r, g, b));
  FastLED.show();
}

// Sincronizar hora local (Obligatorio para que TLS verifique la fecha del certificado AWS)
void sincronizarHora() {
  configTime(-5 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Sincronizando hora ");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nHora sincronizada exitosamente.");
}

// Recibe instrucciones desde AWS
void callback(char* topic, byte* payload, unsigned int length) {
  String mensaje;
  for (int i = 0; i < length; i++) {
    mensaje += (char)payload[i];
  }
  
  Serial.println("Comando entrante desde AWS: " + mensaje);

  if (String(topic) == "adrix/organizador/alerta") {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, mensaje);
    
    if (!error) {
      String accion = doc["accion"];
      if (accion == "sonar") {
        activaR = doc["r"];
        activaG = doc["g"];
        activaB = doc["b"];
        estadoActual = ALARMA_SONANDO;
        Serial.println("Activando alerta para medicamento: " + doc["medicamento"].as<String>());
      }
    } else {
      Serial.println("Error decodificando JSON");
    }
  }
}

void reconectarAWS() {
  while (!client.connected()) {
    Serial.print("Conectando a AWS IoT Core...");
    if (client.connect("ESP32_Organizador_Adrian")) {
      Serial.println("¡Conectado de forma segura!");
      client.subscribe("adrix/organizador/alerta");
    } else {
      Serial.print("Fallo de conexión, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5s");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_SENSOR_CAJON, INPUT_PULLUP);

  // Inicializar FastLED
  FastLED.addLeds<WS2812B, PIN_LED, GRB>(leds, NUM_LEDS);
  fijarColorLED(0, 0, 0); // Apagar LEDs al iniciar

  // Conexión Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado.");

  sincronizarHora();

  // Configurar certificados en el cliente seguro
  espClient.setCACert(AWS_CERT_CA);
  espClient.setCertificate(AWS_CERT_CRT);
  espClient.setPrivateKey(AWS_CERT_PRIVATE);

  client.setServer(aws_endpoint, aws_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconectarAWS();
  }
  client.loop();

  int estadoCajon = digitalRead(PIN_SENSOR_CAJON);

  switch (estadoActual) {
    case MODO_NORMAL:
      fijarColorLED(0, 0, 0);
      digitalWrite(PIN_BUZZER, LOW);
      break;

    case ALARMA_SONANDO:
      fijarColorLED(activaR, activaG, activaB);
      if (millis() - tiempoAnteriorBuzzer >= 250) {
        tiempoAnteriorBuzzer = millis();
        estadoBuzzer = !estadoBuzzer;
        digitalWrite(PIN_BUZZER, estadoBuzzer ? HIGH : LOW);
      }

      if (estadoCajon == HIGH) { // Abierto
        estadoActual = ALARMA_SILENCIADA_ESPERANDO_CIERRE;
        digitalWrite(PIN_BUZZER, LOW);
        
        client.publish("adrix/organizador/estado", "{\"estado\":\"abierto\", \"mensaje\":\"Medicamento tomado\"}");
        Serial.println("Cajón abierto - Reportado a AWS");
      }
      break;

    case ALARMA_SILENCIADA_ESPERANDO_CIERRE:
      digitalWrite(PIN_BUZZER, LOW);
      fijarColorLED(activaR, activaG, activaB); 
      
      if (estadoCajon == LOW) { // Cerrado
        estadoActual = MODO_NORMAL;
        
        client.publish("adrix/organizador/estado", "{\"estado\":\"cerrado\", \"mensaje\":\"Sistema en reposo\"}");
        Serial.println("Cajón cerrado - Reportado a AWS");
        delay(500); 
      }
      break;
  }
}
