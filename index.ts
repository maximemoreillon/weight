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
import { router as pointsRouter } from "./routes/points";
import { dbConnectionCheck, DB_DATABASE, DB_HOST, DB_PORT } from "./db";

import oidcMiddleware from "@moreillon/express-oidc";

const { APP_PORT = 80, OIDC_JWKS_URI } = process.env;

dbConnectionCheck();
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
    db: {
      host: DB_HOST,
      port: DB_PORT,
      db: DB_DATABASE,
    },
    mqtt: {
      url: MQTT_URL,
      topic: MQTT_TOPIC,
      connected: mqttGetConnected(),
    },
    auth: {
      oidc_jwks_uri: OIDC_JWKS_URI,
    },
  });
});

if (OIDC_JWKS_URI) {
  console.log(`[Auth] OIDC auth enabled`);
  app.use(oidcMiddleware({ jwksUri: OIDC_JWKS_URI }));
} else {
  console.log(`[Auth] OIDC auth disabled`);
}

app.use("/points", pointsRouter);

app.listen(APP_PORT, () => {
  console.log(`[Express] Weight listening on *:${APP_PORT}`);
});
