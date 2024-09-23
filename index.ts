import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import { version, author } from "./package.json"
import * as influxdb from "./db"
import {
  getConnected as mqttGetConnected,
  MQTT_URL,
  connect as mqttConnect,
  MQTT_TOPIC,
} from "./mqtt"

const { APP_PORT = 80 } = process.env

mqttConnect()

// Set timezone
process.env.TZ = process.env.TZ || "Asia/Tokyo"

const app = express()
app.use(express.json())
app.use(cors())

app.get("/", (req, res) => {
  res.send({
    application_name: "Weight",
    version,
    author,
    influxdb: {
      url: influxdb.url,
      org: influxdb.org,
      bucket: influxdb.bucket,
    },
    mqtt: {
      url: MQTT_URL,
      topic: MQTT_TOPIC,
      connected: mqttGetConnected(),
    },
  })
})

app.use("/points", require("./routes/points"))

// start server
app.listen(APP_PORT, () => {
  console.log(`[Express] Weight listening on *:${APP_PORT}`)
})
