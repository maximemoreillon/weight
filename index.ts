import "dotenv/config";

import express from "express";
import cors from "cors";
import { version, author } from "./package.json";
import {
  getConnected as mqttGetConnected,
  MQTT_URL,
  connect as mqttConnect,
  MQTT_TOPIC,
} from "./mqtt";
import { authMiddleware, IDENTIFICATION_URL, OIDC_JWKS_URI } from "./auth";
import { router as pointsRouter } from "./routes/points";
import { TIMESCALEDB_DATABASE, TIMESCALEDB_HOST, TIMESCALEDB_PORT } from "./db";
const { APP_PORT = 80 } = process.env;

mqttConnect();

if (!process.env.TZ) process.env.TZ = "Asia/Tokyo";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send({
    application_name: "Weight",
    version,
    author,
    timescaleDb: {
      host: TIMESCALEDB_HOST,
      port: TIMESCALEDB_PORT,
      db: TIMESCALEDB_DATABASE,
    },
    mqtt: {
      url: MQTT_URL,
      topic: MQTT_TOPIC,
      connected: mqttGetConnected(),
    },
    auth: {
      identification_url: IDENTIFICATION_URL,
      oidc_jwks_uri: OIDC_JWKS_URI,
    },
  });
});

app.use(authMiddleware);
app.use("/points", pointsRouter);

app.listen(APP_PORT, () => {
  console.log(`[Express] Weight listening on *:${APP_PORT}`);
});
