import express from "express"
import cors from "cors"
import { version, author } from "./package.json"
import dotenv from "dotenv"
import * as influxdb from "./db"

dotenv.config()

const { APP_PORT = 80 } = process.env

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
  })
})

app.use("/points", require("./routes/points"))

// Route for legacy code compatibility
app.post("/upload", require("./controllers/points").create_point)

// start server
app.listen(APP_PORT, () => {
  console.log(`[Express] Weight listening on *:${APP_PORT}`)
})
