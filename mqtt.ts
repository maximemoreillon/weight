import mqtt, { MqttClient } from "mqtt"
import { writePoint } from "./controllers/points"

export const {
  MQTT_URL = "mqtt://localhost:1883",
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_TOPIC = "weight",
} = process.env

const mqtt_options = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 5000, // Default was too fast
  resubscribe: true, // Defaults to true
}

const message_handler = async (topic: string, messageBuffer: Buffer) => {
  try {
    const messageString = messageBuffer.toString()
    const { weight, time } = JSON.parse(messageString)
    writePoint({ weight, time })
  } catch (error) {
    console.error(error)
  }
}

let client: MqttClient

export const connect = () =>
  new Promise((resolve, reject) => {
    console.log(`[MQTT] Connecting to ${MQTT_URL}...`)
    client = mqtt.connect(MQTT_URL, mqtt_options)

    client.on("connect", () => {
      console.log(`[MQTT] Connected to ${MQTT_URL}`)

      client.subscribe(MQTT_TOPIC)

      client.on("message", message_handler)

      resolve(client)
    })

    client.on("error", () => {
      console.log(`[MQTT] Connection failed`)
    })
  })

export const getConnected = () => client?.connected
